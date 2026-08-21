import { readFileSync } from 'node:fs';
import { fieldNotesUrl, figuresForFamilies } from './field-notes.js';
import { escapeHtml, externalLink, link } from './html.js';
import { clientNoteCopy, dataSentence, localized, translator } from './i18n.js';
import { renderDocument } from './page-layout.js';
import {
  faqPageNode,
  howToNode,
  itemListNode,
  providerDatasetNode,
  techArticleNode,
} from './seo.js';
import { DEFAULT_LOCALE, pageUrl } from './site.js';
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

// What stays the same in every language: a product name, the URL of its
// documentation, and the query this page is written to answer. The prose that
// surrounds them lives in `src/i18n.js`.
const CLIENT_NOTES = Object.freeze({
  codex: {
    title: 'Codex CLI',
    // The company that publishes the tool, which is how a page about it gets
    // matched against a quoted sentence in `figuresForFamilies`. Left off the
    // three whose publisher no cited sentence names; a name written here only
    // to make a link appear would be the thing that check exists to stop.
    vendor: 'OpenAI',
    query: 'free api for codex cli',
    source: { title: 'Codex advanced configuration and custom model providers', url: 'https://developers.openai.com/codex/config-advanced#custom-model-providers' },
  },
  'claude-code': {
    title: 'Claude Code',
    vendor: 'Anthropic',
    query: 'free api for claude code',
    source: { title: 'Claude Code LLM gateway configuration', url: 'https://docs.anthropic.com/en/docs/claude-code/llm-gateway' },
  },
  continue: {
    title: 'Continue',
    query: 'free api for continue',
    source: { title: 'Continue configuration reference', url: 'https://docs.continue.dev/reference' },
  },
  cursor: {
    title: 'Cursor',
    query: 'free api for cursor',
    source: { title: 'Cursor custom API keys', url: 'https://docs.cursor.com/settings/api-keys' },
  },
  cline: {
    title: 'Cline',
    query: 'free api for cline',
    source: { title: 'Cline OpenAI Compatible provider', url: 'https://docs.cline.bot/provider-config/openai-compatible' },
  },
});

const COMPARISONS = Object.freeze([
  {
    id: 'no-credit-card',
    predicate: (provider) => !provider.credit_card_required,
  },
  {
    id: 'openai-compatible',
    predicate: (provider) => provider.openai_compatible,
  },
  {
    id: 'coding-agents',
    predicate: (provider) => provider.openai_compatible
      && provider.models.some((model) => /coder|code|gpt-oss|llama|qwen/i.test(model)),
  },
]);

function clientNote(clientId, locale) {
  return { ...CLIENT_NOTES[clientId], ...clientNoteCopy(clientId, locale) };
}

function ring(list, current, count) {
  const index = list.findIndex((item) => item.id === current.id);
  if (index === -1) return list.slice(0, count);
  return Array.from({ length: Math.min(count, list.length - 1) }, (_, offset) => (
    list[(index + offset + 1) % list.length]
  ));
}

// Chinese has no letter case, and the Latin words that do appear in its labels
// are acronyms that must keep their capitals, so the lowercasing English needs
// mid-sentence is skipped rather than applied to a script that ignores it.
function midSentence(text, locale) {
  return locale.code === 'en' ? text.toLowerCase() : text;
}

function limitsPhrase(provider, context) {
  const { t } = context;
  const { requests_per_minute: rpm, requests_per_day: rpd } = provider.limits;
  if (rpm === null && rpd === null) return t(`limitStatus.${provider.limits.status}`);
  return [
    rpm === null ? null : t('provider.rpm', { count: rpm }),
    rpd === null ? null : t('provider.rpd', { count: rpd }),
  ].filter(Boolean).join(t('word.limitsJoin'));
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
  const { t, locale } = context;
  const { name } = provider;
  const escaped = escapeHtml(name);
  const entries = [
    {
      question: t('provider.faq.cardQ', { name }),
      answer: provider.credit_card_required
        ? t('provider.faq.cardYes', { name: escaped, count: context.cardRequired, total: context.total })
        : t('provider.faq.cardNo', { name: escaped, count: context.cardFree }),
    },
    {
      question: t('provider.faq.limitsQ', { name }),
      answer: publishesFixedNumbers(provider)
        ? t('provider.faq.limitsNumbers', {
          name: escaped,
          phrase: escapeHtml(limitsPhrase(provider, context)),
          date: escapeHtml(provider.source_checked_at),
        })
        : t('provider.faq.limitsNone', {
          name: escaped,
          status: escapeHtml(midSentence(t(`limitStatus.${provider.limits.status}`), locale)),
        }),
    },
    {
      question: t('provider.faq.throttleQ', { name }),
      answer: t('provider.faq.throttleA'),
    },
    {
      question: t('provider.faq.retireQ', { name }),
      answer: provider.availability.retires_at
        ? t('provider.faq.retireYes', {
          date: escapeHtml(provider.availability.retires_at),
          note: escapeHtml(localized(provider.availability, 'note', locale)),
        })
        : t('provider.faq.retireNo', {
          name: escaped,
          date: escapeHtml(provider.source_checked_at),
          note: escapeHtml(localized(provider.availability, 'note', locale)),
        }),
    },
  ];

  if (provider.openai_compatible) {
    entries.push({
      question: t('provider.faq.clientsQ', { name }),
      answer: t('provider.faq.clientsA', { name: escaped, url: escapeHtml(provider.base_url) }),
    });
  }
  return entries;
}

