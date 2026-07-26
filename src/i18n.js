// Every sentence this site prints, in both languages it publishes.
//
// The Chinese entries are written from the same facts as the English ones
// rather than translated from the rendered English, because a page that reads
// like machine output is worth indexing less than no page at all. Where a
// number, a model id or an endpoint appears, both languages carry the same one:
// they are two editions of one catalog, not two catalogs.
//
// A missing key throws instead of falling back to English. A build that fails
// is a translation you notice; an English sentence on a Chinese page is one you
// do not.

import { DEFAULT_LOCALE } from './site.js';

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template, params) {
  return template.replaceAll(PLACEHOLDER, (match, name) => {
    if (!Object.hasOwn(params, name)) throw new Error(`No value for {${name}} in: ${template}`);
    return String(params[name]);
  });
}

/* ------------------------------------------------------------------ english */

const en = {
  /* shared vocabulary */
  'category.provider-free-tier': 'Provider free tier',
  'category.free-model-aggregator': 'Free model aggregator',
  'category.trial-credit': 'Free trial credit',
  'category.metered-access': 'Metered access',
  'category.retiring-free-tier': 'Retiring free tier',

  'limitStatus.tier-based': 'Set by project tier',
  'limitStatus.documented-per-model': 'Published per model',
  'limitStatus.documented-per-endpoint': 'Published per endpoint',
  'limitStatus.documented-per-tier': 'Published per tier',
  'limitStatus.documented-account-wide': 'Published account-wide',
  'limitStatus.documented-baseline': 'Published baseline, then scaled',
  'limitStatus.documented-in-compute-units': 'Published in compute units',
  'limitStatus.documented-in-credits': 'Published as a credit balance',
  'limitStatus.documented-in-plans': 'Published per paid plan',
  'limitStatus.documented-with-conditions': 'Published with conditions',
  'limitStatus.dynamic-no-fixed-numbers': 'Dynamic, no fixed numbers',
  'limitStatus.free-models-listed': 'Selected models priced at zero',
  'limitStatus.not_published': 'Enforced but not published',
  'limitStatus.retiring': 'Retiring',

  'availability.active': 'Active',
  'availability.retiring': 'Retiring',

  'change.added': 'Added',
  'change.limit-changed': 'Limit changed',
  'change.lifecycle': 'Lifecycle',
  'change.correction': 'Correction',
  'change.removed': 'Removed',

  'probe.not-checked': 'Not checked',
  'probe.available': 'Available',
  'probe.credential-rejected': 'Credential rejected',
  'probe.sample-rate-limited': 'Sample limited',
  'probe.endpoint-error': 'Endpoint error',
  'probe.network-error': 'Network error',
  'probe.request-rejected': 'Request rejected',

  'word.yes': 'Yes',
  'word.no': 'No',
  'word.required': 'Required',
  'word.notRequired': 'Not required',
  'word.any': 'Any',
  'word.providerOne': 'provider',
  'word.providerMany': 'providers',

  // Punctuation is part of a language, not a constant. English separates
  // sentences with a space and items with a comma; Chinese ends a sentence with
  // a full-width stop that already carries the gap, and lists with a 、.
  'word.sentenceJoin': ' ',
  'word.sentenceSplit': '. ',
  'word.sentenceEnd': '.',
  'word.listJoin': ', ',
  'word.limitsJoin': ', ',

  /* table headers, shared by every page that compares providers */
  'table.provider': 'Provider',
  'table.access': 'Free access',
  'table.limits': 'Published limits',
  'table.card': 'Card',
  'table.models': 'Matching models',
  'table.endpoint': 'Endpoint',
  'table.comparedWith': 'Compared with',
  'table.baseUrl': 'Base URL',

  /* layout chrome */
  'layout.brand': 'Free LLM API',
  'layout.breadcrumbLabel': 'Breadcrumb',
  'layout.relatedLabel': 'Related pages',
  'layout.footerNote': 'Every number on this page comes from the provider’s own documentation, dated in the catalog.',
  'layout.footerLink': 'Free LLM API catalog',
  'layout.allProviders': 'All providers',
  'layout.browserChecker': 'Browser key checker',
  'layout.methodologyLink': 'How this data is collected',
  'layout.thisCatalog': 'This catalog',
  'layout.familyLink': 'Free {name} API',

  /* home */
  'home.title': 'Free LLM API',
  'home.description': 'Source-backed free LLM API limits, compatibility, lifecycle, and explainable sample probe status.',
  'home.datasetDescription': 'Free-tier terms for {count} LLM API providers: published rate limits, credit-card requirement, OpenAI protocol compatibility, lifecycle, and the official source behind each figure.',
  'home.eyebrow': 'Verified provider facts · Reviewed {date}',
  'home.h1': 'Free LLM API',
  'home.lede': 'Compare official free-access terms without treating one sample key as an uptime monitor.',
  'home.verifyCta': 'Already have a key? Check it in your browser →',
  'home.statsLabel': 'Catalog summary',
  'home.statProviders': 'providers tracked',
  'home.statCompatible': 'OpenAI compatible',
  'home.statRetiring': 'retiring service',
  'home.filterEyebrow': 'Catalog',
  'home.filterHeading': 'Find a usable free tier',
  'home.matches': 'matches',
  'home.searchLabel': 'Search',
  'home.searchPlaceholder': 'Provider, model, or limit',
  'home.categoryLabel': 'Free access type',
  'home.allTypes': 'All types',
  'home.cardLabel': 'Credit card',
  'home.compatibilityLabel': 'OpenAI compatible',
  'home.probeLabel': 'Sample probe',
  'home.anyState': 'Any state',
  'home.tableLabel': 'Free LLM API providers',
  'home.emptyState': 'No providers match these filters.',
  'home.browseEyebrow': 'Browse',
  'home.browseHeading': 'By model family or by client',
  'home.browseFamilies': 'Model families',
  'home.browseClients': 'Coding clients',
  'home.browseData': 'About the data',
  'home.rawJson': 'Raw catalog JSON',
  'home.checkInBrowser': 'Check a key in your browser',
  'home.methodEyebrow': 'Interpretation',
  'home.methodHeading': 'Sample facts, not status theater',
  'home.methodBody': '<strong>401/403</strong> means the sample credential failed. <strong>429</strong> means that sample was limited. Only network and 5xx responses indicate a sampled endpoint reachability problem, never a provider-wide outage.',
  'home.methodLink': 'Read the full methodology',
  'home.hostedCta': 'Need stable hosted access?',
  'home.footerNote': 'Data is reviewed against official sources.',
  'home.footerLink': 'Methodology and data contract',
  'home.footerHref': 'https://github.com/xyzs996/free-llm-api/blob/main/README.md#data',

  'home.colProvider': 'Provider',
  'home.colAccess': 'Free access',
  'home.colCard': 'Card',
  'home.colOpenAi': 'OpenAI',
  'home.colLimits': 'Limits',
  'home.colProbe': 'Sample probe',
  'home.colChecked': 'Sources checked',
  'home.colSignup': 'Access',
  'home.cellCard': 'Credit card',
  'home.cellOpenAi': 'OpenAI compatible',
  'home.cellProbe': 'Probe',
  'home.rowRetires': 'Retires {date}',
  'home.rowSignup': 'Get API access',
  'home.rowClosed': 'New access closed',
  'home.rowRpm': '{count} RPM',
  'home.rowRpd': '{count} requests/day',
  'home.rowUnknown': 'Dynamic / unknown',

  /* provider pages */
  'provider.title': '{name} free tier: limits and models',
  'provider.description': '{name} free-tier rate limits, free models, browser reachability, and setup, taken from official sources on {date}.',
  'provider.eyebrow': '{category} · Sources reviewed {date}',
  'provider.h1': '{name} free tier',
  'provider.lede': 'What {name} publishes about its free allowance, which models it covers, and how to point an existing tool at it.',
  'provider.crumb': 'Providers',
  'provider.allowanceHeading': 'What {name}\'s free tier allows',
  'provider.factLimits': 'Published limits',
  'provider.factCategory': 'Free access type',
  'provider.factCard': 'Credit card',
  'provider.factProtocol': 'Protocol',
  'provider.factLifecycle': 'Lifecycle',
  'provider.factChecked': 'Sources reviewed',
  'provider.protocolOpenAi': 'OpenAI-compatible at <code>{url}</code>',
  'provider.protocolOwn': 'Provider-specific at <code>{url}</code>',
  'provider.retires': 'Retires {date}',
  'provider.rpm': '{count} requests per minute',
  'provider.rpd': '{count} requests per day',
  'provider.placeHeading': 'Where {name} sits in this catalog',
  'provider.placeLede': '{name} is one of {inCategory} {category} entries among the {total} providers detailed here.',
  'provider.cardYes': 'It asks for a credit card, as {count} of the {total} do.',
  'provider.cardNo': 'It asks for no credit card, which is true of {count} of the {total}.',
  'provider.numbersYes': 'It publishes fixed numbers — {phrase} — which only {count} of the {total} do.',
  'provider.numbersNo': 'It publishes no fixed request count, as {count} of the {total} do not.',
  'provider.compareSelf': '{name} (this page)',
  'provider.modelsHeading': 'Models {name} lists as free',
  'provider.modelFamilyTail': ' — <a href="../model/{id}.html">{name}</a>, also free at {count} other {providers} here',
  'provider.modelNoFamily': ' — not part of any family this catalog tracks across providers',
  'provider.familyNone': 'The models above do not fall into any of the multi-provider families this catalog tracks, so {name} is the only route to them here.',
  'provider.familyOnly': 'It is the only provider in this catalog hosting the {name} family.',
  'provider.familyShared': '{count} other {providers} here also host the <a href="../model/{id}.html">{name}</a> family on free terms, and the terms are not the same: {links}.',
  'provider.checkHeading': 'Checking a {name} key',
  'provider.checkMeasured': 'That was measured against <code>{origin}</code> on {date}.',
  'provider.checkBrowser': 'So a key can be checked in the <a href="../verify.html?provider={id}">browser checker</a> without installing anything. If you would rather not paste a key into a web page, this does the same thing:',
  'provider.checkTerminal': 'So the browser checker cannot reach it and does not pretend otherwise. Run this instead:',
  'provider.useHeading': 'Using a {name} key',
  'provider.useNoModel': 'The catalog records no single pasteable model id for {name}, so the command below lists what the key can reach instead of naming a model that might not exist on your account.',
  'provider.useIntro': '{name} serves the OpenAI chat completions protocol at <code>{url}</code>. Point any client that accepts a custom base URL at it, and let the client read the key from <code>{env}</code> so the value never lands in a config file:',
  'provider.faqHeading': 'Questions about the {name} free tier',
  'provider.sourcesHeading': 'Official sources',
  'provider.sourcesNote': 'Every figure above was read from those pages on {date}. Where a provider states a limit only inside a console, this catalog records that fact instead of a number. See the <a href="../methodology.html">methodology</a> for how an entry gets in and how it gets corrected.',
  'provider.relatedCompare': 'Compare with',
  'provider.relatedFamilies': 'Model families',
  'provider.relatedPopular': 'Popular model families',
  'provider.relatedClients': 'Use it with',
  'provider.clientSetup': '{name} setup',

  'provider.faq.cardQ': 'Does {name} ask for a credit card?',
  'provider.faq.cardYes': 'Yes. {name} requires a card on file before the free allowance is usable, which {count} of the {total} providers with a page here also do.',
  'provider.faq.cardNo': 'No. {name} is one of {count} providers here that hand out free access without a card, so the only cost of trying it is the signup.',
  'provider.faq.limitsQ': 'What are {name}\'s free-tier rate limits?',
  'provider.faq.limitsNumbers': '{name} publishes {phrase}. Those are the numbers in its own documentation as reviewed on {date}.',
  'provider.faq.limitsNone': '{name} publishes no single free-tier number: its limits are {status}. This catalog leaves that blank rather than guessing a figure.',
  'provider.faq.throttleQ': 'What happens when a {name} key hits the limit?',
  'provider.faq.throttleA': 'The endpoint answers <code>429</code>. That is a statement about the request that was refused, not about how much quota is left; only a reset header from the provider tells you when it clears.',
  'provider.faq.retireQ': 'Is the {name} free tier going away?',
  'provider.faq.retireYes': 'Yes, on {date}. {note}',
  'provider.faq.retireNo': 'Nothing in {name}\'s own documentation says so as of {date}. {note}',
  'provider.faq.clientsQ': 'Can {name} be used with Codex, Cline, or Continue?',
  'provider.faq.clientsA': 'Yes. {name} serves the OpenAI chat completions protocol at <code>{url}</code>, so any client that accepts a custom base URL can use it. Claude Code is the exception, because it speaks the Anthropic protocol instead.',

  /* model family pages */
  'model.title': 'Free {name} API: {count} providers compared',
  'model.description': 'Which providers serve {name} models on a free tier, what each one publishes as its limit, and how the terms differ. Reviewed {date}.',
  'model.eyebrow': '{vendor} · {count} providers in this catalog',
  'model.h1': 'Free {name} API access',
  'model.lede': 'Every provider in this catalog that lists a {name} model on free terms, with the limit each one publishes.',
  'model.crumb': 'Model families',
  'model.listName': 'Providers offering {name} on free terms',
  'model.listDescription': 'Every provider in this catalog that lists a {name} model as free, ordered as the comparison table on the page.',
  'model.whatHeading': 'What the {name} family is',
  'model.providersHeading': 'Providers offering {name} on free terms',
  'model.providersLede': '{count} of the {total} providers detailed in this catalog list at least one {name} model. Because {vendor} publishes the weights rather than the service, the model id can be identical across all of them while the free allowance is not.',
  'model.differHeading': 'How the free terms actually differ',
  'model.pickHeading': 'Picking one',
  'model.pickBody': '{withNumbers} of these {count} publish a fixed request count; the rest state a tier or a credit balance instead, which means the only honest answer to "how much is free" is the one in their console. {cardFree} take no credit card. {browserOk} answer a cross-origin browser request, so a key for those can be checked from the <a href="../verify.html">browser checker</a> with nothing installed.',
  'model.pickCaveat': 'A model id that matches {name} is not a promise that the free tier includes it. Providers move individual models between paid and free without changing the id, which is why each row links to the provider page carrying that provider\'s own wording and the date it was read.',
  'model.relatedHosts': 'Providers hosting it',
  'model.relatedOthers': 'Other families',

  /* client pages */
  'client.title': 'Free LLM API for {name}: setup and providers',
  'client.description': 'How to point {name} at a free OpenAI-compatible tier, what the generated config contains, and which providers are worth trying first.',
  'client.eyebrow': 'Client setup · Catalog reviewed {date}',
  'client.h1': '{name} with a free LLM API',
  'client.lede': 'The configuration {name} needs, generated from the catalog, plus the free tiers that actually work with it.',
  'client.crumb': 'Clients',
  'client.howToName': 'Point {name} at a free LLM API',
  'client.howToSupply': 'A free-tier API key you created at the provider',
  'client.needsHeading': 'What {name} needs',
  'client.fileHeading': 'The file this produces',
  'client.fileIntro': 'Running <code>npx free-llm-api setup {id}</code> writes <code>{filename}</code>.',
  'client.fileGuided': 'It is a review guide rather than a config file, because the values are typed into a settings panel and this project does not write to another tool’s credential storage.',
  'client.fileGenerated': 'It is generated from the catalog, so the base URL and model id are the ones the provider documents rather than ones you have to look up.',
  'client.fileFilled': 'Here it is filled in for {name}:',
  'client.fileNoKey': 'Nothing in that file is a key. The value is read from <code>{env}</code> at run time, which is the one habit that keeps a credential out of a repository by construction.',
  'client.fitsHeading': 'Which free tiers fit {name}',
  'client.fitsAnthropic': 'Only {count} entry in this catalog is not OpenAI-compatible, so there is no table of drop-in free tiers for {name}. The realistic routes are a local translating router holding your own provider keys, or a gateway that already answers in the Anthropic format.',
  'client.fitsOpenAi': '{count} providers here serve the OpenAI protocol and take no credit card, which makes them the ones worth trying first with {name}. The full list, including the ones that do ask for a card, is in the <a href="../index.html">catalog</a>.',
  'client.expectHeading': 'What to expect on a free tier',
  'client.expectCheck': 'Before blaming the client, check the key itself: the <a href="../verify.html">browser checker</a> separates a rejected credential from a rate limit from an endpoint that is simply down, and each of those has a different fix.',
  'client.sourcesHeading': 'Sources',
  'client.sourcesNote': 'Provider figures shown here come from each provider’s own documentation, reviewed on {date}. The <a href="../methodology.html">methodology</a> covers what is recorded and what is deliberately left blank.',
  'client.relatedTry': 'Providers to try',
  'client.relatedOthers': 'Other clients',

  'client.step1Name': 'Create your own key',
  'client.step1Text': 'Pick a free tier from the catalog and create the key on that provider’s own site. This project distributes no key and never receives yours.',
  'client.step2Name': 'Generate the configuration',
  'client.step2Guided': 'Run npx free-llm-api setup {id}. It writes {filename}, a review guide rather than a config file, because {name} takes these values in its own settings panel.',
  'client.step2Generated': 'Run npx free-llm-api setup {id}. It writes {filename} from the catalog entry, so the base URL and the model id are the ones the provider documents.',
  'client.step3GuidedName': 'Enter the key yourself',
  'client.step3GeneratedName': 'Keep the key in the environment',
  'client.step3Guided': 'Type the key into {name} by hand. This project does not read or write another tool’s credential storage.',
  'client.step3Generated': 'Export the key as {env}. The generated file names that variable and never contains the value, which keeps the credential out of a repository by construction.',
  'client.step4Name': 'Check the key before blaming the client',
  'client.step4Text': 'Open the browser key checker and confirm the provider accepts the key. A rejected credential, a rate limit and an unreachable endpoint look alike from inside the client and have different fixes.',

  /* methodology */
  'methodology.title': 'Methodology: how this free LLM API data is collected',
  'methodology.description': 'What counts as a free tier, where every rate limit comes from, what a probe proves, and why some providers get a page while others stay catalog rows.',
  'methodology.eyebrow': 'Data contract · Reviewed {date}',
  'methodology.h1': 'How this data is collected',
  'methodology.lede': 'Every rule this catalog follows, including the ones that keep numbers out of it.',
  'methodology.crumb': 'Methodology',
  'methodology.articleHeadline': 'How this free LLM API data is collected',
  'methodology.articleDescription': 'The rules behind every entry: what qualifies as a free tier, where each number comes from, what a probe proves, and which providers are deliberately left as catalog rows.',
  'methodology.scopeHeading': 'What counts as a free LLM API here',
  'methodology.scopeBody': 'An entry qualifies when the provider itself documents access that costs nothing to start: a standing free tier, a pool of models priced at zero, or signup credit. Reverse-engineered endpoints, leaked keys, and gateways reselling someone else’s quota are out of scope, and no key of any kind is distributed by this project. Every entry links to the page you would use to create your own.',
  'methodology.scopeCount': 'The catalog currently holds {providers} providers across {categories} access types and {families} model families that appear at more than one provider.',
  'methodology.numbersHeading': 'Where the numbers come from',
  'methodology.numbersBody': 'Each provider record carries at least one official source URL and a <code>source_checked_at</code> date. A rate limit may only be recorded if a source states it; the validator fails the build otherwise. When a provider publishes limits only inside a logged-in console, or scales them by tier, the field stays empty and the status says so. That is why some rows read "set by project tier" instead of a number: inventing a plausible figure would make the table look more complete and be worth less.',
  'methodology.probeHeading': 'What a probe does and does not prove',
  'methodology.probeBody': 'A probe is one sampled request against one endpoint at one moment. <code>200</code> means that request succeeded. <code>401</code> or <code>403</code> means the sample credential was refused and says nothing about the provider. <code>429</code> means that sample was throttled, with no information about anyone’s remaining quota. Only a network failure or a <code>5xx</code> points at the endpoint, and even then it describes one sample rather than an outage. Probes run outside CI and read their key from an environment variable; the published output records the classification, status, latency, and timestamp, never the key or the response body.',
  'methodology.corsHeading': 'How browser reachability is measured',
  'methodology.corsBody': 'Each base URL gets a CORS preflight from the site’s own origin. If the response allows that origin and lists <code>authorization</code> among the permitted headers, a browser can call the endpoint and the provider is marked supported. If the origin is refused, it is marked blocked and the key checker does not pretend otherwise. If the origin is allowed but the header is not listed, the result is recorded as unverified rather than guessed. No credential is involved in this measurement, which is why it can run for every provider.',
  'methodology.pagesHeading': 'Which providers get their own page',
  'methodology.pagesBody': '{total} of the {providers} providers have a page. A provider earns one only when its free terms are documented in enough detail to say something specific: a limits summary of at least 120 characters, at least one official source, and a signup URL a reader can act on.',
  'methodology.pagesAllPass': 'Every provider currently clears that bar.',
  'methodology.pagesSomeFail': '{count} currently do not ({names}), so they appear as catalog rows only.',
  'methodology.pagesDoorway': 'The alternative — a page per provider regardless — produces pages that differ by a name and nothing else, which helps nobody and is the pattern search engines classify as a doorway.',
  'methodology.honestHeading': 'How this is kept honest',
  'methodology.honestBody': 'Every page on this site is generated from the data files by a renderer, and a check step fails if any published file differs from what the current data would produce. Editing a page by hand is therefore not possible without the change being reverted, and a data correction updates the README, the catalog, and every page that cites it at the same time. Corrections are welcome as issues or pull requests against the data file, not the output.',
  'methodology.honestSecurity': 'The repository ships no credentials, and the key checker sends what you paste only to the provider you picked, enforced by a Content Security Policy rather than by a promise.',
  'methodology.relatedStart': 'Start here',
  'methodology.relatedFamilies': 'Model families',
  'methodology.relatedClients': 'Client setup',

  /* verify */
  'verify.title': 'Check a free LLM API key in your browser',
  'verify.description': 'Paste a key you already own and see whether the provider accepts it. The request goes from your browser straight to that provider, never through this site.',
  'verify.appName': 'Free LLM API key checker',
  'verify.feature1': 'Checks a key against {count} providers directly from the browser',
  'verify.feature2': 'Sends the key only to the provider it belongs to, enforced by a Content Security Policy',
  'verify.feature3': 'Stores nothing: no cookie, no local storage, no key in the address bar',
  'verify.feature4': 'Prints an equivalent curl command for providers a browser cannot reach',
  'verify.eyebrow': 'Browser key checker · Reachability measured {date}',
  'verify.lede': 'Bring a key you created yourself. Nothing is installed, nothing is stored, and the request never passes through this site.',
  'verify.statsLabel': 'Checker summary',
  'verify.statBrowser': 'reachable from a browser',
  'verify.statTerminal': 'need the terminal',
  'verify.statZero': 'keys reach this site',
  'verify.formHeading': 'Check a key',
  'verify.providerLabel': 'Provider',
  'verify.groupBrowser': 'Checkable in a browser',
  'verify.groupTerminal': 'Terminal only',
  'verify.keyLabel': 'Your API key',
  'verify.keyPlaceholder': 'Paste the key you created at the provider',
  'verify.submit': 'Check this key',
  'verify.submitBlocked': 'Not checkable in a browser',
  'verify.checking': 'Checking…',
  'verify.asking': 'Asking {name} to list its models.',
  'verify.requestLabel': 'Request:',
  'verify.noscript': 'This check runs entirely in your browser, so it needs JavaScript. The terminal command below does the same thing without it.',
  'verify.whereHeading': 'Where your key goes',
  'verify.whereBody': 'Exactly one place: the provider you picked. This page declares a Content Security Policy whose <code>connect-src</code> lists the {count} provider origins below and nothing else — no analytics host, and not this site\'s own domain. Your browser blocks any other destination before a request leaves it.',
  'verify.whereStorage': 'The key stays in one JavaScript variable for the length of one request. It is never written to <code>localStorage</code>, a cookie, or the address bar, and a key handed to this page in a query string is discarded and stripped from your history.',
  'verify.whereThirdParty': 'This page loads no third-party script of any kind — no analytics beacon, no tag manager, no font or widget host. The only script it runs is the one served from this repository, and the policy above would block anything else even if someone added it.',
  'verify.readScript': 'Read the script that does it',
  'verify.aboutHeading': 'About this provider',
  'verify.fallbackIntro': 'Set your key as <code id="verify-env"></code> and run this instead if the browser cannot reach the provider, or if you would rather not paste a key into a web page at all:',
  'verify.sourcesLabel': 'Official sources:',
  'verify.signup': 'Get a key from this provider',
  'verify.readOn': 'Read on:',
  'verify.readCatalog': 'the full provider catalog',
  'verify.readMethodology': 'how reachability is measured',
  'verify.readClient': 'pointing a coding agent at a free tier',
  'verify.footerNote': 'No key you type here is transmitted to, logged by, or stored on this site.',
  'verify.footerLink': 'Back to the provider catalog',

  'verify.state.key-accepted': 'Key accepted',
  'verify.state.key-rejected': 'Key rejected',
  'verify.state.rate-limited': 'Rate limited',
  'verify.state.request-rejected': 'Request rejected',
  'verify.state.endpoint-error': 'Provider error',
  'verify.state.unreachable': 'No answer',
  'verify.explain.key-accepted': 'The provider listed its models for this key. That proves the key exists and is enabled, not which models your account may call or how much quota is left.',
  'verify.explain.key-rejected': 'The provider read the key and refused it. A truncated paste and a revoked key look identical here, so re-copy it once before assuming it is dead.',
  'verify.explain.rate-limited': 'The provider recognised the key and then throttled the request. This is a quota answer, not an invalid key.',
  'verify.explain.request-rejected': 'The provider refused the request itself. A region restriction, an unaccepted terms page, and a project without the API enabled all surface this way.',
  'verify.explain.endpoint-error': 'The provider failed on its own side. This says nothing about the key; try again later.',
  'verify.explain.unreachable': 'The browser could not complete the request. A CORS refusal, an offline network, a proxy, and a blocking extension are indistinguishable from this side, so this is not a verdict about your key. Run the command below to get one.',
};

