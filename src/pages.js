import { readFileSync } from 'node:fs';
import { escapeHtml, externalLink } from './html.js';
import { limitStatusLabel } from './client-pages.js';
import { renderDocument } from './page-layout.js';
import {
  SNIPPET_CLIENTS,
  keyEnvForProvider,
  renderSnippet,
  snippetModelFor,
  snippetProviderName,
} from './snippets.js';
import { isLandingPageEligible, providersInFamily } from './validate.js';

// The renderer is a build step, so reading the family list once at import keeps
// `renderArtifacts(providers)` a synchronous, single-argument call for every
// existing caller and test.
export const MODEL_FAMILIES = Object.freeze(JSON.parse(
  readFileSync(new URL('../data/model-families.json', import.meta.url), 'utf8'),
));

export const CATEGORY_TITLES = Object.freeze({
  'provider-free-tier': 'Provider free tier',
  'free-model-aggregator': 'Free model aggregator',
  'trial-credit': 'Free trial credit',
  'metered-access': 'Metered access',
  'retiring-free-tier': 'Retiring free tier',
});

export function categoryTitle(category) {
  return CATEGORY_TITLES[category] ?? category;
}

// Editorial framing for each client, kept beside the generated artifact it
// describes. The prose says what breaks in practice, which is the part a
// reader cannot derive from the config file itself.
const CLIENT_NOTES = Object.freeze({
  codex: {
    title: 'Codex CLI',
    query: 'free api for codex cli',
    summary: 'Codex CLI reaches any OpenAI-compatible endpoint through a custom model provider block in `~/.codex/config.toml`.',
    requirements: [
      '<code>model_provider</code> names an entry under <code>[model_providers.*]</code>, and the two spellings have to match exactly.',
      '<code>env_key</code> names the environment variable holding the key, so the key itself never enters the config file.',
      '<code>wire_api</code> selects the request shape. The generated block uses <code>"responses"</code>; if the provider documents only <code>/chat/completions</code>, change it to <code>"chat"</code>, because a mismatch fails as a 404 or a schema error on the very first request.',
      'The file has to be the user-level one. Codex ignores project-level <code>.codex/config.toml</code> keys that redirect provider authentication, including <code>model_provider</code>.',
    ],
    expectation: 'Codex sends large context windows for repository work, so a provider with a generous requests-per-day count can still cut you off on tokens per day. Read both columns before committing to one provider.',
    source: { title: 'Codex advanced configuration and custom model providers', url: 'https://developers.openai.com/codex/config-advanced#custom-model-providers' },
  },
  'claude-code': {
    title: 'Claude Code',
    query: 'free api for claude code',
    summary: 'Claude Code speaks the Anthropic Messages API, while nearly every free tier in this catalog speaks the OpenAI chat completions API.',
    requirements: [
      '<code>ANTHROPIC_BASE_URL</code> has to point at an endpoint that accepts Anthropic-format requests. Claude Code appends its own API path, so the value is a gateway root and not a <code>/v1</code> suffix.',
      '<code>ANTHROPIC_AUTH_TOKEN</code> holds the key, read from the environment at start-up.',
      'The model you name has to exist on that endpoint. A wrong model id comes back as a 404 from the provider, not as a Claude Code error.',
      'That protocol mismatch, not the key, is what usually breaks a free Claude Code setup. Either put a translating router in front of an OpenAI-compatible free tier, or use a gateway that already speaks Anthropic.',
    ],
    expectation: 'Agentic sessions burn a daily quota far faster than chat does, because every tool call is another long prompt. A 429 tells you that one request was limited and nothing about the quota left, unless the provider returns a reset header.',
    source: { title: 'Claude Code LLM gateway configuration', url: 'https://docs.anthropic.com/en/docs/claude-code/llm-gateway' },
  },
  continue: {
    title: 'Continue',
    query: 'free api for continue',
    summary: 'Continue reads a YAML assistant file and treats an OpenAI-compatible endpoint as a first-class provider, with the key resolved from its secret store.',
    requirements: [
      'Each entry under <code>models:</code> needs <code>provider: openai</code>, an <code>apiBase</code> that serves <code>/chat/completions</code>, and the provider’s exact <code>model</code> id.',
      '<code>apiKey</code> uses the <code>${{ secrets.NAME }}</code> form, so the file can be committed while the value stays outside it.',
      '<code>roles</code> decides where the model is offered. A small free model is usually fine for <code>chat</code> and unreliable for <code>apply</code>, and listing a role it cannot handle shows up as broken edits rather than an API error.',
      'A model id that begins with <code>@</code>, as Cloudflare’s do, has to be quoted, because YAML reserves that character.',
    ],
    expectation: 'Continue keeps a persistent context of open files, so the request size grows with the session rather than with what you typed. Token-per-day limits bind before request-per-day limits do.',
    source: { title: 'Continue configuration reference', url: 'https://docs.continue.dev/reference' },
  },
  cursor: {
    title: 'Cursor',
    query: 'free api for cursor',
    summary: 'Cursor accepts a custom OpenAI base URL and key in its settings panel, which is the only supported way to point it at a free tier.',
    requirements: [
      'The values go into <strong>Cursor Settings &gt; Models</strong> by hand. This project writes a setup guide and never touches Cursor’s settings file or its credential storage.',
      'Overriding the OpenAI base URL affects the built-in models too, so it is a global switch rather than a per-request one.',
      'A custom key applies only to supported chat models. Features such as Tab completion keep using Cursor’s own models regardless.',
      'The model has to be added by its exact provider id and then verified, or Cursor will keep sending requests to a name the provider does not serve.',
    ],
    expectation: 'Because the override is global, a free tier that rate-limits you takes the whole editor with it. Keep the built-in configuration one click away.',
    source: { title: 'Cursor custom API keys', url: 'https://docs.cursor.com/settings/api-keys' },
  },
  cline: {
    title: 'Cline',
    query: 'free api for cline',
    summary: 'Cline ships an OpenAI Compatible provider type that takes three values: base URL, API key, and model id.',
    requirements: [
      'The base URL is the root that serves <code>/chat/completions</code>. Most providers document it with the <code>/v1</code> suffix already included.',
      'The model id is the provider’s exact id and not a display name; Cline passes it through verbatim.',
      'The model has to handle tool calls well enough to emit valid diffs. This is the real filter: small free models often return malformed edits, which Cline surfaces as repeated failed apply attempts rather than as an API error.',
      'Values are entered in the Cline settings panel by hand. This project does not read or write VS Code extension storage.',
    ],
    expectation: 'Plan mode and Act mode send very different prompt sizes, so a provider that plans fine can still fail on a large diff. If edits keep failing while the API returns 200, the model is the constraint and not the quota.',
    source: { title: 'Cline OpenAI Compatible provider', url: 'https://docs.cline.bot/provider-config/openai-compatible' },
  },
});