// What the paid rate looks like, on pages whose own model families have a
// figure behind them.
//
// ## Why this is here at all
//
// Two of the 86 pages this file generates linked the sibling write-ups: the
// two home pages. The other 84 are the ones search and answer engines actually
// land on, and every one of them ended at "here is a free tier" without ever
// naming the number that replaces it — which is the question a reader of a
// free-tier page asks next, and the one thing the sibling project has 300-odd
// sourced rows of.
//
// ## Why it is not the same block on all 84
//
// `figuresForFamilies` prints a row only where the quoted sentence names what
// the page is about, so a page is never decorated with somebody else's price,
// and pages that match nothing print nothing. Which pages it is called from,
// and which it is deliberately not called from, is argued out there.
//
// ## Why `link` and not `externalLink`
//
// `externalLink` adds `rel="noreferrer"`, which is right for a provider's own
// documentation and wrong here: this is the one destination whose referrals we
// have to be able to count, and stripping the header makes the click invisible
// on both ends.
function figuresSection(families, lede, context) {
  const { t } = context;
  const rows = figuresForFamilies(families);
  // The blank line above the heading belongs to the block, not to the page.
  // Left in the call site instead, a page that matches nothing comes out with
  // a stray empty line, and `git status` reports twelve files changed by a
  // feature that put nothing on any of them.
  if (rows.length === 0) return '';

  return `

        <h2>${t('figures.heading')}</h2>
        <p>${lede}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${t('table.figure')}</th><th>${t('table.figureSentence')}</th><th>${t('table.figureWriteUp')}</th></tr></thead>
            <tbody>
${rows.map((row) => `              <tr>
                <td data-label="${t('table.figure')}"><code>${escapeHtml(row.value)}</code> ${escapeHtml(row.unit)}</td>
                <td data-label="${t('table.figureSentence')}">${escapeHtml(row.context)}</td>
                <td data-label="${t('table.figureWriteUp')}">${link(row.url, row.article)}</td>
              </tr>`).join('\n')}
            </tbody>
          </table>
        </div>`;
}

