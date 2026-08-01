(() => {

    // ============================
    // PRODUIT ACTUEL
    // ============================

    const body = document.body;

    const product = {
        name: body.dataset.name,
        price: Number(body.dataset.price),
        image: body.dataset.image,
        url: body.dataset.productUrl
    };

    // ============================
    // LOCAL STORAGE
    // ============================

    function read(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // ============================
    // COMPTEURS
    // ============================

    function count(items) {
        return items.reduce((total, item) => total + item.quantity, 0);
    }

    function refreshCounts() {

        const cart = read("cart");
        const wishlist = read("wishlist");

        document.querySelectorAll(".cart-count").forEach(el => {
            el.textContent = count(cart);
        });

        document.querySelectorAll(".wishlist-count,#wishlist-count").forEach(el => {
            el.textContent = wishlist.length;
        });

    }

    // ============================
    // DRAWER
    // ============================

    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    const drawerItems = document.getElementById("drawerItems");
    const drawerTotal = document.getElementById("drawerTotal");

    function openDrawer(){

        updateDrawer();

        drawer.classList.add("active");
        overlay.classList.add("active");

    }

    function closeDrawer(){

        drawer.classList.remove("active");
        overlay.classList.remove("active");

    }

    document.getElementById("closeDrawer")?.addEventListener("click",closeDrawer);
    document.getElementById("continueShopping")?.addEventListener("click",closeDrawer);
    overlay?.addEventListener("click",closeDrawer);
        // ============================
    // GALERIE D'IMAGES
    // ============================

    document.querySelectorAll(".thumb").forEach(thumb => {

        thumb.addEventListener("click", () => {

            document.getElementById("mainImage").src = thumb.dataset.image;

            document.querySelectorAll(".thumb").forEach(img => {
                img.classList.remove("active");
            });

            thumb.classList.add("active");

        });

    });

    // ============================
    // CHOIX DE LA TAILLE
    // ============================

    let selectedSize =
        document.querySelector(".buttons button.active")?.textContent.trim() || "M";

    document.querySelectorAll(".buttons button").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".buttons button").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            selectedSize = button.textContent.trim();

        });

    });

    // ============================
// AJOUT AU PANIER
// ============================

document.getElementById("addToCart")?.addEventListener("click", () => {

    let cart = read("cart");

    const productToAdd = {
        id: product.url || product.name,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        url: product.url,
        size: selectedSize,
        quantity: 1
    };

    // Cherche le même produit avec la même taille
    const existing = cart.find(item =>
        item.id === productToAdd.id &&
        item.size === productToAdd.size
    );

    if (existing) {

        existing.quantity++;

    } else {

        cart.push(productToAdd);

    }

    write("cart", cart);

    refreshCounts();

    updateDrawer();

    openDrawer();

});
        // ============================
    // AFFICHAGE DU DRAWER
    // ============================

    function updateDrawer() {

        const cart = read("cart");

        drawerItems.innerHTML = "";

        let total = 0;

        if(cart.length === 0){

            drawerItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fa-solid fa-bag-shopping"></i>
                    <h3>Votre panier est vide</h3>
                    <p>Ajoutez un article pour commencer vos achats.</p>
                </div>
            `;

            drawerTotal.textContent = "0,00 €";

            return;

        }

        cart.forEach((item,index)=>{

            total += item.price * item.quantity;

            drawerItems.innerHTML += `

            <div class="drawer-item">

                <img src="${item.image}" alt="${item.name}">

                <div class="drawer-info">

                    <h4>${item.name}</h4>

                    <p>Taille : ${item.size}</p>

                    <div class="drawer-price">
                        ${item.price.toFixed(2)} €
                    </div>

                    <div class="quantity-box">

                        <button class="minus-btn"
                                data-index="${index}">
                            −
                        </button>

                        <span>${item.quantity}</span>

                        <button class="plus-btn"
                                data-index="${index}">
                            +
                        </button>

                    </div>

                </div>

            </div>

            `;

        });

        drawerTotal.textContent = total.toFixed(2) + " €";

        addQuantityEvents();

    }

    // ============================
    // EVENEMENTS + ET -
    // ============================

    function addQuantityEvents(){

        document.querySelectorAll(".plus-btn").forEach(btn=>{

            btn.onclick=()=>{

                increaseQuantity(Number(btn.dataset.index));

            };

        });

        document.querySelectorAll(".minus-btn").forEach(btn=>{

            btn.onclick=()=>{

                decreaseQuantity(Number(btn.dataset.index));

            };

        });

    }

    // ============================
    // +
    // ============================

    function increaseQuantity(index){

        let cart = read("cart");

        cart[index].quantity++;

        write("cart",cart);

        refreshCounts();

        updateDrawer();

    }

    // ============================
    // -
    // ============================

    function decreaseQuantity(index){

        let cart = read("cart");

        cart[index].quantity--;

        if(cart[index].quantity<=0){

            cart.splice(index,1);

        }

        write("cart",cart);

        refreshCounts();

        updateDrawer();

    }
        // ============================
    // WISHLIST
    // ============================

    const wishlistButton = document.querySelector(".wishlist");

    let wishlistToastTimer = null;

    function showWishlistToast(message){

        let toast = document.getElementById("wishlistToast");

        if(!toast){

            toast = document.createElement("div");
            toast.id = "wishlistToast";
            toast.className = "wishlist-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);

        }

        toast.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <span>${message}</span>
        `;
        toast.classList.add("show");

        clearTimeout(wishlistToastTimer);

        wishlistToastTimer = setTimeout(()=>{

            toast.classList.remove("show");

        },2200);

    }

    function updateWishlistButton(){

        if(!wishlistButton) return;

        const wishlist = read("wishlist");

        const saved = wishlist.some(item => item.name === product.name);

        wishlistButton.classList.toggle("active", saved);

        if(saved){

            wishlistButton.innerHTML =
            '<i class="fa-solid fa-heart"></i> Dans la wishlist';

        }else{

            wishlistButton.innerHTML =
            '<i class="fa-regular fa-heart"></i> Ajouter à la wishlist';

        }

    }

    wishlistButton?.addEventListener("click",()=>{

        let wishlist = read("wishlist");

        const index = wishlist.findIndex(item=>item.name===product.name);
        let added = false;

        if(index>=0){

            wishlist.splice(index,1);

        }else{

            wishlist.push(product);
            added = true;

        }

        write("wishlist",wishlist);

        updateWishlistButton();

        refreshCounts();

        if(added){

            showWishlistToast("Ajouté à la wishlist");

        }

    });

    // ============================
    // BOUTON VOIR LE PANIER
    // ============================

    document.querySelector(".cart-btn")?.addEventListener("click",()=>{

        window.location.href="panier.html";

    });

    // ============================
    // BOUTON COMMANDER
    // ============================

    document.querySelector(".checkout-btn")?.addEventListener("click",()=>{

        window.location.href="paiement.html";

        // ou checkout.html si c'est le nom de ta page

    });

    // ============================
    // INITIALISATION
    // ============================

    updateWishlistButton();

    refreshCounts();

    updateDrawer();

})();