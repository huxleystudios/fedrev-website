document.addEventListener("DOMContentLoaded", async () => {
  const observeModule = await import("./observer.js");
  observeModule.observeElements(".hero-item");
  observeModule.observeElements(".about-item");
  observeModule.observeElements(".service-item");
  observeModule.observeElements(".contact-item");

  const navToggleModule = await import("./navToggle.js");
  navToggleModule.initNavToggleOnClick();

  const yearModule = await import("./footerDate.js");
  yearModule.setCurrentYear();
});
