export const initNavToggleOnClick = () => {
  const navToggle = document.querySelector(".nav-toggle");
  if (!navToggle) return;
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-link");

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen);
  });

  // Close nav when link is clicked (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("open")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", false);
      }
    });
  });
};
