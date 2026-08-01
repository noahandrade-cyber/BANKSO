/*=========================================
        BANKSO CART MANAGER
=========================================*/

class Cart{

    constructor(){

        this.cart = JSON.parse(

            localStorage.getItem("cart")

        ) || [];

        this.updateCounter();

    }

    save(){

        localStorage.setItem(

            "cart",

            JSON.stringify(this.cart)

        );

        this.updateCounter();

    }

    updateCounter(){

        const badge = document.querySelector(".cart-count");

        if(!badge) return;

        let total = 0;

        this.cart.forEach(item=>{

            total += item.quantite;

        });

        badge.textContent = total;

    }

    add(product){

        const existing = this.cart.find(item=>

            item.nom===product.nom

            &&

            item.taille===product.taille

        );

        if(existing){

            existing.quantite++;

        }

        else{

            this.cart.push(product);

        }

        this.save();

        this.notification(product.nom);

    }

    notification(name){

        const div = document.createElement("div");

        div.className="cart-popup";

        div.innerHTML=`

            <i class="fa-solid fa-check"></i>

            <div>

                <strong>${name}</strong>

                <p>Ajouté au panier</p>

            </div>

        `;

        document.body.appendChild(div);

        setTimeout(()=>{

            div.classList.add("show");

        },50);

        setTimeout(()=>{

            div.classList.remove("show");

            setTimeout(()=>{

                div.remove();

            },500);

        },2500);

    }

}

const CART = new Cart();