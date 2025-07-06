document.addEventListener("DOMContentLoaded", async () => {
  const observeModule = await import("./observer.js");
  const elements = [
    "[data-animate-hero-item]",
    "[data-animate-hero-image]",
    "[data-animate-about-item]",
    "[data-animate-service-item]",
    "[data-animate-contact-item]",
  ];
  elements.forEach((element) => {
    observeModule.observeElements(element);
  });

  const navToggleModule = await import("./navToggle.js");
  navToggleModule.initNavToggleOnClick();

  const yearModule = await import("./footerDate.js");
  yearModule.setCurrentYear();
});
