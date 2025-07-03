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

        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", false);

        // Delay navigation to allow closing animation (adjust time as needed)
        setTimeout(() => {
          window.location.href = href;
        }, 300); // 300ms is a common transition time
      }
    });
  });
};
