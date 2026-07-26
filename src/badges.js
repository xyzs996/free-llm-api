// Two of the README badges report facts that change every time the catalog is
// reviewed: how many providers it covers and when the sources were last read.
// Both are rendered from data/ into a shields.io endpoint file the site serves,
// so the badge follows a data change automatically and nobody has to remember
// to edit a number in two READMEs. The badge URL and the file it reads are
// built from the same constant here, which is the only way they cannot diverge.
import { REPO_URL, SITE_URL } from './site.js';

const CI_WORKFLOW = 'ci.yml';

export const BADGE_ENDPOINTS = Object.freeze({
  providers: 'docs/badges/providers.json',
  checked: 'docs/badges/checked.json',
});

// https://shields.io/badges/endpoint-badge — schemaVersion 1 is the contract.
function endpointFile(label, message, color) {
  return `${JSON.stringify({ schemaVersion: 1, label, message, color }, null, 2)}\n`;
}

export function renderBadgeEndpoints(providers) {
  const checkedAt = providers
    .map(({ source_checked_at: date }) => date)
    .sort()
    .at(-1);

  return {
    [BADGE_ENDPOINTS.providers]: endpointFile('providers', String(providers.length), 'blue'),
    [BADGE_ENDPOINTS.checked]: endpointFile('sources checked', checkedAt, 'brightgreen'),
  };
}

// The label travels in the badge URL rather than in the JSON, so both editions
// read one endpoint file and each still prints the words its readers use.
function endpointBadge(artifactPath, label) {
  const target = `${SITE_URL}${artifactPath.slice('docs/'.length)}`;
  return `https://img.shields.io/endpoint?url=${encodeURIComponent(target)}&label=${encodeURIComponent(label)}`;
}

/**
 * The badge row a README opens with, in the language that README is written in.
 *
 * @param {{ci: string, license: string, providers: string, checked: string}} labels
 * @param {{home: string, methodology: string}} links
 */
export function renderBadges(labels, links) {
  const workflow = `${REPO_URL}/actions/workflows/${CI_WORKFLOW}`;

  return [
    `[![${labels.ci}](${workflow}/badge.svg)](${workflow})`,
    `[![${labels.license}](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)`,
    `[![${labels.providers}](${endpointBadge(BADGE_ENDPOINTS.providers, labels.providers)})](${links.home})`,
    `[![${labels.checked}](${endpointBadge(BADGE_ENDPOINTS.checked, labels.checked)})](${links.methodology})`,
  ].join('\n');
}

// star-history.com renders the chart from the public star count. It is a
// picture of what already happened, not an offer: nothing here is unlocked by
// starring, and the README says so next to the button.
export function starHistory() {
  const repo = REPO_URL.replace('https://github.com/', '');
  return {
    image: `https://api.star-history.com/svg?repos=${repo}&type=Date`,
    link: `https://star-history.com/#${repo}&Date`,
  };
}