/* ------------------------------------------------------------------ chinese */

const zh = {
  /* shared vocabulary */
  'category.provider-free-tier': '厂商免费额度',
  'category.free-model-aggregator': '免费模型聚合',
  'category.trial-credit': '注册赠送额度',
  'category.metered-access': '按量计费',
  'category.retiring-free-tier': '即将下线的免费额度',

  'limitStatus.tier-based': '按项目层级设定',
  'limitStatus.documented-per-model': '按模型公布',
  'limitStatus.documented-per-endpoint': '按端点公布',
  'limitStatus.documented-per-tier': '按层级公布',
  'limitStatus.documented-account-wide': '按账号整体公布',
  'limitStatus.documented-baseline': '公布基线后动态伸缩',
  'limitStatus.documented-in-compute-units': '以计算单位公布',
  'limitStatus.documented-in-credits': '以额度余额公布',
  'limitStatus.documented-in-plans': '按付费计划公布',
  'limitStatus.documented-with-conditions': '公布但附带条件',
  'limitStatus.dynamic-no-fixed-numbers': '动态，无固定数值',
  'limitStatus.free-models-listed': '部分模型标价为零',
  'limitStatus.not_published': '有限流但未公布数值',
  'limitStatus.retiring': '即将下线',

  'availability.active': '正常开放',
  'availability.retiring': '即将下线',

  'change.added': '新增',
  'change.limit-changed': '限额变化',
  'change.lifecycle': '生命周期',
  'change.correction': '更正',
  'change.removed': '移除',

  'probe.not-checked': '未探活',
  'probe.available': '可用',
  'probe.credential-rejected': '凭据被拒',
  'probe.sample-rate-limited': '采样被限流',
  'probe.endpoint-error': '端点报错',
  'probe.network-error': '网络错误',
  'probe.request-rejected': '请求被拒',

  'word.yes': '是',
  'word.no': '否',
  'word.required': '需要',
  'word.notRequired': '不需要',
  'word.any': '不限',
  'word.providerOne': '服务商',
  'word.providerMany': '服务商',

  'word.sentenceJoin': '',
  'word.sentenceSplit': '。',
  'word.sentenceEnd': '。',
  'word.listJoin': '、',
  'word.limitsJoin': '，',

  /* table headers, shared by every page that compares providers */
  'table.provider': '服务商',
  'table.access': '免费形式',
  'table.limits': '官方公布限额',
  'table.card': '信用卡',
  'table.models': '匹配到的模型',
  'table.endpoint': '端点',
  'table.comparedWith': '对比对象',
  'table.baseUrl': 'Base URL',

  /* layout chrome */
  'layout.brand': '免费 LLM API',
  'layout.breadcrumbLabel': '面包屑导航',
  'layout.relatedLabel': '相关页面',
  'layout.footerNote': '本页每个数字都来自服务商自己的文档，核验日期记录在清单里。',
  'layout.footerLink': '免费 LLM API 清单',
  'layout.allProviders': '全部服务商',
  'layout.browserChecker': '浏览器 key 检测',
  'layout.methodologyLink': '这份数据是怎么来的',
  'layout.thisCatalog': '本清单',
  'layout.familyLink': '{name} 免费 API',

  /* home */
  'home.title': '免费 LLM API 目录',
  'home.description': '有官方来源可查的免费 LLM API 额度、协议兼容性、生命周期，以及可解释的采样探活状态。',
  'home.datasetDescription': '{count} 家 LLM API 服务商的免费额度条款：官方公布的限流数值、是否需要信用卡、是否兼容 OpenAI 协议、生命周期，以及每个数字背后的官方来源。',
  'home.eyebrow': '逐条核验的服务商事实 · 核验于 {date}',
  'home.h1': '免费 LLM API 目录',
  'home.lede': '按官方公布的条款横向比较免费额度，而不是把一次采样请求当成可用性监控。',
  'home.verifyCta': '已经有 key 了？在浏览器里验一下 →',
  'home.statsLabel': '清单概览',
  'home.statProviders': '家服务商在跟踪',
  'home.statCompatible': '家兼容 OpenAI 协议',
  'home.statRetiring': '家即将下线',
  'home.filterEyebrow': '清单',
  'home.filterHeading': '筛出一个真能用的免费额度',
  'home.matches': '条匹配',
  'home.searchLabel': '搜索',
  'home.searchPlaceholder': '服务商、模型或限额',
  'home.categoryLabel': '免费形式',
  'home.allTypes': '全部形式',
  'home.cardLabel': '信用卡',
  'home.compatibilityLabel': 'OpenAI 兼容',
  'home.probeLabel': '采样探活',
  'home.anyState': '任意状态',
  'home.tableLabel': '免费 LLM API 服务商清单',
  'home.emptyState': '没有服务商符合当前筛选条件。',
  'home.browseEyebrow': '浏览',
  'home.browseHeading': '按模型系列或按客户端查看',
  'home.browseFamilies': '模型系列',
  'home.browseClients': '编码客户端',
  'home.browseData': '关于这份数据',
  'home.rawJson': '原始清单 JSON',
  'home.checkInBrowser': '在浏览器里验一个 key',
  'home.methodEyebrow': '怎么读这张表',
  'home.methodHeading': '采样事实，不是状态表演',
  'home.methodBody': '<strong>401/403</strong> 说明采样用的凭据没通过。<strong>429</strong> 说明那次采样被限流。只有网络错误和 5xx 才说明采样端点这次连不通，而且也绝不等于服务商整体故障。',
  'home.methodLink': '读完整的数据方法说明',
  'home.hostedCta': '需要稳定的托管访问？',
  'home.footerNote': '数据均对照官方来源核验。',
  'home.footerLink': '数据方法与数据契约',
  'home.footerHref': 'https://github.com/xyzs996/free-llm-api/blob/main/README_zh.md#数据',

  'home.colProvider': '服务商',
  'home.colAccess': '免费形式',
  'home.colCard': '信用卡',
  'home.colOpenAi': 'OpenAI',
  'home.colLimits': '限额',
  'home.colProbe': '采样探活',
  'home.colChecked': '来源核验',
  'home.colSignup': '获取',
  'home.cellCard': '需信用卡',
  'home.cellOpenAi': 'OpenAI 兼容',
  'home.cellProbe': '探活',
  'home.rowRetires': '{date} 下线',
  'home.rowSignup': '去开通 API',
  'home.rowClosed': '已停止新用户注册',
  'home.rowRpm': '{count} RPM',
  'home.rowRpd': '{count} 次/天',
  'home.rowUnknown': '动态 / 未公布',

  /* provider pages */
  'provider.title': '{name} 免费额度：限流与可用模型',
  'provider.description': '{name} 免费额度的限流数值、免费模型、浏览器可达性与接入方式，取自 {date} 核验的官方来源。',
  'provider.eyebrow': '{category} · 来源核验于 {date}',
  'provider.h1': '{name} 免费额度',
  'provider.lede': '{name} 官方就免费额度公布了什么、覆盖哪些模型，以及怎么把现有工具指过去。',
  'provider.crumb': '服务商',
  'provider.allowanceHeading': '{name} 的免费额度给到哪一步',
  'provider.factLimits': '官方公布限额',
  'provider.factCategory': '免费形式',
  'provider.factCard': '信用卡',
  'provider.factProtocol': '协议',
  'provider.factLifecycle': '生命周期',
  'provider.factChecked': '来源核验日期',
  'provider.protocolOpenAi': '兼容 OpenAI，端点 <code>{url}</code>',
  'provider.protocolOwn': '厂商自有协议，端点 <code>{url}</code>',
  'provider.retires': '{date} 下线',
  'provider.rpm': '每分钟 {count} 次请求',
  'provider.rpd': '每天 {count} 次请求',
  'provider.placeHeading': '{name} 在这份清单里处于什么位置',
  'provider.placeLede': '本站详列的 {total} 家服务商里，属于{category}的有 {inCategory} 家，{name} 是其中之一。',
  'provider.cardYes': '它要求绑信用卡，{total} 家里有 {count} 家是这样。',
  'provider.cardNo': '它不要求绑信用卡，{total} 家里有 {count} 家是这样。',
  'provider.numbersYes': '它公布了固定数值——{phrase}——{total} 家里只有 {count} 家做到了这一点。',
  'provider.numbersNo': '它没有公布固定的请求次数，{total} 家里有 {count} 家同样没有。',
  'provider.compareSelf': '{name}（当前页）',
  'provider.modelsHeading': '{name} 标为免费的模型',
  'provider.modelFamilyTail': ' —— <a href="../model/{id}.html">{name}</a>，本站另有 {count} 家{providers}也免费提供',
  'provider.modelNoFamily': ' —— 不属于本清单跨服务商跟踪的任何系列',
  'provider.familyNone': '上面这些模型不属于本清单跨服务商跟踪的任何系列，因此在这里 {name} 是拿到它们的唯一入口。',
  'provider.familyOnly': '在本清单里，它是唯一提供 {name} 系列的服务商。',
  'provider.familyShared': '本站另有 {count} 家{providers}也以免费条款提供 <a href="../model/{id}.html">{name}</a> 系列，而且条款并不相同：{links}。',
  'provider.checkHeading': '怎么验一个 {name} 的 key',
  'provider.checkMeasured': '这一结论是 {date} 针对 <code>{origin}</code> 实测得到的。',
  'provider.checkBrowser': '所以不用装任何东西，直接在<a href="../verify.html?provider={id}">浏览器检测页</a>里就能验。如果你不愿意把 key 粘进网页，下面这条命令是等价的：',
  'provider.checkTerminal': '所以浏览器检测页够不着它，页面也不会假装够得着。请改用下面这条命令：',
  'provider.useHeading': '怎么用一个 {name} 的 key',
  'provider.useNoModel': '本清单没有为 {name} 记录某一个可直接粘贴的 model id，所以下面这条命令是列出该 key 能访问到什么，而不是硬报一个你账号上未必存在的模型名。',
  'provider.useIntro': '{name} 在 <code>{url}</code> 上提供 OpenAI chat completions 协议。把任何支持自定义 base URL 的客户端指过去，并让客户端从 <code>{env}</code> 读取 key，这样 key 本身永远不会落进配置文件：',
  'provider.faqHeading': '关于 {name} 免费额度的常见问题',
  'provider.sourcesHeading': '官方来源',
  'provider.sourcesNote': '以上每个数字都是 {date} 从这些页面上读到的。如果某家只在控制台里给出限额，本清单就如实记下这件事，而不是填一个数字。收录标准和纠错流程见<a href="../methodology.html">数据方法</a>。',
  'provider.relatedCompare': '横向对比',
  'provider.relatedFamilies': '模型系列',
  'provider.relatedPopular': '热门模型系列',
  'provider.relatedClients': '搭配使用',
  'provider.clientSetup': '{name} 接入',

  'provider.faq.cardQ': '{name} 需要绑信用卡吗？',
  'provider.faq.cardYes': '需要。{name} 要求先绑卡，免费额度才可用；本站有独立页面的 {total} 家里，有 {count} 家同样如此。',
  'provider.faq.cardNo': '不需要。本站有 {count} 家不用绑卡就能拿到免费访问，{name} 是其中之一，所以试一下的成本只有注册本身。',
  'provider.faq.limitsQ': '{name} 免费额度的限流是多少？',
  'provider.faq.limitsNumbers': '{name} 公布的是{phrase}。这些数字来自它自己的文档，核验日期为 {date}。',
  'provider.faq.limitsNone': '{name} 没有公布单一的免费额度数字：它的限额形式是「{status}」。本清单在这里留空，而不是猜一个数。',
  'provider.faq.throttleQ': '{name} 的 key 撞到限额会怎样？',
  'provider.faq.throttleA': '端点返回 <code>429</code>。这只说明那一次请求被拒了，不说明还剩多少额度；只有服务商返回的 reset 响应头才能告诉你什么时候恢复。',
  'provider.faq.retireQ': '{name} 的免费额度会取消吗？',
  'provider.faq.retireYes': '会，下线日期是 {date}。{note}',
  'provider.faq.retireNo': '截至 {date}，{name} 自己的文档里没有这样的说法。{note}',
  'provider.faq.clientsQ': '{name} 能配合 Codex、Cline 或 Continue 使用吗？',
  'provider.faq.clientsA': '可以。{name} 在 <code>{url}</code> 上提供 OpenAI chat completions 协议，任何支持自定义 base URL 的客户端都能用。例外是 Claude Code，它讲的是 Anthropic 协议。',

  /* model family pages */
  'model.title': '{name} 免费 API：{count} 家服务商横评',
  'model.description': '哪些服务商以免费额度提供 {name} 模型、各自公布的限额是什么、条款差在哪里。核验于 {date}。',
  'model.eyebrow': '{vendor} · 本清单收录 {count} 家',
  'model.h1': '{name} 免费 API 访问',
  'model.lede': '本清单里所有以免费条款提供 {name} 模型的服务商，以及各自公布的限额。',
  'model.crumb': '模型系列',
  'model.listName': '以免费条款提供 {name} 的服务商',
  'model.listDescription': '本清单里所有把 {name} 模型标为免费的服务商，顺序与页面上的对比表一致。',
  'model.whatHeading': '{name} 系列是什么',
  'model.providersHeading': '以免费条款提供 {name} 的服务商',
  'model.providersLede': '本清单详列的 {total} 家服务商里，有 {count} 家至少提供一个 {name} 模型。因为 {vendor} 公开的是权重而不是服务，所以 model id 在这些家之间可以完全一致，免费额度却不一样。',
  'model.differHeading': '免费条款到底差在哪',
  'model.pickHeading': '怎么挑一家',
  'model.pickBody': '这 {count} 家里有 {withNumbers} 家公布了固定的请求次数，其余的只给出层级或额度余额，也就是说「到底免费多少」唯一诚实的答案在它们各自的控制台里。有 {cardFree} 家不要信用卡。有 {browserOk} 家会响应跨域浏览器请求，所以这些家的 key 不用装任何东西，直接在<a href="../verify.html">浏览器检测页</a>里就能验。',
  'model.pickCaveat': 'model id 匹配上 {name}，并不等于承诺免费额度里就包含它。服务商会在不改 id 的情况下把某个模型在付费和免费之间挪动，所以每一行都链回对应的服务商页面，那里放着该服务商自己的原话和读取日期。',
  'model.relatedHosts': '提供它的服务商',
  'model.relatedOthers': '其他系列',

  /* client pages */
  'client.title': '{name} 用免费 LLM API：配置与服务商',
  'client.description': '怎么把 {name} 指向一个免费的 OpenAI 兼容端点、生成的配置里有什么，以及优先值得一试的是哪几家。',
  'client.eyebrow': '客户端接入 · 清单核验于 {date}',
  'client.h1': '{name} 搭配免费 LLM API',
  'client.lede': '{name} 需要的配置由清单直接生成，另附真正能配合它工作的免费额度。',
  'client.crumb': '客户端',
  'client.howToName': '把 {name} 指向一个免费 LLM API',
  'client.howToSupply': '一个你自己在服务商处创建的免费额度 API key',
  'client.needsHeading': '{name} 需要什么',
  'client.fileHeading': '这条命令会生成什么文件',
  'client.fileIntro': '运行 <code>npx free-llm-api setup {id}</code> 会写出 <code>{filename}</code>。',
  'client.fileGuided': '它是一份对照检查清单而不是配置文件，因为这些值要手工填进设置面板，而本项目不会去写别的工具的凭据存储。',
  'client.fileGenerated': '它由清单生成，所以 base URL 和 model id 都是服务商文档里的原值，不用你再去翻。',
  'client.fileFilled': '下面是按 {name} 填好的样子：',
  'client.fileNoKey': '那个文件里没有 key。值在运行时从 <code>{env}</code> 读取——就这一个习惯，从结构上保证凭据进不了仓库。',
  'client.fitsHeading': '哪些免费额度适合 {name}',
  'client.fitsAnthropic': '本清单里只有 {count} 条不兼容 OpenAI 协议，所以没法给 {name} 列一张开箱即用的免费额度表。现实的路子有两条：本地起一个做协议转换的路由、由它持有你自己的服务商 key，或者用一个本身就按 Anthropic 格式应答的网关。',
  'client.fitsOpenAi': '本站有 {count} 家既提供 OpenAI 协议又不要信用卡，配 {name} 最值得先试。完整名单（含要求绑卡的那些）在<a href="../index.html">清单页</a>。',
  'client.expectHeading': '用免费额度该有什么预期',
  'client.expectCheck': '在怪客户端之前，先验 key 本身：<a href="../verify.html">浏览器检测页</a>能把「凭据被拒」「被限流」和「端点根本没起来」这三种情况分开，而它们的解法各不相同。',
  'client.sourcesHeading': '来源',
  'client.sourcesNote': '这里引用的服务商数字，都来自各家自己的文档，核验日期 {date}。哪些内容会被记录、哪些是有意留空的，见<a href="../methodology.html">数据方法</a>。',
  'client.relatedTry': '值得先试的服务商',
  'client.relatedOthers': '其他客户端',

  'client.step1Name': '自己去创建一个 key',
  'client.step1Text': '从清单里挑一个免费额度，到该服务商自己的站点上创建 key。本项目不分发任何 key，也永远不会收到你的 key。',
  'client.step2Name': '生成配置',
  'client.step2Guided': '运行 npx free-llm-api setup {id}，它会写出 {filename}。那是一份对照检查清单而不是配置文件，因为 {name} 要在自己的设置面板里填这些值。',
  'client.step2Generated': '运行 npx free-llm-api setup {id}，它会按清单条目写出 {filename}，其中的 base URL 和 model id 都是服务商文档里的原值。',
  'client.step3GuidedName': '手工把 key 填进去',
  'client.step3GeneratedName': '把 key 留在环境变量里',
  'client.step3Guided': '在 {name} 里手工输入 key。本项目不读也不写别的工具的凭据存储。',
  'client.step3Generated': '把 key 导出为 {env}。生成的文件只写变量名、从不写值，这样凭据从结构上就进不了仓库。',
  'client.step4Name': '怪客户端之前先验 key',
  'client.step4Text': '打开浏览器 key 检测页，确认服务商认这个 key。凭据被拒、被限流、端点连不上，这三种情况在客户端里看起来一模一样，解法却完全不同。',

  /* methodology */
  'methodology.title': '数据方法：这份免费 LLM API 数据是怎么来的',
  'methodology.description': '什么算免费额度、每个限流数字从哪来、一次探活能证明什么，以及为什么有些服务商有独立页面、有些只作为清单行。',
  'methodology.eyebrow': '数据契约 · 核验于 {date}',
  'methodology.h1': '这份数据是怎么来的',
  'methodology.lede': '本清单遵守的全部规则，包括那些专门用来把数字挡在外面的规则。',
  'methodology.crumb': '数据方法',
  'methodology.articleHeadline': '这份免费 LLM API 数据是怎么来的',
  'methodology.articleDescription': '每一条记录背后的规则：什么算免费额度、每个数字从哪来、一次探活能证明什么，以及哪些服务商是被刻意留作清单行的。',
  'methodology.scopeHeading': '这里所说的「免费 LLM API」指什么',
  'methodology.scopeBody': '只有服务商自己在文档里写明「零成本即可开始」的访问方式才会被收录：常设的免费额度、一批标价为零的模型，或者注册赠送的额度。逆向出来的端点、泄露的 key、以及转卖别人配额的网关都不在范围内，本项目也不分发任何形式的 key。每一条都链到你自己去创建 key 的那个页面。',
  'methodology.scopeCount': '本清单目前收录 {providers} 家服务商，覆盖 {categories} 种免费形式，以及 {families} 个在不止一家出现的模型系列。',
  'methodology.numbersHeading': '这些数字是从哪来的',
  'methodology.numbersBody': '每条服务商记录都至少带一个官方来源 URL 和一个 <code>source_checked_at</code> 日期。只有来源里写明了的限流数值才允许被记录，否则校验器会让构建失败。如果某家只在登录后的控制台里给出限额，或者限额随层级伸缩，那么该字段就留空，由状态字段说明情况。这就是为什么有些行写的是「按项目层级设定」而不是一个数字：编一个看起来合理的数字，只会让表格显得更完整，同时更不值钱。',
  'methodology.probeHeading': '一次探活能证明什么、不能证明什么',
  'methodology.probeBody': '一次探活就是在某一个时刻、对某一个端点发出的一次采样请求。<code>200</code> 只说明那次请求成功了。<code>401</code> 或 <code>403</code> 说明采样用的凭据被拒，与服务商本身无关。<code>429</code> 说明那次采样被限流，不携带任何人剩余额度的信息。只有网络失败或 <code>5xx</code> 才指向端点本身，即便如此，它描述的也是一次采样而不是一次故障。探活在 CI 之外运行，key 只从环境变量读取；公布的输出里只有分类、状态码、延迟和时间戳，绝不含 key 或响应体。',
  'methodology.corsHeading': '浏览器可达性是怎么测的',
  'methodology.corsBody': '每个 base URL 都会收到一次从本站自身源发出的 CORS 预检。如果响应放行了这个源、并且把 <code>authorization</code> 列进允许的请求头，那么浏览器就能直接调用该端点，这家会被标为 supported。如果源被拒，就标为 blocked，key 检测页也不会假装它能通。如果源放行了但请求头没列出来，结果记为 unverified 而不是猜一个。这项测量完全不涉及凭据，所以能对每一家都跑。',
  'methodology.pagesHeading': '哪些服务商会有自己的页面',
  'methodology.pagesBody': '{providers} 家里有 {total} 家有独立页面。只有当一家的免费条款被记录得足够具体、能说出点实在东西时，它才配拿到一个页面：限额说明至少 120 个字符、至少一个官方来源，以及一个读者点得动的注册链接。',
  'methodology.pagesAllPass': '目前每一家都过了这条线。',
  'methodology.pagesSomeFail': '目前有 {count} 家没过（{names}），所以它们只作为清单行出现。',
  'methodology.pagesDoorway': '另一种做法——不管三七二十一每家都生成一页——产出的是除了名字之外别无二致的页面，对谁都没有帮助，而这正是搜索引擎判定为「桥页（doorway）」的那种模式。',
  'methodology.honestHeading': '这件事靠什么保持诚实',
  'methodology.honestBody': '本站每一个页面都由渲染器从数据文件生成，并有一个检查步骤：只要任何已发布文件与当前数据应产出的结果不一致，就会失败。因此手改页面是行不通的，改动会被还原；而修一处数据，会同时更新 README、清单和每一个引用它的页面。欢迎以 issue 或 PR 的形式对数据文件提交更正，而不是对产物。',
  'methodology.honestSecurity': '本仓库不携带任何凭据；key 检测页只会把你粘进去的东西发给你自己选的那一家服务商，这一点由 Content Security Policy 强制，而不是靠一句承诺。',
  'methodology.relatedStart': '从这里开始',
  'methodology.relatedFamilies': '模型系列',
  'methodology.relatedClients': '客户端接入',

  /* verify */
  'verify.title': '在浏览器里验一个免费 LLM API key',
  'verify.description': '粘一个你自己已有的 key，看服务商认不认。请求从你的浏览器直连那家服务商，不经过本站。',
  'verify.appName': '免费 LLM API key 检测器',
  'verify.feature1': '直接在浏览器里对 {count} 家服务商验 key',
  'verify.feature2': 'key 只发给它所属的那一家，由 Content Security Policy 强制',
  'verify.feature3': '什么都不存：没有 cookie，不写 localStorage，也不把 key 放进地址栏',
  'verify.feature4': '对浏览器够不着的服务商，直接给出等价的 curl 命令',
  'verify.eyebrow': '浏览器 key 检测 · 可达性实测于 {date}',
  'verify.lede': '请带上你自己创建的 key。不用安装、不留存任何内容，请求也从不经过本站。',
  'verify.statsLabel': '检测器概览',
  'verify.statBrowser': '家可在浏览器中直连',
  'verify.statTerminal': '家需要走终端',
  'verify.statZero': '个 key 会到达本站',
  'verify.formHeading': '验一个 key',
  'verify.providerLabel': '服务商',
  'verify.groupBrowser': '可在浏览器中检测',
  'verify.groupTerminal': '仅限终端',
  'verify.keyLabel': '你的 API key',
  'verify.keyPlaceholder': '粘贴你在服务商处创建的 key',
  'verify.submit': '验这个 key',
  'verify.submitBlocked': '该服务商无法在浏览器中检测',
  'verify.checking': '正在检测…',
  'verify.asking': '正在请求 {name} 列出它的模型。',
  'verify.requestLabel': '请求：',
  'verify.noscript': '这项检测完全在你的浏览器里跑，所以需要 JavaScript。下面那条终端命令不需要 JavaScript，做的是同一件事。',
  'verify.whereHeading': '你的 key 会去哪',
  'verify.whereBody': '只去一个地方：你自己选的那家服务商。本页声明的 Content Security Policy 里，<code>connect-src</code> 只列出下面这 {count} 个服务商源，别的一个都没有——既没有统计服务，也没有本站自己的域名。任何其他目的地，浏览器会在请求发出之前就拦掉。',
  'verify.whereStorage': 'key 只在一个 JavaScript 变量里存在一次请求那么久。它绝不会被写进 <code>localStorage</code>、cookie 或地址栏；如果有人用查询串把 key 塞进本页，本页会丢弃它，并把它从你的历史记录里抹掉。',
  'verify.whereThirdParty': '本页不加载任何第三方脚本——没有统计信标，没有标签管理器，也没有字体或组件托管。它唯一运行的脚本来自本仓库；就算有人往里加别的，上面那条策略也会把它挡掉。',
  'verify.readScript': '读一读干这件事的那段脚本',
  'verify.aboutHeading': '关于这家服务商',
  'verify.fallbackIntro': '如果浏览器够不着这家服务商，或者你压根不想把 key 粘进网页，那就把 key 设成 <code id="verify-env"></code> 然后运行下面这条：',
  'verify.sourcesLabel': '官方来源：',
  'verify.signup': '去这家服务商领 key',
  'verify.readOn': '继续读：',
  'verify.readCatalog': '完整的服务商清单',
  'verify.readMethodology': '可达性是怎么测的',
  'verify.readClient': '把编码 agent 指向免费额度',
  'verify.footerNote': '你在这里输入的 key，不会被传给本站、不会被本站记录，也不会存在本站。',
  'verify.footerLink': '回到服务商清单',

  'verify.state.key-accepted': 'key 通过',
  'verify.state.key-rejected': 'key 被拒',
  'verify.state.rate-limited': '被限流',
  'verify.state.request-rejected': '请求被拒',
  'verify.state.endpoint-error': '服务商报错',
  'verify.state.unreachable': '没有应答',
  'verify.explain.key-accepted': '服务商为这个 key 列出了模型。这证明 key 存在且已启用，但不代表你的账号能调哪些模型，也不代表还剩多少额度。',
  'verify.explain.key-rejected': '服务商读到了这个 key 并拒绝了它。粘贴时被截断和 key 已被吊销，在这里看起来一模一样，所以先重新复制一次再下结论。',
  'verify.explain.rate-limited': '服务商认出了这个 key，然后把请求限流了。这是关于额度的答复，不是说 key 无效。',
  'verify.explain.request-rejected': '服务商拒绝的是请求本身。区域限制、条款没点同意、项目没开通对应 API，都会以这种形式出现。',
  'verify.explain.endpoint-error': '服务商自己这边出错了。这跟 key 没有关系，过一会儿再试。',
  'verify.explain.unreachable': '浏览器没能完成这次请求。CORS 被拒、网络断开、走了代理、装了拦截插件，从这一侧看完全无法区分，所以这不是对你 key 的判断。想拿到判断，请运行下面那条命令。',
};

