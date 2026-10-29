// Test setup for @magicpages/theme-qa: https://github.com/magicpages/theme-qa
//
// On top of the shared base content, Pod needs podcast episodes: posts with an
// audio card, the internal #podcast tag (which the RSS feed and the episode
// layout look for) and pod:* markers in code injection.

import { SHOW_NOTES_CASES } from './qa/show-notes.mjs';

const SHOW_NOTES =
  'In this episode we talk about publishing a podcast from your own website, ' +
  'without a separate podcast host.';

function markers({ audio, episode, duration, chapters = [] }) {
  return [
    `<!-- pod:audio=${audio} -->`,
    '<!-- pod:audioLength=40125 -->',
    `<!-- pod:duration=${duration} -->`,
    `<!-- pod:episode=${episode} -->`,
    '<!-- pod:season=1 -->',
    '<!-- pod:explicit=false -->',
    '<!-- pod:episodeType=full -->',
    ...chapters.map(([time, title]) => `<!-- pod:chapter=${time}|${title} -->`),
    '<!-- pod:person=Ada Example|host|https://example.com/ada -->',
  ].join('\n');
}

export default {
  routes: 'routes.yaml',

  async seed({ post, custom, cards, media, url }) {
    await custom({
      itunes_author: 'Theme QA',
      itunes_owner_name: 'Theme QA',
      itunes_owner_email: 'podcast@example.com',
      podcast_guid: 'c2f1a7e0-6a0b-5d7e-9c3b-2f4f6e8a1b2c',
      subscribe_apple_url: 'https://podcasts.apple.com/podcast/id0000000000',
      subscribe_spotify_url: 'https://open.spotify.com/show/0000000000000000000000',
    });

    const episodes = [
      { title: 'Welcome to the show', duration: '00:00:05', chapters: [] },
      {
        title: 'Owning your feed',
        duration: '00:00:05',
        chapters: [
          ['00:00:00', 'Intro'],
          ['00:00:02', 'Why RSS still matters'],
        ],
      },
      { title: 'Listener questions', duration: '00:00:05', chapters: [] },
    ];

    for (const [index, episode] of episodes.entries()) {
      const number = index + 1;
      await post({
        title: episode.title,
        slug: `episode-${number}`,
        tags: ['Episodes', '#podcast'],
        featureImage: { src: media.images.square.src, alt: 'Episode cover' },
        excerpt: SHOW_NOTES,
        cards: [
          cards.audio({ ...media.audio, title: episode.title }),
          cards.paragraph(SHOW_NOTES),
          cards.heading('Show notes'),
          cards.list(['Ghost as a podcast host', 'Apple Podcasts and Spotify', 'Chapters']),
        ],
        fields: {
          codeinjection_foot: markers({
            audio: media.audio.src,
            episode: number,
            duration: episode.duration,
            chapters: episode.chapters,
          }),
        },
      });
      url(`/episode-${number}/`, { id: `episode-${number}`, screenshot: number === 2 });
    }

    // One episode per show-notes case for qa/rss.spec.mjs. Dated before the
    // shared base content so they stay off the first pages of the site, and
    // tagged #podcast only, so they appear in the feed but not on a tag page.
    for (const [index, notes] of SHOW_NOTES_CASES.entries()) {
      await post({
        title: notes.title,
        slug: notes.slug,
        tags: ['#podcast'],
        publishedAt: Date.UTC(2024, 0, index + 1, 9, 0, 0),
        cards: [cards.audio({ ...media.audio, title: notes.title }), ...notes.build(cards)],
        fields: {
          codeinjection_foot: markers({
            audio: media.audio.src,
            episode: episodes.length + index + 1,
            duration: '00:00:05',
          }),
        },
      });
    }
  },

  profiles: {
    default: {},
    dark: { custom: { color_scheme_default: 'Dark' }, colorScheme: 'dark' },
    'no-cta': { custom: { show_post_cta: false } },
  },

  urls: [
    '/subscribe/',
    // An XML feed: checked for status and console errors; the feed's content
    // is tested in qa/rss.spec.mjs.
    { path: '/podcast/rss/', screenshot: false },
  ],
};
