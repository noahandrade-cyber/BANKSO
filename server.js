require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 4242;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// =====================================
// BASE URL
// =====================================

function baseUrl() {

    return process.env.BASE_URL || `http://localhost:${PORT}`;

}

// =====================================
// DOSSIER DATABASE
// =====================================

const databaseFolder = path.join(__dirname, "database");

if (!fs.existsSync(databaseFolder)) {

    fs.mkdirSync(databaseFolder);

}

// =====================================
// SQLITE
// =====================================

const db = new Database(

    path.join(databaseFolder, "bankso.sqlite")

);

const schema = fs.readFileSync(

    path.join(databaseFolder, "schema.sql"),

    "utf8"

);

db.exec(schema);

// =====================================
// MIDDLEWARE
// =====================================

app.use(express.static(__dirname));

app.use(express.json());

// =====================================
// PAGE D'ACCUEIL
// =====================================

app.get("/", (req, res) => {

    res.sendFile(

        path.join(__dirname, "index.html")

    );

});
// =====================================
// NODEMAILER
// =====================================

const emailReady = Boolean(

    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.CONTACT_EMAIL

);

let mailer = null;

if (emailReady) {

    mailer = nodemailer.createTransport({

        host: process.env.SMTP_HOST,

        port: Number(process.env.SMTP_PORT),

        secure: process.env.SMTP_SECURE === "true",

        auth: {

            user: process.env.SMTP_USER,

            pass: process.env.SMTP_PASS

        }

    });

    

}

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

function clean(value, max = 200) {

    return String(value || "")

        .trim()

        .slice(0, max);

}

function validEmail(email) {

    return /^\S+@\S+\.\S+$/.test(email);

}

// =====================================
// WAITLIST
// =====================================

app.post("/api/waitlist", (req, res) => {

    try {

        const email = clean(

            req.body.email,

            254

        ).toLowerCase();

        if (!validEmail(email)) {

            return res.status(400).json({

                error: "Adresse e-mail invalide."

            });

        }

        db.prepare(

            "INSERT OR IGNORE INTO waitlist(email) VALUES(?)"

        ).run(email);

        console.log("✅ Waitlist :", email);

        res.json({

            ok: true,

            message: "Merci pour votre inscription."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:

            "Impossible d'enregistrer cette adresse."

        });

    }

});
// =====================================
// CONTACT
// =====================================

app.post("/api/contact", async (req, res) => {

    try {

        const name = clean(req.body.name);

        const email = clean(

            req.body.email,

            254

        ).toLowerCase();

        const subject = clean(req.body.subject);

        const message = clean(

            req.body.message,

            5000

        );

        if (

            !name ||

            !subject ||

            !message ||

            !validEmail(email)

        ) {

            return res.status(400).json({

                error: "Veuillez compléter tous les champs."

            });

        }

        db.prepare(`
INSERT INTO contact_messages
(
    name,
    email,
    subject,
    message
)
VALUES
(
    ?,?,?,?
)
`).run(

            name,

            email,

            subject,

            message

        );

        console.log("📧 E-mail non envoyé (test)");

res.json({

    ok: true,

    message: "Message envoyé."

});

return;

        console.log("📩 Nouveau message :", email);

    

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Impossible d'envoyer le message."

        });

    }

});
// =====================================
// STRIPE CHECKOUT
// =====================================