function providerBody(provider, context) {
  const {
    families, providers, pageIds, peers, t, locale,
  } = context;
  const keyEnv = keyEnvForProvider(provider);
  const model = snippetModelFor(provider);
  const origin = new URL(provider.base_url).origin;
  const browserSupported = provider.browser_check === 'supported';
  const memberFamilies = familiesOf(provider, families, providers);
  const join = t('word.sentenceJoin');
  const name = escapeHtml(provider.name);
  const category = t(`category.${provider.category}`);

  const familySentence = memberFamilies.length === 0
    ? t('provider.familyNone', { name })
    : memberFamilies.map((family) => {
      const familyName = escapeHtml(localized(family, 'name', locale));
      const others = providersInFamily(family, providers)
        .filter((other) => other.id !== provider.id && pageIds.has(other.id));
      if (others.length === 0) return t('provider.familyOnly', { name: familyName });
      const links = others
        .map((other) => `<a href="../provider/${escapeHtml(other.id)}.html">${escapeHtml(other.name)}</a>`)
        .join(t('word.listJoin'));
      return t('provider.familyShared', {
        count: others.length,
        providers: t(others.length === 1 ? 'word.providerOne' : 'word.providerMany'),
        id: escapeHtml(family.id),
        name: familyName,
        links,
      });
    }).join(join);

  const cardSentence = provider.credit_card_required
    ? t('provider.cardYes', { count: context.cardRequired, total: context.total })
    : t('provider.cardNo', { count: context.cardFree, total: context.total });
  const numbersSentence = publishesFixedNumbers(provider)
    ? t('provider.numbersYes', {
      phrase: escapeHtml(limitsPhrase(provider, context)),
      count: context.withNumbers,
      total: context.total,
    })
    : t('provider.numbersNo', { count: context.total - context.withNumbers, total: context.total });

  const usage = model === null
    ? `<p>${t('provider.useNoModel', { name })}</p>`
    : `<p>${t('provider.useIntro', { name, url: escapeHtml(provider.base_url), env: escapeHtml(keyEnv) })}</p>
${codeBlock(renderSnippet('codex', {
      baseUrl: provider.base_url,
      model,
      keyEnv,
      providerId: provider.id,
      providerName: snippetProviderName(provider),
    }).content)}`;

  return `        <h2>${t('provider.allowanceHeading', { name })}</h2>
        <p>${escapeHtml(localized(provider.limits, 'summary', locale))}</p>
        <dl class="fact-grid">
${definition(t('provider.factLimits'), escapeHtml(limitsPhrase(provider, context)))}
${definition(t('provider.factCategory'), escapeHtml(category))}
${definition(t('provider.factCard'), provider.credit_card_required ? t('word.required') : t('word.notRequired'))}
${definition(t('provider.factProtocol'), t(provider.openai_compatible ? 'provider.protocolOpenAi' : 'provider.protocolOwn', { url: escapeHtml(provider.base_url) }))}
${definition(t('provider.factLifecycle'), provider.availability.retires_at ? t('provider.retires', { date: escapeHtml(provider.availability.retires_at) }) : escapeHtml(t(`availability.${provider.availability.status}`)))}
${definition(t('provider.factChecked'), escapeHtml(provider.source_checked_at))}
        </dl>
        <p>${escapeHtml(localized(provider.availability, 'note', locale))}</p>

        <h2>${t('provider.placeHeading', { name })}</h2>
        <p>${[
    t('provider.placeLede', {
      name,
      inCategory: context.inCategory,
      category: escapeHtml(midSentence(category, locale)),
      total: context.total,
    }),
    cardSentence,
    numbersSentence,
  ].join(join)}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${t('table.comparedWith')}</th><th>${t('table.limits')}</th><th>${t('table.card')}</th><th>${t('table.endpoint')}</th></tr></thead>
            <tbody>
${[provider, ...peers].map((entry) => `              <tr${entry.id === provider.id ? ' class="row-self"' : ''}>
                <td data-label="${t('table.comparedWith')}">${entry.id === provider.id
    ? t('provider.compareSelf', { name })
    : `<a href="../provider/${escapeHtml(entry.id)}.html">${escapeHtml(entry.name)}</a>`}</td>
                <td data-label="${t('table.limits')}">${escapeHtml(limitsPhrase(entry, context))}</td>
                <td data-label="${t('table.card')}">${entry.credit_card_required ? t('word.required') : t('word.notRequired')}</td>
                <td data-label="${t('table.endpoint')}"><code>${escapeHtml(new URL(entry.base_url).host)}</code></td>
              </tr>`).join('\n')}
            </tbody>
          </table>
        </div>

        <h2>${t('provider.modelsHeading', { name })}</h2>
        <ul class="model-list">
${provider.models.map((entry) => {
    const family = families.find((candidate) => new RegExp(candidate.pattern, 'i').test(entry));
    const members = family ? providersInFamily(family, providers).length : 0;
    const tail = family
      ? t('provider.modelFamilyTail', {
        id: escapeHtml(family.id),
        name: escapeHtml(localized(family, 'name', locale)),
        count: members - 1,
        providers: t(members === 2 ? 'word.providerOne' : 'word.providerMany'),
      })
      : t('provider.modelNoFamily');
    return `          <li><code>${escapeHtml(entry)}</code>${tail}</li>`;
  }).join('\n')}
        </ul>
        <p>${familySentence}</p>

        <h2>${t('provider.checkHeading', { name })}</h2>
        <p>${[
    escapeHtml(dataSentence(provider.browser_check_note, locale)),
    t('provider.checkMeasured', {
      origin: escapeHtml(origin),
      date: escapeHtml(provider.browser_checked_at),
    }),
  ].join(join)}</p>
        <p>${browserSupported
    ? t('provider.checkBrowser', { id: escapeHtml(provider.id) })
    : t('provider.checkTerminal')}</p>
${codeBlock(renderSnippet('curl', { baseUrl: provider.base_url, keyEnv }).content)}

        <h2>${t('provider.useHeading', { name })}</h2>
${usage}

        <h2>${t('provider.faqHeading', { name })}</h2>
${faq(context.faqEntries)}

        <h2>${t('provider.sourcesHeading')}</h2>
        <ul class="source-list">
${provider.official_sources.map(({ title, url }) => `          <li>${externalLink(url, title)}<span class="source-url">${escapeHtml(url)}</span></li>`).join('\n')}
        </ul>
        <p>${t('provider.sourcesNote', { date: escapeHtml(provider.source_checked_at) })}</p>`;
}

