// Both READMEs have linked "the issue templates" at /issues/new/choose since
// the Contributing section was written. There were none. GitHub does not 404
// that URL — it quietly drops a signed-in reader into the blank issue box — so
// the promise read as kept from the outside and from every test in this suite.
// The one repository in this account that has readers was therefore asking for
// corrections through an empty text area.
//
// These tests assert the promise against the directory, not against the prose.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

import { THREAD_URL } from '../src/site.js';

const templateDir = new URL('../.github/ISSUE_TEMPLATE/', import.meta.url);
const readmeEn = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const readmeZh = await readFile(new URL('../README_zh.md', import.meta.url), 'utf8');

async function forms() {
  const names = (await readdir(templateDir)).filter(
    (name) => name.endsWith('.yml') && name !== 'config.yml',
  );
  return Promise.all(
    names.map(async (name) => [name, await readFile(new URL(name, templateDir), 'utf8')]),
  );
}

test('the chooser both READMEs link to has forms behind it', async () => {
  const chooser = '/issues/new/choose';
  for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
    assert.ok(readme.includes(chooser), `${name} no longer links the chooser`);
  }
  // Two, because the plural in "the issue templates" is part of the promise,
  // and because one form would make the chooser page skip itself entirely.
  const list = await forms();
  assert.ok(list.length >= 2, `only ${list.length} form(s) in .github/ISSUE_TEMPLATE/`);
});

test('every form carries the two fields GitHub renders the chooser from', async () => {
  for (const [name, body] of await forms()) {
    // A form missing either one is silently dropped from the chooser, which
    // puts us back at the blank box with the tests still green.
    assert.match(body, /^name: \S/m, `${name} has no name:`);
    assert.match(body, /^description: \S/m, `${name} has no description:`);
  }
});

test('no form invites a credential into a public issue', async () => {
  for (const [name, body] of await forms()) {
    assert.match(
      body,
      /Do not paste an API key/,
      `${name} does not tell the reporter to keep keys out`,
    );
  }
});

// A bare 2026-08-21 is a YAML date, not a string, and GitHub rejects the whole
// form for it — which drops that form from the chooser and leaves the reader
// back in the blank box with nothing on this side looking wrong. The date
// placeholder in correction.yml shipped unquoted and did exactly that.
const COERCED = /^(\d{4}-\d{1,2}-\d{1,2}|-?\d[\d_]*(\.\d+)?([eE][-+]?\d+)?|0x[0-9a-fA-F]+|true|false|yes|no|on|off|null|~)$/i;

test('no string field is written so YAML turns it into a date, number, or boolean', async () => {
  const files = await forms();
  files.push(['config.yml', await readFile(new URL('config.yml', templateDir), 'utf8')]);
  for (const [name, body] of files) {
    for (const [i, line] of body.split('\n').entries()) {
      const m = /^\s*(label|description|placeholder|title|about|name|value):[ \t]+(\S.*?)\s*$/.exec(line);
      if (!m) continue;
      const value = m[2];
      if (/^["'|>]/.test(value)) continue; // quoted or a block scalar
      assert.ok(
        !COERCED.test(value),
        `${name}:${i + 1} — ${m[1]}: ${value} is not a string to YAML; quote it`,
      );
    }
  }
});

// The forms above are the strict path: a correction needs the provider's own
// page and the date you read it, or it cannot be applied. That leaves everyone
// who only *noticed* something with nothing to file, and this repository has
// the readers. The open thread is the path with no such bar — and a thread
// nothing links to is not a path at all, which is why this is asserted against
// the generated READMEs rather than trusted to the fact that it exists.
test('both READMEs point at the report path that needs no source', () => {
  for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
    assert.ok(
      readme.includes(THREAD_URL),
      `${name} does not link ${THREAD_URL}; the only report path it offers demands a source`,
    );
    // Next to the form, not in some other section — the reader who just bounced
    // off the form's requirements is the one this line is for.
    const contributing = readme.slice(readme.indexOf('/issues/new/choose'));
    const nextHeading = contributing.indexOf('\n## ');
    assert.ok(
      (nextHeading === -1 ? contributing : contributing.slice(0, nextHeading)).includes(THREAD_URL),
      `${name} links the thread somewhere other than beside the issue templates`,
    );
  }
});

test('the chooser itself offers the path that asks for nothing', async () => {
  // A reader who opens the chooser has already decided to report something.
  // If every option there demands a source, that decision is spent on nothing.
  const config = await readFile(new URL('config.yml', templateDir), 'utf8');
  assert.ok(config.includes(THREAD_URL), `config.yml does not list ${THREAD_URL}`);
});

test('the catalog page offers it too, beside the ask that needs a source', async () => {
  // The site, not the repository, is where the search and answer-engine traffic
  // lands, and its one contribution ask was the strict one.
  for (const path of ['../docs/index.html', '../docs/zh/index.html']) {
    const html = await readFile(new URL(path, import.meta.url), 'utf8');
    const band = html.slice(html.indexOf('method-band'));
    const end = band.indexOf('</section>');
    assert.ok(
      (end === -1 ? band : band.slice(0, end)).includes(THREAD_URL),
      `${path} does not offer the thread where it asks for corrections`,
    );
  }
});

test('the correction form asks for the source and the date it was read', async () => {
  // Without these two, a report cannot be applied: CONTRIBUTING requires the
  // provider's own page and a source_checked_at that is the reporter's own
  // reading date. A form that collects neither generates work instead of fixes.
  const body = await readFile(new URL('correction.yml', templateDir), 'utf8');
  assert.match(body, /id: source\b/);
  assert.match(body, /id: read-on\b/);
  for (const id of ['source', 'read-on', 'provider', 'what-changed']) {
    const field = body.slice(body.indexOf(`id: ${id}`));
    const nextField = field.indexOf('\n  - type:');
    assert.match(
      nextField === -1 ? field : field.slice(0, nextField),
      /required: true/,
      `${id} is optional`,
    );
  }
});
