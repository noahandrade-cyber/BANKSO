(() => {

    /*=====================================
            LOCAL STORAGE
    =====================================*/

    function read(key) {

        try {

            const data = JSON.parse(localStorage.getItem(key));

            return Array.isArray(data) ? data : [];

        } catch {

            return [];

        }

    }

    /*=====================================
            COMPTEURS
    =====================================*/

    function updateCounters() {

        const cart = read("cart");
        const wishlist = read("wishlist");

        const cartTotal = cart.reduce((total, item) => {

            return total + (Number(item.quantity ?? item.quantite) || 1);

        }, 0);

        document
            .querySelectorAll(".cart-count, #cart-count")
            .forEach(counter => {

                counter.textContent = cartTotal;

            });

        document
            .querySelectorAll(".wishlist-count, #wishlist-count")
            .forEach(counter => {

                counter.textContent = wishlist.length;

            });

    }

    updateCounters();

    /*=====================================
            MENU MOBILE
    =====================================*/

    const menuButton = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-header nav");

    if(menuButton && nav){

        const icon = menuButton.querySelector("i");

        function closeMenu(){

            nav.classList.remove("open");

            menuButton.setAttribute("aria-expanded","false");

            if(icon){

                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");

            }

            document.body.style.overflow = "";

        }

        function openMenu(){

            nav.classList.add("open");

            menuButton.setAttribute("aria-expanded","true");

            if(icon){

                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");

            }

            document.body.style.overflow = "hidden";

        }

        menuButton.addEventListener("click",(event)=>{

            event.stopPropagation();

            if(nav.classList.contains("open")){

                closeMenu();

            }else{

                openMenu();

            }

        });

        /*=========================
            Cliquer sur un lien
        =========================*/

        nav.querySelectorAll("a").forEach(link=>{

            link.addEventListener("click",()=>{

                closeMenu();

            });

        });

        /*=========================
          Cliquer hors du menu
        =========================*/

        document.addEventListener("click",(event)=>{

            if(

                nav.classList.contains("open") &&

                !nav.contains(event.target) &&

                !menuButton.contains(event.target)

            ){

                closeMenu();

            }

        });

        /*=========================
           Touche Echap
        =========================*/

        document.addEventListener("keydown",(event)=>{

            if(event.key==="Escape"){

                closeMenu();

            }

        });

        /*=========================
           Retour version PC
        =========================*/

        window.addEventListener("resize",()=>{

            if(window.innerWidth>768){

                closeMenu();

            }

        });

    }

})();