function providerPage(provider, context) {
  const {
    families, providers, pageIds, t, locale,
  } = context;
  const siblings = ring(context.categoryPeers.get(provider.category), provider, 3);
  const memberFamilies = familiesOf(provider, families, providers);
  const clientLinks = (provider.openai_compatible ? ['codex', 'cline', 'continue'] : ['claude-code', 'codex'])
    .map((id) => ({
      href: `client/${id}.html`,
      text: t('provider.clientSetup', { name: CLIENT_NOTES[id].title }),
    }));
  // The questions are written once and used twice: as the visible FAQ and as
  // the structured one, so a crawler can never be shown an answer the page
  // does not print.
  const faqEntries = providerFaq(provider, context);

  return renderDocument({
    depth: 1,
    locale,
    title: t('provider.title', { name: provider.name }).slice(0, 60),
    description: t('provider.description', {
      name: provider.name,
      date: provider.source_checked_at,
    }).slice(0, 160),
    canonicalPath: `provider/${provider.id}.html`,
    jsonLd: [providerDatasetNode(provider, locale), faqPageNode(faqEntries)],
    breadcrumb: [
      { href: 'index.html', text: t('layout.brand') },
      { href: 'index.html', text: t('provider.crumb') },
      { text: provider.name },
    ],
    eyebrow: t('provider.eyebrow', {
      category: t(`category.${provider.category}`),
      date: provider.source_checked_at,
    }),
    h1: t('provider.h1', { name: provider.name }),
    lede: t('provider.lede', { name: provider.name }),
    body: providerBody(provider, { ...context, peers: siblings, faqEntries }),
    related: [
      {
        heading: t('provider.relatedCompare'),
        links: siblings.map((peer) => ({ href: `provider/${peer.id}.html`, text: peer.name })),
      },
      {
        heading: t(memberFamilies.length > 0 ? 'provider.relatedFamilies' : 'provider.relatedPopular'),
        links: (memberFamilies.length > 0 ? memberFamilies : context.families.slice(0, 2))
          .map((family) => ({
            href: `model/${family.id}.html`,
            text: t('layout.familyLink', { name: localized(family, 'name', locale) }),
          })),
      },
      { heading: t('provider.relatedClients'), links: clientLinks },
      {
        heading: t('layout.thisCatalog'),
        links: [
          { href: 'index.html', text: t('layout.allProviders') },
          { href: 'verify.html', text: t('layout.browserChecker') },
          { href: 'methodology.html', text: t('layout.methodologyLink') },
        ],
      },
    ],
  });
}

/* --------------------------------------------------------------------- model */

function modelBody(family, members, context) {
  const { t, locale } = context;
  const familyName = escapeHtml(localized(family, 'name', locale));
  const withNumbers = members.filter(publishesFixedNumbers);
  const cardFree = members.filter(({ credit_card_required: card }) => !card);
  const browserOk = members.filter(({ browser_check: check }) => check === 'supported');

  const rows = members.map((provider) => `            <tr>
              <td data-label="${t('table.provider')}"><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a></td>
              <td data-label="${t('table.access')}">${escapeHtml(t(`category.${provider.category}`))}</td>
              <td data-label="${t('table.limits')}">${escapeHtml(limitsPhrase(provider, context))}</td>
              <td data-label="${t('table.card')}">${provider.credit_card_required ? t('word.required') : t('word.notRequired')}</td>
              <td data-label="${t('table.models')}">${escapeHtml(provider.models.filter((entry) => new RegExp(family.pattern, 'i').test(entry)).join(t('word.listJoin')) || '—')}</td>
            </tr>`).join('\n');

  const differences = members.map((provider) => {
    const summary = localized(provider.limits, 'summary', locale);
    const first = summary.split(t('word.sentenceSplit'))[0] + t('word.sentenceEnd');
    return `          <li><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a> — ${escapeHtml(first)}</li>`;
  }).join('\n');

  return `        <h2>${t('model.whatHeading', { name: familyName })}</h2>
        <p>${escapeHtml(localized(family, 'blurb', locale))}</p>

        <h2>${t('model.providersHeading', { name: familyName })}</h2>
        <p>${t('model.providersLede', {
    count: members.length,
    total: context.total,
    name: familyName,
    vendor: escapeHtml(family.vendor),
  })}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${t('table.provider')}</th><th>${t('table.access')}</th><th>${t('table.limits')}</th><th>${t('table.card')}</th><th>${t('table.models')}</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>

        <h2>${t('model.differHeading')}</h2>
        <ul class="difference-list">
${differences}
        </ul>

        <h2>${t('model.pickHeading')}</h2>
        <p>${t('model.pickBody', {
    withNumbers: withNumbers.length,
    count: members.length,
    cardFree: cardFree.length,
    browserOk: browserOk.length,
  })}</p>
        <p>${t('model.pickCaveat', { name: familyName })}</p>${figuresSection([family], t('figures.ledeFamily', { name: familyName, table: fieldNotesUrl(locale.code) }), context)}`;
}

