const form = document.getElementById("waitlist-form");
const modal = document.getElementById("waitlist-modal");
console.log(modal);
const closeBtn = document.getElementById("close-modal");

if(form){

    form.addEventListener("submit",async(e)=>{

        e.preventDefault();

        const button=form.querySelector("button");

        const oldText=button.innerHTML;

        button.disabled=true;
        button.innerHTML="ENVOI...";

        try{

            const response=await fetch("/api/waitlist",{

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    email:document.getElementById("waitlist-email").value

                })

            });

            const text=await response.text();

            const data=text ? JSON.parse(text) : {};

            if(!response.ok){

                throw new Error(data.error);

            }

            form.reset();

            modal.classList.add("active");

        }

        catch(error){

            alert(error.message);

        }

        finally{

            button.disabled=false;
            button.innerHTML=oldText;

        }

    });

}

closeBtn.onclick=()=>{

    modal.classList.remove("active");

}

window.onclick=(e)=>{

    if(e.target===modal){

        modal.classList.remove("active");

    }

}