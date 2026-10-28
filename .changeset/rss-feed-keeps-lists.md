---
"pod": patch
---

Fixed the podcast RSS feed dropping show notes. The `content:encoded` whitelist only emitted `<p>` blocks and relied on `{{#unless @first}}` after a `split` — which Ghost 6.7 (empty-result filter in the split helper) turned into a first-paragraph drop, and which cut `<ul>`/`<ol>` list content entirely. Passes now select chunks by closer-matching, emit flat lists in document order (including a document that opens with a list), rebuild nested-list items as closed `<li>`s, and rewrite `]]>` to `]]&gt;` at every emission point so a literal terminator can't invalidate the feed's CDATA sections.