function modelPage(family, context) {
  const { t, locale } = context;
  const name = localized(family, 'name', locale);
  const members = providersInFamily(family, context.providers).filter((provider) => context.pageIds.has(provider.id));
  const others = ring(context.families, family, 2);

  return renderDocument({
    depth: 1,
    locale,
    title: t('model.title', { name, count: members.length }).slice(0, 60),
    description: t('model.description', { name, date: context.checkedAt }).slice(0, 160),
    canonicalPath: `model/${family.id}.html`,
    jsonLd: [itemListNode({
      name: t('model.listName', { name }),
      description: t('model.listDescription', { name }),
      items: members.map((provider) => ({
        name: provider.name,
        url: pageUrl(`provider/${provider.id}.html`, locale),
      })),
    })],
    breadcrumb: [
      { href: 'index.html', text: t('layout.brand') },
      { href: 'index.html', text: t('model.crumb') },
      { text: name },
    ],
    eyebrow: t('model.eyebrow', { vendor: family.vendor, count: members.length }),
    h1: t('model.h1', { name }),
    lede: t('model.lede', { name }),
    body: modelBody(family, members, context),
    related: [
      {
        heading: t('model.relatedHosts'),
        links: members.map((provider) => ({ href: `provider/${provider.id}.html`, text: provider.name })),
      },
      {
        heading: t('model.relatedOthers'),
        links: others.map((other) => ({
          href: `model/${other.id}.html`,
          text: t('layout.familyLink', { name: localized(other, 'name', locale) }),
        })),
      },
      {
        heading: t('layout.thisCatalog'),
        links: [
          { href: 'index.html', text: t('layout.allProviders') },
          { href: 'verify.html', text: t('layout.browserChecker') },
          { href: 'methodology.html', text: t('layout.methodologyLink') },
        ],
      },
    ],
  });
}

/* -------------------------------------------------------------------- client */

