(() => {

    /*=====================================
            LOCAL STORAGE
    =====================================*/

    const read = (key) => {

        try {

            const data = JSON.parse(localStorage.getItem(key));

            return Array.isArray(data) ? data : [];

        } catch {

            return [];

        }

    };

    let wishlist = read("wishlist");
    let cart = read("cart");

    /*=====================================
            ELEMENTS HTML
    =====================================*/

    const container = document.getElementById("wishlistContainer");
    const empty = document.getElementById("empty");

    /*=====================================
            DONNEES PRODUIT
    =====================================*/

    const getName = (item) => item.name ?? item.nom;

    const getPrice = (item) => Number(item.price ?? item.prix);

    const getImage = (item) => item.image;

    const getSize = (item) => item.size ?? item.taille ?? "M";

    /*=====================================
            MISE A JOUR
    =====================================*/

    function updateCounters() {

        const cartCount = cart.reduce((total, item) => {

            return total + (Number(item.quantity ?? item.quantite) || 1);

        }, 0);

        document.querySelectorAll(".wishlist-count, #wishlist-count").forEach((el) => {

            el.textContent = wishlist.length;

        });

        document.querySelectorAll(".cart-count, #cart-count").forEach((el) => {

            el.textContent = cartCount;

        });

    }

    function save() {

        localStorage.setItem("wishlist", JSON.stringify(wishlist));

        localStorage.setItem("cart", JSON.stringify(cart));

        updateCounters();

    }

    /*=====================================
            RENDU
    =====================================*/

    function render() {

        container.innerHTML = "";

        empty.style.display = wishlist.length ? "none" : "block";
                wishlist.forEach((item, index) => {

            const card = document.createElement("article");

            card.className = "card";

            card.innerHTML = `

                <div class="card-media">

                    <span class="card-badge">WISHLIST</span>

                    <img src="${getImage(item)}" alt="${getName(item)}">

                </div>

                <div class="card-content">

                    <div class="card-top">

                        <h2>${getName(item)}</h2>

                        <div class="card-price">

                            ${getPrice(item).toFixed(2).replace(".", ",")} €

                        </div>

                    </div>

                    <p class="card-size">

                        Taille ${getSize(item)}

                    </p>

                    <div class="actions">

                        <button class="add-cart">

                            Ajouter au panier

                        </button>

                        <button class="delete">

                            Retirer

                        </button>

                    </div>

                </div>

            `;

            /*==============================
                AJOUT AU PANIER
            ==============================*/

            card.querySelector(".add-cart").addEventListener("click", () => {

                const existing = cart.find((product) =>

                    getName(product) === getName(item) &&
                    (product.size ?? product.taille ?? "M") === getSize(item)

                );

                if (existing) {

                    existing.quantity =
                        (Number(existing.quantity ?? existing.quantite) || 1) + 1;

                } else {

                    cart.push({

                        ...item,

                        name: getName(item),

                        price: getPrice(item),

                        size: getSize(item),

                        quantity: 1

                    });

                }

                /* Retire automatiquement de la wishlist */

                wishlist.splice(index, 1);

                save();
                showToast();
                render();



            });

            /*==============================
                    SUPPRIMER
            ==============================*/

            card.querySelector(".delete").addEventListener("click", () => {

                wishlist.splice(index, 1);

                save();

                render();

            });

            container.appendChild(card);

        });
            }
    /*=====================================
        NOTIFICATION
======================================*/

function showToast(){

    const toast = document.getElementById("toast");

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

    /*=====================================
            INITIALISATION
    =====================================*/

    updateCounters();

    render();

})();