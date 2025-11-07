// Pega os elementos
const navBar = document.getElementById("navbar");
const openBtn = document.getElementById("openModal");
const modal = document.getElementById("login-screen");
const closeBtn = document.getElementById("closeModal");

// Abrir a modal
openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// Fechar a modal
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Fechar clicando fora
window.addEventListener("click", (e) => {
    if (e.target === modal) {
    modal.style.display = "none";
    }
});