function clientBody(clientId, note, context) {
  const { t, locale } = context;
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
  const title = escapeHtml(note.title);

  const rows = fits.slice(0, 8).map((provider) => `            <tr>
              <td data-label="${t('table.provider')}"><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a></td>
              <td data-label="${t('table.baseUrl')}"><code>${escapeHtml(provider.base_url)}</code></td>
              <td data-label="${t('table.limits')}">${escapeHtml(limitsPhrase(provider, context))}</td>
            </tr>`).join('\n');

  const fitsSection = client.wire === 'anthropic'
    ? `<p>${t('client.fitsAnthropic', { count: fits.length, name: title })}</p>`
    : `<p>${t('client.fitsOpenAi', { count: fits.length, name: title })}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${t('table.provider')}</th><th>${t('table.baseUrl')}</th><th>${t('table.limits')}</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;

  return `        <h2>${t('client.needsHeading', { name: title })}</h2>
        <p>${escapeHtml(note.summary.replaceAll('`', ''))}</p>
        <ol class="requirement-list">
${note.requirements.map((item) => `          <li>${item}</li>`).join('\n')}
        </ol>

        <h2>${t('client.fileHeading')}</h2>
        <p>${[
    t('client.fileIntro', { id: escapeHtml(clientId), filename: escapeHtml(client.filename) }),
    t(client.mode === 'guided' ? 'client.fileGuided' : 'client.fileGenerated'),
    t('client.fileFilled', { name: escapeHtml(sample.name) }),
  ].join(t('word.sentenceJoin'))}</p>
${codeBlock(snippet.content)}
        <p>${t('client.fileNoKey', { env: escapeHtml(keyEnvForProvider(sample)) })}</p>

        <h2>${t('client.fitsHeading', { name: title })}</h2>
        ${fitsSection}

        <h2>${t('client.expectHeading')}</h2>
        <p>${escapeHtml(note.expectation)}</p>
        <p>${t('client.expectCheck')}</p>${figuresSection([{ name: note.title, vendor: CLIENT_NOTES[clientId].vendor }], t('figures.ledeClient', {
    name: title,
    vendor: escapeHtml(CLIENT_NOTES[clientId].vendor ?? ''),
    table: fieldNotesUrl(locale.code),
  }), context)}

        <h2>${t('client.sourcesHeading')}</h2>
        <ul class="source-list">
          <li>${externalLink(note.source.url, note.source.title)}</li>
        </ul>
        <p>${t('client.sourcesNote', { date: escapeHtml(context.checkedAt) })}</p>`;
}

// The steps describe what a reader does, in the order the page describes it,
// so the structured version stays a summary of the page rather than a second
// set of instructions that can drift from it.
function clientSteps(clientId, note, context) {
  const { t } = context;
  const client = SNIPPET_CLIENTS.find(({ id }) => id === clientId);
  const keyEnv = keyEnvForProvider(context.sampleProvider);
  const guided = client.mode === 'guided';

  return [
    { name: t('client.step1Name'), text: t('client.step1Text') },
    {
      name: t('client.step2Name'),
      text: t(guided ? 'client.step2Guided' : 'client.step2Generated', {
        id: clientId,
        filename: client.filename,
        name: note.title,
      }),
    },
    {
      name: t(guided ? 'client.step3GuidedName' : 'client.step3GeneratedName'),
      text: t(guided ? 'client.step3Guided' : 'client.step3Generated', {
        name: note.title,
        env: keyEnv,
      }),
    },
    { name: t('client.step4Name'), text: t('client.step4Text') },
  ];
}

function clientPage(clientId, context) {
  const { t, locale } = context;
  const note = clientNote(clientId, locale);
  const others = ring(
    Object.keys(CLIENT_NOTES).map((id) => ({ id })),
    { id: clientId },
    2,
  );

  return renderDocument({
    depth: 1,
    locale,
    title: t('client.title', { name: note.title }).slice(0, 60),
    description: t('client.description', { name: note.title }).slice(0, 160),
    canonicalPath: `client/${clientId}.html`,
    jsonLd: [howToNode({
      name: t('client.howToName', { name: note.title }),
      description: note.summary.replaceAll('`', ''),
      url: pageUrl(`client/${clientId}.html`, locale),
      tool: note.title,
      supply: t('client.howToSupply'),
      steps: clientSteps(clientId, note, context),
      locale,
    })],
    breadcrumb: [
      { href: 'index.html', text: t('layout.brand') },
      { href: 'index.html', text: t('client.crumb') },
      { text: note.title },
    ],
    eyebrow: t('client.eyebrow', { date: context.checkedAt }),
    h1: t('client.h1', { name: note.title }),
    lede: t('client.lede', { name: note.title }),
    body: clientBody(clientId, note, context),
    related: [
      {
        heading: t('client.relatedTry'),
        links: context.pages
          .filter((provider) => provider.openai_compatible && !provider.credit_card_required)
          .slice(0, 4)
          .map((provider) => ({ href: `provider/${provider.id}.html`, text: provider.name })),
      },
      {
        heading: t('client.relatedOthers'),
        links: others.map(({ id }) => ({ href: `client/${id}.html`, text: CLIENT_NOTES[id].title })),
      },
      {
        heading: t('layout.thisCatalog'),
        links: [
          { href: 'index.html', text: t('layout.allProviders') },
          { href: 'verify.html', text: t('layout.browserChecker') },
          { href: 'methodology.html', text: t('layout.methodologyLink') },
        ],
      },
    ],
  });
}

/* --------------------------------------------------------------- comparison */

