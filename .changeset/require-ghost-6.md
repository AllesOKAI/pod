---
"pod": patch
---

Pod now declares Ghost 6 as its minimum version. Ghost 5 has never accepted the theme upload (it rejects several templates as invalid Handlebars), so `engines.ghost` said `>=5.93.0` without it being true.
