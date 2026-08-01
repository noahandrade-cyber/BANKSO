// =======================================
// BANKSO - paiement-valide.js
// =======================================

// Vérifie que le paiement vient bien de Stripe
const params = new URLSearchParams(window.location.search);

const sessionId = params.get("session_id");

if (!sessionId) {

    window.location.href = "panier.html";

}

// -------------------------
// Vérification Stripe
// -------------------------

async function verifyPayment() {

    try {

        const response = await fetch(

            `/api/checkout-session?session_id=${sessionId}`

        );

        const data = await response.json();

        if (!data.paid) {

            window.location.href = "panier.html";

            return;

        }

        showConfirmation();

    }

    catch (error) {

        console.error(error);

        window.location.href = "panier.html";

    }

}

// -------------------------
// Affichage
// -------------------------

function money(value) {

    return Number(value)
        .toFixed(2)
        .replace(".", ",") + " €";

}

function showConfirmation() {

    const confirmation = document.getElementById("confirmation");
console.log(confirmation);
    const container = document.getElementById("confirmation-items");

    const number = document.getElementById("order-number");

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    let total = 0;

    number.textContent =
        "BK-" + Date.now().toString().slice(-8);

    container.innerHTML = "";

    cart.forEach(product => {

        total +=
            product.price * product.quantity;

        container.innerHTML += `

        <article class="confirmation-item">

            <img
                src="${product.image}"
                alt="${product.name}">

            <div>

                <h3>${product.name}</h3>

                <p>

                    Taille :
                    ${product.size}

                </p>

                <p>

                    Quantité :
                    ${product.quantity}

                </p>

            </div>

            <strong>

                ${money(product.price * product.quantity)}

            </strong>

        </article>

        `;

    });

    container.innerHTML += `

        <div class="confirmation-total">

            <span>Total</span>

            <strong>${money(total)}</strong>

        </div>

    `;

    confirmation.hidden = false;

confirmation.style.display = "block";

    // vide le panier

    localStorage.removeItem("cart");

    localStorage.removeItem("checkoutOrder");

}

verifyPayment();