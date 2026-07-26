export function accessGroups(providers) {
  return {
    permanent: providers.filter(({ category }) => category === 'provider-free-tier'),
    other: providers.filter(({ category }) => category !== 'provider-free-tier'),
  };
}

export function catalogSummary(providers) {
  const { permanent } = accessGroups(providers);

  return {
    permanentFree: permanent.length,
    noCardPermanentFree: permanent.filter(
      ({ credit_card_required: required }) => !required,
    ).length,
    openAiCompatiblePermanentFree: permanent.filter(
      ({ openai_compatible: compatible }) => compatible,
    ).length,
    latestReview: providers.map(({ source_checked_at: date }) => date).sort().at(-1),
  };
}

function maxBy(providers, valueFor) {
  return providers.reduce((best, provider) => (
    valueFor(provider) > valueFor(best) ? provider : best
  ));
}

export function quickPicks(providers) {
  const { permanent } = accessGroups(providers);
  if (permanent.length === 0) return [];

  const highestDaily = maxBy(
    permanent,
    ({ limits }) => limits.requests_per_day ?? -1,
  );
  const highestRpm = maxBy(
    permanent,
    ({ limits }) => limits.requests_per_minute ?? -1,
  );
  const browserReady = permanent.find(({ browser_check: check }) => check === 'supported');
  const codingAgents = permanent.find(({ id }) => id === 'groq')
    ?? permanent.find(({ models }) => models.some((model) => /code|coder|gpt-oss/i.test(model)));

  return [
    {
      id: 'highest-daily-limit',
      provider: highestDaily,
      reason: `${highestDaily.limits.requests_per_day.toLocaleString('en-US')} requests/day published`,
    },
    {
      id: 'highest-rpm',
      provider: highestRpm,
      reason: `${highestRpm.limits.requests_per_minute.toLocaleString('en-US')} RPM published`,
    },
    browserReady && {
      id: 'browser-ready',
      provider: browserReady,
      reason: 'Browser CORS check supported',
    },
    codingAgents && {
      id: 'coding-agents',
      provider: codingAgents,
      reason: 'Documented OpenAI-compatible coding setup',
    },
  ].filter(Boolean);
}
