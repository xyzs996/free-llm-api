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
