# Prism-style LaTeX editor for the Paper stage — implementation tickets

## Summary

- The compile/error-parse/auto-fix machinery Prism and OpenPrism advertise **already exists** in `DenarioBackend/denario/paper_agents/latex.py` (`compile_tex_document`, `compile_latex`, `extract_latex_errors`, `fix_latex`) and is already wired into generation-time drafting (`paper_node.py`). The gap is that none of it is reachable on demand after generation — Tickets 1-2 expose it, they don't rebuild it.
- The files API (`api/routes/files.py`) is read-only today — no write endpoint, and `/stages/{id}/run` only re-runs the entire stage. A scoped "save + recompile" path (Ticket 1) doesn't exist yet.
- The "kick off from the composer bar" half of the original ask is **already substantially solved** — `HomePage.tsx`'s composer already creates a project and can enter directly at the Paper stage via the Modular dropdown, and in-project follow-through is already scoped in `COMPOSE_BAR_TICKETS.md`. Nothing new needed there; this doc stays scoped to the editor itself.
- Forking either OpenPrism repo was considered and rejected — both are full standalone apps (own router/backend/state), and neither matches Denario's actual stack (Vite+React+zustand, no Next.js/`assistant-ui`). Mining them for reference (CodeMirror config, the auto-fix-retry idea) instead of vendoring them wholesale avoids the wide-blast-radius vendoring pattern already flagged as something to avoid in this project.

## Context

The goal is for Denario's Paper stage to work like OpenAI's Prism (shipped January 2026 — a free, GPT-5.2-powered LaTeX-native workspace: editor + live PDF preview + AI assistance in one view). Two open-source projects both calling themselves "OpenPrism" exist (`OpenDCAI/OpenPrism` — Vite+React+Fastify+CodeMirror+PDF.js; `assistant-ui/open-prism` — Next.js+`assistant-ui`+Hono+CodeMirror+react-pdf), but neither is built as an embeddable component — both are full standalone apps with their own router, backend, and state management. Denario's actual frontend is plain Vite+React 19+TypeScript+react-router-dom+zustand (no Next.js, no `assistant-ui`), and its backend (`DenarioBackend`) is a separate Python/FastAPI service. Forking either repo wholesale would mean bolting a second app onto Denario — the wide-blast-radius vendoring pattern already flagged as something to avoid. **Decision: don't fork OpenPrism. Build the editor as native Denario components, reusing the LaTeX-compile machinery that already exists in `DenarioBackend`.**

**Confirmed current state, by reading the actual code:**
- `PaperFullPage.tsx` (lines 10-19) already had a fabricated mock LaTeX editor + fake-journal PDF preview ripped out — its own comment documents this. Today it renders `manuscript.tex` as a **read-only** `<pre>` dump (lines 135-142) and `manuscript.pdf` via a native browser `<iframe>` (lines 115-133), gated on `usePdfAvailability`'s `HEAD`-request check. No editing, no write path, no CodeMirror.
- The LaTeX compile machinery Prism/OpenPrism advertise (compile, detect errors, LLM-fix, retry) **already exists and is already wired into generation**, in `DenarioBackend/denario/paper_agents/latex.py`: `compile_tex_document()`/`compile_latex()` (xelatex + bibtex passes), `extract_latex_errors()` (parses `! `-prefixed error blocks out of the xelatex log into a `LaTeX_err` file), and `fix_latex()` (an LLM-rewrite-and-retry loop, 3 attempts, confirmed called from `paper_node.py:150,221,372,435` during drafting). This is the same self-healing philosophy Stage 4 already uses for Python — it just isn't exposed as an on-demand action outside the initial generation run.
- The files API (`api/routes/files.py`) is **read-only** — `GET`/`HEAD` only, no write endpoint. `POST /stages/{id}/run` re-runs the **entire** stage via LangGraph (full regeneration, not a scoped recompile). `POST /stages/{id}/approve` accepts a single `edited_content` string (`api/routes/stages.py:58-65`) — built for single-blob markdown stages, not Paper's multi-file (`.tex` + `.bib` + `.pdf`) shape.
- `manuscript.tex`/`manuscript.pdf` at the project root are **copies**, written once by `api/runner.py` (~lines 587-596) after the Paper stage's LangGraph run completes, sourced from whichever `paper/paper_v{1,2,3,4}_*.tex` file is the most complete one actually produced. The real compile machinery operates on `state['files']['Paper_folder']`/`'Temp'`/`'LaTeX_log'`/`'LaTeX_err'` — paths set up as part of the full pipeline's `GraphState`, not something these two files construct standalone. An on-demand recompile endpoint needs to reconstruct a minimal compatible state, not assume a drop-in call — flagged as a real integration risk in Ticket 1, not glossed over.

**Composer-bar "kick off the project" ask — already substantially covered, not re-scoped here:** `HomePage.tsx`'s existing composer (`handleBegin`) already creates a backend project and can jump directly into any stage — including Paper — via the Modular stage-entry dropdown (`STAGE_ENTRY_OPTIONS` / `STAGE_CONFIG[...].modularEntry`, `stageConfig.ts:205-272`). In-project continuation (rerun/edit/trigger from the conversation `ComposeBar`) is already scoped in `COMPOSE_BAR_TICKETS.md`. This doc is scoped to the editor capability only.

---

## Ticket 1 — Backend: on-demand recompile endpoint for the Paper stage

