// ===============================
// BANKSO - paiement.js
// ===============================

const cart = JSON.parse(localStorage.getItem("cart")) || [];

const orderItems = document.getElementById("order-items");
const orderTotal = document.getElementById("order-total");
const paymentTotal = document.getElementById("payment-total");
const paymentForm = document.getElementById("payment-form");

function money(value) {
    return Number(value)
        .toFixed(2)
        .replace(".", ",") + " €";
}

// Si le panier est vide
if (cart.length === 0) {
    window.location.href = "panier.html";
}

// -------------------------------
// Affichage des articles
// -------------------------------

function renderOrder() {

    orderItems.innerHTML = "";

    let total = 0;

    cart.forEach(item => {

        total += item.price * item.quantity;

        const article = document.createElement("article");
        article.className = "order-item";

        article.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="order-info">

                <h3>${item.name}</h3>

                <p>Taille : ${item.size}</p>

                <p>Quantité : ${item.quantity}</p>

            </div>

            <strong>${money(item.price * item.quantity)}</strong>
        `;

        orderItems.appendChild(article);

    });

    orderTotal.textContent = money(total);
    paymentTotal.textContent = money(total);

}

renderOrder();

// -------------------------------
// Paiement Stripe
// -------------------------------

paymentForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const button = paymentForm.querySelector("button");

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Redirection sécurisée...
    `;

    try {

        const response = await fetch("/api/create-checkout-session", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                products: cart

            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.error);

        }

        window.location.href = data.url;

    }

    catch (error) {

        alert(error.message);

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            CONTINUER VERS LE PAIEMENT
            <span id="payment-total">${orderTotal.textContent}</span>
        `;

    }

});