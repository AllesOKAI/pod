---
"pod": patch
---

Fixed the podcast RSS feed emitting localized dates on non-English sites. Ghost's `date` helper defaults to the site locale, so German sites rendered `<pubDate>` as "Mo., 26 Okt. 2026 …" instead of the RFC 822 form "Mon, 26 Oct 2026 …", which breaks feed validation and podcatcher parsing. `lastBuildDate` and `pubDate` now pin `locale="en"` so the feed always emits RFC 822-compliant dates regardless of the site's language.