function ring(list, current, count) {
  const index = list.findIndex((item) => item.id === current.id);
  if (index === -1) return list.slice(0, count);
  return Array.from({ length: Math.min(count, list.length - 1) }, (_, offset) => (
    list[(index + offset + 1) % list.length]
  ));
}

function limitsPhrase(provider) {
  const { requests_per_minute: rpm, requests_per_day: rpd } = provider.limits;
  if (rpm === null && rpd === null) return limitStatusLabel(provider.limits.status);
  return [
    rpm === null ? null : `${rpm} requests per minute`,
    rpd === null ? null : `${rpd} requests per day`,
  ].filter(Boolean).join(', ');
}

function publishesFixedNumbers(provider) {
  return provider.limits.requests_per_minute !== null || provider.limits.requests_per_day !== null;
}

function familiesOf(provider, families, providers) {
  return families.filter((family) => providersInFamily(family, providers).some(({ id }) => id === provider.id));
}

function definition(term, value) {
  return `          <div><dt>${escapeHtml(term)}</dt><dd>${value}</dd></div>`;
}

function codeBlock(text) {
  return `        <pre class="page-code"><code>${escapeHtml(text)}</code></pre>`;
}

function faq(entries) {
  return entries
    .map(({ question, answer }) => `        <h3>${escapeHtml(question)}</h3>\n        <p>${answer}</p>`)
    .join('\n');
}

/* ------------------------------------------------------------------ provider */

