# Backlog

## Extend `useHydratedPipeline` fix to Idea/Methods/Paper full pages

**Status:** Open
**Found:** 2026-07-19, while fixing the same bug on `AnalysisFullPage`

**Problem:** Any "full page" view that reads pipeline state directly from the Zustand store (`usePipelineStore(s => s.pipeline)`) can end up with nothing to show — not just on a raw browser refresh, but also mid-session when a dev-server hot-reload falls back to a full page reload (e.g. after editing a non-component module), which resets the in-memory store to its default/mock state. The symptom: the page goes blank, and navigating back to the conversation page and re-opening "full" view brings the content back (because `StagePage.tsx` already has fetch-on-mount recovery logic).

**Confirmed:** `IdeaFullPage.tsx`, `MethodsFullPage.tsx`, and `PaperFullPage.tsx` all read `pipeline` directly with no re-fetch logic — same gap `AnalysisFullPage.tsx` had before it was fixed. `PaperFullPage.tsx` has a `useEffect`, but it's an unrelated Escape-key handler for a dialog, not fetch-on-mount recovery.

**Fix already built and proven on `AnalysisFullPage.tsx`:** a shared hook, `src/hooks/useHydratedPipeline.ts`, extracted from `StagePage.tsx`'s original inline fix. It detects when the store's hydrated pipeline id doesn't match the URL's real project id and re-fetches via `api.getProject()` + `hydratePipeline()`.

**To do:** in each of `IdeaFullPage.tsx`, `MethodsFullPage.tsx`, `PaperFullPage.tsx` —
1. Replace `usePipelineStore(s => s.pipeline)` with `useHydratedPipeline(projectId)`.
2. Add the same two early-return guards `AnalysisFullPage.tsx`/`StagePage.tsx` use: `if (fetchFailed) return <Navigate to="/" replace />;` and `if (needsFetch) return <div className={styles.layout} />;` (adjust the placeholder div's class to match each page's own root layout class).

**Reference implementation:** `src/pages/AnalysisFullPage/AnalysisFullPage.tsx` (search for `useHydratedPipeline`) and `src/pages/StagePage/StagePage.tsx` (the original pattern, now also refactored to use the shared hook).

**Risk:** low — purely additive, same proven pattern already live on two pages, no shared state/behavior changes for the pages not yet touched.

## Move Literature Review from stage 6 to right after Idea (stage 3)

**Status:** Open — scoped, not started
**Found:** 2026-07-19, during a design discussion about why Literature Review sits so late in the pipeline

