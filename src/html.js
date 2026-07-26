export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// A JSON payload embedded in a data block only has to survive the HTML parser
// looking for the next `</script>`, and escaping `<` is enough for that.
export function embedJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

// Structured data carries text, not markup: a string that already went
// through escapeHtml has to come back out as the sentence a reader sees, or
// the JSON-LD ends up quoting `&#39;` at a search engine.
export function plainText(html) {
  return String(html)
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function link(href, text, extra = '') {
  return `<a href="${escapeHtml(href)}"${extra}>${escapeHtml(text)}</a>`;
}

export function externalLink(href, text) {
  return link(href, text, ' rel="noreferrer"');
}

export function joinInline(parts) {
  return parts.join('<span aria-hidden="true"> · </span>');
}
