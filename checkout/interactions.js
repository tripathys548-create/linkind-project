'use strict';

// Scroll-reveal for section headings and cards. Purely cosmetic —
// everything is already visible without JS or if this fails to run.
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.section h2, .problem-card, .solution-card, .benefits-list li, .steps-list li, .faq-item'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
})();