function providerFaq(provider, context) {
  const { name } = provider;
  const entries = [
    {
      question: `Does ${name} ask for a credit card?`,
      answer: provider.credit_card_required
        ? `Yes. ${escapeHtml(name)} requires a card on file before the free allowance is usable, which ${context.cardRequired} of the ${context.total} providers with a page here also do.`
        : `No. ${escapeHtml(name)} is one of ${context.cardFree} providers here that hand out free access without a card, so the only cost of trying it is the signup.`,
    },
    {
      question: `What are ${name}'s free-tier rate limits?`,
      answer: publishesFixedNumbers(provider)
        ? `${escapeHtml(name)} publishes ${escapeHtml(limitsPhrase(provider))}. Those are the numbers in its own documentation as reviewed on ${escapeHtml(provider.source_checked_at)}.`
        : `${escapeHtml(name)} publishes no single free-tier number: its limits are ${escapeHtml(limitStatusLabel(provider.limits.status).toLowerCase())}. This catalog leaves that blank rather than guessing a figure.`,
    },
    {
      question: `What happens when a ${name} key hits the limit?`,
      answer: 'The endpoint answers <code>429</code>. That is a statement about the request that was refused, not about how much quota is left; only a reset header from the provider tells you when it clears.',
    },
    {
      question: `Is the ${name} free tier going away?`,
      answer: provider.availability.retires_at
        ? `Yes, on ${escapeHtml(provider.availability.retires_at)}. ${escapeHtml(provider.availability.note)}`
        : `Nothing in ${escapeHtml(name)}'s own documentation says so as of ${escapeHtml(provider.source_checked_at)}. ${escapeHtml(provider.availability.note)}`,
    },
  ];

  if (provider.openai_compatible) {
    entries.push({
      question: `Can ${name} be used with Codex, Cline, or Continue?`,
      answer: `Yes. ${escapeHtml(name)} serves the OpenAI chat completions protocol at <code>${escapeHtml(provider.base_url)}</code>, so any client that accepts a custom base URL can use it. Claude Code is the exception, because it speaks the Anthropic protocol instead.`,
    });
  }
  return entries;
}

