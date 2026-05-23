const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

if (hamburger) {
    hamburger.addEventListener("click", function () {
        navLinks.classList.toggle("open");
    });
}