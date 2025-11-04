(function () {
  const searchInput = document.querySelector('[data-faq-search]');
  const items = Array.from(document.querySelectorAll('.faq-item'));
  const categorySections = Array.from(document.querySelectorAll('.faq-category'));
  const emptyState = document.querySelector('[data-faq-empty]');

  if (!searchInput || !items.length) return;

  const normalize = (str) => str.toLowerCase().trim();

  const updateVisibility = () => {
    const term = normalize(searchInput.value);
    let anyMatch = false;

    items.forEach((item) => {
      const question = item.dataset.question || '';
      const answer = item.dataset.answer || '';
      const matches = term.length === 0 || question.includes(term) || answer.includes(term);
      item.style.display = matches ? '' : 'none';
      if (!matches) {
        item.removeAttribute('open');
      }
      anyMatch = anyMatch || matches;
    });

    categorySections.forEach((section) => {
      const visibleItems = section.querySelectorAll('.faq-item:not([style*="display: none"])');
      section.style.display = visibleItems.length ? '' : 'none';
    });

    if (emptyState) {
      emptyState.hidden = anyMatch || term.length === 0;
    }
  };

  searchInput.addEventListener('input', updateVisibility, { passive: true });
  updateVisibility();
})();