function providerBody(provider, context) {
  const { families, providers, pageIds, peers } = context;
  const keyEnv = keyEnvForProvider(provider);
  const model = snippetModelFor(provider);
  const origin = new URL(provider.base_url).origin;
  const browserSupported = provider.browser_check === 'supported';
  const memberFamilies = familiesOf(provider, families, providers);

  const familySentence = memberFamilies.length === 0
    ? `The models above do not fall into any of the multi-provider families this catalog tracks, so ${escapeHtml(provider.name)} is the only route to them here.`
    : memberFamilies.map((family) => {
      const others = providersInFamily(family, providers)
        .filter((other) => other.id !== provider.id && pageIds.has(other.id));
      if (others.length === 0) {
        return `It is the only provider in this catalog hosting the ${escapeHtml(family.name)} family.`;
      }
      const links = others
        .map((other) => `<a href="../provider/${escapeHtml(other.id)}.html">${escapeHtml(other.name)}</a>`)
        .join(', ');
      return `${others.length} other ${others.length === 1 ? 'provider' : 'providers'} here also host the <a href="../model/${escapeHtml(family.id)}.html">${escapeHtml(family.name)}</a> family on free terms, and the terms are not the same: ${links}.`;
    }).join(' ');

  const cardSentence = provider.credit_card_required
    ? `It asks for a credit card, as ${context.cardRequired} of the ${context.total} do.`
    : `It asks for no credit card, which is true of ${context.cardFree} of the ${context.total}.`;
  const numbersSentence = publishesFixedNumbers(provider)
    ? `It publishes fixed numbers — ${escapeHtml(limitsPhrase(provider))} — which only ${context.withNumbers} of the ${context.total} do.`
    : `It publishes no fixed request count, as ${context.total - context.withNumbers} of the ${context.total} do not.`;

  const usage = model === null
    ? `<p>The catalog records no single pasteable model id for ${escapeHtml(provider.name)}, so the command below lists what the key can reach instead of naming a model that might not exist on your account.</p>`
    : `<p>${escapeHtml(provider.name)} serves the OpenAI chat completions protocol at <code>${escapeHtml(provider.base_url)}</code>. Point any client that accepts a custom base URL at it, and let the client read the key from <code>${escapeHtml(keyEnv)}</code> so the value never lands in a config file:</p>
${codeBlock(renderSnippet('codex', {
      baseUrl: provider.base_url,
      model,
      keyEnv,
      providerId: provider.id,
      providerName: snippetProviderName(provider),
    }).content)}`;

  return `        <h2>What ${escapeHtml(provider.name)}'s free tier allows</h2>
        <p>${escapeHtml(provider.limits.summary)}</p>
        <dl class="fact-grid">
${definition('Published limits', escapeHtml(limitsPhrase(provider)))}
${definition('Free access type', escapeHtml(categoryTitle(provider.category)))}
${definition('Credit card', provider.credit_card_required ? 'Required' : 'Not required')}
${definition('Protocol', provider.openai_compatible ? `OpenAI-compatible at <code>${escapeHtml(provider.base_url)}</code>` : `Provider-specific at <code>${escapeHtml(provider.base_url)}</code>`)}
${definition('Lifecycle', provider.availability.retires_at ? `Retires ${escapeHtml(provider.availability.retires_at)}` : escapeHtml(provider.availability.status))}
${definition('Sources reviewed', escapeHtml(provider.source_checked_at))}
        </dl>
        <p>${escapeHtml(provider.availability.note)}</p>

        <h2>Where ${escapeHtml(provider.name)} sits in this catalog</h2>
        <p>${escapeHtml(provider.name)} is one of ${context.inCategory} ${escapeHtml(categoryTitle(provider.category).toLowerCase())} entries among the ${context.total} providers detailed here. ${cardSentence} ${numbersSentence}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Compared with</th><th>Published limits</th><th>Card</th><th>Endpoint</th></tr></thead>
            <tbody>
${[provider, ...peers].map((entry) => `              <tr${entry.id === provider.id ? ' class="row-self"' : ''}>
                <td data-label="Compared with">${entry.id === provider.id
    ? `${escapeHtml(entry.name)} (this page)`
    : `<a href="../provider/${escapeHtml(entry.id)}.html">${escapeHtml(entry.name)}</a>`}</td>
                <td data-label="Published limits">${escapeHtml(limitsPhrase(entry))}</td>
                <td data-label="Card">${entry.credit_card_required ? 'Required' : 'Not required'}</td>
                <td data-label="Endpoint"><code>${escapeHtml(new URL(entry.base_url).host)}</code></td>
              </tr>`).join('\n')}
            </tbody>
          </table>
        </div>

        <h2>Models ${escapeHtml(provider.name)} lists as free</h2>
        <ul class="model-list">
${provider.models.map((entry) => {
    const family = families.find((candidate) => new RegExp(candidate.pattern, 'i').test(entry));
    const tail = family
      ? ` — <a href="../model/${escapeHtml(family.id)}.html">${escapeHtml(family.name)}</a>, also free at ${providersInFamily(family, providers).length - 1} other ${providersInFamily(family, providers).length === 2 ? 'provider' : 'providers'} here`
      : ' — not part of any family this catalog tracks across providers';
    return `          <li><code>${escapeHtml(entry)}</code>${tail}</li>`;
  }).join('\n')}
        </ul>
        <p>${familySentence}</p>

        <h2>Checking a ${escapeHtml(provider.name)} key</h2>
        <p>${escapeHtml(provider.browser_check_note)} That was measured against <code>${escapeHtml(origin)}</code> on ${escapeHtml(provider.browser_checked_at)}.</p>
        <p>${browserSupported
          ? `So a key can be checked in the <a href="../verify.html?provider=${escapeHtml(provider.id)}">browser checker</a> without installing anything. If you would rather not paste a key into a web page, this does the same thing:`
          : 'So the browser checker cannot reach it and does not pretend otherwise. Run this instead:'}</p>
${codeBlock(renderSnippet('curl', { baseUrl: provider.base_url, keyEnv }).content)}

        <h2>Using a ${escapeHtml(provider.name)} key</h2>
${usage}

        <h2>Questions about the ${escapeHtml(provider.name)} free tier</h2>
${faq(providerFaq(provider, context))}

        <h2>Official sources</h2>
        <ul class="source-list">
${provider.official_sources.map(({ title, url }) => `          <li>${externalLink(url, title)}<span class="source-url">${escapeHtml(url)}</span></li>`).join('\n')}
        </ul>
        <p>Every figure above was read from those pages on ${escapeHtml(provider.source_checked_at)}. Where a provider states a limit only inside a console, this catalog records that fact instead of a number. See the <a href="../methodology.html">methodology</a> for how an entry gets in and how it gets corrected.</p>`;
}