**Motivation:** Literature Review's only real dependency is the Idea (`idea.md`) and the data description — confirmed directly in the backend: `denario.py`'s `check_idea_semantic_scholar()` builds its `input_state` from `idea` and `data_description` only, and `get_method()`/`get_results()`'s own docstrings confirm Methods and Analysis in turn depend only on `data_description.md` + `idea.md`, never on literature review output. So there's no technical reason Literature Review has to wait until after Methods, Analysis, and Paper — it's ordered that way by convention (lit review traditionally accompanies paper-writing), not by any real data dependency. Running it right after Idea turns it into a novelty/stress-test gate — same spirit as Idea's own idea_maker/idea_hater adversarial loop, just checked against real external literature — before sinking time into the three most expensive downstream stages (Methods' multi-agent planning, Analysis' actual sandboxed code execution, Paper's LLM writing + citation search + LaTeX compile). Today, a researcher only discovers "this isn't novel" at stage 6, after all of that has already run.

**Non-goal (explicitly out of scope for this ticket):** no new automated behavior — e.g. this is *not* about automatically blocking/looping the pipeline back to Idea when the decision comes back "not novel". The Literature stage's own internal LLM loop already handles that decision (`novel` / `not novel` / `query`) by writing it into `literature.md`/`literature.json` for the researcher to read; nothing downstream currently reacts to it programmatically, and this ticket doesn't propose changing that — just moving *when* the researcher sees it.

**Concrete change — reorder, not rewrite:**

The new sequence: `input → idea → literature → methods → analysis → paper → referee → keywords`.

1. **Backend** — `api/runner.py:27`: reorder `STAGE_ORDER` from `["input", "idea", "methods", "analysis", "paper", "literature", "referee", "keywords"]` to `["input", "idea", "literature", "methods", "analysis", "paper", "referee", "keywords"]`. Confirmed this is the *only* backend change needed — `_unlock_next()` (`api/runner.py:647-652`) and every other `STAGE_ORDER` use in that file are already fully generic (index-based), no stage-specific special-casing to touch. `STAGE_FILES`/`VALID_STAGES` are unordered dict/set, unaffected.

2. **Frontend — three separate hardcoded copies of the same array, found via grep, all must change together:**
   - `src/config/stageConfig.ts:413-415` (canonical `STAGE_ORDER` export — `nextStage()` and most of the app derive from this one)
   - `src/pages/StagePage/RightPanel.tsx:24-26` (a duplicate, not imported from stageConfig.ts)
   - `src/pages/HomePage/HomePage.tsx:235` (`STAGE_ORDER_LIST`, another duplicate)

   All three currently read `['input', 'idea', 'methods', 'analysis', 'paper', 'literature', 'referee', 'keywords']` (or the equivalent single-quoted inline form) — reorder all three identically. Everything else that consumes `STAGE_ORDER` (`pipelineStore.ts`'s `buildPipeline`/hydrate/`activeStageId` logic, `mockPipeline.ts`, `HomePage.tsx`'s stage-entry dropdown) is index/position-based already, so the reorder alone gives literature its new unlock position — e.g. `buildPipeline()` (`pipelineStore.ts:44`) sets `status: idx === 0 ? 'idle' : 'locked'`, so Literature just becomes the second unlockable stage automatically.

3. **Two hardcoded "next stage" button labels need updating** (`src/pages/StagePage/ResultCards/ResultCards.tsx`) — every other card's primary button is either generic (`"Approve & Proceed →"`) or already correctly names its (unchanged) next stage:
   - `PaperResultCard` (line 581): `"Literature Review →"` → `"Referee Report →"` (Paper is now followed directly by Referee)
   - `LiteratureResultCard` (line 599): `"Referee Report →"` → `"Methods →"` (Literature is now followed by Methods)

4. **One stage-prompt copy update** — `stageConfig.ts`'s Literature `denarioOpener` (line 314-315) currently reads *"Ready to search Semantic Scholar and your uploaded references for overlapping prior work. **This runs in parallel with the Paper stage.**"* — the bolded claim becomes false once Literature moves before Paper entirely. Needs rewriting to the new framing, e.g. something like: *"Ready to check whether your idea is novel before you invest in Methods and Analysis — searching Semantic Scholar and your uploaded references for overlapping prior work."* Every other stage's `denarioOpener` text was checked and contains no sequence-order assumptions that would go stale.

5. **Documentation** — `Denario/CLAUDE.md`'s pipeline table (stages 1-8) needs renumbering: Literature moves from row 6 to row 3, Methods/Analysis/Paper shift from 3/4/5 to 4/5/6, Referee/Keywords stay 7/8.

**Verify:** after the reorder, confirm (a) a fresh project unlocks Literature immediately after approving Idea, before Methods is reachable; (b) Paper's card correctly offers "Referee Report →" and Literature's card correctly offers "Methods →"; (c) an *existing* in-progress project (one that already has Methods/Analysis/Paper completed under the old order) still hydrates sensibly — worth a manual check since `hydratePipeline()`'s `activeStageId` derivation (`pipelineStore.ts:278-283`) picks the first `idle`/`error` stage by `STAGE_ORDER` position, so a project frozen mid-pipeline under the old order should still resolve to a sane active stage under the new one, but hasn't been tested.

**Risk:** low-to-medium — mechanically straightforward (four array edits + two button labels + one copy string + one doc table), but touches gating logic that every stage's lock/unlock state depends on, so needs a real test pass across a few projects at different completion points, not just a fresh one.

## `InlineMarkdown` doesn't render bullet lists — `* item` shows as a literal asterisk

**Status:** Open
**Found:** 2026-07-19, reviewing the real Referee Report structured output — several point bodies contain embedded sub-bullets (e.g. `* **In Section II.B (Page 3):** ...`) that render with a literal leading `*` instead of an actual list marker.

**Problem:** `src/utils/MarkdownBlock.tsx`'s `InlineMarkdown` only handles two inline-only patterns — `**bold**` and `` `code` `` — by design (its own header comment: "Inline-only formatting... there's no freeform markdown block structure (lists, nesting, headings) left to parse here"). That assumption was true when it was built for Methods' schema-constrained fields (always a single sentence/clause), but it's now reused for real free-form LLM markdown in `LiteratureFullPage.tsx` and `RefereeFullPage.tsx`, where the backend parsers (`literature_parser.py`, `referee_parser.py`) intentionally keep multi-line body text (including `*`-prefixed sub-bullets) as one joined string rather than parsing it into a further nested structure. The result: real bullet points inside a paper's "Differences" text or a referee point's supporting evidence show up as `* **In Section II.B...**` verbatim instead of an actual bullet list.

**Confirmed affected:** `RefereeFullPage.tsx`'s point bodies (e.g. "Fatal Contradiction in PCA Results" has two `*`-prefixed sub-bullets citing page/section numbers) and potentially `LiteratureFullPage.tsx`'s paper similarities/differences text, anywhere a real backend markdown blob contains a bulleted sub-list rather than a single flat paragraph.

**Fix (not yet scoped in detail):** extend `InlineMarkdown` (or add a sibling component/small block-level renderer) to recognize lines starting with `* `/`- ` as list items and render an actual `<ul>/<li>`, while still falling back to plain paragraph text for content with no bullets. Needs to stay lightweight — not a full markdown engine, just one more block-level pattern alongside the existing inline-only bold/code handling — consistent with this app's established "no markdown library, just targeted patterns" approach (see `MarkdownBlock.tsx`'s own docstring reasoning).

