export const setCurrentYear = (selector = "#year") => {
  const el = document.querySelector(selector);
  if (el) el.textContent = new Date().getFullYear();
};