function providerPage(provider, context) {
  const { families, providers, pageIds } = context;
  const siblings = ring(context.categoryPeers.get(provider.category), provider, 3);
  const memberFamilies = familiesOf(provider, families, providers);
  const clientLinks = (provider.openai_compatible ? ['codex', 'cline', 'continue'] : ['claude-code', 'codex'])
    .map((id) => ({ href: `client/${id}.html`, text: `${CLIENT_NOTES[id].title} setup` }));

  return renderDocument({
    depth: 1,
    title: `${provider.name} free tier: limits and models`.slice(0, 60),
    description: `${provider.name} free-tier rate limits, free models, browser reachability, and setup, taken from official sources on ${provider.source_checked_at}.`.slice(0, 160),
    canonicalPath: `provider/${provider.id}.html`,
    breadcrumb: [
      { href: 'index.html', text: 'Free LLM API' },
      { href: 'index.html', text: 'Providers' },
      { text: provider.name },
    ],
    eyebrow: `${categoryTitle(provider.category)} · Sources reviewed ${provider.source_checked_at}`,
    h1: `${provider.name} free tier`,
    lede: `What ${provider.name} publishes about its free allowance, which models it covers, and how to point an existing tool at it.`,
    body: providerBody(provider, { ...context, peers: siblings }),
    related: [
      {
        heading: 'Compare with',
        links: siblings.map((peer) => ({ href: `provider/${peer.id}.html`, text: peer.name })),
      },
      {
        heading: memberFamilies.length > 0 ? 'Model families' : 'Popular model families',
        links: (memberFamilies.length > 0 ? memberFamilies : context.families.slice(0, 2))
          .map((family) => ({ href: `model/${family.id}.html`, text: `Free ${family.name} API` })),
      },
      { heading: 'Use it with', links: clientLinks },
      {
        heading: 'This catalog',
        links: [
          { href: 'index.html', text: 'All providers' },
          { href: 'verify.html', text: 'Browser key checker' },
          { href: 'methodology.html', text: 'How this data is collected' },
        ],
      },
    ],
  });
}

/* --------------------------------------------------------------------- model */

function modelBody(family, members, context) {
  const withNumbers = members.filter(publishesFixedNumbers);
  const cardFree = members.filter(({ credit_card_required: card }) => !card);
  const browserOk = members.filter(({ browser_check: check }) => check === 'supported');

  const rows = members.map((provider) => `            <tr>
              <td data-label="Provider"><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a></td>
              <td data-label="Free access">${escapeHtml(categoryTitle(provider.category))}</td>
              <td data-label="Published limits">${escapeHtml(limitsPhrase(provider))}</td>
              <td data-label="Card">${provider.credit_card_required ? 'Required' : 'Not required'}</td>
              <td data-label="Matching models">${escapeHtml(provider.models.filter((entry) => new RegExp(family.pattern, 'i').test(entry)).join(', ') || '—')}</td>
            </tr>`).join('\n');

  const differences = members.map((provider) => (
    `          <li><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a> — ${escapeHtml(provider.limits.summary.split('. ')[0])}.</li>`
  )).join('\n');

  return `        <h2>What the ${escapeHtml(family.name)} family is</h2>
        <p>${escapeHtml(family.blurb)}</p>

        <h2>Providers offering ${escapeHtml(family.name)} on free terms</h2>
        <p>${members.length} of the ${context.total} providers detailed in this catalog list at least one ${escapeHtml(family.name)} model. Because ${escapeHtml(family.vendor)} publishes the weights rather than the service, the model id can be identical across all of them while the free allowance is not.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Provider</th><th>Free access</th><th>Published limits</th><th>Card</th><th>Matching models</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>

        <h2>How the free terms actually differ</h2>
        <ul class="difference-list">
${differences}
        </ul>

        <h2>Picking one</h2>
        <p>${withNumbers.length} of these ${members.length} publish a fixed request count; the rest state a tier or a credit balance instead, which means the only honest answer to "how much is free" is the one in their console. ${cardFree.length} take no credit card. ${browserOk.length} answer a cross-origin browser request, so a key for those can be checked from the <a href="../verify.html">browser checker</a> with nothing installed.</p>
        <p>A model id that matches ${escapeHtml(family.name)} is not a promise that the free tier includes it. Providers move individual models between paid and free without changing the id, which is why each row links to the provider page carrying that provider's own wording and the date it was read.</p>`;
}

