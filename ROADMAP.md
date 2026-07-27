# Denario Roadmap

One consolidated, prioritized view of everything scoped across the planning docs. Supersedes the seven docs now in `docs/archive/` (kept for their detailed investigation history and reference; this file is the working source of truth).

---

## Legend

**Story points** (rough effort, Fibonacci):

| SP | Meaning |
|----|---------|
| 1 | Trivial — under half a day |
| 2 | Small — about a day |
| 3 | Moderate — 2–4 days |
| 5 | Substantial — about a week |
| 8 | Large — multi-week, usually full-stack |
| 13 | Too big — must be split before starting |

**Status:** `Shipped` · `Ready` (buildable now) · `Blocked` (waiting on a dependency) · `Paused` (waiting on a product decision) · `Not planned` (deliberately won't build) · `Not possible` (can't build without breaking a constraint).

**Ticket fields:** every ticket carries Status, Description, Dependencies, User impact, Story points, Blockers, Files likely touched, Claude suggestion, Hard pivot, Needs design.

- **Hard pivot** — a structural decision worth discussing *before* building, because it changes something deep. `—` means none.
- **Needs design** — whether it needs a UI design pass before/alongside the build.
- **Files likely touched** — best current estimate; frontend paths are relative to `Denario/`, backend to `DenarioBackend/`.

---

## Recommended build sequence

Ordered by impact, effort, and what unblocks what — not strict, but the sensible path.

### Phase 0 — Quick wins & honesty fixes
*Tiny effort, no blockers, no design. Fixes things that are currently blank, broken, or fabricated — highest trust-per-hour.*

| Ticket | SP |
|--------|----|
| 1.1 Show the real manuscript title | 1 |
| 1.2 Stop PASJ dropping keywords | 1 |
| 1.3 Render bullet lists in Referee/Literature bodies | 2 |
| 1.4 Replace fabricated plot captions | 2 |
| 1.6 Honor the `model_overrides` field | 2 |

### Phase 1 — Foundations
*Unblock the bigger features downstream. 4.1 needs its hard-pivot decision made first.*

| Ticket | SP | Unblocks |
|--------|----|----------|
| 2.1 Harden & generalize the reasoning-log renderer | 3 | 2.2 |
| 4.1 Preserve scripts/data + plot→script map | 5 | 4.2, 4.3, 4.4 |

### Phase 2 — Ready features
*High-value build-out that's unblocked once Phase 0–1 land.*

| Ticket | SP |
|--------|----|
| 2.2 Idea adversarial log (Rigorous track) | 3 |
| 4.2 → 4.3 Interactive plots (backend render → popup) | 8 / 8 |
| 4.4 Browsable data tables | 3 |

### Phase 3 — Structural / decision-gated
*Each needs a decision or an unpause before it starts.*

| Ticket | SP | Gate |
|--------|----|------|
| 5.3 Move Literature Review earlier | 3 | Hard pivot (pipeline gating) |
| Epic 6 (whole) Research Assistant | ~37 | Paused on problem statement |
| 3.4 Chat-driven LaTeX edits | 5 | Needs 6.3 to exist first |

---

## Epic 1 — Correctness & Trust Fixes
*Fix what's broken, blank, or fabricated before building on top of it.*

### 1.1 Show the real manuscript title
- **Status:** Ready · **SP:** 1 · **Needs design:** No · **Hard pivot:** —
- **Description:** The Paper stage's title always renders blank. `extractTitle()` only matches a markdown `#` heading, but the real backend output is LaTeX, which declares its title via `\title{}`.
- **Dependencies:** none
- **User impact:** The manuscript card and full-page header show the real paper title instead of nothing.
- **Blockers:** none
- **Files likely touched:** `src/utils/parsers.ts` (`parsePaper`)
- **Claude suggestion:** Match `\title{...}` directly and strip nested LaTeX commands; keep the markdown fallback for safety.

