const learningMenu = document.querySelector(".menu-group > a");
const menuGroup = document.querySelector(".menu-group");

learningMenu.addEventListener("click", function(event) {
    event.preventDefault();
    menuGroup.classList.toggle("open");
});