app.post("/api/create-checkout-session", async (req, res) => {

    try {

        const products = Array.isArray(req.body.products)
            ? req.body.products
            : [];

        if (products.length === 0) {

            return res.status(400).json({

                error: "Votre panier est vide."

            });

        }

        const line_items = products.map(product => ({

            quantity: Number(product.quantity),

            price_data: {

                currency: "eur",

                unit_amount: Math.round(Number(product.price) * 100),

                product_data: {

                    name: clean(product.name, 120),

                    description:

                        `Taille : ${product.size || "-"}`,

                    images:

                        product.image
                        ? [`${baseUrl()}/${product.image}`]
                        : []

                }

            }

        }));

        const totalCents = products.reduce(

            (total, product) =>

                total +

                Math.round(Number(product.price) * 100) *

                Number(product.quantity),

            0

        );

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            payment_method_types: [

                "card"

            ],

            customer_creation: "always",

            billing_address_collection: "required",

            phone_number_collection: {

                enabled: true

            },

            shipping_address_collection: {

                allowed_countries: [

                    "BE",

                    "FR",

                    "LU",

                    "NL",

                    "DE"

                ]

            },

            line_items,

            success_url:

`${baseUrl()}/paiement-valide.html?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:

`${baseUrl()}/paiement.html`

        });

        const order = db.prepare(`
INSERT INTO orders
(
    stripe_session_id,
    customer_email,
    status,
    total_cents,
    currency
)
VALUES
(
    ?, ?, ?, ?, ?
)
`).run(

            session.id,

            "",

            "pending",

            totalCents,

            "eur"

        );

        const insertItem = db.prepare(`
INSERT INTO order_items
(
    order_id,
    product_name,
    size,
    quantity,
    unit_price_cents
)
VALUES
(
    ?, ?, ?, ?, ?
)
`);

        for (const product of products) {

            insertItem.run(

                order.lastInsertRowid,

                product.name,

                product.size || "",

                Number(product.quantity),

                Math.round(Number(product.price) * 100)

            );

        }

        res.json({

            url: session.url

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

});
// =====================================
// WEBHOOK STRIPE
// =====================================

app.post(
    "/webhook",
    express.raw({
        type: "application/json"
    }),
    async (req, res) => {

        let event;

        try {

            event = stripe.webhooks.constructEvent(

                req.body,

                req.headers["stripe-signature"],

                process.env.STRIPE_WEBHOOK_SECRET

            );

        }

        catch (error) {

            console.error("Webhook invalide");

            console.error(error.message);

            return res.status(400).send(error.message);

        }

        try {

            if (event.type === "checkout.session.completed") {

                const session = event.data.object;

                db.prepare(`
UPDATE orders
SET
    status=?,
    customer_email=?,
    paid_at=CURRENT_TIMESTAMP
WHERE
    stripe_session_id=?
`).run(

                    "paid",

                    session.customer_details?.email || "",

                    session.id

                );

                console.log("");

                console.log("================================");

                console.log("✅ Paiement confirmé");

                console.log(session.id);

                console.log("================================");

                const order = db.prepare(`
SELECT *
FROM orders
WHERE stripe_session_id=?
`).get(session.id);

                if (

                    order &&

                    mailer &&

                    order.customer_email

                ) {

                    await mailer.sendMail({

                        from:

`BANKSO <${process.env.SMTP_USER}>`,

                        to:

order.customer_email,

                        subject:

"Confirmation de votre commande BANKSO",

                        text:

`Bonjour,

Merci pour votre commande.

Numéro de commande :

#${order.id}

Montant :

${(order.total_cents / 100).toFixed(2)} €

Nous préparons actuellement votre colis.

BANKSO`

                    });

                }

            }

            res.sendStatus(200);

        }

        catch (error) {

            console.error(error);

            res.sendStatus(500);

        }

    }

);
// =====================================
// VERIFICATION SESSION STRIPE
// =====================================

app.get("/api/checkout-session", async (req, res) => {

    try {

        const sessionId = req.query.session_id;

        if (!sessionId) {

            return res.status(400).json({

                error: "Session Stripe manquante."

            });

        }

        const session = await stripe.checkout.sessions.retrieve(

            sessionId

        );

        const order = db.prepare(`
SELECT *
FROM orders
WHERE stripe_session_id=?
`).get(

            sessionId

        );

        const items = db.prepare(`
SELECT *
FROM order_items
WHERE order_id=?
`).all(

            order ? order.id : -1

        );

        res.json({

            paid:

                session.payment_status === "paid",

            sessionId:

                session.id,

            customer:

                session.customer_details || null,

            order:

                order || null,

            items:

                items,

            total:

                order
                    ? order.total_cents
                    : session.amount_total,

            currency:

                order
                    ? order.currency
                    : session.currency

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:

                "Impossible de récupérer la commande."

        });

    }


});
// =====================================
// PAGE 404
// =====================================

app.use((req, res) => {

    res.status(404).json({

        error: "Route introuvable."

    });

});

// =====================================
// GESTION DES ERREURS
// =====================================

app.use((error, req, res, next) => {

    console.error(error);

    res.status(500).json({

        error: "Erreur interne du serveur."

    });

});

// =====================================
// DEMARRAGE DU SERVEUR
// =====================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");

    console.log("====================================");

    console.log("🚀 BANKSO SERVER");

    console.log(`Port : ${PORT}`);

    console.log(`URL  : ${baseUrl()}`);

    console.log("====================================");

});

// =====================================
// ERREURS NODE
// =====================================

process.on("uncaughtException", error => {

    console.error("UNCAUGHT EXCEPTION");

    console.error(error);

});

process.on("unhandledRejection", error => {

    console.error("UNHANDLED REJECTION");

    console.error(error);

});