function comparisonBody(comparison, members, context) {
  const { t } = context;
  const rows = members.map((provider) => `            <tr>
              <td data-label="${t('table.provider')}"><a href="../provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a></td>
              <td data-label="${t('table.access')}">${escapeHtml(t(`category.${provider.category}`))}</td>
              <td data-label="${t('table.limits')}">${escapeHtml(limitsPhrase(provider, context))}</td>
              <td data-label="${t('table.card')}">${provider.credit_card_required ? t('word.required') : t('word.notRequired')}</td>
              <td data-label="${t('table.baseUrl')}"><code>${escapeHtml(provider.base_url)}</code></td>
            </tr>`).join('\n');
  const key = `comparison.${comparison.id}`;

  return `        <h2>${escapeHtml(t(`${key}.scopeHeading`))}</h2>
        <p>${escapeHtml(t(`${key}.scopeBody`, { count: members.length, total: context.total }))}</p>

        <h2>${escapeHtml(t(`${key}.tableHeading`))}</h2>
        <p>${escapeHtml(t(`${key}.tableBody`, { count: members.length }))}</p>
        <div class="table-wrap comparison-table">
          <table>
            <thead><tr><th>${t('table.provider')}</th><th>${t('table.access')}</th><th>${t('table.limits')}</th><th>${t('table.card')}</th><th>${t('table.baseUrl')}</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>

        <h2>${escapeHtml(t(`${key}.chooseHeading`))}</h2>
        <p>${escapeHtml(t(`${key}.chooseBody`))}</p>

        <h2>${escapeHtml(t(`${key}.tradeoffsHeading`))}</h2>
        <p>${escapeHtml(t(`${key}.tradeoffsBody`))}</p>

        <h2>${escapeHtml(t(`${key}.workflowHeading`))}</h2>
        <p>${escapeHtml(t(`${key}.workflowBody`))}</p>

        <h2>${escapeHtml(t(`${key}.verifyHeading`))}</h2>
        <p>${t(`${key}.verifyBody`, { date: escapeHtml(context.checkedAt) })}</p>`;
}

function comparisonPage(comparison, context) {
  const { t, locale } = context;
  const key = `comparison.${comparison.id}`;
  const members = context.pages.filter(comparison.predicate);
  const others = COMPARISONS.filter(({ id }) => id !== comparison.id);
  const faqEntries = [
    {
      question: t(`${key}.chooseHeading`),
      answer: t(`${key}.chooseBody`),
    },
    {
      question: t(`${key}.verifyHeading`),
      answer: t(`${key}.verifyBody`, { date: context.checkedAt }),
    },
  ];

  return renderDocument({
    depth: 1,
    locale,
    title: t(`${key}.title`, { count: members.length }).slice(0, 60),
    description: t(`${key}.description`, { count: members.length, date: context.checkedAt }).slice(0, 160),
    canonicalPath: `compare/${comparison.id}.html`,
    jsonLd: [
      itemListNode({
        name: t(`${key}.listName`),
        description: t(`${key}.listDescription`),
        items: members.map((provider) => ({
          name: provider.name,
          url: pageUrl(`provider/${provider.id}.html`, locale),
        })),
      }),
      faqPageNode(faqEntries),
    ],
    breadcrumb: [
      { href: 'index.html', text: t('layout.brand') },
      { href: 'index.html', text: t('comparison.crumb') },
      { text: t(`${key}.crumb`) },
    ],
    eyebrow: t('comparison.eyebrow', { count: members.length, date: context.checkedAt }),
    h1: t(`${key}.h1`),
    lede: t(`${key}.lede`, { count: members.length }),
    body: comparisonBody(comparison, members, context),
    related: [
      {
        heading: t('comparison.relatedProviders'),
        links: members.slice(0, 6).map((provider) => ({
          href: `provider/${provider.id}.html`,
          text: provider.name,
        })),
      },
      {
        heading: t('comparison.relatedComparisons'),
        links: others.map(({ id }) => ({
          href: `compare/${id}.html`,
          text: t(`comparison.${id}.link`),
        })),
      },
      {
        heading: t('layout.thisCatalog'),
        links: [
          { href: 'index.html', text: t('layout.allProviders') },
          { href: 'verify.html', text: t('layout.browserChecker') },
          { href: 'methodology.html', text: t('layout.methodologyLink') },
        ],
      },
    ],
  });
}

/* --------------------------------------------------------------- methodology */

function methodologyBody(context) {
  const {
    providers, total, families, t,
  } = context;
  const ineligible = providers.filter((provider) => !isLandingPageEligible(provider));

  return `        <h2>${t('methodology.scopeHeading')}</h2>
        <p>${t('methodology.scopeBody')}</p>
        <p>${t('methodology.scopeCount', {
    providers: providers.length,
    categories: Object.keys(CATEGORY_TITLES).length,
    families: families.length,
  })}</p>

        <h2>${t('methodology.numbersHeading')}</h2>
        <p>${t('methodology.numbersBody')}</p>

        <h2>${t('methodology.probeHeading')}</h2>
        <p>${t('methodology.probeBody')}</p>

        <h2>${t('methodology.corsHeading')}</h2>
        <p>${t('methodology.corsBody')}</p>

        <h2>${t('methodology.pagesHeading')}</h2>
        <p>${[
    t('methodology.pagesBody', { total, providers: providers.length }),
    ineligible.length === 0
      ? t('methodology.pagesAllPass')
      : t('methodology.pagesSomeFail', {
        count: ineligible.length,
        names: ineligible.map(({ name }) => escapeHtml(name)).join(t('word.listJoin')),
      }),
    t('methodology.pagesDoorway'),
  ].join(t('word.sentenceJoin'))}</p>

        <h2>${t('methodology.honestHeading')}</h2>
        <p>${t('methodology.honestBody')}</p>
        <p>${t('methodology.honestSecurity')}</p>`;
}

