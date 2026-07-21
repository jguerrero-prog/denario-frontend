# Interactive Visualization ("Artifact Viewer" / per-plot interact) — tickets

## Context

Original ask: Denario already generates reproducible Python analysis (matplotlib/seaborn scripts, CSVs, PNGs) during the Analysis stage, but the UI only exposes static thumbnails and downloads. Could an "Artifact Viewer" auto-detect the visualization library used and render an interactive workspace instead — ideally via structured artifact metadata the backend emits and the frontend dynamically composes against (an A2UI-style approach)?

Two rounds of investigation (grounding this against the real codebase, then a live correction mid-investigation that reshaped the scope) converged on: **the literal "auto-detect library, always render interactively" premise is structurally blocked inside `cmbagent` itself** — but a narrower, corrected version, an on-demand **"Interact with this plot"** button per existing PNG, is genuinely feasible without touching cmbagent/AG2/LangGraph.

**Final crystallized user story:** right after Analysis finishes, the researcher sees their plot exactly as today (static PNG), plus a new "Interact with it" button. Clicking it opens an interactive viewer — not just pannable/hoverable, but with **real parameter controls** (recolor, adjust bins/ranges, tweak whatever's reasonable for that chart type) that actually re-render the chart against the same real underlying data. Nothing about this touches or interferes with the Analysis pipeline itself — it's a strictly additive, opt-in feature for researchers who want to play with an interactive view instead of reading a static image. And critically: since Denario's Analysis stage only ever produces Python (matplotlib/seaborn) scripts + static PNGs — confirmed below, never HTML — the interactive version can't come from detecting an already-existing richer artifact. It has to be *built* from the static script + its real data, on demand, every time the button is clicked.

## Acceptance criteria

- [ ] A researcher can open any real generated plot's interactive companion via an "Interact with it" button next to the existing static PNG (both remain visible — this is additive, not a replacement).
- [ ] The interactive view is genuinely interactive (pan/zoom/hover on real data), not a static re-skin.
- [ ] The researcher can change real parameters relevant to that chart type (e.g., bin count for a histogram, axis range, which columns are plotted) and see the chart actually re-render against the same real underlying data — not just cosmetic knobs with no effect.
- [ ] The researcher can change colors (a color scale/palette control), and it visibly changes the rendered chart.
- [ ] Where a 3D representation is meaningful for the chart's data (see below), the researcher can view it in 3D — rotate/pan/zoom a real 3D trace, not a 2D chart with fake depth styling.
- [ ] For research domains where the original plot is *already* 3D (galactic dynamics, black hole/orbital simulations, and other astrophysics work cmbagent's own lineage is built for — e.g. a 3D scatter of star positions, an orbital trajectory, a spatial density field), the interactive companion preserves and defaults to that native 3D view rather than flattening it to 2D. This is distinct from the previous bullet: there, 3D is an *optional enhancement* for otherwise-2D data; here, 3D is *how the plot was already conceived*, and the interactive version needs to recognize and respect that rather than treat 3D as always-optional.
- [ ] None of the above touches, blocks, or slows down the Analysis pipeline itself — the static PNG generation researchers already see is completely unaffected; this is a separate, opt-in, read-only exploration path.

**On the 3D requirement specifically:** not every chart type has a meaningful 3D form (a simple time-series line trend doesn't gain anything from a 3rd axis). Plotly.js supports real 3D trace types natively (`scatter3d`, `surface`, `mesh3d`) with the same interactivity model (rotate/pan/zoom) as its 2D traces — so this doesn't introduce a new technical wall or a second rendering library, it's the same Ticket 2/3 architecture, just with the declarative chart-type mapping covering 3D-capable shapes where the underlying data supports it (e.g., a correlation heatmap's magnitude can become a 3D surface; a scatter plot with a natural third variable can become `scatter3d`). Where the data genuinely doesn't support a meaningful 3rd dimension, the "view in 3D" control simply doesn't appear for that plot — this is why Ticket 2's spec needs to declare *which* parameters (including whether a 3D mode exists) are available per chart, rather than the frontend assuming every chart has the same control set.

## The wall that reshaped this — confirmed directly, not assumed

`Denario_env/.../cmbagent/functions.py:1469`, inside `load_plots()` — the function cmbagent uses to discover what the engineer agent produced:
```python
image_extensions = ('.png', '.jpg', '.jpeg', '.gif')
```
This is a **hard raster-extension whitelist inside cmbagent's own installed package**. Plotly is genuinely installed (confirmed `6.8.0` in the same non-sandboxed `LocalCommandLineCodeExecutor` environment the engineer's scripts run in — no sandbox barrier at all), and even declared as a direct `cmbagent` dependency in its own package metadata — but never imported or used anywhere in cmbagent's actual source. Even if the engineer wrote `fig.write_html(...)`, that file would never enter `displayed_images`, never reach `denario/experiment.py`'s `plot_paths`, never get moved into `input_files/plots/` (`denario/denario.py:793-805`), and never reach the frontend — it would sit invisible in the working directory. On top of that, `denario/paper_agents/paper_node.py`'s `image_to_base64()` hard-whitelists `{.pdf,.jpg,.jpeg,.png,.bmp,.gif}` and **raises `ValueError`** for anything else, so a hypothetical HTML file that did survive would crash Paper generation if it ever flowed that far.

`cmbagent-ui` (the Next.js frontend bundled inside the `cmbagent` package itself) has the identical raster-only assumption in its own file browser (`FileBrowser.tsx`: `/\.(png|jpg|jpeg|gif|bmp|svg|webp|tiff|tif)$/i`) — corroborating this is pervasive across the whole cmbagent ecosystem, not a Denario-specific gap.

Fixing `load_plots()` means editing cmbagent's own installed package — out of bounds per the explicit constraint not to touch cmbagent/LangGraph/AG2 logic. **So real library-diversity auto-detection isn't buildable as originally framed**, since matplotlib/seaborn PNG is the only thing that will ever reach Denario's own layer from a real run (confirmed: every script in a real test run imports matplotlib+seaborn, never plotly).

## The corrected, actually-feasible feature

Not a global auto-detect-and-switch-renderer. An **on-demand, per-plot "Interact with this plot" button**: click a specific existing PNG, and Denario — entirely within its own application layer, never asking cmbagent's pipeline to discover or serve anything new — derives and renders an interactive companion version in a popup. This sidesteps `load_plots()` entirely because the interactive artifact is never meant to become a cmbagent-native "displayed image" at all; it's a separate, parallel, opt-in transformation triggered by the researcher, not something flowing back into the main Analysis/Paper pipeline.

### Why the pieces this needs are all independently confirmed feasible

**1. The plot→script link isn't guessed, it's structurally guaranteed.** cmbagent's engineer prompt (`engineer.yaml`) requires every executed code block to start with a `# filename: codebase/module.py` header comment. AG2's `extract_file_path_from_source()` (`cmbagent/functions.py:1365-1379`) reads that header and writes the code to that exact path **before** executing it via `LocalCommandLineCodeExecutor` — so the script that runs and the script that's persisted to `experiment_generation_output/control/codebase/` are always the same file, never a separate ephemeral path. Confirmed directly against a real run: `model_estimation.py:247-248`, `data_profiling.py:222-233`, and `post_estimation.py:195-196` each contain a `plt.savefig(...)` call whose constructed filename-prefix (`'data/model_diagnostics_3_' + timestamp + '.png'`) matches a real produced PNG (`model_diagnostics_3_20260718_205733.png`) exactly — only the runtime-generated timestamp suffix isn't a literal string match, everything before it is. One script → one or more plots, matchable via straightforward static analysis, no engineer cooperation or prompt change required.

**2. The library used is derivable the same way** — each script's own `import` lines (`import matplotlib.pyplot as plt`, `import seaborn as sns`) unambiguously state it. Also static analysis, also zero engineer cooperation needed.

**3. No package-availability barrier for the companion transform.** Plotly `6.8.0`, seaborn `0.13.2`, matplotlib `3.10.9`, and altair `6.2.2` are all already installed in the exact same non-sandboxed execution environment the engineer's own scripts run in (bokeh is not installed). A companion Plotly-based re-render can run there with zero new dependencies.

**4. Data-dependency fragility is real and must be designed around, not ignored.** Every script uses **relative paths** (`data/wui_wildfire_data.csv`, never absolute), chained across scripts — `data_profiling.py` writes the base CSV, `construct_wui_index.py` reads it and writes `wui_wildfire_data_wdi.csv`, `model_estimation.py` reads that, `post_estimation.py` reads model_estimation's output. All of these intermediate CSVs do genuinely persist on disk in `experiment_generation_output/control/data/` today — but re-executing any single script standalone, later, requires staging a scratch directory with the *same relative folder layout* (a populated `data/` subfolder), or its `pd.read_csv('data/...')` calls fail.

**5. Retry fragility is a real, pre-existing risk this design should fix as a side effect, not just work around.** `experiment_generation_output/` lives directly under `project_dir` (not a true tmpdir), but a retried Analysis run's default `restart_at_step<=0` triggers cmbagent's own `clear_work_dir()`, which wipes the *entire* working directory — scripts and data included — unless `api/runner.py`'s existing resume-detection intervenes first (this exact risk is already documented in that file's own comments, describing prior real behavior). Promoting scripts + data to a stable `input_files/` location — the same way PNGs already are — removes this fragility for both the new feature and future robustness generally.

