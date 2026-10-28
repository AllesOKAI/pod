---
"pod": patch
---

Fixed the podcast RSS feed dropping show notes that live in lists. The `content:encoded` whitelist only emitted `<p>` blocks, so `<ul>`/`<ol>` content between paragraphs was silently cut. Flat lists now survive in original document order, with inline links intact. Nested lists (indented items) come out flattened-but-present, and a `<ul>` directly followed by an `<ol>` emits in ul-then-ol order.