/* ------------------------------------------------------- sentences from data */

// A handful of fields in `data/providers.json` are prose the renderer prints
// verbatim, and the same wording repeats across providers because it describes
// the same measurement. They are translated by their English text, keyed on the
// sentence itself, so a new phrasing in the data fails the Chinese build loudly
// instead of appearing untranslated on a Chinese page.
const DATA_SENTENCES = Object.freeze({
  'The CORS preflight echoes the requesting origin and allows an Authorization header, so a browser can call this endpoint directly.':
    'CORS 预检回显了发起请求的源，并允许 Authorization 请求头，所以浏览器可以直接调用这个端点。',
  'The CORS preflight allows any origin to send an Authorization header, so a browser can call this endpoint directly.':
    'CORS 预检允许任意源携带 Authorization 请求头，所以浏览器可以直接调用这个端点。',
  'The CORS preflight succeeds but returns no allow-origin header, so a browser refuses to send the Authorization header.':
    'CORS 预检本身成功了，但没有返回 allow-origin 响应头，所以浏览器拒绝把 Authorization 请求头发出去。',
  'The endpoint answers the CORS preflight with 405 and no allow-origin header, so a browser refuses to send the Authorization header.':
    '该端点对 CORS 预检返回 405 且没有 allow-origin 响应头，所以浏览器拒绝把 Authorization 请求头发出去。',
  'The endpoint answers the CORS preflight with 404 and no allow-origin header, so a browser refuses to send the Authorization header.':
    '该端点对 CORS 预检返回 404 且没有 allow-origin 响应头，所以浏览器拒绝把 Authorization 请求头发出去。',
  'No authenticated probe has been published.': '尚未公布任何带凭据的探活结果。',
});