function modelPage(family, context) {
  const members = providersInFamily(family, context.providers).filter((provider) => context.pageIds.has(provider.id));
  const others = ring(context.families, family, 2);

  return renderDocument({
    depth: 1,
    title: `Free ${family.name} API: ${members.length} providers compared`.slice(0, 60),
    description: `Which providers serve ${family.name} models on a free tier, what each one publishes as its limit, and how the terms differ. Reviewed ${context.checkedAt}.`.slice(0, 160),
    canonicalPath: `model/${family.id}.html`,
    breadcrumb: [
      { href: 'index.html', text: 'Free LLM API' },
      { href: 'index.html', text: 'Model families' },
      { text: family.name },
    ],
    eyebrow: `${family.vendor} · ${members.length} providers in this catalog`,
    h1: `Free ${family.name} API access`,
    lede: `Every provider in this catalog that lists a ${family.name} model on free terms, with the limit each one publishes.`,
    body: modelBody(family, members, context),
    related: [
      {
        heading: 'Providers hosting it',
        links: members.map((provider) => ({ href: `provider/${provider.id}.html`, text: provider.name })),
      },
      {
        heading: 'Other families',
        links: others.map((other) => ({ href: `model/${other.id}.html`, text: `Free ${other.name} API` })),
      },
      {
        heading: 'This catalog',
        links: [
          { href: 'index.html', text: 'All providers' },
          { href: 'verify.html', text: 'Browser key checker' },
          { href: 'methodology.html', text: 'How this data is collected' },
        ],
      },
    ],
  });
}

/* -------------------------------------------------------------------- client */

