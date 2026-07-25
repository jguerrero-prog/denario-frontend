# Denario — Project Reference

## What Denario Is

Denario is an **open-source AI research co-pilot for scientists**. It takes a dataset and a research question, then runs them through an 8-stage sequential pipeline of specialised AI agents to produce a reproducible, submission-ready LaTeX manuscript. Every stage output is a physical local file (`project_dir/`). Humans review and approve each stage before the next one unlocks.

**Two core principles:**
- **Reproducibility** — every output (.md, .tex, .pdf, .bib, .py, plots) lives on the researcher's local drive. No cloud silos.
- **Human-in-the-loop** — "Approve & Proceed" is a hard gate. The researcher can edit any Markdown output before approving.

---

## The 8-Stage Research Pipeline

Each stage produces a file that gates the next stage.

| # | Stage | What happens | Output file | Gates |
|---|-------|-------------|-------------|-------|
| 1 | **Input Prompt** | Researcher defines dataset, domain, tools, and LLM credentials | workspace config | Stage 2 |
| 2 | **Idea** | Adversarial agent loop (`idea_maker` ↔ `idea_hater`) stress-tests and hardens the hypothesis | `idea.md` | Stage 3 |
| 3 | **Methods** | Multi-agent sub-swarm (Planner + Plan Reviewer + Method Generator) translates hypothesis into a concrete technical roadmap | `method.md` | Stage 4 |
| 4 | **Analysis** | Engineer agent writes Python; `cmbagent` sandbox executes it; self-healing loop fixes errors iteratively until success | `results.md` + plots + scripts | Stage 5 |
| 5 | **Paper** | Writing agents draft prose, insert citations, embed plots, apply journal template (LaTeX) | `manuscript.tex` + `.bib` + compiled `.pdf` | Stages 6 & 7 |
| 6 | **Literature Review** | Searches Semantic Scholar + uploaded references for overlapping prior work | `literature_review.md` | — |
| 7 | **Referee Report** | Single-pass LLM review of the compiled manuscript's rendered pages; surfaces comments and a revision verdict | `referee_report.md` | — |
| 8 | **Keywords** | Extracts keywords from the manuscript as a flat list, optionally matched against a controlled vocabulary (UNESCO / AAS / AAAI) | `keywords.md` | ✓ Done |

