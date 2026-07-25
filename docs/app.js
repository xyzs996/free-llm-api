import { filterProviders } from './filter.js';

export function buildFilterState(values) {
  return {
    query: values.query?.trim() ?? '',
    category: values.category || 'all',
    creditCard: values.creditCard || 'all',
    openaiCompatible: values.openaiCompatible || 'all',
    probe: values.probe || 'all',
  };
}

function initializeFilters() {
  const form = document.querySelector('#provider-filters');
  const dataElement = document.querySelector('#provider-data');
  const countElement = document.querySelector('#provider-count');
  const emptyState = document.querySelector('#empty-state');
  const rows = [...document.querySelectorAll('[data-provider-id]')];

  if (!form || !dataElement || !countElement || !emptyState) return;

  const providers = JSON.parse(dataElement.textContent);

  const applyFilters = () => {
    const values = Object.fromEntries(new FormData(form));
    const matches = filterProviders(providers, buildFilterState(values));
    const visibleIds = new Set(matches.map(({ id }) => id));

    for (const row of rows) {
      row.hidden = !visibleIds.has(row.dataset.providerId);
    }

    countElement.textContent = String(matches.length);
    emptyState.hidden = matches.length !== 0;
  };

  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  applyFilters();
}

if (typeof document !== 'undefined') initializeFilters();
