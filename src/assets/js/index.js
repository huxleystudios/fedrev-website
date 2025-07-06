document.addEventListener("DOMContentLoaded", async () => {
  const observeModule = await import("./observer.js");
  observeModule.observeElements("[data-animate-hero-item]");
  observeModule.observeElements("[data-animate-about-item]");
  observeModule.observeElements("[data-animate-service-item]");
  observeModule.observeElements("[data-animate-contact-item]");

  const navToggleModule = await import("./navToggle.js");
  navToggleModule.initNavToggleOnClick();

  const yearModule = await import("./footerDate.js");
  yearModule.setCurrentYear();
});
