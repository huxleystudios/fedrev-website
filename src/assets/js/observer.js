export const observeElements = (
  selector,
  threshold = 0.1,
  delay = 200,
  className = "visible"
) => {
  const elements = document.querySelectorAll(selector);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Get the index of this element in the full NodeList
        const index = Array.from(elements).indexOf(entry.target);

        setTimeout(() => {
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }, index * delay);
      });
    },
    { threshold }
  );

  elements.forEach((el) => observer.observe(el));
};
