// Show-notes episodes for the podcast feed checks. theme-qa.config.mjs seeds
// one episode per case, and qa/rss.spec.mjs reads each one back from
// /podcast/rss/. Seeding goes through Ghost's Admin API, so the feed gets the
// HTML Ghost really renders for each card (Lexical lists without whitespace,
// markdown lists with a newline after every tag) instead of HTML typed by hand.
//
// Every case has to pass the checks in qa/rss.spec.mjs: allowed tags only,
// well-formed, no text twice. On top of that, `expected` is the exact
// content:encoded (whitespace between tags removed), and `keeps` lists text
// that has to survive where the exact markup is up to the template.

/**
 * @typedef {{ slug: string, title: string, build: (cards: any) => object[],
 *   expected?: string, keeps?: string[] }} ShowNotesCase
 * @type {ShowNotesCase[]}
 */
export const SHOW_NOTES_CASES = [
  {
    slug: 'notes-paragraphs',
    title: 'Show notes with formatting and links',
    build: (c) => [
      c.paragraph([
        'Hosted by ',
        c.text('Ada', { bold: true }),
        ' and ',
        c.text('Grace', { italic: true }),
        '.',
      ]),
      c.paragraph(['Read ', c.link('the transcript', 'https://example.com/transcript'), '.']),
    ],
    expected:
      '<p>Hosted by <strong>Ada</strong> and <em>Grace</em>.</p>' +
      '<p>Read <a href="https://example.com/transcript">the transcript</a>.</p>',
  },
  {
    slug: 'notes-bullet-list',
    title: 'Show notes with a bullet list',
    build: (c) => [
      c.paragraph('In this episode:'),
      c.list(['Ghost as a podcast host', 'Apple Podcasts and Spotify']),
      c.paragraph('Thanks for listening.'),
    ],
    expected:
      '<p>In this episode:</p>' +
      '<ul><li>Ghost as a podcast host</li><li>Apple Podcasts and Spotify</li></ul>' +
      '<p>Thanks for listening.</p>',
  },
  {
    slug: 'notes-numbered-list',
    title: 'Show notes with a numbered list',
    build: (c) => [
      c.paragraph('Chapters:'),
      c.list(['Intro', 'Interview', 'Listener mail'], { ordered: true }),
    ],
    expected: '<p>Chapters:</p><ol><li>Intro</li><li>Interview</li><li>Listener mail</li></ol>',
  },
  {
    slug: 'notes-list-first',
    title: 'Show notes that start with a list',
    build: (c) => [c.list(['First topic', 'Second topic']), c.paragraph('More next week.')],
    expected: '<ul><li>First topic</li><li>Second topic</li></ul><p>More next week.</p>',
  },
  {
    // Both lists have to make it into the feed; their order isn't checked.
    slug: 'notes-numbered-then-bullets',
    title: 'Show notes with a numbered list right before a bullet list',
    build: (c) => [
      c.list(['Step one', 'Step two'], { ordered: true }),
      c.list(['A link', 'Another link']),
    ],
    keeps: ['Step one', 'Step two', 'A link', 'Another link'],
  },
  {
    slug: 'notes-markdown-lists',
    title: 'Show notes with lists in a markdown card',
    build: (c) => [
      c.markdown(
        [
          'Topics:',
          '',
          '- Tight item one',
          '- Tight item two',
          '',
          'Steps:',
          '',
          '1. Numbered one',
          '2. Numbered two',
        ].join('\n'),
      ),
    ],
    expected:
      '<p>Topics:</p><ul><li>Tight item one</li><li>Tight item two</li></ul>' +
      '<p>Steps:</p><ol><li>Numbered one</li><li>Numbered two</li></ol>',
  },
  {
    // A blank line between items makes markdown wrap each one in <p>.
    slug: 'notes-markdown-loose-list',
    title: 'Show notes with a spaced-out markdown list',
    build: (c) => [c.markdown(['Spaced out:', '', '- Loose one', '', '- Loose two'].join('\n'))],
    keeps: ['Spaced out:', 'Loose one', 'Loose two'],
  },
  {
    // Apple and Spotify render nested lists badly, so the feed may flatten or
    // drop levels; it only has to stay well-formed. The editor keeps a nested
    // list in a list item of its own, after the item it belongs to.
    slug: 'notes-nested-list',
    title: 'Show notes with a nested list',
    build: (c) => {
      const outline = c.list(['Part one', '', 'Part two']);
      outline.children[1].children = [c.list(['Detail A', 'Detail B'], { ordered: true }, 1)];
      return [c.paragraph('Outline:'), outline, c.paragraph('After the outline.')];
    },
    keeps: ['Outline:', 'After the outline.'],
  },
  {
    slug: 'notes-html-card',
    title: 'Show notes next to an HTML card',
    build: (c) => [
      c.paragraph('Before the HTML card.'),
      c.html(
        '<link rel="stylesheet" href="https://example.com/embed.css">' +
          '<style>.links { color: red; }</style>' +
          '<ul class="links"><li><a href="https://example.com/one">One</a></li></ul>' +
          '<p class="note" dir="ltr">A paragraph with attributes.</p>' +
          '<script>document.title = "injected";</script>',
      ),
      c.paragraph('After the HTML card.'),
    ],
    keeps: ['Before the HTML card.', 'After the HTML card.'],
  },
  {
    slug: 'notes-other-cards',
    title: 'Show notes next to other editor cards',
    build: (c) => [
      c.paragraph('Cards below.'),
      c.callout({ text: 'A callout card.' }),
      c.toggle({ heading: 'A toggle', content: 'Hidden toggle text.' }),
      c.bookmark({ url: 'https://example.com/', title: 'Example bookmark' }),
      // Twitter's embed markup, minus the widget script, so nothing loads from
      // a third party.
      c.embed({
        url: 'https://twitter.com/example/status/1',
        html:
          '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">An embedded post.</p>' +
          '&mdash; Example (@example)</blockquote>',
      }),
      c.codeblock('const notes = "<ul><li>not a list</li></ul>";'),
      c.paragraph('Cards above.'),
    ],
    keeps: ['Cards below.', 'Cards above.'],
  },
];
