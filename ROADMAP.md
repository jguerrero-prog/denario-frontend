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
| 1.5 Full-page views survive refresh & hot-reload | 2 | 3.2 |
| 2.1 Harden & generalize the reasoning-log renderer | 3 | 2.2 |
| 4.1 Preserve scripts/data + plot→script map | 5 | 4.2, 4.3, 4.4 |

### Phase 2 — Ready features
*High-value build-out that's unblocked once Phase 0–1 land.*

| Ticket | SP |
|--------|----|
| 2.2 Idea adversarial log (Rigorous track) | 3 |
| 3.1 → 3.2 → 3.3 LaTeX editor (recompile → editor → auto-fix) | 3 / 8 / 5 |
| 4.2 → 4.3 Interactive plots (backend render → popup) | 8 / 8 |
| 5.1 → 5.2 Literature corpus (parse → table) | 3 / 3 |
| 4.4 Browsable data tables | 3 |

### Phase 3 — Structural / decision-gated
*Each needs a decision or an unpause before it starts.*

| Ticket | SP | Gate |
|--------|----|------|
| 5.3 Move Literature Review earlier | 3 | Hard pivot (pipeline gating) |
| Epic 6 (whole) Research Assistant | ~40 | Paused on problem statement |
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
- **Status:** Ready · **SP:** 2 · **Needs design:** No · **Hard pivot:** — · **Foundational (blocks 3.2)**
- **Description:** Idea/Methods/Paper full pages read pipeline state directly from the store and go blank on a raw refresh or a dev hot-reload. Analysis was already fixed with a shared hook; extend it.
- **Dependencies:** none
- **User impact:** Full-page views reliably show content instead of blanking out; also a prerequisite for the LaTeX editor, which lives in `PaperFullPage`.
- **Blockers:** none
- **Files likely touched:** `src/pages/IdeaFullPage/IdeaFullPage.tsx`, `src/pages/MethodsFullPage/MethodsFullPage.tsx`, `src/pages/PaperFullPage/PaperFullPage.tsx` (reuse `src/hooks/useHydratedPipeline.ts`)
- **Claude suggestion:** Purely additive — swap the direct store read for `useHydratedPipeline` and add the two early-return guards, same as `AnalysisFullPage`.

### 1.6 Honor the `model_overrides` field
- **Status:** Ready · **SP:** 2 · **Needs design:** No · **Hard pivot:** —
- **Description:** `RunStageRequest.model_overrides` is defined but never read in `runner.py`, so per-agent model selection (e.g. "regenerate methods with claude-opus") silently does nothing.
- **Dependencies:** none
- **User impact:** Per-agent model choice actually takes effect instead of silently no-op'ing.
- **Blockers:** none
- **Files likely touched:** `api/runner.py`, `api/models.py`
- **Claude suggestion:** Wire the field through to each stage's agent-model assignment; **verify the override actually reaches the agent before claiming it works** — this codebase has hit cross-track parity gaps before.

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
- **Status:** Ready · **SP:** 3 · **Needs design:** Minimal (reuse) · **Hard pivot:** —
- **Description:** A Rigorous-track Idea run produces the same planning-debate + execution-step structure as Methods, but the shipped Idea viewer only reads the Fast-track `idea.log`, so a Rigorous Idea run silently shows no reasoning log at all.
- **Dependencies:** 2.1
- **User impact:** Rigorous-track Idea runs show their adversarial reasoning instead of a silent blank — closes a gap a user would hit without warning.
- **Blockers:** none
- **Files likely touched:** backend `denario/idea.py` (confirm the real output directory); frontend `src/utils/parsers.ts`, `src/utils/stageRunner.ts`, `src/pages/StagePage/ConversationThread.tsx`, `src/pages/StagePage/RightPanel.tsx`, `src/pages/IdeaFullPage/IdeaFullPage.tsx`
- **Claude suggestion:** Reuse the Methods components (2.1 makes them stage-agnostic); confirm the output dir name against a real run before wiring the fetch.

### Not planned (with reasons)
- **Analysis log** — technically buildable (same cmbagent call) but the per-step artifact is one large raw two-voice (engineer + researcher) transcript, too noisy to be worth reading. Closed as a scope call, not deferred.
- **Paper / Literature / Referee / Keywords** — no adversarial/planning transcript exists to show (sequential drafting, a search pipeline, a single review call, and a single utility call respectively).

---

## Epic 3 — LaTeX Manuscript Editor (Paper stage)
*Edit and recompile the manuscript in-app, Prism-style. The compile/error/auto-fix machinery already exists in the backend — these tickets expose it, they don't rebuild it.*

