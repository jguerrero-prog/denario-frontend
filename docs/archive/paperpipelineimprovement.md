# Paper Pipeline Improvements

## `extractTitle()` doesn't match LaTeX title syntax — Paper stage title always comes back empty

**Status:** Open
**Found:** 2026-07-19, during the first real end-to-end test of the Paper stage after removing the legacy fake-PDF UI

**Problem:** `src/utils/parsers.ts`'s `extractTitle(md)` only matches a markdown-style heading: `/^#\s+(.+)$/m`. The real backend output for Paper is LaTeX (`manuscript.tex`), which declares its title via `\title{...}`, not a `#` heading. Confirmed on a real completed run: `state.json`'s stored `title` for the `paper` stage is `None` even though the real `.tex` file has a proper `\title{Limits of Socio-Ecological Decoupling: ...}`.

**Impact:** Low today — the Paper card/full page fall back gracefully (no crash, just a missing/blank title where one should show). Worth fixing so the card and full-page header actually show the real manuscript title instead of nothing.

**Fix:** in `parsePaper()` (`src/utils/parsers.ts`), extract the LaTeX `\title{...}` command directly instead of relying on the markdown-oriented `extractTitle()` helper used by every other stage. Something like:

```ts
const texTitleMatch = content.match(/\\title\{([^}]*)\}/);
const rawTitle = texTitleMatch
  ? texTitleMatch[1].replace(/\\[a-z]+\{([^}]*)\}/gi, '$1').trim() // strip nested LaTeX commands (\textsubscript{}, etc.)
  : extractTitle(content.replace(/\\[a-z]+\{([^}]*)\}/gi, '$1'));  // existing fallback, in case a future track ever emits markdown instead
```

**Verify:** re-open a completed Paper stage project and confirm the card/full-page title shows the real manuscript title (matching what's inside `\title{...}` in the `.tex` file), not blank/undefined.

**Reference:** real example confirmed on project `90fa5f38-37fb-4cea-87ba-0f3bfbe7092f` — `manuscript.tex`'s real title is "Limits of Socio-Ecological Decoupling: Climate Dominance Over Wildfire Behavior Persists Across the Wildland-Urban Interface".
