---
"pod": patch
---

Pod now declares Ghost 6.5.3 as its minimum version. The podcast feed, footer and subscribe links use Ghost's `{{split}}` helper, and Ghost only accepts themes that use it from 6.5.3 on. Older versions reject the theme upload, so `engines.ghost` said `>=5.93.0` without it being true.
