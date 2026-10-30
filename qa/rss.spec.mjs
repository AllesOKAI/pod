// Pod-specific checks, run by @magicpages/theme-qa next to the shared ones.
// The podcast feed is what Apple Podcasts and Spotify read, so a broken feed
// breaks every subscriber at once, not just one page.

import { test, expect } from '@magicpages/theme-qa/test';

test('the podcast feed lists every episode with a playable enclosure', async ({
  request,
  manifest,
}) => {
  const response = await request.get(`${manifest.url}/podcast/rss/`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/xml');

  const xml = await response.text();
  const items = xml.split('<item>').slice(1);
  expect(items).toHaveLength(3);

  for (const item of items) {
    expect(item).toMatch(/<enclosure length="40125" url="http[^"]+\.mp3" type="audio\/mpeg"\s*\/>/);
    expect(item).toContain('<itunes:duration>00:00:05</itunes:duration>');
    expect(item).toMatch(/<itunes:episode>[123]<\/itunes:episode>/);
  }
  expect(xml).toContain('<itunes:author>Theme QA</itunes:author>');
});

test('chapters from pod:chapter markers show on the episode page', async ({ page, manifest }) => {
  await page.goto(`${manifest.url}/episode-2/`);
  await expect(page.getByText('Why RSS still matters')).toBeVisible();
});
