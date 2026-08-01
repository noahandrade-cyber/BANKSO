(() => {
  const shippingCost = 0;
  const readCart = () => {

    try {

        const cart = JSON.parse(localStorage.getItem("cart"));

        if (!Array.isArray(cart)) {

            return [];

        }

        return cart.map(item => ({

            id: item.id,
            name: item.name,
            image: item.image,
            size: item.size || "M",
            quantity: Number(item.quantity) || 1,
            price: Number(item.price)

        }));

    } catch {

        return [];

    }

};
  let cart = readCart();
  const els = { items:document.getElementById('cart-items'), wrapper:document.querySelector('.cart-wrapper'), empty:document.getElementById('empty-cart'), subtotal:document.getElementById('subtotal'), shipping:document.getElementById('shipping'), total:document.getElementById('total') };
  const money = (value) => `${value.toFixed(2).replace('.', ',')} €`;
 const save = () => {

    localStorage.setItem("cart", JSON.stringify(cart));

    render();

};
  const badge = () => document.querySelectorAll('.cart-count').forEach((el) => el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0));
  function render() {
    els.items.innerHTML = '';
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery = cart.length ? shippingCost : 0;
    els.subtotal.textContent = money(subtotal); els.shipping.textContent = cart.length ? 'Gratuite' : money(delivery); els.total.textContent = money(subtotal + delivery); badge();
    els.wrapper.style.display = cart.length ? 'grid' : 'none'; els.empty.style.display = cart.length ? 'none' : 'flex';
    cart.forEach((item, index) => {
      const card = document.createElement('article'); card.className = 'cart-item';
      card.innerHTML = `<img src="${item.image}" class="cart-image" alt="${item.name}"><div class="cart-info"><h3>${item.name}</h3><p>Taille : ${item.size}</p><div class="cart-price">${money(item.price)}</div><div class="quantity"><button class="minus" type="button" aria-label="Retirer un article">−</button><span>${item.quantity}</span><button class="plus" type="button" aria-label="Ajouter un article">+</button></div><p class="line-total">Sous-total : <strong>${money(item.price * item.quantity)}</strong></p><button class="remove" type="button"><i class="fa-solid fa-trash"></i> Supprimer</button></div>`;
      const qty = card.querySelector(".quantity span");

card.querySelector(".plus").onclick = () => {

    qty.classList.add("update");

    setTimeout(() => qty.classList.remove("update"), 250);

    cart[index].quantity++;

    setTimeout(save,120);

};

card.querySelector(".minus").onclick = () => {

    qty.classList.add("update");

    setTimeout(() => qty.classList.remove("update"),250);

    cart[index].quantity--;

    if(cart[index].quantity < 1){

        card.classList.add("removing");

        setTimeout(() => {

            cart.splice(index,1);

            save();

        },300);

    }else{

        setTimeout(save,120);

    }

};
      card.querySelector('.remove').onclick = () => { cart.splice(index, 1); save(); };
      els.items.append(card);
    });
  }
  document.getElementById("checkoutButton")?.addEventListener("click", () => {

    if (cart.length === 0) {

        alert("Votre panier est vide.");

        return;

    }

    localStorage.setItem("cart", JSON.stringify(cart));

    window.location.href = "paiement.html";

});
  document.querySelector('.menu-toggle')?.addEventListener('click', (event) => { const nav=document.querySelector('.site-header nav'); const open=nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
  render();
})();
/*=====================================
        VIDER LE PANIER
======================================*/

const clearCartButton = document.getElementById("clearCartButton");

if(clearCartButton){

    clearCartButton.addEventListener("click",()=>{

        if(confirm("Voulez-vous vraiment supprimer tous les articles du panier ?")){

            localStorage.removeItem("cart");

            location.reload();

        }

    });

}