### 3.1 On-demand recompile endpoint
- **Status:** Ready · **SP:** 3 · **Needs design:** No · **Hard pivot:** —
- **Description:** A new endpoint that writes edited `.tex`, recompiles by reusing the existing `compile_tex_document`/`compile_latex`, returns parsed errors via the existing `extract_latex_errors`, and copies the PDF back so the current availability-check + fetch pattern keeps working.
- **Dependencies:** none
- **User impact:** Foundation for any in-app editing — lets an edited manuscript actually recompile to a fresh PDF.
- **Blockers:** none
- **Files likely touched:** new `api/routes/paper.py` (or extend `api/routes/files.py`), `denario/paper_agents/latex.py` (reuse), `api/runner.py`, `api/models.py`, `src/api/client.ts`
- **Claude suggestion:** Reconstruct the minimal `GraphState`-shaped paths the compile functions expect rather than assuming a drop-in call; serialize concurrent recompiles (the cleanup step isn't concurrency-safe); degrade honestly if no LaTeX toolchain is installed.

### 3.2 Split-pane LaTeX editor + live PDF preview
- **Status:** Blocked · **SP:** 8 · **Needs design:** Yes · **Hard pivot:** —
- **Description:** Replace the read-only source dump in `PaperFullPage` with a real editor: CodeMirror + LaTeX syntax highlighting on the left, the existing native PDF iframe on the right, an explicit Save (not autosave — consistent with the Approve-&-Proceed model).
- **Dependencies:** 3.1, 1.5
- **User impact:** Researchers can edit the manuscript and see the recompiled PDF without leaving Denario.
- **Blockers:** 3.1 (recompile endpoint), 1.5 (page must survive refresh first)
- **Files likely touched:** `src/pages/PaperFullPage/PaperFullPage.tsx` (+ `.module.css`), new `src/components/organisms/LatexEditor/`, `src/api/client.ts`, `src/types/pipeline.ts`; new deps `codemirror-lang-latex`, `@codemirror/lint`
- **Claude suggestion:** `codemirror-lang-latex` (verified: actively published, best feature fit) for highlighting/folding; `@codemirror/lint` to render compile errors as inline diagnostics at the right line rather than a flat error panel; keep editing available even when no PDF can be produced.

### 3.3 One-click auto-fix for compile errors
- **Status:** Blocked · **SP:** 5 · **Needs design:** Yes · **Hard pivot:** see note
- **Description:** Expose the existing `fix_latex()` "detect error → LLM-rewrite → retry" loop as an explicit editor action.
- **Dependencies:** 3.1
- **User impact:** When a manuscript won't compile, one click attempts an automated fix instead of manual LaTeX debugging.
- **Blockers:** 3.1
- **Files likely touched:** `denario/paper_agents/latex.py` (`fix_latex`), `denario/paper_agents/prompts.py` (`fix_latex_bug_prompt`), same endpoint as 3.1
- **Claude suggestion:** `fix_latex()` currently expects a single named `section_to_fix` — a whole-document edit doesn't map to that. Decide between error-log→section detection or a coarser whole-doc fix path **before** building. Lean toward an explicit button (not auto-fire) to match the app's explicit-controls pattern.
- **Hard pivot (small):** the `section_to_fix` mismatch above is a real design fork — resolve first.

### 3.4 Chat-driven full-document edits
- **Status:** Blocked · **SP:** 5 · **Needs design:** No (uses 3.2's editor) · **Hard pivot:** decided
- **Description:** A chat instruction targeting the Paper ("make the abstract punchier", "add the booktabs package and reformat this table", "add a Limitations section") sends the whole current `.tex` + instruction to the LLM and gets a whole new `.tex` back, shown as a diff, applied on confirm.
- **Dependencies:** 3.2, 6.3 (the classification node)
- **User impact:** Content *and* structural manuscript edits from plain-language requests, with a diff to review before anything changes.
- **Blockers:** 3.2 (needs the editor), 6.3 (needs the classifier to exist)
- **Files likely touched:** new `api/routes/paper.py` edit endpoint, `denario/langgraph_agents/` (classifier tool from 6.3), `src/components/organisms/LatexEditor/`; new dep `@codemirror/merge`
- **Claude suggestion:** Full-document rewrite, not diff/patch — a manuscript is small enough that whole-file round-trips avoid the fragile substring-matching that made OpenPrism/assistant-ui edits unreliable. Use `@codemirror/merge`'s `MergeView` for the preview; validate the LLM output is well-formed LaTeX (balanced `\begin`/`\end`, has `\documentclass`) before it can overwrite the buffer.
- **Hard pivot (decided):** the editor's raw `.tex` buffer is the source of truth once the editor ships; this **supersedes** the old structured-field section-rewrite approach (was Compose Bar 6.8).

### Open design questions (decide during 3.2–3.4)
`.bib` editability (in scope or `.tex`-only?) · how a manual edit interacts with the Approve-&-Proceed stage gate · whether auto-fix (3.3) is automatic after a failed save or an explicit click.

---

## Epic 4 — Interactive Data Visualization (Analysis stage)
*Let researchers explore plots and test parameters, not just view static PNGs. Built client-side with `react-plotly.js` inside Denario's own app — not Dash.*

### 4.1 Preserve scripts/data + build the plot→script map
- **Status:** Ready · **SP:** 5 · **Needs design:** No · **Hard pivot:** yes · **Foundational (blocks 4.2/4.3/4.4)**
- **Description:** At the point `get_results()` already moves plots into `input_files/`, also copy the generating scripts and their CSVs to stable storage (before a retry's cleanup wipes them), and build a manifest linking each plot to its producing script and plotting library.
- **Dependencies:** none
- **User impact:** No direct user-facing change yet, but it's the durable foundation everything interactive needs, and it also hardens the Analysis stage against retry data-loss.
- **Blockers:** none
- **Files likely touched:** `denario/denario.py` (`get_results`), new manifest helper module
- **Claude suggestion:** This is the last moment scripts and final (timestamped) plot names are both known — do the promotion here.
- **Hard pivot:** choose the linking mechanism first — the static-analysis manifest (`savefig`-prefix match + import-line scan, done after the fact) currently scoped, **vs.** a live run-ledger captured at execution time (stronger, certain linkage, no misattribution risk — the open-science-inspired pattern). Denario controls its own script execution, so the live approach is available to it and is likely the better long-term call.

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

### Not possible
- **Auto-detect library & always render interactively** — cmbagent's `load_plots()` hard-whitelists raster extensions, so a non-PNG artifact never reaches Denario's layer. Would require editing the vendored cmbagent package (out of bounds). The per-plot on-demand approach above sidesteps this entirely.

---

## Epic 5 — Literature Search: Transparency & Positioning
*Show all the papers the search actually found (not just the 3 cited), and check novelty earlier in the pipeline.*

### 5.1 Parse the full searched corpus into structured sidecars (backend)
- **Status:** Ready · **SP:** 3 · **Needs design:** No · **Hard pivot:** —
- **Description:** The literature search finds ~43 papers across multiple query rounds but only the 3 cited ones reach the UI. Parse the deterministic `.log` files into structured sidecars.
- **Dependencies:** none
- **User impact:** Makes the full breadth of the search available to the UI — foundation for the transparency the tool promises.
- **Blockers:** none
- **Files likely touched:** new `denario/papers_log_parser.py`, `denario/denario.py` (invoke in the literature flow)
- **Claude suggestion:** Same pattern as the existing `literature.json`/`results.json` parsers — Python-side, writing `papers_processed.json` (+ optional `literature_rounds.json`). The `.log` files are code-formatted and deterministic, easier to parse than the LLM prose already handled.

### 5.2 "Related Literature" table + "how this was searched" trail
- **Status:** Blocked · **SP:** 3 · **Needs design:** Yes · **Hard pivot:** —
- **Description:** A collapsible table (title / authors / abstract snippet / link) of the full searched corpus, shown in both the conversation card and the full page, plus an optional round-by-round query trail.
- **Dependencies:** 5.1
- **User impact:** Researchers see the real breadth of the search and can catch papers the LLM's summary skipped — directly serves the transparency premise.
- **Blockers:** 5.1
- **Files likely touched:** `src/pages/LiteratureFullPage/LiteratureFullPage.tsx`, `src/pages/StagePage/ResultCards/ResultCards.tsx` (Literature card), new collapsible-table component, `src/types/pipeline.ts`
- **Claude suggestion:** Keep it distinct from the existing "Most Relevant Papers" comparison section (don't fabricate similarities/differences for papers the LLM never compared); truncated abstract snippets in the table, full text behind a per-row expand.

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

### Sub-phase A — Foundations
- **6.1 Rationale field on Methods schema** — Paused · SP3. Capture *why* each step was chosen at generation time, so "why did you…" can be answered from a real saved reason. Files: `denario/structured_method.py`, `denario/method.py`, `denario/langgraph_agents/methods.py`.
- **6.2 Context-assembly helper** — Paused · SP3. One backend function gathering every completed stage's content into a grounding context. Files: `api/runner.py` (`_read_result`, new `assemble_context`).
- **6.3 Classification endpoint (core LangGraph node)** — Paused · SP8. The single entry point every message goes through — tool-calling node with `propose_edit`/`propose_run`, or a grounded plain-text answer. Files: new `api/routes/assistant.py`, `denario/langgraph_agents/`, `api/runner.py`.
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