### Stage mechanics
- **Dual tracks** — only Idea and Methods offer a real choice between a **Fast** track (single model, immediate) and a **Curated** track (full multi-agent swarm, configurable models). Analysis, Paper, Literature, Referee, and Keywords each have exactly one generation path in the backend (`denario.py`'s `get_results`/`get_paper`/`check_idea`/`referee`/`get_keywords` — no `_fast`/`_cmbagent` variants exist for these); the `track` field on a run request has no effect on them.
- **Stage 2 adversarial loop** — `idea_maker` (creative) and `idea_hater` (cynical) debate in streaming iterations until the hypothesis stabilises.
- **Stage 4 self-healing** — if generated Python hits a runtime error, the loop captures the stack trace and refactors the script autonomously until it executes cleanly.
- **Alternative inputs** — Stage 1 accepts a `.md` dropzone instead of typed text; Stage 3 accepts a dropped methodology file; Stage 4 accepts pre-calculated analytical markdown.

---

## UI Layout — 3 Columns

```
┌────────────────┬──────────────────────────────┬──────────────┐
│  LEFT SIDEBAR  │   CONVERSATION COLUMN         │  RIGHT PANEL │
│  ~16% width    │   fluid (center)              │  ~23% width  │
│                │                               │              │
│  New/Lab/Paper │  One artifact card per stage  │  File output │
│  nav           │  (idea.md, method.md, …)      │  monitors    │
│  Project name  │  AI-generated prose + actions │  Download    │
│  + backend     │  "Approve & Proceed →"        │  rows        │
│  status        │                               │  Breadcrumb  │
│  Settings gear │                               │  bar (top)   │
└────────────────┴──────────────────────────────┴──────────────┘
```

### Left Sidebar
An app-shell nav, not per-project stage navigation — that job moved out of
the sidebar entirely, to the Compose Bar (Epic 6 in `ROADMAP.md`).
- **New / Lab / Paper** — flat nav list. New starts a new project (same
  behavior as before). Lab and Paper are placeholder destinations today
  (`src/pages/LabPage/`, `src/pages/PaperPage/`) — Lab will house the
  interactive data-visualization work (Epic 4), Paper the LaTeX manuscript
  editor (Epic 3); neither is built out yet.
- **Project section** — current project name (or "No project open") +
  backend connection status dot.
- **Settings gear** — always neutral; opens project settings.

Removed in the redesign: the old per-stage nav rows, lock icons, and the
Pipeline/Modular mode toggle pill (the toggle was already dead — local
component state disconnected from the rest of the app). Stage-to-stage
navigation within an open project is now: scroll the conversation thread,
or use "Approve & Proceed" sequentially. A `/command`-driven stage jump via
the Compose Bar is the intended long-term replacement once Epic 6 ships.

### Conversation Column (Artifact Cards)
Each card follows this structure:
```
CardHeader:  [status dot] [file.md chip] | Generated by Denario  Just now
Body:        AI-generated content (prose / step rows / plot grid / stats)
Tags:        domain tags
Actions:     [Edit ___]  [Approve & Proceed →]
```

### Right Panel
- Monitor panels showing live code output / plot previews
- File output rows with Download icon (for .tex, .bib, .py)
- Top breadcrumb bar showing current stage

---

## Execution Controls

| Control | Style | Behaviour |
|---------|-------|-----------|
| **Generate** | Primary Accent (green) | Validates prerequisites → launches backend → loading/streaming state |
| **Stop** | Secondary Neutral | Immediate circuit breaker — kills API streams, reverts to idle |

---

## Per-Stage Model Configuration

Each stage exposes a config panel (Config Field Rows) for assigning LLM models:

| Stage | Models |
|-------|--------|
| 2 — Idea | `idea_maker` model + `idea_hater` model |
| 3 — Methods | Planner model + Plan Reviewer model + Method Generator model |
| 4 — Analysis | Engineer model (default: `gemini-2.5-pro`) + Researcher model |
| 5 — Paper | Writing model + journal format selector + researcher discipline input |
| 1 — Lit Enhancement | Summarizer model + Response Formatter model (active only when arXiv URLs are in the input) |

Supported providers: OpenAI, Anthropic Claude, Google Gemini (mixed per-agent routing is supported).

---

## Design System & Tech Stack

- **Framework:** React + TypeScript + Vite
- **Storybook 10** for component documentation (`@storybook/react-vite`, addon-vitest, addon-a11y, addon-docs)
- **CSS Modules** for styling — no Tailwind
- **Design tokens** in `src/tokens/tokens.css` (CSS custom properties: `--color-*`, `--space-*`, `--radius-*`, etc.)
- **Fonts:** Literata (serif headings), Instrument Sans Variable (UI body), JetBrains Mono (code/monospace) — all via `@fontsource`
- **Atomic design:** `src/components/atoms/` · `molecules/` · `organisms/`
- **Story tests:** run with `npx vitest --project storybook run <file>`

### Completed Storybook documentation components
| Component | Path | Notes |
|-----------|------|-------|
| Text | atoms/Text | Typography specimen |
| ColorSwatch | atoms/ColorSwatch | Brand palette |
| Elevation | atoms/Elevation | Shadow tokens |
| BorderRadius | atoms/BorderRadius | Radius tokens |
| SpacingScale | atoms/SpacingScale | Space tokens |
| ContrastTable | atoms/ContrastTable | A11y contrast matrix |
| BorderWidths | atoms/BorderWidths | Border tokens |
| LayoutGrid | atoms/LayoutGrid | 3-column layout diagram |
| PatternLibrary | atoms/PatternLibrary | UI pattern specimens |
| IconSet | atoms/IconSet | 15 inline-SVG icons with states |
| BrandMark | atoms/BrandMark | Logo, convergence variant, wordmarks |
| VoiceTone | atoms/VoiceTone | Copy principles and stage examples |
| ComponentLibraryPt2 | molecules/ComponentLibraryPt2 | 7 artifact card specimens |

### Key coding conventions
- All icons are **inline SVG** (never localhost asset URLs — those are Figma dev assets only)
- Tests use `getAllByText(...).length).toBeGreaterThanOrEqual(1)` for any text that might repeat across specimens
- No Tailwind — convert all Figma-generated Tailwind to CSS Modules using design tokens
- No trailing summaries in responses (user prefers terse output)

---

## Key Vocabulary

| Term | Meaning |
|------|---------|
| `project_dir` | The local folder on the researcher's machine where all outputs are saved |
| Stage gate | The "Approve & Proceed" action that unlocks the next stage |
| `cmbagent` | The sandboxed code execution environment used in Stage 4 |
| Adversarial loop | The Stage 2 debate between `idea_maker` and `idea_hater` |
| Self-healing loop | Stage 4's autonomous error-correction cycle for generated Python |
| Pipeline/Modular mode | **Removed from the sidebar** (see Left Sidebar above) — was a UI toggle between sequential stage-unlock and freely-jumpable stages. Underlying stage-gate mechanics (`approveStage`/`unlockNextStage`) still exist; only the toggle and its lock-icon UI are gone. Not to be confused with Fast/Curated Track below, a separate per-stage generation concept. |
| Fast Track | Single-model, low-latency generation for any stage |
| Curated Track | Full multi-agent swarm for any stage |
