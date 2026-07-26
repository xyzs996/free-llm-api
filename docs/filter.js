function matchesSelection(value, selected, expected) {
  return !selected || selected === 'all' || expected(value) === selected;
}

export function filterProviders(providers, filters = {}) {
  const query = filters.query?.trim().toLowerCase() ?? '';

  return providers.filter((provider) => {
    if (
      filters.category
      && filters.category !== 'all'
      && provider.category !== filters.category
    ) {
      return false;
    }

    if (
      !matchesSelection(
        provider.credit_card_required,
        filters.creditCard,
        (required) => (required ? 'required' : 'not-required'),
      )
    ) {
      return false;
    }

    if (
      !matchesSelection(
        provider.openai_compatible,
        filters.openaiCompatible,
        (compatible) => (compatible ? 'yes' : 'no'),
      )
    ) {
      return false;
    }

    if (
      filters.probe
      && filters.probe !== 'all'
      && provider.probe.classification !== filters.probe
    ) {
      return false;
    }

    if (!query) return true;

    // One script serves every edition of the catalog, so the index carries each
    // translation the record holds. Otherwise a reader on the Chinese page would
    // search the text in front of them and match nothing.
    const searchable = [
      provider.name,
      provider.category,
      provider.models.join(' '),
      provider.limits.summary,
      provider.limits.summary_zh,
      provider.availability.note,
      provider.availability.note_zh,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchable.includes(query);
  });
}
