/*==================================================
                BANKSO SHOP
==================================================*/

/*==========================
        VARIABLES
==========================*/

const cart = document.querySelector(".cart");
const overlay = document.querySelector(".cart-overlay");

const openCartBtn = document.querySelector(".open-cart");
const closeCartBtn = document.querySelector(".close-cart");

const addButtons = document.querySelectorAll(".add-cart");

const cartItems = document.querySelector(".cart-items");

const totalPrice = document.getElementById("total-price");

const cartCounter = document.getElementById("cart-count");

const toast = document.getElementById("toast");

/*==========================
        LOCAL STORAGE
==========================*/

let products = JSON.parse(
    localStorage.getItem("bankso-cart")
) || [];

/*==========================
        OUVERTURE
==========================*/

function openCart(){

    cart.classList.add("active");
    overlay.classList.add("active");

}

/*==========================
        FERMETURE
==========================*/

function closeCart(){

    cart.classList.remove("active");
    overlay.classList.remove("active");

}

/*==========================
        EVENEMENTS
==========================*/

if(openCartBtn){

    openCartBtn.addEventListener("click", openCart);

}

if(closeCartBtn){

    closeCartBtn.addEventListener("click", closeCart);

}

overlay.addEventListener("click", closeCart);

/*==========================
        TOAST
==========================*/

function showToast(){

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2000);

}

/*==========================
        SAUVEGARDE
==========================*/

function saveCart(){

    localStorage.setItem(
        "bankso-cart",
        JSON.stringify(products)
    );

}
/*==================================================
            COMPTEUR PANIER
==================================================*/

function updateCounter() {

    let quantity = 0;

    products.forEach(product => {

        quantity += product.quantity;

    });

    cartCounter.textContent = quantity;

}

/*==================================================
            AJOUT AU PANIER
==================================================*/

function addToCart(product){

    const existing = products.find(item => item.id === product.id);

    if(existing){

        existing.quantity++;

    }else{

        products.push({

            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity:1

        });

    }

    saveCart();

    renderCart();

    updateCounter();

    showToast();

    // ouvre automatiquement le panier
    openCart();

}

/*==================================================
            BOUTONS AJOUTER
==================================================*/

addButtons.forEach(button=>{

    button.addEventListener("click",()=>{

        const product = {

            id: button.dataset.id,

            name: button.dataset.name,

            price: Number(button.dataset.price),

            image: button.dataset.image

        };

        addToCart(product);

    });

});
/*==================================================
            AFFICHAGE DU PANIER
==================================================*/

function renderCart(){

    cartItems.innerHTML = "";

    let total = 0;

    products.forEach(product=>{

        total += product.price * product.quantity;

        cartItems.innerHTML += `

        <div class="cart-item">

            <img src="${product.image}" alt="${product.name}">

            <div class="cart-details">

                <h4>${product.name}</h4>

                <p>${product.price.toFixed(2)} €</p>

                <div class="quantity">

                    <button class="minus" data-id="${product.id}">−</button>

                    <span>${product.quantity}</span>

                    <button class="plus" data-id="${product.id}">+</button>

                </div>

                <button class="remove-item"
                        data-id="${product.id}">
                    Supprimer
                </button>

            </div>

        </div>

        `;

    });

    totalPrice.textContent = total.toFixed(2) + " €";

    quantityEvents();

}
/*==================================================
            GESTION DES QUANTITÉS
==================================================*/

function quantityEvents(){

    /*======================
            +
    ======================*/

    document.querySelectorAll(".plus").forEach(button=>{

        button.addEventListener("click",()=>{

            const product = products.find(item => item.id === button.dataset.id);

            if(!product) return;

            product.quantity++;

            saveCart();

            renderCart();

            updateCounter();

        });

    });

    /*======================
            -
    ======================*/

    document.querySelectorAll(".minus").forEach(button=>{

        button.addEventListener("click",()=>{

            const product = products.find(item => item.id === button.dataset.id);

            if(!product) return;

            product.quantity--;

            if(product.quantity <= 0){

                products = products.filter(item => item.id !== button.dataset.id);

            }

            saveCart();

            renderCart();

            updateCounter();

        });

    });

}

/*==================================================
            SUPPRESSION
==================================================*/

document.addEventListener("click",(event)=>{

    if(!event.target.classList.contains("remove-item")) return;

    const id = event.target.dataset.id;

    products = products.filter(product => product.id !== id);

    saveCart();

    renderCart();

    updateCounter();

});
/*==================================================
                ANIMATIONS
==================================================*/

const fadeElements = document.querySelectorAll(".fade-up");

if(fadeElements.length){

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("show");

            }

        });

    },{
        threshold:0.2
    });

    fadeElements.forEach(element=>{

        observer.observe(element);

    });

}

/*==================================================
            RECHARGEMENT DU PANIER
==================================================*/

window.addEventListener("load",()=>{

    renderCart();

    updateCounter();

});

/*==================================================
            BOUTON PAIEMENT
==================================================*/

const checkoutButton = document.querySelector(".checkout");

if(checkoutButton){

    checkoutButton.addEventListener("click",()=>{

        if(products.length === 0){

            alert("Votre panier est vide.");

            return;

        }

        alert("La page de paiement sera bientôt disponible.");

    });

}
/*==================================================
                INITIALISATION
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    // Charger le panier
    renderCart();

    // Mettre à jour le compteur
    updateCounter();

    // Fermer le panier avec la touche Échap
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeCart();

        }

    });

    // Empêcher les erreurs si certains éléments sont absents
    if (!cart || !overlay || !cartItems) {

        console.warn("BANKSO : certains éléments du panier sont introuvables.");

        return;

    }

});

/*==================================================
                DEBUG
==================================================*/

console.log("✅ BANKSO SHOP chargé avec succès");