// Pod-specific checks, run by @magicpages/theme-qa next to the shared ones.
// The podcast feed is what Apple Podcasts and Spotify read, so a broken feed
// breaks every subscriber at once, not just one page.

import { test, expect } from '@magicpages/theme-qa/test';
import { SHOW_NOTES_CASES } from './show-notes.mjs';

// The three regular episodes theme-qa.config.mjs seeds before the show-notes
// cases.
const EPISODES = 3;

// Apple Podcasts allows <p>, <ol>, <ul>, <li> and <a> in show notes; PSP-1
// adds <b>, <i>, <strong> and <em>. Only links keep an attribute.
const ALLOWED_TAGS = new Set(['p', 'ol', 'ul', 'li', 'a', 'b', 'i', 'strong', 'em']);
const ALLOWED_ATTRIBUTES = { a: new Set(['href']) };
const BLOCKS = new Set(['p', 'ol', 'ul']);
const LISTS = new Set(['ol', 'ul']);

/**
 * Fetches the feed and parses it in the browser, which fails on anything a
 * podcast app's XML parser would choke on.
 * @returns {Promise<{ xml: string, items: { link: string, notes: string | null }[] }>}
 */
async function readFeed({ page, request, manifest }) {
  const response = await request.get(`${manifest.url}/podcast/rss/`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/xml');
  const xml = await response.text();

  const feed = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    const error = doc.querySelector('parsererror');
    if (error) return { error: error.textContent };
    const items = [...doc.getElementsByTagName('item')].map((item) => ({
      link: item.getElementsByTagName('link')[0]?.textContent ?? '',
      notes:
        item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]
          ?.textContent ?? null,
    }));
    return { items };
  }, xml);
  expect(feed.error, 'the feed is well-formed XML').toBeUndefined();
  return { xml, items: feed.items };
}

/**
 * Everything wrong with one episode's show notes: tags or attributes podcast
 * apps don't support, tags that don't nest or close properly, text outside a
 * paragraph or list item, and a paragraph or list item that appears twice.
 * @param {string} html
 */
function showNotesProblems(html) {
  const problems = [];
  /** @type {{ name: string, text: string }[]} */
  const open = [];
  const seen = new Set();
  const token = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>|([^<]+)|(<)/gi;

  for (const [, closing, rawName, attributes, text, stray] of html.matchAll(token)) {
    const parent = open.at(-1)?.name;
    if (stray) {
      problems.push(`stray "<" inside ${parent ? `<${parent}>` : 'nothing'}`);
    } else if (text !== undefined) {
      if (!text.trim()) continue;
      // Text belongs to the paragraph or list item around it, links and bold included.
      const block = open.findLast(({ name }) => name === 'p' || name === 'li');
      if (!block || LISTS.has(parent)) {
        problems.push(`"${text.trim()}" is outside a paragraph or list item`);
      } else {
        block.text += text;
      }
    } else if (closing) {
      const name = rawName.toLowerCase();
      if (parent !== name) {
        problems.push(`</${name}> closes ${parent ? `<${parent}>` : 'nothing'}`);
        break;
      }
      const words = open.pop().text.trim();
      if (words && seen.has(words)) problems.push(`"${words}" appears twice`);
      if (words) seen.add(words);
    } else {
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) problems.push(`<${name}> isn't allowed`);
      for (const [, attribute] of attributes.matchAll(
        /([^\s=/]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g,
      )) {
        if (!ALLOWED_ATTRIBUTES[name]?.has(attribute.toLowerCase())) {
          problems.push(`<${name} ${attribute}> isn't allowed`);
        }
      }
      if (name === 'li' && !LISTS.has(parent)) {
        problems.push(`<li> inside ${parent ? `<${parent}>` : 'nothing'}`);
      } else if (BLOCKS.has(name) && parent && parent !== 'li') {
        problems.push(`<${name}> inside <${parent}>`);
      } else if (!BLOCKS.has(name) && name !== 'li' && (!parent || LISTS.has(parent))) {
        problems.push(`<${name}> outside a paragraph or list item`);
      }
      open.push({ name, text: '' });
    }
  }
  if (open.length) problems.push(`unclosed ${open.map(({ name }) => `<${name}>`).join('')}`);
  return problems;
}

/** Whitespace between tags doesn't render; Ghost appends ?ref=<site> to outbound links. */
function normalize(html) {
  return html
    .replace(/>\s+</g, '><')
    .replace(/[?&]ref=[^"&]*(?=")/g, '')
    .trim();
}

const textOf = (html) => html.replace(/<[^>]*>/g, '');

test('the podcast feed lists every episode with a playable enclosure', async ({
  page,
  request,
  manifest,
}) => {
  const { xml } = await readFeed({ page, request, manifest });
  const items = xml.split('<item>').slice(1);
  expect(items).toHaveLength(EPISODES + SHOW_NOTES_CASES.length);

  for (const item of items) {
    expect(item).toMatch(/<enclosure length="40125" url="http[^"]+\.mp3" type="audio\/mpeg"\s*\/>/);
    expect(item).toContain('<itunes:duration>00:00:05</itunes:duration>');
  }
  // Each episode's pod:episode marker, not one marker repeated for every item.
  const numbers = items.map((item) => Number(item.match(/<itunes:episode>(\d+)</)?.[1]));
  expect(numbers.sort((a, b) => a - b)).toEqual(items.map((_, index) => index + 1));
  expect(xml).toContain('<itunes:author>Theme QA</itunes:author>');
});

test('show notes in the feed only use markup podcast apps support', async ({
  page,
  request,
  manifest,
}) => {
  const { items } = await readFeed({ page, request, manifest });
  for (const { link, notes } of items) {
    expect(notes, `content:encoded of ${link}`).not.toBeNull();
    expect(showNotesProblems(notes), `show notes of ${link}`).toEqual([]);
  }
});

for (const notes of SHOW_NOTES_CASES) {
  test(`show notes in the feed: ${notes.title}`, async ({ page, request, manifest }) => {
    const { items } = await readFeed({ page, request, manifest });
    const item = items.find(({ link }) => new URL(link).pathname === `/${notes.slug}/`);
    expect(item, `feed item for /${notes.slug}/`).toBeDefined();

    if (notes.expected) expect(normalize(item.notes)).toBe(notes.expected);
    for (const text of notes.keeps ?? []) expect(textOf(item.notes)).toContain(text);
  });
}

test('chapters from pod:chapter markers show on the episode page', async ({ page, manifest }) => {
  await page.goto(`${manifest.url}/episode-2/`);
  await expect(page.getByText('Why RSS still matters')).toBeVisible();
});