export function dataSentence(text, locale) {
  if (locale.code === 'en') return text;
  const translated = DATA_SENTENCES[text];
  if (translated === undefined) throw new Error(`No ${locale.code} translation for data sentence: ${text}`);
  return translated;
}

/* -------------------------------------------------------------- client notes */

// The parts of a client note that are prose. The title, the source link and the
// target query stay in `src/pages.js` beside the client definition, because a
// product name and a URL are the same in both languages.
const CLIENT_NOTE_COPY = Object.freeze({
  en: {
    codex: {
      summary: 'Codex CLI reaches any OpenAI-compatible endpoint through a custom model provider block in `~/.codex/config.toml`.',
      requirements: [
        '<code>model_provider</code> names an entry under <code>[model_providers.*]</code>, and the two spellings have to match exactly.',
        '<code>env_key</code> names the environment variable holding the key, so the key itself never enters the config file.',
        '<code>wire_api</code> selects the request shape. The generated block uses <code>"responses"</code>; if the provider documents only <code>/chat/completions</code>, change it to <code>"chat"</code>, because a mismatch fails as a 404 or a schema error on the very first request.',
        'The file has to be the user-level one. Codex ignores project-level <code>.codex/config.toml</code> keys that redirect provider authentication, including <code>model_provider</code>.',
      ],
      expectation: 'Codex sends large context windows for repository work, so a provider with a generous requests-per-day count can still cut you off on tokens per day. Read both columns before committing to one provider.',
    },
    'claude-code': {
      summary: 'Claude Code speaks the Anthropic Messages API, while nearly every free tier in this catalog speaks the OpenAI chat completions API.',
      requirements: [
        '<code>ANTHROPIC_BASE_URL</code> has to point at an endpoint that accepts Anthropic-format requests. Claude Code appends its own API path, so the value is a gateway root and not a <code>/v1</code> suffix.',
        '<code>ANTHROPIC_AUTH_TOKEN</code> holds the key, read from the environment at start-up.',
        'The model you name has to exist on that endpoint. A wrong model id comes back as a 404 from the provider, not as a Claude Code error.',
        'That protocol mismatch, not the key, is what usually breaks a free Claude Code setup. Either put a translating router in front of an OpenAI-compatible free tier, or use a gateway that already speaks Anthropic.',
      ],
      expectation: 'Agentic sessions burn a daily quota far faster than chat does, because every tool call is another long prompt. A 429 tells you that one request was limited and nothing about the quota left, unless the provider returns a reset header.',
    },
    continue: {
      summary: 'Continue reads a YAML assistant file and treats an OpenAI-compatible endpoint as a first-class provider, with the key resolved from its secret store.',
      requirements: [
        'Each entry under <code>models:</code> needs <code>provider: openai</code>, an <code>apiBase</code> that serves <code>/chat/completions</code>, and the provider’s exact <code>model</code> id.',
        '<code>apiKey</code> uses the <code>${{ secrets.NAME }}</code> form, so the file can be committed while the value stays outside it.',
        '<code>roles</code> decides where the model is offered. A small free model is usually fine for <code>chat</code> and unreliable for <code>apply</code>, and listing a role it cannot handle shows up as broken edits rather than an API error.',
        'A model id that begins with <code>@</code>, as Cloudflare’s do, has to be quoted, because YAML reserves that character.',
      ],
      expectation: 'Continue keeps a persistent context of open files, so the request size grows with the session rather than with what you typed. Token-per-day limits bind before request-per-day limits do.',
    },
    cursor: {
      summary: 'Cursor accepts a custom OpenAI base URL and key in its settings panel, which is the only supported way to point it at a free tier.',
      requirements: [
        'The values go into <strong>Cursor Settings &gt; Models</strong> by hand. This project writes a setup guide and never touches Cursor’s settings file or its credential storage.',
        'Overriding the OpenAI base URL affects the built-in models too, so it is a global switch rather than a per-request one.',
        'A custom key applies only to supported chat models. Features such as Tab completion keep using Cursor’s own models regardless.',
        'The model has to be added by its exact provider id and then verified, or Cursor will keep sending requests to a name the provider does not serve.',
      ],
      expectation: 'Because the override is global, a free tier that rate-limits you takes the whole editor with it. Keep the built-in configuration one click away.',
    },
    cline: {
      summary: 'Cline ships an OpenAI Compatible provider type that takes three values: base URL, API key, and model id.',
      requirements: [
        'The base URL is the root that serves <code>/chat/completions</code>. Most providers document it with the <code>/v1</code> suffix already included.',
        'The model id is the provider’s exact id and not a display name; Cline passes it through verbatim.',
        'The model has to handle tool calls well enough to emit valid diffs. This is the real filter: small free models often return malformed edits, which Cline surfaces as repeated failed apply attempts rather than as an API error.',
        'Values are entered in the Cline settings panel by hand. This project does not read or write VS Code extension storage.',
      ],
      expectation: 'Plan mode and Act mode send very different prompt sizes, so a provider that plans fine can still fail on a large diff. If edits keep failing while the API returns 200, the model is the constraint and not the quota.',
    },
  },
  zh: {
    codex: {
      summary: 'Codex CLI 通过 `~/.codex/config.toml` 里的一段自定义 model provider 配置，可以调用任何兼容 OpenAI 的端点。',
      requirements: [
        '<code>model_provider</code> 指向 <code>[model_providers.*]</code> 下的某一项，两处写法必须完全一致。',
        '<code>env_key</code> 指定持有 key 的环境变量名，因此 key 本身从不进入配置文件。',
        '<code>wire_api</code> 决定请求形态。生成的配置用的是 <code>"responses"</code>；如果服务商文档里只写了 <code>/chat/completions</code>，就改成 <code>"chat"</code>——写错会在第一次请求就以 404 或 schema 错误失败。',
        '文件必须是用户级的那一份。Codex 会忽略项目级 <code>.codex/config.toml</code> 中重定向服务商认证的键，<code>model_provider</code> 也在其中。',
      ],
      expectation: 'Codex 处理仓库时会发很长的上下文，所以一家「每天请求数」看着很宽松的服务商，仍可能先卡在每天的 token 上限。定下一家之前，两列都要看。',
    },
    'claude-code': {
      summary: 'Claude Code 讲的是 Anthropic Messages API，而本清单里几乎每一个免费额度讲的都是 OpenAI chat completions API。',
      requirements: [
        '<code>ANTHROPIC_BASE_URL</code> 必须指向一个接受 Anthropic 格式请求的端点。Claude Code 会自己拼接 API 路径，所以这个值是网关根地址，不带 <code>/v1</code> 后缀。',
        '<code>ANTHROPIC_AUTH_TOKEN</code> 持有 key，在启动时从环境变量读取。',
        '你写的模型名必须在那个端点上真实存在。写错的 model id 会由服务商返回 404，而不是由 Claude Code 报错。',
        '真正让免费 Claude Code 配置失败的通常是这层协议不匹配，而不是 key。要么在兼容 OpenAI 的免费端点前面加一个做协议转换的路由，要么直接用一个本身就讲 Anthropic 的网关。',
      ],
      expectation: 'Agent 会话消耗每日额度的速度远快于聊天，因为每一次工具调用都是又一段长 prompt。429 只告诉你那一次请求被限流，除非服务商返回了 reset 头，否则它不说明还剩多少额度。',
    },
    continue: {
      summary: 'Continue 读取一个 YAML 助手配置文件，把兼容 OpenAI 的端点当成一等公民，key 则从它自己的 secret 存储里解析。',
      requirements: [
        '<code>models:</code> 下的每一项都需要 <code>provider: openai</code>、一个提供 <code>/chat/completions</code> 的 <code>apiBase</code>，以及服务商那边确切的 <code>model</code> id。',
        '<code>apiKey</code> 用 <code>${{ secrets.NAME }}</code> 这种写法，这样文件可以提交进仓库，而值留在外面。',
        '<code>roles</code> 决定这个模型出现在哪些场景。小的免费模型通常做 <code>chat</code> 没问题、做 <code>apply</code> 不可靠；给它配一个扛不住的 role，表现是编辑结果乱掉，而不是 API 报错。',
        '以 <code>@</code> 开头的 model id（例如 Cloudflare 的）必须加引号，因为 YAML 保留了这个字符。',
      ],
      expectation: 'Continue 会持续携带已打开文件的上下文，所以请求体积是随会话增长的，而不是随你输入的字数增长。每日 token 上限会比每日请求上限先卡住你。',
    },
    cursor: {
      summary: 'Cursor 在设置面板里接受自定义的 OpenAI base URL 和 key，这也是把它指向免费额度的唯一受支持方式。',
      requirements: [
        '这些值要手工填进 <strong>Cursor Settings &gt; Models</strong>。本项目只生成一份对照指南，绝不碰 Cursor 的设置文件或它的凭据存储。',
        '覆盖 OpenAI base URL 会连内置模型一起改掉，所以这是一个全局开关，而不是按请求生效的开关。',
        '自定义 key 只对受支持的对话模型生效。Tab 补全之类的功能仍然走 Cursor 自己的模型。',
        '模型必须按服务商那边确切的 id 添加并通过验证，否则 Cursor 会一直把请求发往一个服务商并不提供的名字。',
      ],
      expectation: '因为覆盖是全局的，一旦免费额度把你限流，整个编辑器都会跟着受影响。把内置配置留在一键可切回的位置。',
    },
    cline: {
      summary: 'Cline 自带一种 OpenAI Compatible 服务商类型，只需要三个值：base URL、API key、model id。',
      requirements: [
        'base URL 是提供 <code>/chat/completions</code> 的那个根地址。多数服务商在文档里给出的写法已经包含 <code>/v1</code> 后缀。',
        'model id 要用服务商那边确切的 id，不是展示名；Cline 会原样透传。',
        '模型必须把工具调用做得足够好，能吐出合法的 diff。这才是真正的筛选条件：小的免费模型经常返回格式坏掉的编辑，Cline 表现为反复 apply 失败，而不是 API 报错。',
        '这些值要在 Cline 设置面板里手工输入。本项目不读也不写 VS Code 扩展的存储。',
      ],
      expectation: 'Plan 模式和 Act 模式发出的 prompt 体积差别很大，所以一家能顺利做规划的服务商，仍可能在一个大 diff 上失败。如果 API 一直返回 200 而编辑总是失败，瓶颈是模型而不是额度。',
    },
  },
});