function clientBody(clientId, note, context) {
  const client = SNIPPET_CLIENTS.find(({ id }) => id === clientId);
  const sample = context.sampleProvider;
  const model = snippetModelFor(sample);
  const snippet = renderSnippet(clientId, {
    baseUrl: sample.base_url,
    model,
    keyEnv: keyEnvForProvider(sample),
    providerId: sample.id,
    providerName: snippetProviderName(sample),
  });
  const fits = client.wire === 'anthropic'
    ? context.pages.filter((provider) => !provider.openai_compatible)
    : context.pages.filter((provider) => provider.openai_compatible && !provider.credit_card_required);

  const rows = fits.slice(0, 8).map((provider) => `            <tr>
              <td data-label="Provider"><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a></td>
              <td data-label="Base URL"><code>${escapeHtml(provider.base_url)}</code></td>
              <td data-label="Published limits">${escapeHtml(limitsPhrase(provider))}</td>
            </tr>`).join('\n');

  const fitsSection = client.wire === 'anthropic'
    ? `<p>Only ${fits.length} entry in this catalog is not OpenAI-compatible, so there is no table of drop-in free tiers for ${escapeHtml(note.title)}. The realistic routes are a local translating router holding your own provider keys, or a gateway that already answers in the Anthropic format.</p>`
    : `<p>${fits.length} providers here serve the OpenAI protocol and take no credit card, which makes them the ones worth trying first with ${escapeHtml(note.title)}. The full list, including the ones that do ask for a card, is in the <a href="../index.html">catalog</a>.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Provider</th><th>Base URL</th><th>Published limits</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;

  return `        <h2>What ${escapeHtml(note.title)} needs</h2>
        <p>${escapeHtml(note.summary.replaceAll('`', ''))}</p>
        <ol class="requirement-list">
${note.requirements.map((item) => `          <li>${item}</li>`).join('\n')}
        </ol>

        <h2>The file this produces</h2>
        <p>Running <code>npx free-llm-api setup ${escapeHtml(clientId)}</code> writes <code>${escapeHtml(client.filename)}</code>. ${client.mode === 'guided'
          ? 'It is a review guide rather than a config file, because the values are typed into a settings panel and this project does not write to another tool’s credential storage.'
          : 'It is generated from the catalog, so the base URL and model id are the ones the provider documents rather than ones you have to look up.'} Here it is filled in for ${escapeHtml(sample.name)}:</p>
${codeBlock(snippet.content)}
        <p>Nothing in that file is a key. The value is read from <code>${escapeHtml(keyEnvForProvider(sample))}</code> at run time, which is the one habit that keeps a credential out of a repository by construction.</p>

        <h2>Which free tiers fit ${escapeHtml(note.title)}</h2>
        ${fitsSection}

        <h2>What to expect on a free tier</h2>
        <p>${escapeHtml(note.expectation)}</p>
        <p>Before blaming the client, check the key itself: the <a href="../verify.html">browser checker</a> separates a rejected credential from a rate limit from an endpoint that is simply down, and each of those has a different fix.</p>

        <h2>Sources</h2>
        <ul class="source-list">
          <li>${externalLink(note.source.url, note.source.title)}</li>
        </ul>
        <p>Provider figures shown here come from each provider’s own documentation, reviewed on ${escapeHtml(context.checkedAt)}. The <a href="../methodology.html">methodology</a> covers what is recorded and what is deliberately left blank.</p>`;
}

function clientPage(clientId, context) {
  const note = CLIENT_NOTES[clientId];
  const others = ring(
    Object.keys(CLIENT_NOTES).map((id) => ({ id })),
    { id: clientId },
    2,
  );

  return renderDocument({
    depth: 1,
    title: `Free LLM API for ${note.title}: setup and providers`.slice(0, 60),
    description: `How to point ${note.title} at a free OpenAI-compatible tier, what the generated config contains, and which providers are worth trying first.`.slice(0, 160),
    canonicalPath: `client/${clientId}.html`,
    breadcrumb: [
      { href: 'index.html', text: 'Free LLM API' },
      { href: 'index.html', text: 'Clients' },
      { text: note.title },
    ],
    eyebrow: `Client setup · Catalog reviewed ${context.checkedAt}`,
    h1: `${note.title} with a free LLM API`,
    lede: `The configuration ${note.title} needs, generated from the catalog, plus the free tiers that actually work with it.`,
    body: clientBody(clientId, note, context),
    related: [
      {
        heading: 'Providers to try',
        links: context.pages
          .filter((provider) => provider.openai_compatible && !provider.credit_card_required)
          .slice(0, 4)
          .map((provider) => ({ href: `provider/${provider.id}.html`, text: provider.name })),
      },
      {
        heading: 'Other clients',
        links: others.map(({ id }) => ({ href: `client/${id}.html`, text: CLIENT_NOTES[id].title })),
      },
      {
        heading: 'This catalog',
        links: [
          { href: 'index.html', text: 'All providers' },
          { href: 'verify.html', text: 'Browser key checker' },
          { href: 'methodology.html', text: 'How this data is collected' },
        ],
      },
    ],
  });
}

/* --------------------------------------------------------------- methodology */

function methodologyBody(context) {
  const { providers, total, families } = context;
  const ineligible = providers.filter((provider) => !isLandingPageEligible(provider));

  return `        <h2>What counts as a free LLM API here</h2>
        <p>An entry qualifies when the provider itself documents access that costs nothing to start: a standing free tier, a pool of models priced at zero, or signup credit. Reverse-engineered endpoints, leaked keys, and gateways reselling someone else’s quota are out of scope, and no key of any kind is distributed by this project. Every entry links to the page you would use to create your own.</p>
        <p>The catalog currently holds ${providers.length} providers across ${Object.keys(CATEGORY_TITLES).length} access types and ${families.length} model families that appear at more than one provider.</p>

        <h2>Where the numbers come from</h2>
        <p>Each provider record carries at least one official source URL and a <code>source_checked_at</code> date. A rate limit may only be recorded if a source states it; the validator fails the build otherwise. When a provider publishes limits only inside a logged-in console, or scales them by tier, the field stays empty and the status says so. That is why some rows read "set by project tier" instead of a number: inventing a plausible figure would make the table look more complete and be worth less.</p>

        <h2>What a probe does and does not prove</h2>
        <p>A probe is one sampled request against one endpoint at one moment. <code>200</code> means that request succeeded. <code>401</code> or <code>403</code> means the sample credential was refused and says nothing about the provider. <code>429</code> means that sample was throttled, with no information about anyone’s remaining quota. Only a network failure or a <code>5xx</code> points at the endpoint, and even then it describes one sample rather than an outage. Probes run outside CI and read their key from an environment variable; the published output records the classification, status, latency, and timestamp, never the key or the response body.</p>

        <h2>How browser reachability is measured</h2>
        <p>Each base URL gets a CORS preflight from the site’s own origin. If the response allows that origin and lists <code>authorization</code> among the permitted headers, a browser can call the endpoint and the provider is marked supported. If the origin is refused, it is marked blocked and the key checker does not pretend otherwise. If the origin is allowed but the header is not listed, the result is recorded as unverified rather than guessed. No credential is involved in this measurement, which is why it can run for every provider.</p>

        <h2>Which providers get their own page</h2>
        <p>${total} of the ${providers.length} providers have a page. A provider earns one only when its free terms are documented in enough detail to say something specific: a limits summary of at least 120 characters, at least one official source, and a signup URL a reader can act on. ${ineligible.length === 0 ? 'Every provider currently clears that bar.' : `${ineligible.length} currently do not (${ineligible.map(({ name }) => escapeHtml(name)).join(', ')}), so they appear as catalog rows only.`} The alternative — a page per provider regardless — produces pages that differ by a name and nothing else, which helps nobody and is the pattern search engines classify as a doorway.</p>

        <h2>How this is kept honest</h2>
        <p>Every page on this site is generated from the data files by a renderer, and a check step fails if any published file differs from what the current data would produce. Editing a page by hand is therefore not possible without the change being reverted, and a data correction updates the README, the catalog, and every page that cites it at the same time. Corrections are welcome as issues or pull requests against the data file, not the output.</p>
        <p>The repository ships no credentials, and the key checker sends what you paste only to the provider you picked, enforced by a Content Security Policy rather than by a promise.</p>`;
}

function methodologyPage(context) {
  return renderDocument({
    depth: 0,
    title: 'Methodology: how this free LLM API data is collected',
    description: 'What counts as a free tier, where every rate limit comes from, what a probe proves, and why some providers get a page while others stay catalog rows.',
    canonicalPath: 'methodology.html',
    breadcrumb: [
      { href: 'index.html', text: 'Free LLM API' },
      { text: 'Methodology' },
    ],
    eyebrow: `Data contract · Reviewed ${context.checkedAt}`,
    h1: 'How this data is collected',
    lede: 'Every rule this catalog follows, including the ones that keep numbers out of it.',
    body: methodologyBody(context),
    related: [
      {
        heading: 'Start here',
        links: [
          { href: 'index.html', text: 'All providers' },
          { href: 'verify.html', text: 'Browser key checker' },
        ],
      },
      {
        heading: 'Model families',
        links: context.families.map((family) => ({ href: `model/${family.id}.html`, text: `Free ${family.name} API` })),
      },
      {
        heading: 'Client setup',
        links: Object.entries(CLIENT_NOTES).map(([id, note]) => ({ href: `client/${id}.html`, text: note.title })),
      },
    ],
  });
}

/* ---------------------------------------------------------------- entrypoint */

export const clientPageIds = Object.freeze(Object.keys(CLIENT_NOTES));

export const CLIENT_PAGE_TITLES = Object.freeze(Object.fromEntries(
  Object.entries(CLIENT_NOTES).map(([id, note]) => [id, note.title]),
));

export function buildContext(providers, families = MODEL_FAMILIES) {
  const pages = providers.filter(isLandingPageEligible);
  const pageIds = new Set(pages.map(({ id }) => id));
  const categoryPeers = new Map();
  for (const provider of pages) {
    if (!categoryPeers.has(provider.category)) categoryPeers.set(provider.category, []);
    categoryPeers.get(provider.category).push(provider);
  }
  // A category with one member would leave that page without a peer, so it
  // borrows the whole page list rather than pointing at itself.
  for (const [category, peers] of categoryPeers) {
    if (peers.length < 2) categoryPeers.set(category, pages);
  }

  return {
    providers,
    families,
    pages,
    pageIds,
    categoryPeers,
    total: pages.length,
    cardRequired: pages.filter(({ credit_card_required: card }) => card).length,
    cardFree: pages.filter(({ credit_card_required: card }) => !card).length,
    withNumbers: pages.filter(publishesFixedNumbers).length,
    // The client pages show one filled-in config, so the example has to be a
    // provider that publishes a pasteable model id rather than a catalog blurb.
    sampleProvider: pages.find((provider) => provider.id === 'groq' && snippetModelFor(provider))
      ?? pages.find((provider) => snippetModelFor(provider))
      ?? pages[0],
    checkedAt: providers.map(({ source_checked_at: date }) => date).sort().at(-1),
  };
}

export function renderMatrixPages(providers, families = MODEL_FAMILIES) {
  const context = buildContext(providers, families);
  const artifacts = {};

  for (const provider of context.pages) {
    const inCategory = context.pages.filter(({ category }) => category === provider.category).length;
    artifacts[`docs/provider/${provider.id}.html`] = providerPage(provider, { ...context, inCategory });
  }
  for (const family of families) {
    artifacts[`docs/model/${family.id}.html`] = modelPage(family, context);
  }
  for (const clientId of clientPageIds) {
    artifacts[`docs/client/${clientId}.html`] = clientPage(clientId, context);
  }
  artifacts['docs/methodology.html'] = methodologyPage(context);

  return artifacts;
}
