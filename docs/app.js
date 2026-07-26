import { filterProviders } from './filter.js';

const DEFAULT_FILTER_STATE = Object.freeze({
  query: '',
  category: 'all',
  creditCard: 'all',
  openaiCompatible: 'all',
  probe: 'all',
});

const ALLOWED_VALUES = Object.freeze({
  category: new Set([
    'all',
    'provider-free-tier',
    'trial-credit',
    'free-model-aggregator',
    'retiring-free-tier',
    'metered-access',
  ]),
  creditCard: new Set(['all', 'not-required', 'required']),
  openaiCompatible: new Set(['all', 'yes', 'no']),
  probe: new Set([
    'all',
    'available',
    'credential-rejected',
    'sample-rate-limited',
    'endpoint-error',
    'network-error',
    'not-checked',
  ]),
});

export function buildFilterState(values) {
  return {
    query: values.query?.trim() ?? '',
    category: ALLOWED_VALUES.category.has(values.category) ? values.category : 'all',
    creditCard: ALLOWED_VALUES.creditCard.has(values.creditCard) ? values.creditCard : 'all',
    openaiCompatible: ALLOWED_VALUES.openaiCompatible.has(values.openaiCompatible) ? values.openaiCompatible : 'all',
    probe: ALLOWED_VALUES.probe.has(values.probe) ? values.probe : 'all',
  };
}

export function filterStateFromSearch(search) {
  const params = new URLSearchParams(search);
  return buildFilterState(Object.fromEntries(params));
}

export function filterStateToSearch(state) {
  const normalized = buildFilterState(state);
  const params = new URLSearchParams();

  for (const key of ['query', 'category', 'creditCard', 'openaiCompatible', 'probe']) {
    if (normalized[key] !== DEFAULT_FILTER_STATE[key]) params.set(key, normalized[key]);
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}

function initializeFilters() {
  const form = document.querySelector('#provider-filters');
  const dataElement = document.querySelector('#provider-data');
  const countElement = document.querySelector('#provider-count');
  const emptyState = document.querySelector('#empty-state');
  const rows = [...document.querySelectorAll('[data-provider-id]')];

  if (!form || !dataElement || !countElement || !emptyState) return;

  const providers = JSON.parse(dataElement.textContent);
  const initialState = filterStateFromSearch(window.location.search);

  for (const [name, value] of Object.entries(initialState)) {
    const control = form.elements.namedItem(name);
    if (control) control.value = value;
  }

  const applyFilters = () => {
    const values = Object.fromEntries(new FormData(form));
    const state = buildFilterState(values);
    const matches = filterProviders(providers, state);
    const visibleIds = new Set(matches.map(({ id }) => id));

    for (const row of rows) {
      row.hidden = !visibleIds.has(row.dataset.providerId);
    }

    countElement.textContent = String(matches.length);
    emptyState.hidden = matches.length !== 0;
    const nextUrl = `${window.location.pathname}${filterStateToSearch(state)}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  };

  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  applyFilters();
}

if (typeof document !== 'undefined') initializeFilters();