export function clientNoteCopy(clientId, locale) {
  const copy = CLIENT_NOTE_COPY[locale.code]?.[clientId];
  if (!copy) throw new Error(`No ${locale.code} copy for client: ${clientId}`);
  return copy;
}

const TABLES = Object.freeze({ en, zh });

export const LOCALE_STRINGS = TABLES;

export const CLIENT_NOTE_LOCALE_COPY = CLIENT_NOTE_COPY;

// A key the current locale does not define is a bug in this file, not a reason
// to print the other language, so the lookup throws instead of falling back.
export function translator(locale = DEFAULT_LOCALE) {
  const table = TABLES[locale.code];
  if (!table) throw new Error(`No string table for locale: ${locale.code}`);

  return function t(key, params = {}) {
    const template = table[key];
    if (template === undefined) throw new Error(`Missing ${locale.code} string: ${key}`);
    return interpolate(template, params);
  };
}

// A string whose placeholders are filled in somewhere else — by a browser
// script holding a value this build step does not have. Interpolating it here
// would throw on the very placeholder that is supposed to survive.
export function rawString(key, locale = DEFAULT_LOCALE) {
  const table = TABLES[locale.code];
  if (!table) throw new Error(`No string table for locale: ${locale.code}`);
  const template = table[key];
  if (template === undefined) throw new Error(`Missing ${locale.code} string: ${key}`);
  return template;
}

/* ------------------------------------------------- data-driven translations */

// Provider and model copy lives in the data files, where a contributor can add
// a Chinese sentence beside the English one. Falling back is right here: an
// entry without Chinese should still appear, in the language it has.
export function localized(record, field, locale) {
  return (locale.code === 'en' ? null : record[`${field}_${locale.code}`]) ?? record[field];
}

// Kept for the Chinese README, which had these tables before the rest of the
// site was translated and whose tests import them by name.
export const CATEGORY_TITLES_ZH = Object.freeze(Object.fromEntries(
  Object.keys(en)
    .filter((key) => key.startsWith('category.'))
    .map((key) => [key.slice('category.'.length), zh[key]]),
));

export const AVAILABILITY_STATUS_ZH = Object.freeze(Object.fromEntries(
  Object.keys(en)
    .filter((key) => key.startsWith('availability.'))
    .map((key) => [key.slice('availability.'.length), zh[key]]),
));

export const CHANGE_LABELS_ZH = Object.freeze(Object.fromEntries(
  Object.keys(en)
    .filter((key) => key.startsWith('change.'))
    .map((key) => [key.slice('change.'.length), zh[key]]),
));
