require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 4242;

// =====================================
// STRIPE
// =====================================

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// =====================================
// BASE URL
// =====================================

const baseUrl = () => {

    return process.env.BASE_URL ||
        `http://localhost:${PORT}`;

};

// =====================================
// SQLITE
// =====================================

const databaseFolder = path.join(__dirname, "database");

if (!fs.existsSync(databaseFolder)) {

    fs.mkdirSync(databaseFolder);

}

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

app.use(express.json());

app.use(express.static(__dirname));

// =====================================
// NODEMAILER
// =====================================

const emailReady = Boolean(

    process.env.SMTP_HOST &&
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

    mailer.verify((error) => {

        if (error) {

            console.log("❌ SMTP");

            console.log(error);

        }

        else {

            console.log("✅ SMTP connecté");

        }

    });

}

// =====================================
// FONCTIONS
// =====================================

function clean(value, max = 200) {

    return String(value || "")

        .trim()

        .slice(0, max);

}
// =====================================
// WAITLIST
// =====================================

app.post("/api/waitlist", (req, res) => {

    const email = clean(req.body.email, 254).toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(email)) {

        return res.status(400).json({

            error: "Adresse e-mail invalide."

        });

    }

    try {

        db.prepare(

            "INSERT OR IGNORE INTO waitlist(email) VALUES(?)"

        ).run(email);

        console.log("✅ Waitlist :", email);

        return res.json({

            ok: true,

            message: "Merci pour votre inscription."

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error: "Impossible d'enregistrer cette adresse."

        });

    }

});

// =====================================
// CONTACT
// =====================================

app.post("/api/contact", async (req, res) => {

    const name = clean(req.body.name);

    const email = clean(req.body.email, 254).toLowerCase();

    const subject = clean(req.body.subject);

    const message = clean(req.body.message, 5000);

    if (

        !name ||

        !subject ||

        !message ||

        !/^\S+@\S+\.\S+$/.test(email)

    ) {

        return res.status(400).json({

            error: "Veuillez compléter tous les champs."

        });

    }

    try {

        db.prepare(

            `

            INSERT INTO contact_messages

            (name,email,subject,message)

            VALUES

            (?,?,?,?)

            `

        ).run(

            name,

            email,

            subject,

            message

        );

        if (mailer) {

            await mailer.sendMail({

                from:

                    `BANKSO <${process.env.SMTP_USER}>`,

                to:

                    process.env.CONTACT_EMAIL,

                replyTo: email,

                subject:

                    `[BANKSO] ${subject}`,

                text:

`Nom : ${name}

Email : ${email}

Sujet : ${subject}

-----------------------------------

${message}`

            });

        }

        console.log("📧 Contact reçu :", email);

        res.json({

            ok: true

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:

            "Impossible d'envoyer votre message."

        });

    }

});
// =====================================
// WEBHOOK STRIPE
// =====================================

app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => {

        try {

            const event = stripe.webhooks.constructEvent(

                req.body,

                req.headers["stripe-signature"],

                process.env.STRIPE_WEBHOOK_SECRET

            );

            if (event.type === "checkout.session.completed") {

                const session = event.data.object;

                db.prepare(`
UPDATE orders
SET
status='paid',
paid_at=CURRENT_TIMESTAMP
WHERE stripe_session_id=?
`).run(session.id);

                console.log("✅ Paiement confirmé :", session.id);

            }

            res.sendStatus(200);

        }

        catch (error) {

            console.error(error);

            res.status(400).send(error.message);

        }

    }

);

// =====================================
// CREATION SESSION STRIPE
// =====================================

app.post("/api/create-checkout-session", async (req, res) => {

    try {

        const products = req.body.products;

        if (!Array.isArray(products) || products.length === 0) {

            return res.status(400).json({

                error: "Votre panier est vide."

            });

        }

        const line_items = products.map(product => ({

            quantity: product.quantity,

            price_data: {

                currency: "eur",

                unit_amount: Math.round(product.price * 100),

                product_data: {

                    name: product.name,

                    description:

                        `Taille : ${product.size}`,

                    images: product.image

                        ? [

                            `${baseUrl()}/${product.image}`

                        ]

                        : []

                }

            }

        }));

        const total = products.reduce(

            (sum, product) =>

                sum + product.price * product.quantity,

            0

        );

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            payment_method_types: [

                "card"

            ],

            line_items,

            success_url:

                `${baseUrl()}/paiement-valide.html?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:

                `${baseUrl()}/paiement.html`

        });

        db.prepare(`

            INSERT INTO orders

            (

                stripe_session_id,

                amount,

                status

            )

            VALUES

            (

                ?,

                ?,

                ?

            )

        `).run(

            session.id,

            total,

            "pending"

        );
        const totalCents = products.reduce((total, product) => {

    return total + Math.round(product.price * 100) * product.quantity;

}, 0);

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
    ?,
    ?,
    ?,
    ?,
    ?
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

        product.quantity,

        Math.round(product.price * 100)

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
// VERIFICATION SESSION
// =====================================

app.get("/api/checkout-session", async (req, res) => {

    try {

        const session = await stripe.checkout.sessions.retrieve(

            req.query.session_id

        );

        res.json({

            paid: session.payment_status === "paid",

            email: session.customer_details?.email || "",

            amount: session.amount_total,

            currency: session.currency

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
// PAGE D'ACCUEIL
// =====================================

app.get("/", (req, res) => {

    res.sendFile(

        path.join(__dirname, "index.html")

    );

});

// =====================================
// PAGE 404
// =====================================

app.use((req, res) => {

    res.status(404).json({

        error: "Page introuvable."

    });

});

// =====================================
// GESTION DES ERREURS EXPRESS
// =====================================

app.use((error, req, res, next) => {

    console.error("========================");
    console.error("ERREUR SERVEUR");
    console.error("========================");

    console.error(error);

    res.status(500).json({

        error: "Erreur interne du serveur."

    });

});

// =====================================
// DEMARRAGE DU SERVEUR
// =====================================

const server = app.listen(PORT, () => {

    console.log("");

    console.log("========================================");

    console.log("🚀 BANKSO est lancé");

    console.log("");

    console.log("Adresse :");

    console.log(baseUrl());

    console.log("");

    console.log("========================================");

});

// =====================================
// FERMETURE PROPRE
// =====================================

function shutdown() {

    console.log("");

    console.log("Arrêt du serveur...");

    server.close(() => {

        try {

            db.close();

            console.log("Base SQLite fermée.");

        }

        catch (e) {

            console.log(e);

        }

        process.exit(0);

    });

}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);

// =====================================
// ERREURS NODE
// =====================================

process.on("uncaughtException", error => {

    console.error("");

    console.error("ERREUR NON INTERCEPTEE");

    console.error(error);

});

process.on("unhandledRejection", error => {

    console.error("");

    console.error("PROMESSE REJETEE");

    console.error(error);

});