function methodologyPage(context) {
  const { t, locale } = context;

  return renderDocument({
    depth: 0,
    locale,
    title: t('methodology.title'),
    description: t('methodology.description'),
    canonicalPath: 'methodology.html',
    jsonLd: [techArticleNode({
      headline: t('methodology.articleHeadline'),
      description: t('methodology.articleDescription'),
      url: pageUrl('methodology.html', locale),
      dateModified: context.checkedAt,
      locale,
    })],
    breadcrumb: [
      { href: 'index.html', text: t('layout.brand') },
      { text: t('methodology.crumb') },
    ],
    eyebrow: t('methodology.eyebrow', { date: context.checkedAt }),
    h1: t('methodology.h1'),
    lede: t('methodology.lede'),
    body: methodologyBody(context),
    related: [
      {
        heading: t('methodology.relatedStart'),
        links: [
          { href: 'index.html', text: t('layout.allProviders') },
          { href: 'verify.html', text: t('layout.browserChecker') },
        ],
      },
      {
        heading: t('methodology.relatedFamilies'),
        links: context.families.map((family) => ({
          href: `model/${family.id}.html`,
          text: t('layout.familyLink', { name: localized(family, 'name', locale) }),
        })),
      },
      {
        heading: t('methodology.relatedClients'),
        links: Object.entries(CLIENT_NOTES).map(([id, note]) => ({ href: `client/${id}.html`, text: note.title })),
      },
    ],
  });
}

/* ---------------------------------------------------------------- entrypoint */

export const clientPageIds = Object.freeze(Object.keys(CLIENT_NOTES));

// The company behind each client that has one named in a cited sentence. Only
// these client pages can carry a figures block, so the test that checks which
// pages do needs the same list the renderer uses rather than its own copy.
export const clientVendors = Object.freeze(Object.fromEntries(
  Object.entries(CLIENT_NOTES)
    .filter(([, note]) => note.vendor)
    .map(([id, note]) => [id, note.vendor]),
));
export const comparisonPageIds = Object.freeze(COMPARISONS.map(({ id }) => id));

export const CLIENT_PAGE_TITLES = Object.freeze(Object.fromEntries(
  Object.entries(CLIENT_NOTES).map(([id, note]) => [id, note.title]),
));

// The one provider every filled-in example is written against. A config with a
// placeholder in it teaches nothing, so the example needs a provider that
// publishes a pasteable model id rather than a catalog blurb. The client pages
// and the files in examples/ both come through here, so the repository and the
// website can never demonstrate two different endpoints.
export function sampleProviderFrom(providers) {
  return providers.find((provider) => provider.id === 'groq' && snippetModelFor(provider))
    ?? providers.find((provider) => snippetModelFor(provider))
    ?? providers[0];
}

export function buildContext(providers, families = MODEL_FAMILIES, locale = DEFAULT_LOCALE) {
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
    locale,
    t: translator(locale),
    total: pages.length,
    cardRequired: pages.filter(({ credit_card_required: card }) => card).length,
    cardFree: pages.filter(({ credit_card_required: card }) => !card).length,
    withNumbers: pages.filter(publishesFixedNumbers).length,
    sampleProvider: sampleProviderFrom(pages),
    checkedAt: providers.map(({ source_checked_at: date }) => date).sort().at(-1),
  };
}

export function renderMatrixPages(providers, families = MODEL_FAMILIES, locale = DEFAULT_LOCALE) {
  const context = buildContext(providers, families, locale);
  const artifacts = {};
  const directory = `docs/${locale.path_prefix}`;

  for (const provider of context.pages) {
    const inCategory = context.pages.filter(({ category }) => category === provider.category).length;
    artifacts[`${directory}provider/${provider.id}.html`] = providerPage(provider, { ...context, inCategory });
  }
  for (const family of families) {
    artifacts[`${directory}model/${family.id}.html`] = modelPage(family, context);
  }
  for (const clientId of clientPageIds) {
    artifacts[`${directory}client/${clientId}.html`] = clientPage(clientId, context);
  }
  for (const comparison of COMPARISONS) {
    artifacts[`${directory}compare/${comparison.id}.html`] = comparisonPage(comparison, context);
  }
  artifacts[`${directory}methodology.html`] = methodologyPage(context);

  return artifacts;
}
