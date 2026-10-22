/* DIANAE site navigation. Vanilla JS, no dependencies. */
(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-navigation');
  if (!button || !nav) return;
  const setOpen = (open) => {
    const value = Boolean(open);
    button.setAttribute('aria-expanded', String(value));
    nav.dataset.open = String(value);
    button.setAttribute('aria-label', value ? button.dataset.closeLabel : button.dataset.openLabel);
    button.setAttribute('title', value ? button.dataset.closeLabel : button.dataset.openLabel);
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) setOpen(false);
  });
  const desktop = window.matchMedia('(min-width: 1101px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
})();