**Risk:** low — additive to a small, already-isolated shared component (`InlineMarkdown`), no schema/parser changes needed since the raw `*`-prefixed text is already present in the joined body strings; purely a rendering fix.

## PASJ journal preset silently discards generated keywords — missing `keywords` handler

**Status:** Open
**Found:** 2026-07-19, researching which of Denario's 7 journal presets actually support keywords by real publishing convention (not just what the code currently implements)

**Problem:** `denario/paper_agents/latex_presets.py`'s `latex_pasj` preset (Publications of the Astronomical Society of Japan) never defines a `keywords` field, so it falls back to the default no-op lambda in `journal.py`'s `LatexPresets` (`keywords: Callable[[str], str] = lambda x: ""`) — meaning any keywords `keywords_node` generates during paper generation are silently discarded for PASJ, exactly like the APS case investigated earlier. The difference: for APS this is *correct* (PACS was deprecated ~2016 in favor of PhySH, a submission-time classification never embedded in the manuscript). For PASJ it's a real gap — confirmed via web research that PASJ genuinely requires 3–5 keywords per paper, now aligned with the same **Unified Astronomy Thesaurus (UAT)** that AAS adopted. PASJ's preset already uses the identical AASTeX-family macros as AAS (`aas_macros` usepackage, `aasjournal.bst` bibliography style, a `pasj01.cls`/AASTeX-derived article class — see `latex_presets.py:60-67`), which does support a real `\keywords{}` command — the preset just never wires it up, unlike `latex_aas` which does (`latex_presets.py:14-21`).

**Confirmed via research, of Denario's 7 presets only 2 currently define a working `keywords` handler:**
- ✅ AAS — `\keywords{...}` (correct, matches real convention)
- ✅ ICML — `\icmlkeywords{...}` (though real-world ICML papers don't actually typeset this anymore — keywords there live only as OpenReview submission metadata for reviewer matching, so this one's arguably *not* matching current convention either, just less clear-cut)
- ❌ PASJ — missing, **should** have one (this ticket)
- ❌ APS, JHEP, NeurIPS, NONE — missing, but correctly so (none of these embed keywords in the compiled manuscript by real convention; APS/JHEP use submission-time classification, NeurIPS/ICML use OpenReview metadata only)

**Fix:** add a `keywords=lambda x: f"\\keywords{{{x}}}"` line to `latex_pasj` in `latex_presets.py`, identical to `latex_aas`'s existing handler (both use the same AASTeX-family macro).

**Verify:** generate a Paper with `journal='PASJ'` and confirm the manuscript's compiled output actually includes a populated `\keywords{...}` line (currently it would be silently blank).

**Risk:** low — one-line addition to an existing preset object, no schema/parser changes, purely fixes a silent data-loss gap for one journal option.