### Explicitly out of scope / non-goals

- **Not** a global "detect and always render interactively by default" — blocked by `load_plots()`'s hard extension whitelist, which would mean editing cmbagent's own package.
- **Not** flowing any interactive/HTML artifact back into the main Analysis or Paper pipeline — `paper_node.py`'s `image_to_base64()` hard-whitelists raster formats and raises on anything else. This stays a separate, parallel, opt-in viewing path, always.
- **Not** the same as the previously-deferred "Analysis as a lab" idea (plain-English plot editing via a declarative chart-spec + dual matplotlib/Plotly renderer, logged in memory as `project_denario_future_work` and `COMPOSE_BAR_TICKETS.md`'s Ticket 10 background). That one requires new engineer-agent behavior (emitting a spec instead of raw code) and was already judged too heavy for v1. This proposal touches nothing upstream of already-generated files — it's purely about interacting with static plots that already exist, better.

## Tickets

### Ticket 1 — Promote scripts/data to stable storage + compute the plot→script→library manifest

**What:** At the same point `denario/denario.py`'s `get_results()` already moves PNGs into `input_files/plots/` (`shutil.move`, lines ~793-805), add:
- Copy `experiment_generation_output/control/codebase/*.py` into a new `input_files/scripts/`.
- Copy `experiment_generation_output/control/data/*.csv` into a new `input_files/data/`.
- Compute a manifest linking each realized plot filename to its producing script and that script's plotting library (via the static `savefig()`-prefix match and `import`-line scan described above), persisted as a new sidecar, e.g. `input_files/plot_manifest.json`: `{"model_diagnostics_3_....png": {"script": "model_estimation.py", "library": "matplotlib"}}`.

**Why here:** this is the last moment both the script directory and the final (timestamped) plot filenames are simultaneously known, before `experiment_generation_output/` is at risk of being wiped by a future retry's `clear_work_dir()`.

**Alternative worth considering before treating the above as final (found 2026-07-20, investigating `ai4s-research/open-science` — see `COMPOSE_BAR_TICKETS.md`'s investigation section for full detail):** that project links generated outputs back to source by reconstructing the connection *after the fact*, via a wall-clock mtime-window filesystem diff — and it has real, acknowledged misattribution risk because of it, since it doesn't control the arbitrary bash commands its own agent invokes. This ticket's `savefig()`-prefix-match + import-line-scan approach is the same category of after-the-fact reconstruction, with the same category of risk (a plot that imports a shared `plotting_utils.py` module has that module invisible to the manifest, per the existing edge-case note below). Denario is better-positioned than that project to avoid this entirely: since `get_results()` already orchestrates the script execution itself (via `experiment.py`/`cmbagent`), it could instead record a run record — script, args, start/end time, output files — *at the moment of execution*, with certain linkage, rather than reconstructing it afterward from static analysis. Worth a real design pass before committing to the static-analysis version below.

**Files:** `denario/denario.py` (`get_results()`), new small helper module for the manifest computation (script/plot matching + import-line scan).

### Ticket 2 — On-demand companion interactive render, backend

**What:** A new endpoint (e.g. `POST /projects/{id}/plots/{plot_filename}/interact`) that: looks up the plot's script + library from Ticket 1's manifest; stages a scratch execution directory with a `data/` subfolder populated from `input_files/data/` (matching the script's expected relative layout); derives a small declarative description of the chart (chart type, data columns/ranges, current color/styling) from the original script + its data; runs a companion Plotly render from that description; writes the resulting `.html` **plus the declarative description itself** to a stable, cache-keyed location; returns both.

**Real parameter controls requirement — this decides the design, not just a nice-to-have:** the ask is explicitly not "the same chart but hoverable" — it's "recolor it, adjust bins/ranges, tweak parameters" from actual UI controls in the popup. That only works if the backend hands the frontend a genuine **spec** (chart type + data reference + the specific parameters that are meaningfully adjustable for that chart type — color scale, bin count, axis range, etc.), which the frontend then binds real controls to and re-renders against (client-side, via Plotly.js reacting to prop changes — no new backend call needed per tweak, just for the initial derivation). This makes the design choice below not really a choice:

- **(a) A small per-chart-type declarative mapping** (scatter/line/bar/histogram/heatmap cover most real cases seen so far) that reads the same CSV and re-plots via Plotly directly, independent of the original matplotlib code's rendering details — this is the only approach that naturally produces a spec with named, bindable parameters a control panel can hook into. **This is the one to build.**
- ~~(b) Monkeypatch/intercept the original script's plotting calls at runtime~~ — ruled out for this requirement specifically: even if it worked reliably (matplotlib→Plotly conversion is not reliable in general — already noted in the "Analysis as a lab" memory, `mpl_to_plotly` shouldn't be relied on), it would only ever produce one fixed rendered figure, with no clean hook for "here are the 3 parameters a user can tweak."

**3D coverage within that mapping — two distinct cases, not one:**

1. **Already-3D scripts (the motivating case — cmbagent's own lineage is astrophysics: CMB analysis, AAS/PASJ journal support).** For domains like galactic dynamics, black hole/orbital simulations, or spatial density fields, the engineer agent may already be writing genuinely 3D matplotlib code (`mpl_toolkits.mplot3d`, `ax.plot_surface(...)`, a 3-arg `ax.scatter(x, y, z)`) — confirmed nothing in cmbagent's engineer prompt (`engineer.yaml`) forbids this; it's just standard matplotlib, no extra dependency. Ticket 1's manifest computation needs a detection step for this (grep the script for `projection='3d'` / `Axes3D` / `mplot3d` / `plot_surface`/`plot_wireframe` / a 3-arg `scatter` call on a 3D axes object) — when detected, the chart-type mapping should treat 3D as the **native, default** representation (map straight to `scatter3d`/`surface`/`mesh3d`), not an optional add-on.
2. **Optionally-3D data (a genuine 2D chart that happens to have a 3rd numeric column available).** Here 3D is an *enhancement*, off by default — a 2D scatter with a natural third column → an available `scatter3d` toggle; a correlation/2D-grid heatmap → an available `surface` toggle (magnitude as height).

The spec's per-chart-type entry needs to distinguish these (e.g. `is3dNative: boolean` for case 1 vs. `supports3d: boolean` for case 2) so the frontend knows whether to *default* to 3D or just *offer* it — chart types with no natural 3rd dimension at all (e.g. a plain time-series line) declare neither, rather than forcing a meaningless 3D toggle everywhere.

**Also needed:** add `.html` to `api/routes/files.py`'s `INLINE_EXTENSIONS` (currently `{.md,.tex,.bib,.py,.txt,.json,.pdf}`) so the existing generic file-serving endpoint can serve it inline via `<iframe>` instead of forcing a download — this is the *only* change needed to that endpoint; path resolution, traversal protection, and `FileResponse` streaming are already generic and content-type-agnostic. (The chart *spec* itself, returned as JSON alongside the HTML, is what actually powers live parameter tweaking — the `.html`/iframe path matters mainly as a zero-JS-framework fallback/export view.)

**Caching:** generation could be slow (spinning up a subprocess, real computation) — cache the resulting HTML keyed by plot filename (+ a content hash of the manifest entry, so a regenerated Analysis run invalidates stale interactive versions).

**Files:** new `api/routes/` endpoint, new backend module for the companion-render logic, `api/routes/files.py` (`INLINE_EXTENSIONS`).

### Ticket 3 — Frontend: "Interact with this plot" button + popup with real parameter controls, and de-duplicate `PlotThumb`

**What:** Add an "Interact with it" button to the existing plot rendering (shown right next to the static PNG, exactly as it renders today — this ticket adds to the existing view, doesn't replace it). Clicking it calls Ticket 2's endpoint, shows a loading state, then opens a popup containing:
- The chart itself, rendered client-side via `Plotly.js` bound to the spec Ticket 2 returned (not just an `<iframe>` of a static export — the spec needs to live in JS state so controls can mutate it and Plotly re-renders reactively).
- A small control panel next to/below the chart, generated from the same spec's declared adjustable parameters (a color picker for the color-scale parameter, a slider for bin count, range inputs for axis bounds, a "View in 3D" toggle when the spec declares `supports3d`, etc.) — exactly which controls appear depends on what Ticket 2's chart-type mapping declares as adjustable for that chart type, so this needs to consume the spec generically rather than hardcoding one control set. Toggling 3D swaps the bound Plotly trace type (e.g. `scatter` → `scatter3d`, `heatmap` → `surface`) using the same underlying data — still a client-side re-render, no new backend call. **UX reference for this panel's individual controls:** `dash-daq`'s widget set (Knob, Gauge, ToggleSwitch, ColorPicker — see "Dash by Plotly" section below) is a good source of visual/interaction ideas for these controls, even though the package itself isn't used — it's a Dash-Python component library, not something importable here.
- Nothing here touches the underlying real data or the original static PNG — this is a read-only, sandboxed exploration view. No "save" action in v1 (matches the app's existing pattern of not designing save/versioning until it's actually needed).

**Also do while touching this code (real, independently-valuable cleanup surfaced during research, not net-new scope):** consolidate the three separately-duplicated `PlotThumb` implementations (`ResultCards.tsx:458-480`, `AnalysisFullPage.tsx:113-135`, `PlotLightbox.tsx`'s `PlotImage:95-120`) into one shared component.

**New frontend dependency:** `react-plotly.js`/`plotly.js` — this is genuinely new (confirmed nothing like it exists in the frontend today), needed specifically because live parameter-driven re-rendering has to happen client-side, not by re-requesting a new static HTML export per tweak.

**Files:** `src/pages/StagePage/ResultCards/ResultCards.tsx`, `src/pages/AnalysisFullPage/AnalysisFullPage.tsx`, `src/components/PlotLightbox/PlotLightbox.tsx`, a new shared hook generalizing `usePdfAvailability.ts`'s pattern, new `InteractivePlotModal` component + control-panel sub-components.

### Ticket 4 — Fix `PlotLightbox`'s fake captions (small, standalone, not gated on Tickets 1-3)

**What:** `PlotLightbox.tsx`'s `PLOT_CAPTIONS` (lines 78-88) is a hardcoded dictionary keyed on nine specific mock filenames (`co2_temp_timeseries.png`, `correlation_heatmap.png`, etc.) with fabricated statistics ("Pearson r = 0.847, p < 0.001") that never match real generated filenames — confirmed every real plot falls through to a generic "Figure N." fallback. Replace with real captions pulled from `structured.sections`/`findings` text that actually references each plot filename (the structured-results parsing already built this session). Also remove the two hand-drawn SVG mock placeholder charts (`Co2TempChart`, `PlaceholderChart`, lines 15-66), used only as pre-real-data scaffolding.

**Files:** `src/components/PlotLightbox/PlotLightbox.tsx`.

### Ticket 5 — Real CSV data tables (lower priority, natural extension of Ticket 1)

**What:** Since Ticket 1 already promotes CSVs to `input_files/data/`, render them as real sortable/filterable tables in the artifact viewer instead of plain downloadable files — the "data tables, statistics" half of the original ask, and a much smaller lift than interactive plots since it's just tabular rendering of already-real data, no companion-execution step needed.

**Files:** new table-rendering component, `api/routes/files.py` (add `.csv` to `INLINE_EXTENSIONS`).

## Relevant existing precedent worth knowing about, not needed for v1

`denario/cmbagent_patches.py` already monkey-patches `cmbagent.functions.register_function` at import time (wrapping only the `record_status_starter` registration, to fix an unrelated upstream bug) — concrete proof that runtime interception of cmbagent's registered functions, without forking the vendored package, is an established, working pattern in this codebase. Not needed for Tickets 1-5 (static post-hoc parsing of `codebase/*.py` is sufficient), but relevant if a future iteration ever wants to *capture* `latest_executed_code`/`latest_plot_path` live during a run (both exist in cmbagent's context but are cleared to `None` after each step and never persisted today — confirmed via unpickling a real `context_step_N.pkl`) instead of reconstructing the link via static analysis after the fact.

## A2UI (https://github.com/a2ui-project/a2ui) — considered, not applicable to this feature

Checked directly against the real repo, not from memory. A2UI is a protocol for letting an **LLM agent declaratively describe generic UI** (forms, buttons, cards, layout) as JSON, rendered by a client-side "component catalog" adapter — confirmed renderer implementations exist only for React, Angular, Flutter, Lit, and Markdown (`renderers/` directory), with **no chart/plot/data-visualization component shipped with it at all**. It does have a "Smart Wrapper" extensibility mechanism for registering arbitrary custom components (including iframe-wrapped legacy content) into its catalog, so a Plotly chart *could* be wrapped as one in principle.

**Why it doesn't help Tickets 1-5:** wrapping our chart as an A2UI "Smart Wrapper" component wouldn't remove any of the actual work — Ticket 2's chart-spec derivation (from the matplotlib script) and Ticket 3's Plotly.js rendering + parameter controls + 3D toggle would still need to be built exactly as scoped, regardless of whether A2UI sits on top. A2UI solves a different problem: an *agent* dynamically deciding, per-turn, what kind of UI to show next. Our feature has no such dynamic-decision point — the frontend already knows deterministically when to show the "Interact with it" button (whenever a plot exists) — so adopting A2UI here would just add a protocol/dependency layer with nothing underneath it to plug into.

**Where it might genuinely fit later:** if the compose-bar assistant (`COMPOSE_BAR_TICKETS.md`) ever needs to dynamically decide whether to render a chart vs. a table vs. plain text as part of an LLM-composed conversational response, that's exactly the dynamic-UI-composition scenario A2UI is built for — worth revisiting there, not here.

## Dash by Plotly — considered, not adopted

Investigated directly (2026-07-20, checked against Dash's own docs/GitHub, not marketing) in response to the longer-term vision of researchers interactively viewing and testing parameters for visualizations and 3D renderings in Analysis — Dash pitches exactly this, so it deserved a real look rather than a reflexive no.

**What Dash actually is:** a full Python web application framework (Flask + React + Plotly.js under the hood) where the entire app — layout and interactivity — is authored in Python, with widget state changes round-tripping to Python callback functions on a Dash server. It is not a component library importable into an existing React app; it's a complete, separate application model. Same category as the A2UI verdict above: adopting it wouldn't remove any of Tickets 1-3's actual work, it would just add a different app framework on top of it.

**The 3D/interactive charting itself adds nothing beyond what Tickets 1-3 already plan.** `dcc.Graph` (Dash's chart component) is confirmed to be a thin wrapper that renders whatever Plotly figure object it's handed, via the open-source `plotly.js` library — the exact same library `react-plotly.js` already wraps directly in Ticket 3's plan. Dash's `scatter3d`/`surface`/`mesh3d` support is the same underlying Plotly.js trace types this doc already specs, not something extra Dash brings.

**Embedding it into Denario's existing app has real friction, and the good path is paywalled.** Two ways to embed a Dash app in another site: a plain `<iframe>` (free/open-source) — Dash's own docs confirm this can't share the host app's authentication/session model and has awkward bidirectional data flow; or "Embedding Middleware" (real bidirectional state, SSO) — confirmed to be a **Dash Enterprise / Plotly Cloud paid feature**, not available in open-source Dash. Neither fits a feature meant to sit inline in an existing page the way the "Interact with it" popup (Ticket 3) is designed to.

**What's worth keeping, as UX reference only:** `dash-daq` (Dash's control-widget library — Knob, Gauge, ToggleSwitch, ColorPicker, styled like real instrument panels) is a genuinely good reference for what Ticket 3's parameter control panel could look like (a knob for a continuous parameter, a gauge for a read-only derived value) — but it's a Dash-Python package, not importable into a React app. The ideas transfer; the package doesn't. See the note added to Ticket 3 below.

**Verdict: don't adopt Dash.** Tickets 1-3's existing architecture (client-side `react-plotly.js` in Denario's own React app, driven by a backend-derived declarative chart spec) is already the right shape for this vision — this investigation confirms it rather than changes it.

## No schema changes needed for `StageResultData`'s `kind` discriminant, but worth knowing

Every `StageResultData` variant already carries a `kind` field (`'idea' | 'methods' | ... `), but nothing in the frontend ever reads it at runtime (`StageResultCard`'s dispatch switches on `stageId`, not `.kind`) — confirmed via grep, zero usages. There is no existing schema-driven/dynamic-composition pattern in this codebase today; Tickets 1-5 don't need to invent one (a plot either has an interactive companion available or it doesn't — a simple boolean/URL-presence check, same shape as `usePdfAvailability`), but if a broader per-artifact-kind dynamic renderer is ever wanted later (images vs. tables vs. code, per Ticket 5 and beyond), this would be the first real use of that unused discriminant.

## Verification (once any ticket is picked up)

- Ticket 1: run a real Analysis stage end-to-end and confirm `input_files/scripts/*.py`, `input_files/data/*.csv`, and `plot_manifest.json` are populated correctly after completion, with each plot filename mapped to the right script and library.
- Ticket 2: call the new endpoint against a real promoted plot and confirm the returned HTML renders a genuine interactive Plotly chart reflecting the same real underlying data (not a placeholder) — verify the scratch-directory data staging actually resolves the script's relative `data/` paths correctly.
- Ticket 3: verify visually (same Playwright-based approach used elsewhere this session) that clicking "Interact with this plot" on a real plot opens a working interactive popup; that at least one real parameter control (color, bins, or range) actually changes the rendered chart against real data; that for a plot whose spec declares `supports3d`, the "View in 3D" toggle produces a real rotatable 3D trace (not a fake-depth 2D chart); and that the de-duplicated `PlotThumb` renders identically to the three prior implementations it replaces.
- Ticket 4: confirm a real plot's caption now shows real, non-fabricated text pulled from the actual `structured.sections`/`findings` content.
- Re-confirm at the end of implementing any of these that no file under `cmbagent`'s own installed package was touched.
