---
"pod": patch
---

Fixed the podcast RSS feed dropping show notes. The `content:encoded` whitelist only emitted `<p>` blocks and relied on `{{#unless @first}}` after a `split` — which Ghost 6.7 (empty-result filter in the split helper) turned into a first-paragraph drop, and which cut `<ul>`/`<ol>` list content entirely. Passes now select chunks by closer-matching and emit matched `<ul>…</ul>` / `<ol>…</ol>` pairs in document order, including a document that opens with a list. Every emission point rewrites `]]>` to `]]&gt;` so a literal terminator can't invalidate the feed's CDATA sections. Nested-list content outside the innermost matched pair is dropped (apps render nested lists badly anyway); markdown cards with blank lines between items keep coming out as clean paragraphs.
