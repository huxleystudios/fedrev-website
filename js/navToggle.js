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

  // Close nav when link is clicked (mobile), then navigate
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (nav.classList.contains("open")) {
        e.preventDefault(); // Stop immediate navigation

        const href = link.getAttribute("href");

        // Remove open classes to trigger close animation
        nav.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", false);

        // Wait for closing animation to finish, then navigate
        setTimeout(() => {
          window.location.href = href;
        }, 300); // Adjust to match your CSS transition duration
      }
    });
  });
};