### 1.2 Stop PASJ from silently dropping keywords
- **Status:** Ready · **SP:** 1 · **Needs design:** No · **Hard pivot:** —
- **Description:** The PASJ journal preset never wires up a `keywords` handler, so generated keywords are silently discarded — even though PASJ genuinely requires keywords and uses the same AASTeX macros as AAS (which does wire it up).
- **Dependencies:** none
- **User impact:** PASJ manuscripts include their keywords instead of dropping them silently.
- **Blockers:** none
- **Files likely touched:** `denario/paper_agents/latex_presets.py` (`latex_pasj`)
- **Claude suggestion:** One-line `keywords=lambda x: f"\\keywords{{{x}}}"`, mirroring `latex_aas`. (APS/JHEP/NeurIPS correctly omit it — don't touch those.)
- **Note:** need to test with PASJ journal style.

### 1.3 Render bullet lists in Referee/Literature bodies
- **Status:** Ready · **SP:** 2 · **Needs design:** No · **Hard pivot:** —
- **Description:** `InlineMarkdown` only handles bold/code, so `* item` sub-bullets in real Referee/Literature text render as literal asterisks.
- **Dependencies:** none
- **User impact:** Peer-review points and literature comparisons read as proper lists, not raw markup.
- **Blockers:** none
- **Files likely touched:** `src/utils/MarkdownBlock.tsx`; consumers `src/pages/RefereeFullPage/`, `src/pages/LiteratureFullPage/`
- **Claude suggestion:** Add one block-level pattern for `* `/`- ` lines → `<ul>/<li>`; stay lightweight, no markdown library (matches the app's existing convention).

### 1.4 Replace fabricated plot captions with real ones
- **Status:** Ready · **SP:** 2 · **Needs design:** No · **Hard pivot:** —
- **Description:** `PlotLightbox` has a hardcoded caption dictionary with invented statistics ("Pearson r = 0.847…") keyed to mock filenames that never match real plots, plus two hand-drawn mock SVG charts left over from pre-real-data scaffolding.
- **Dependencies:** none
- **User impact:** Plot captions show real, non-fabricated text; removes invented numbers that could mislead a researcher.
- **Blockers:** none
- **Files likely touched:** `src/components/PlotLightbox/PlotLightbox.tsx`
- **Claude suggestion:** Source captions from real `structured.sections`/`findings` that reference each filename; delete the mock SVG charts.

### 1.5 Full-page views survive refresh & hot-reload
- **Status:** Shipped (commit `c725858`) · **SP:** 2 · **Needs design:** No · **Hard pivot:** —
- **Description:** Idea/Methods/Paper full pages read pipeline state directly from the store and go blank on a raw refresh or a dev hot-reload. Analysis was already fixed with a shared hook; extend it.
- **Verified:** every `*FullPage` component (Analysis, Idea, Keywords, Literature, Methods, Paper, Referee) uses `useHydratedPipeline` with the `fetchFailed`/`needsFetch` guards — confirmed by grep across all seven files, not just the three originally scoped.
- **Files touched:** `src/hooks/useHydratedPipeline.ts` + all `src/pages/*FullPage/*FullPage.tsx`

### 1.6 Honor the `model_overrides` field
- **Status:** Ready · **SP:** 2 → needs re-estimate (see note) · **Needs design:** Yes (new settings screen) · **Hard pivot:** —
- **Description:** `RunStageRequest.model_overrides` is defined but never read in `runner.py`, so per-agent model selection (e.g. "regenerate methods with claude-opus") silently does nothing. Originally scoped as backend-only, assuming a frontend settings UI already sent this field — **it doesn't exist yet.** There is currently no Configuration settings screen anywhere in the app for a researcher to actually pick per-agent models; `CLAUDE.md`'s "Per-Stage Model Configuration" table describes the intended Config Field Rows per stage, but none of that UI has been built. Scope now includes building that screen, not just wiring the backend field.
- **Dependencies:** none
- **User impact:** Per-agent model choice actually takes effect instead of silently no-op'ing — and becomes possible at all, since there's no UI to set it today.
- **Blockers:** none
- **Files likely touched:** `api/runner.py`, `api/models.py` (backend wiring); new frontend Settings/Config panel (per-stage Config Field Rows per `CLAUDE.md`), `src/api/client.ts` (send `model_overrides` on run requests), `src/types/pipeline.ts`
- **Claude suggestion:** Wire the field through to each stage's agent-model assignment; **verify the override actually reaches the agent before claiming it works** — this codebase has hit cross-track parity gaps before. Settle the settings screen's shape (modal vs. per-stage inline panel vs. a dedicated settings page) before building it.

---

## Epic 2 — Per-Stage Reasoning Transparency
*Show researchers how the AI reached each result. Methods' log is already shipped; this generalizes and extends it.*

> **Shipped:** Methods' Rigorous-track reasoning log (planning debate + execution steps) as a collapsible card in the thread and full page (commit on 2026-07-20).

### 2.1 Harden & generalize the reasoning-log renderer
- **Status:** Ready · **SP:** 3 · **Needs design:** Minor · **Hard pivot:** — · **Foundational (unblocks 2.2)**
- **Description:** Consolidates the rough edges that piled up while building the Methods log: brittle label-matching regex, visual-only (non-semantic) nested lists with no depth cap, and a `RightPanel` Overview/Discussion split that hardcodes Idea/Methods by name rather than generalizing.
- **Dependencies:** none (Methods log shipped)
- **User impact:** More robust rendering against real-content variety; sets up any other stage's log to plug in without touching the same conditional again.
- **Blockers:** none
- **Files likely touched:** `src/utils/liteMarkdown.tsx`, `src/pages/StagePage/RightPanel.tsx`, `src/components/molecules/MethodsLog/`, `src/components/molecules/CollapsibleLogCard/`
- **Claude suggestion:** Generalize the Overview/Discussion detection to "has parsed log content" rather than stage-name checks; give lists real `<ul>/<ol>` semantics with a depth cap.

### 2.2 Idea adversarial log (Rigorous track)
- **Status:** Ready (unblocked by 2.1) but **Blocked** on verification · **SP:** 3 · **Needs design:** Minimal (reuse) · **Hard pivot:** —
- **Description:** A Rigorous-track Idea run produces the same planning-debate + execution-step structure as Methods, but the shipped Idea viewer only reads the Fast-track `idea.log`, so a Rigorous Idea run silently shows no reasoning log at all.
- **Dependencies:** 2.1 (done)
- **User impact:** Rigorous-track Idea runs show their adversarial reasoning instead of a silent blank — closes a gap a user would hit without warning.
- **Blockers:** **Need to run Rigorous track first.** Source-level investigation (2026-07-23, cross-referencing `cmbagent/functions.py`, `autogen/agentchat/groupchat.py:1314`, and a real Analysis `final_plan.json`) found a real structural wrinkle Methods doesn't have: Methods' execution steps are always handled by one fixed agent (`researcher`), so its fetch hardcodes that name — but Idea's steps alternate between `idea_maker`/`idea_hater` per step (confirmed via `agent_for_sub_task` routing in `cmbagent/functions.py`), with the correct agent for each step readable from `final_plan.json`'s `sub_task_agent` field (confirmed present, holding `"engineer"` in the real Analysis sample checked). This is solid source-level evidence, not a guess, but nothing here has been checked against a real Rigorous-track Idea run's actual output on disk — that requires triggering a real (costly) generation. Do that first, confirm the file paths/agent names match, before wiring the fetch.
- **Files likely touched:** frontend only — `src/types/pipeline.ts` (add `planningLog`/`executionLog` to `IdeaResultData`, mirroring `MethodsResultData`), `src/utils/stageRunner.ts` (new `fetchIdeaLog()`: read `sub_task_agent` per step from `final_plan.json`, not a hardcoded agent name like `fetchMethodsLog` uses), `src/pages/IdeaFullPage/IdeaFullPage.tsx` (render via `MethodsLogCard`/`MethodsLogSections`, already stage-agnostic per 2.1). `RightPanel.tsx` needs no further changes — its Discussion-tab detection already checks data shape from 2.1.
- **Claude suggestion:** Reuse the Methods components (2.1 makes them stage-agnostic) — confirmed feasible. Do not hardcode a single agent name per step the way `fetchMethodsLog` does; read `sub_task_agent` from the plan per step instead.

### Not planned (with reasons)
- **Analysis log** — technically buildable (same cmbagent call) but the per-step artifact is one large raw two-voice (engineer + researcher) transcript, too noisy to be worth reading. Closed as a scope call, not deferred.
- **Paper / Literature / Referee / Keywords** — no adversarial/planning transcript exists to show (sequential drafting, a search pipeline, a single review call, and a single utility call respectively).

---

## Epic 3 — LaTeX Manuscript Editor (Paper stage)
*Edit and recompile the manuscript in-app, Prism-style. The compile/error/auto-fix machinery already exists in the backend — these tickets expose it, they don't rebuild it.*

### 3.1 On-demand recompile endpoint
- **Status:** Shipped (2026-07-24) · **SP:** 3 · **Needs design:** No · **Hard pivot:** —
- **Description:** A new endpoint that writes edited `.tex`, recompiles by reusing the existing `compile_latex`, returns parsed errors via the existing `extract_latex_errors`, and copies the PDF back so the current availability-check + fetch pattern keeps working.
- **Dependencies:** none
- **User impact:** Foundation for any in-app editing — lets an edited manuscript actually recompile to a fresh PDF.
- **Blockers:** none
- **Files touched:** new `api/routes/paper.py`, `denario/paper_agents/manuscript_edit.py` (new — reuses `latex.py`'s `compile_latex`/`extract_latex_errors`), `api/runner.py` (`_compile_lock`), `api/main.py` (router registration), `src/api/client.ts` (`recompilePaper`)
- **Verified against real project data**, not just theorized — found and fixed a real bug in the process: `compile_latex` only ever writes `LaTeX_log` from inside a `CalledProcessError` handler, so a clean pass or (as on this dev machine, no `xelatex` installed) a missing toolchain entirely never creates the log file at all — calling `extract_latex_errors` unconditionally crashed on the nonexistent file. Fixed to only call it when the log exists. Concurrency guard (409 on a second in-flight recompile) and the no-toolchain degrade path (`success: true, pdf_available: false`) both confirmed working via FastAPI's in-process `TestClient`.
- **Next:** ticket 3.2 (split-pane CodeMirror editor) — no UI built yet, this ticket is the backend + API client method only.

### 3.2 Split-pane LaTeX editor + live PDF preview
- **Status:** Shipped (2026-07-25, redesigned 2026-07-26/27) · **SP:** 8 · **Needs design:** No · **Hard pivot:** —
- **Description:** A real editor — CodeMirror + LaTeX syntax highlighting, lint-gutter diagnostics from real compile errors, line wrapping — alongside the PDF preview, with an explicit Save/Recompile (not autosave).
- **Note:** ended up living in the standalone `PaperPage` (ticket 3.5), not `PaperFullPage` as originally scoped — see 3.5's own entry. Redesigned twice against real Figma nodes (783:1614, then 797:2043) into the current folder-tab layout with a PDF/Summary/Logs/Suggestions right panel.
- **Files touched:** `src/components/organisms/LatexEditor/`, `src/pages/PaperPage/`, `src/api/client.ts`, `src/types/pipeline.ts`; deps `codemirror-lang-latex`, `@codemirror/lint`, `@codemirror/language`, `@lezer/highlight`

### 3.3 One-click auto-fix for compile errors
- **Status:** Shipped (2026-07-27) · **SP:** 5 · **Needs design:** No · **Hard pivot:** resolved
- **Description:** Expose an LLM "detect error → rewrite → retry" loop as an explicit editor action.
- **Dependencies:** 3.1 (done)
- **User impact:** When a manuscript won't compile, one click attempts an automated fix instead of manual LaTeX debugging.
- **Files touched:** `denario/paper_agents/manuscript_edit.py` (new `auto_fix_manuscript`/`fix_manuscript_bug_prompt`/`_build_fix_state`), `api/routes/paper.py` (new `/paper/auto-fix` route), `src/api/client.ts` (`autoFixPaper`), `src/pages/PaperPage/PaperPage.tsx` (Auto-fix button)
- **Hard pivot (resolved):** `fix_latex()` patches one named section (`state['paper'][section_to_fix]`), a structured-field model from the original multi-agent generation flow — doesn't map to our whole-document editor. Built new code instead: `auto_fix_manuscript()` rewrites and recompiles the whole `.tex` buffer, reusing `recompile_manuscript()` (3.1) for each attempt's compile+persist step. Consistent with 3.4's already-decided "raw buffer is the source of truth" pivot. `fix_latex()` itself is untouched — still used by the original generation-time flow.
- **Verified:** three mocked scenarios (this dev machine has neither xelatex nor API keys) — a real missing-credentials failure degrading honestly (found that `ChatGoogleGenerativeAI` fails at *construction* time with no key, not lazily at `.invoke()`), a fix-succeeds-on-attempt-1 retry loop, and giving up cleanly after 3 failed attempts — plus the real endpoint via TestClient and the full UI flow via Playwright (button visibility, editor content swap on success).

### 3.4 Chat-driven full-document edits
- **Status:** Blocked · **SP:** 5 · **Needs design:** No (uses 3.2's editor) · **Hard pivot:** decided
- **Description:** A chat instruction targeting the Paper ("make the abstract punchier", "add the booktabs package and reformat this table", "add a Limitations section") sends the whole current `.tex` + instruction to the LLM and gets a whole new `.tex` back, shown as a diff, applied on confirm.
- **Dependencies:** 3.2, 6.3 (the classification node)
- **User impact:** Content *and* structural manuscript edits from plain-language requests, with a diff to review before anything changes.
- **Blockers:** 3.2 (needs the editor), 6.3 (needs the classifier to exist)
- **Files likely touched:** new `api/routes/paper.py` edit endpoint, `denario/langgraph_agents/` (classifier tool from 6.3), `src/components/organisms/LatexEditor/`; new dep `@codemirror/merge`
- **Claude suggestion:** Full-document rewrite, not diff/patch — a manuscript is small enough that whole-file round-trips avoid the fragile substring-matching that made OpenPrism/assistant-ui edits unreliable. Use `@codemirror/merge`'s `MergeView` for the preview; validate the LLM output is well-formed LaTeX (balanced `\begin`/`\end`, has `\documentclass`) before it can overwrite the buffer.
- **Hard pivot (decided):** the editor's raw `.tex` buffer is the source of truth once the editor ships; this **supersedes** the old structured-field section-rewrite approach (was Compose Bar 6.8).

### 3.5 Standalone "Paper" workspace (new sidebar nav destination)
- **Status:** Shipped (2026-07-25/27) · **SP:** — · **Needs design:** No · **Hard pivot:** resolved
- **Description:** `/paper` (`src/pages/PaperPage/`) now hosts the real split-pane editor from 3.2, not a placeholder.
- **Cross-project-vs-per-project, resolved by implementation:** `PaperPage` reads whichever project is currently loaded in `usePipelineStore` globally (no `:projectId` route param) — it's a deep-link into the currently-open project's manuscript, not a global cross-project picker. Shows an honest empty state ("No project open") if none is loaded.
- **Files touched:** `src/pages/PaperPage/PaperPage.tsx` (+ `.module.css`)

### Open design questions (decide during 3.2–3.4)
`.bib` editability (in scope or `.tex`-only?) · how a manual edit interacts with the Approve-&-Proceed stage gate.

**Resolved:** auto-fix (3.3) is an explicit button, not automatic after a failed save — matches the app's explicit-controls pattern.

---

## Epic 4 — Interactive Data Visualization (Analysis stage)
*Let researchers explore plots and test parameters, not just view static PNGs. Built client-side with `react-plotly.js` inside Denario's own app — not Dash.*

### 4.1 Preserve scripts/data + build the plot→script map
- **Status:** Held (paused, not implemented) — hard-pivot decided but risk profile is materially higher than the rest of Phase 0/1; deliberately not started · **SP:** 5 → needs re-estimate (live-ledger is more invasive than the static-analysis manifest it replaces) · **Needs design:** No · **Hard pivot:** Decided 2026-07-23 — live run-ledger, captured at execution time · **Foundational (blocks 4.2/4.3/4.4)**
- **Risks identified before holding (2026-07-23):** (1) the `sitecustomize.py`/PYTHONPATH hook depends on cmbagent's current, undocumented `control/` directory naming — not a public API contract, so a cmbagent upgrade could silently zero out the ledger with no error; (2) a bug in the ledger's own patch code could block the LLM-generated script from running at all if not defensively wrapped (try/except, fail-open); (3) the Analysis self-healing retry loop re-runs revised scripts and wipes the plots folder each pass — the ledger must track run/attempt identity or a stale entry could misattribute a plot to a discarded earlier script; (4) much harder to verify than the frontend tickets this session — only provable against a real live Analysis run through the actual sandbox, not a standalone unit test. If picked back up: implement fail-open, validate against a real run end-to-end, and treat SP as 5+ (bigger than a normal Phase 1 ticket) before scheduling it.
- **Description:** At the point `get_results()` already moves plots into `input_files/`, also copy the generating scripts and their CSVs to stable storage (before a retry's cleanup wipes them), and build a manifest linking each plot to its producing script and plotting library. **Decided 2026-07-23:** build the manifest as a live run-ledger recorded during the sandboxed script's own execution (e.g. wrapping/patching the plotting call so each `savefig` records its own source script + library at the moment it fires), not a post-hoc static-analysis pass over saved scripts. Denario controls the execution sandbox, so this is available and removes any static-analysis misattribution risk entirely.
- **Dependencies:** none
- **User impact:** No direct user-facing change yet, but it's the durable foundation everything interactive needs, and it also hardens the Analysis stage against retry data-loss.
- **Blockers:** none
- **Files likely touched:** `denario/denario.py` (`get_results`), the cmbagent sandbox execution path (to hook/patch the plotting call and record the ledger), new manifest helper module
- **Claude suggestion:** This is the last moment scripts and final (timestamped) plot names are both known — do the promotion here. For the ledger itself, the cleanest hook point is wherever the sandbox actually invokes `plt.savefig`/equivalent — confirm that call site in the real execution path before committing to an implementation shape.

### 4.2 Interactive companion render (backend)
- **Status:** Blocked · **SP:** 8 · **Needs design:** No · **Hard pivot:** —
- **Description:** An on-demand endpoint that, for a given plot, derives a declarative chart spec (type, data columns/ranges, adjustable parameters) from its script + data and returns it, so the frontend can render and re-parameterize a real interactive chart.
- **Dependencies:** 4.1
- **User impact:** Backing service for the interactive popup — produces a spec with named, bindable parameters, not just a static export.
- **Blockers:** 4.1
- **Files likely touched:** new `api/routes/` endpoint + companion-render module, `api/routes/files.py` (add `.html` to `INLINE_EXTENSIONS`)
- **Claude suggestion:** Per-chart-type declarative mapping (scatter/line/bar/histogram/heatmap, plus 3D variants where the data supports it) that re-plots via Plotly from the CSV — this is the only approach that yields a spec with tweakable named parameters.

### 4.3 "Interact with it" popup: live controls + 3D
- **Status:** Blocked · **SP:** 8 · **Needs design:** Yes · **Hard pivot:** —
- **Description:** An "Interact with it" button next to each static plot opens a popup rendering the chart client-side via `react-plotly.js`, with a control panel (recolor, bins, axis range, a 3D toggle where supported) generated from the spec. Also de-dupe the three copies of `PlotThumb` while in this code.
- **Dependencies:** 4.2
- **User impact:** Researchers can pan/zoom/rotate, recolor, and re-parameterize plots against the real data — the core "explore, don't just view" experience.
- **Blockers:** 4.2
- **Files likely touched:** `src/pages/StagePage/ResultCards/ResultCards.tsx`, `src/pages/AnalysisFullPage/AnalysisFullPage.tsx`, `src/components/PlotLightbox/PlotLightbox.tsx`, new `InteractivePlotModal` + shared `PlotThumb` + new availability hook; new deps `react-plotly.js`/`plotly.js`
- **Claude suggestion:** Controls must be generated from the spec's declared adjustable params, not hardcoded. `dash-daq`'s widget set (knob/gauge/toggle/color-picker) is good visual reference for the controls — the ideas, not the package. Read-only, sandboxed; no save in v1.

### 4.4 Browsable data tables from the run's CSVs
- **Status:** Blocked · **SP:** 3 · **Needs design:** No · **Hard pivot:** — · **Low priority**
- **Description:** Render the CSVs promoted in 4.1 as sortable/filterable tables in the artifact viewer instead of plain downloads.
- **Dependencies:** 4.1
- **User impact:** Researchers can inspect the underlying data tables directly, not just download them.
- **Blockers:** 4.1
- **Files likely touched:** new table component, `api/routes/files.py` (add `.csv` to `INLINE_EXTENSIONS`)
- **Claude suggestion:** Small lift once 4.1 promotes the CSVs — pure tabular rendering, no companion-execution step.

### 4.5 Standalone "Lab" workspace (new sidebar nav destination)
- **Status:** Ready (placeholder shipped 2026-07-24) · **SP:** needs estimate · **Needs design:** Yes · **Hard pivot:** —
- **Description:** The sidebar redesign (2026-07-24) added a "Lab" nav item routing to `/lab` (`src/pages/LabPage/`), intended to eventually showcase the interactive data-visualization work this whole epic describes (4.2's chart-spec rendering, 4.3's "Interact with it" popup). Today it's a bare "coming soon" placeholder. Real scope needs deciding: a cross-project data-exploration space, or a deep-link into the current project's Analysis stage once 4.2/4.3 exist?
- **Dependencies:** 4.1 (held), 4.2, 4.3 — this is "where does the interactive-viz work surface," not new viz functionality itself.
- **User impact:** A dedicated place to explore analysis outputs — exact value depends on the cross-project vs. per-project decision above.
- **Blockers:** 4.1 is held (see its own risk notes above); 4.2/4.3 not built; scope decision above not made.
- **Files likely touched:** `src/pages/LabPage/LabPage.tsx` (replace placeholder), depends on wherever 4.2/4.3's components end up living.
- **Claude suggestion:** Don't build past the placeholder until 4.1 is unheld and 4.2 exists — right now this would be an empty shell with nothing to show. Decide the cross-project-vs-per-project question first, same fork as 3.5's Paper workspace.

### Not possible
- **Auto-detect library & always render interactively** — cmbagent's `load_plots()` hard-whitelists raster extensions, so a non-PNG artifact never reaches Denario's layer. Would require editing the vendored cmbagent package (out of bounds). The per-plot on-demand approach above sidesteps this entirely.

---

## Epic 5 — Literature Search: Transparency & Positioning
*Show all the papers the search actually found (not just the 3 cited), and check novelty earlier in the pipeline.*

### 5.1 Parse the full searched corpus into structured sidecars (backend)
- **Status:** Shipped · **SP:** 3 · **Needs design:** No · **Hard pivot:** —
- **Description:** The literature search finds ~43 papers across multiple query rounds but only the 3 cited ones reach the UI. Parse the deterministic `.log` files into structured sidecars.
- **Files touched:** `denario/papers_log_parser.py`, `denario/denario.py`

### 5.2 "Related Literature" list + "how this was searched" trail
- **Status:** Mostly shipped (2026-07-27) · **SP:** 3 · **Needs design:** No · **Hard pivot:** —
- **Description:** The full searched corpus (not just the 3 cited papers), shown as a 3-paper teaser in the conversation card and in full on the Literature full page, plus an optional round-by-round query trail.
- **Shipped:** the conversation-thread teaser (`PublicationCard`, 3 papers) and the full-page "All Searched Papers (N)" section (all papers, via `PublicationCard`) both already existed from earlier session work — as a card list, not the table format originally specified, but serving the same transparency purpose. 2026-07-27 added the missing piece: the full-page section defaults collapsed with a chevron toggle, since a real search returns 29–40+ papers and the list previously always rendered fully expanded.
- **Not built (explicitly deferred, ticket itself calls it optional):** the round-by-round "how this was searched" query trail — `papers_log_parser.py` dedupes across rounds internally but never exposes which round found what. Table-vs-cards was also explicitly left as cards per product decision (2026-07-27) rather than converted to the originally-specified table format.
- **Files touched:** `src/pages/LiteratureFullPage/LiteratureFullPage.tsx` (+ `.module.css`)

### 5.3 Move Literature Review earlier (stage 6 → 3)
- **Status:** Ready (mechanically) · **SP:** 3 · **Needs design:** No · **Hard pivot:** yes
- **Description:** Reorder the pipeline to `input → idea → literature → methods → analysis → paper → referee → keywords`, turning lit review into an upfront novelty gate before the expensive stages. Confirmed a pure reorder — Literature only depends on the idea + data description.
- **Dependencies:** none
- **User impact:** Researchers learn "this isn't novel" before sinking time into Methods/Analysis/Paper, instead of at stage 6.
- **Blockers:** none
- **Files likely touched:** `api/runner.py` (`STAGE_ORDER`), `src/config/stageConfig.ts`, `src/pages/StagePage/RightPanel.tsx`, `src/pages/HomePage/HomePage.tsx`, `src/pages/StagePage/ResultCards/ResultCards.tsx` (2 next-stage button labels), `CLAUDE.md` (pipeline table renumber)
- **Claude suggestion:** Mechanically small (4 array edits + 2 labels + 1 copy string + doc), but it changes the gating logic every stage's lock/unlock depends on.
- **Hard pivot:** needs a real test pass across projects at different completion points (including an in-progress project created under the old order), not just a fresh one — that's why it's gated rather than a quick win.

---

## Epic 6 — The Research Assistant (Compose Bar)
*Ask Denario to answer questions, edit stages, and trigger runs from the compose bar — freeform natural language and explicit `/` commands into one shared action registry.*

> **Status: PAUSED — whole-epic hard pivot.** This is deliberately parked pending clearer articulation of the problem statement, after several rounds of proposing concrete designs that didn't match the intended shape. The tickets below are a well-researched record of what's been explored, not a ready queue. **Discuss and unpause before building any of them.** The current compose bar is placeholder scaffolding only.
>
> **2026-07-27 — one piece of the problem statement resolved:** how the compose bar gets its context. 6.1's premise (a pre-computed schema field per anticipated question) doesn't generalize — confirmed the reasoning content it wanted already exists on disk without new schema work (see 6.1's entry). Real project content is ≈450K tokens if concatenated whole, 78% of it Analysis's raw retry transcripts that Epic 2 already rejected as "too noisy to be worth reading" — so blind full-project-context is the wrong shape too. Redesigned 6.2/6.3 around on-demand, selective reads instead (an agent that reads what a question actually needs, the same way Claude Code itself works), rather than either narrow pre-computed fields or one giant stuffed prompt. This narrows the "unpause" gap but doesn't close it — 6.3's actual tool-calling design still needs its own planning pass before building.

### Sub-phase A — Foundations
- **6.1 Rationale field on Methods schema** — **Superseded**, not just paused. The reasoning content this wanted already exists on disk without any new schema field: Idea's adversarial loop writes the full `idea_maker`/`idea_hater` transcript verbatim to `idea_generation_output/idea.log` (confirmed: 18,539 chars in a real project — full prose reasoning, e.g. the critic explaining exactly why a GEE model was rejected for N=25 clusters); Methods' Rigorous track calls the identical `cmbagent.planning_and_control_context_carryover(...)` primitive Analysis uses, which is why 2.1/2.2 already treat "planning debate + execution steps" as a generalizable log shape across stages. This is a *viewer* gap (2.1/2.2's territory — surfacing an existing log), not a *schema* gap. No files touched.
- **6.2 On-demand project-reading tools** *(reframed from "Context-assembly helper")* — Paused · SP3. Was scoped as one function gathering every completed stage's content into a single grounding blob; reframed as a small set of tools a tool-calling agent (6.3) can call selectively. Three tools, each with `project_id` bound server-side (never an LLM-supplied argument, so scope stays inside that project's directory by construction, not by the model policing itself):
  - `list_stages(project_id)` — per stage: id, status, whether a reasoning log exists, one-line title. Cheap, always-safe first call so the agent can see what's available before committing to an expensive read. Built from `get_state()`'s existing `statuses` dict, no new tracking needed.
  - `read_stage_summary(project_id, stage_id)` — the stage's final doc (idea.md, methods.md, etc.). Already small (a few KB each) — safe to return in full, no truncation needed for v1. Generalizes `_read_result` to take any `stage_id` instead of its current single-call shape.
  - `read_stage_reasoning(project_id, stage_id)` — the reasoning log if one exists, or a clean "none available" signal if not. **Verified against real project data** (not assumed): Methods' planning log (`chat_output_planning.json`) is a list of named chat turns; filtering to `name in {planner, plan_reviewer}` with non-empty content — the exact rule the frontend's `parseMethodsPlanningLog` (`src/utils/parsers.ts`) already uses for the UI viewer — correctly isolates the real draft→critique→revision reasoning from formatter/recorder/tool-executor noise, confirmed by inspecting an actual 16-entry file. Each step's `chat_output_researcher_step_N.json` has exactly one `researcher`-named entry with real content, also confirmed against real data. The frontend logic is TypeScript running client-side (fetches over HTTP) so isn't directly reusable, but the *filter rules* are proven and directly portable to Python.
  - **Log availability is not a simple Rig-vs-Fast binary — three distinct cases, verified, not assumed:** (1) track-dependent but *stage-specific*: Methods' Fast track (`methods_fast()`) skips the debate entirely (confirmed empty on disk), but Idea's `get_idea_fast()` surprisingly builds the *same* LangGraph graph as the Rigorous path (`get_idea_cmagent()`) — so Idea's "fast" track likely still produces a debate log, unlike Methods; a tool can't apply one blanket rule across stages. (2) stage-structural absence unrelated to track: Paper/Literature/Referee/Keywords never have this artifact on any track — no planning-debate loop exists for those stage types at all (already closed as a scope call in Epic 2). (3) present-but-noisy, not absent: Analysis always has a transcript (no track choice exists for Analysis), the problem there is filtering, not availability. Design conclusion: the tool should check on-disk file presence/non-emptiness directly, never infer availability from which track was selected. (Caveat on the evidence: initially cited 4 real projects all having `idea.log` as independent confirmation — a diff check showed two of them are byte-identical, almost certainly copies of one generation, not independent runs; the real verified sample is smaller than first implied.) Not yet verified: whether an interrupted/crashed run can leave a partial log even on the "right" track — `idea.py`'s field-based log writes are commented out, with content populated only via the streaming side-channel, so a failed stream could plausibly leave a gap.
  - **No web-search fallback when a log is missing.** Considered and rejected for the direct "why did you..." case: a web search returns generic domain knowledge ("LMMs are typically preferred when data is clustered"), not this project's actual reasoning — presenting that as the answer is fabrication with extra steps, the same failure mode already fought elsewhere this session (fabricated plot captions, honest xelatex/llm_error surfacing). Better fallback: read the stage's *other* real content (final doc, data description, idea hypothesis) and offer an inferred rationale, explicitly labeled as inference rather than recorded reasoning — stays grounded in real project content instead of reaching outward. Web search remains legitimate only as explicitly-labeled supplementary background, on request, never automatic (Denario already calls external search APIs — Perplexity, Semantic Scholar — for Literature, so this isn't a new dependency category, just a call site worth being deliberate about, given Denario's local-reproducibility ethos).
  - No token-budget/tiktoken machinery needed for v1 — individual docs/logs are small; the ≈450K-token whole-project number only bites if everything loads at once, which this design avoids by construction.
  - Files: `api/runner.py` (`_read_result`, new read-tool functions).
- **6.3 Classification endpoint (core LangGraph node)** — Paused · SP8 (re-estimate: internal shape changed from prompt-assembly to an agent loop). The single entry point every message goes through — a **tool-calling node with 6.2's read-tools bound to it** (agentic retrieval: the node decides what to read per question, not a pre-assembled context blob), plus `propose_edit`/`propose_run`, or a grounded plain-text answer. Files: new `api/routes/assistant.py`, `denario/langgraph_agents/`, `api/runner.py`.
  - **Still open, needs its own planning pass before building** (6.2's design above only resolves "how does it get context"): (1) no tool-calling pattern (`bind_tools`/`ToolNode`/`create_react_agent`) exists anywhere in this codebase yet — confirmed via repo-wide grep — so this is genuinely new wiring, not an extension of an existing pattern; (2) the three-way branch (edit/run/answer) routes into `propose_edit` (6.5) and `propose_run` (6.7), which don't exist yet — does 6.3 ship as answer-only first, or need stub branches to exercise routing end-to-end; (3) a turn-budget cap on tool-call rounds per question, so an unbounded agent loop can't recreate the "read everything anyway" problem this redesign was meant to avoid; (4) conversation memory — single-turn only, or does it need recent thread history, and how that interacts with the token-budget concern; (5) model choice — same gap 3.3/1.6 already exposed, no per-project record of which model to use and no settings UI; (6) how streaming (6.4) interacts with a mid-tool-call agent — does the user see any progress signal before the final answer starts streaming; (7) verification strategy — this dev machine has neither real API keys nor xelatex, so an actual agent loop reading real files and calling a real LLM needs the same mocked-scenario approach used for 3.3.
- **6.4 Two-step streaming (POST + SSE GET)** — Paused · SP3. POST submits the message, GET `EventSource` streams the reply — mirrors the existing `streamStage()`. Files: `src/api/client.ts`, `api/routes/stages.py`, `api/runner.py`.

### Sub-phase B — Edit & run
- **6.5 Methods edit preview/confirm** — Paused · SP5 · Needs design. NL instruction → schema-constrained proposed edit, previewed, saved only on confirm; needs recent conversation history as context. Files: new edit endpoints, `denario/structured_method.py`.
- **6.6 Stage-order defensive guards / staleness** — Paused · SP3. When an upstream stage is edited/rerun, surface that downstream stages are now stale and *propose* (never auto-run) a refresh. Files: `api/routes/stages.py`, `api/runner.py`.
- **6.7 Propose-run action** — Paused · SP3. Wire a NL/`/rerun` request into the existing run mechanism, shown as a proposed action requiring confirmation. Files: `src/utils/stageRunner.ts`, `api/runner.py`.

### Sub-phase C — Content generation
- **6.8 One-shot code-exec wiring** — Paused · SP5. Expose cmbagent's lighter `one_shot()` primitive through Denario for the first time — the foundation for plot generation. Files: `denario/denario.py` (new `run_one_shot_task`); `cmbagent.one_shot` (verify only). *Watch: cmbagent's own `cmbagent_mcp` may mature into a cleaner path — re-check before building.*
- **6.9 Plot regeneration + review** — Paused · SP8 · Needs design. Treat a plot critique as a from-scratch regeneration via 6.8 + a VLM plot-judge (there's no plot→code link to patch). Files: 6.8 wiring, `denario/denario.py`, `denario/paper_agents/latex.py`.

### Sub-phase D — UI
- **6.10 "/" skill dropdown** — Paused · SP3 · Needs design. Explicit entry point into the same action registry the freeform path uses. Reference implementation for the parsing: open-science's `Composer.tsx` (regex-gate-then-chip). Files: `src/pages/StagePage/ConversationThread.tsx` (`ComposeBar`).

### Superseded
- **Manuscript section rewrite** (old 6.x) → replaced by **3.4** (chat-driven full-document rewrite against the LaTeX editor buffer).

### Easy-wins note (cheap wrappers, but each needs an entry point — a command or a button)
`/run-all` (`research_pilot`) · `/resume` (`get_results(restart_at_step)` — has a natural non-compose-bar home as a button on a failed Analysis card, so this one could ship independently of the epic) · `/enhance-description` · `/ocr-pdf` · `/fetch-arxiv` · `/prior-art` (FutureHouse novelty check — hardcoded unreachable today; adds an external dependency). These are real, working backend capabilities with no REST entry point — thin wrappers, not new agent work, but they need somewhere for a user to trigger them.

---

## Appendix — Decisions & investigations (condensed)

Verdicts from this and the prior session, kept so they aren't relitigated. Full detail lives in `docs/archive/` and git history.

- **OpenPrism / assistant-ui** — *not forked.* Both are full standalone apps; OpenDCAI/OpenPrism is an abandoned solo project with no committed LICENSE, assistant-ui/open-prism is a one-day demo on a deprecated API. Mined for reference: adopted `codemirror-lang-latex`, `@codemirror/lint`, `@codemirror/merge`. Neither actually has auto-recompile-on-edit; both do have a propose-then-apply edit flow (validates our preview/confirm design).
- **Dash by Plotly** — *not adopted.* A separate Python web-app framework, not an embeddable component; its charts use the same `plotly.js` we'll use directly; the good embedding path is paywalled (Dash Enterprise). `dash-daq` kept as UX reference for 4.3's controls.
- **open-science ("Claude Science" clone)** — *not adopted.* ~18-day-old, effectively one-author Tauri desktop app; architecturally incompatible with our web-app model. One strong takeaway: its two-ledger provenance pattern (artifact ledger + run ledger joined by `run_id`, `pip freeze`-level env capture) → informs 4.1's hard-pivot choice, and we're better-positioned than they are (we control script execution, so we can capture the link with certainty).
- **AG2 vs LangGraph** — LangGraph chosen for the assistant engine (single-agent + human-in-the-loop fits; already vendored).
- **A2UI** — not applicable to the visualization feature (no chart component; solves dynamic agent-composed UI, which this feature doesn't have).
- **cmbagent raster wall** — auto-detecting/serving interactive artifacts is impossible without editing the vendored cmbagent package; hence the per-plot on-demand approach in Epic 4.
- **LaTeX editor source-of-truth** — the editor's raw `.tex` buffer wins once the editor ships; edits are full-document rewrites, not diff/patch.
- **CLAUDE.md corrections shipped** — dual-track exists only for Idea/Methods (not every stage); Referee is a single review call, not two reviewers.