**Description:** A new endpoint (e.g. `POST /projects/{id}/stages/paper/recompile`, or a write+recompile pair under `files.py`) that: (a) writes edited `.tex` content to `project_dir/manuscript.tex`, (b) invokes the **existing** `compile_tex_document()`/`compile_latex()` from `latex.py` rather than reimplementing xelatex invocation, (c) returns compiled/failed plus the parsed error text via `extract_latex_errors()` (already exists — don't reinvent error parsing), (d) copies the resulting PDF back to `project_dir/manuscript.pdf` so the existing `usePdfAvailability` + `api.fileUrl` fetch pattern in the frontend keeps working unchanged.

**Files:** `api/routes/files.py` or new `api/routes/paper.py`; `denario/paper_agents/latex.py` (`compile_tex_document`, `compile_latex`, `extract_latex_errors` — reuse); `api/runner.py` (mirror the copy-back logic already at ~lines 587-596); `api/models.py` (new request/response models).

**Edge cases:** `compile_tex_document`/`compile_latex` expect a `GraphState`-shaped dict with `state['files']['Paper_folder']`/`'Temp'`/`'LaTeX_log'`/`'LaTeX_err']` populated — confirm the `project_dir/paper/` directory and these working files still exist/are reconstructable after the stage has completed, rather than assuming it. If no LaTeX toolchain is installed (already a known degrade path — see `usePdfAvailability.ts`'s comment), recompile must report that plainly, not silently no-op. Concurrent recompile requests for the same project need to be serialized or rejected while one is in flight — `clean_files()`'s `rm` of `.aux`/`.log`/`.pdf`/`.out` is not concurrency-safe.

---

## Ticket 2 — Backend: expose the existing auto-fix-on-error loop as an on-demand action

**Description:** `fix_latex()` (`latex.py:327`) already does the "detect compile errors → LLM-rewrite the failing content → retry, up to 3 attempts" loop that Prism/OpenPrism market as a feature — it's real, and already used at generation time. Expose it as a distinct on-demand action from the editor ("Auto-fix compile errors"), separate from a plain recompile (Ticket 1), reusing the function rather than rebuilding retry logic client-side.

**Files:** same as Ticket 1, plus `denario/paper_agents/prompts.py` (`fix_latex_bug_prompt`) — read it first to confirm exactly what section-level context it expects.

**Edge cases:** `fix_latex()` currently expects `state['latex']['section_to_fix']` — it was built to regenerate one named section (title/abstract/introduction/etc.) during per-section drafting. A full-manuscript edit made in the new editor doesn't map to one named section the same way — this needs either error-log-driven section detection (parse which section the xelatex error points into) or a coarser whole-document fix path. **Not a drop-in reuse — needs design before implementation, same caution as Ticket 1's state reconstruction.**

---

## Ticket 3 — Frontend: split-pane LaTeX editor + PDF preview in PaperFullPage

**Description:** Replace the read-only `<pre className={styles.fullDocument}>` block (`PaperFullPage.tsx:135-142`) with an actual editor. Left pane: CodeMirror with LaTeX syntax highlighting, local edit state with a dirty flag against `result.rawContent`, and an **explicit Save action** — not silent autosave. Denario's stage-gate model is built entirely around an explicit "Approve & Proceed" step (per `CLAUDE.md`); an editor that persists on every keystroke would be inconsistent with that pattern, not just a style choice. Right pane: keep the existing native-`<iframe>` PDF approach (`usePdfAvailability` + `api.fileUrl`) rather than pulling in `pdf.js`/`react-pdf` — it already works and degrades honestly when no PDF exists, per that file's own comment; only reconsider if a real need (inline annotations, search, page thumbnails) shows up later. Save calls Ticket 1's recompile endpoint, surfaces compile errors inline using the parsed error text close to verbatim (don't reformat or invent structure around it), and bumps the PDF pane's `cacheBust` key on success so `usePdfAvailability` re-checks the freshly compiled file.

**Files:** `src/pages/PaperFullPage/PaperFullPage.tsx`, `PaperFullPage.module.css`; new `src/components/organisms/LatexEditor/`; `src/api/client.ts` (new recompile method); `src/types/pipeline.ts` (`PaperResultData` may need a `bibContent` field if `.bib` editing is in scope — see Ticket 4).

**Edge cases:** No first-party `@codemirror/lang-latex` package exists — this needs research into which community package (or a custom `StreamLanguage`) to adopt; don't assume one exists with the right API surface without checking first. Editing must remain available even when `pdfAvailable` is `false` (no LaTeX toolchain on this machine) — the researcher should still be able to edit/save `.tex` source with no preview ever appearing, the same honest degradation the page already does today; don't gate editing on PDF availability.

---

## Ticket 4 — Open design questions (not yet decided — needs a call before Tickets 1-3 are built)

- **Scope of "editable":** `.tex` only, or also `bibliography.bib`? OpenPrism's reference treats them as separate editable files; Denario's `PaperResultData` today only models tex-derived fields (`abstract`, `citations` count) — no bib content at all yet.
- **Relationship to the stage-gate model:** `CLAUDE.md`'s "Approve & Proceed" gate implies edits should flow through the existing `approve_stage`/`edited_content` mechanism at some point. Does a manual `.tex` edit from this new editor bypass that gate entirely, or does Save also re-approve the Paper stage? Not decided.
- **Auto-fix (Ticket 2) automation level:** it's an LLM-call retry loop (up to 3 attempts, real cost/latency) — should it fire automatically after a failed manual Save, or stay a separate action the researcher clicks explicitly? This app's existing pattern favors explicit Generate/Stop controls over automatic background LLM calls, which leans toward explicit-by-default, but confirm before building.
