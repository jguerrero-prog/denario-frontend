# Smart, context-aware compose bar — implementation tickets

## Context

The compose bar at the bottom of the conversation panel (`ConversationThread.tsx`'s `ComposeBar`) currently only posts plain text messages — it can't answer questions, edit stage content, or trigger anything. The goal is a real assistant scoped strictly to the current project: answer questions grounded in stage data ("what's step 6 in my methods again?"), make targeted edits ("add this code block to step 6"), trigger re-runs ("run an analysis with this new change"), and eventually edit plots/manuscript captions.

This isn't exotic — it's the same tool-calling-LLM-agent pattern used elsewhere, just scoped to Denario's own project data instead of a codebase. The right mental model: one LLM call with a small, fixed menu of tools (read a stage, edit a stage field, start a stage, run a one-shot task), not multiple different "agents" being routed between.

**Interaction style, not just a feature:** every response should feel like talking to a context-aware collaborator, not a rigid command parser — (1) briefly reflect back what it understood the request to be, (2) answer or propose an action grounded in real project data, (3) leave an explicit opening to redirect ("let me know if you meant something different"). The output shape is never just "here's the answer" — it's "here's what I think you're asking + here's the grounded answer/proposal," which is also the same shape needed for confirm/cancel UI on mutating actions.

**"Why did you..." questions need real grounding, not invented justification — and nothing about this gets baked into the schema or the stage cards.** The reasoning behind a choice like "why Pearson" isn't currently recoverable consistently: the Rigorous/cmbagent track saves its chat history (`chat_history_step_N.json`, `cmbagent.py:1269`) but the Standard/fast track's Methods generation (`methods_fast()` in `denario/langgraph_agents/methods.py`) is a single structured-output call with no reasoning artifact saved at all. **This is answered entirely on demand, in the conversation thread, not by pre-computing and storing a rationale anywhere.** When a why-question comes in about a Rigorous-track-generated stage, the assistant reads that stage's existing `chat_history_step_N.json` live and reasons from it. When the stage was generated via the Standard/fast track, there's no such record — the assistant says so plainly rather than invent one. No schema field, no generation-time change, no change to how stage cards render — this is purely something the classification endpoint (Ticket 3) does at answer-time, folded into context assembly (Ticket 2). This generalizes to every stage that shares the same Rigorous-track cmbagent call (confirmed: Methods and Idea both do, since `chat_history_step_N.json` is written by the shared `cmbagent.planning_and_control_context_carryover()` call itself, not anything stage-specific) — with zero extra schema work, since there's no schema involved at all.

**Engine: LangGraph, not AG2.** Checked AG2 (`autogen`)'s own docs, product positioning, and cmbagent's actual usage — all three describe/use it for multi-agent coordination, not a single flexible assistant (AG2 docs: "strictly designed for coordinating multiple specialized agents"; product page: "The Operating System for AI Agents"). `ConversableAgent` is technically tool-call-capable but fights the ecosystem's grain. LangGraph natively supports single-agent flows with human-in-the-loop control, and Denario's own Standard/fast track already runs on it (`denario/langgraph_agents/methods.py`) — extending an already-vendored dependency instead of introducing AG2 in a new role.

`cmbagent.one_shot()` (`cmbagent.py:2041`) is a real, existing lighter-weight primitive — a single `engineer` agent (no planner/reviewer loop) with an optional VLM-based `plot_judge`/`plot_debugger` pair. This is the foundation for new-plot generation and plot regeneration (Tickets 9-10); it's never been exposed through `Denario` or the API before.

## Architecture: two entry points, one shared action registry

**Don't build a feature per example — build one registry of actions, reachable two ways.** Every capability (edit Methods, rephrase a manuscript section, regenerate a plot, rerun a stage) is a well-defined backend action with a clear parameter shape. There are two doors into that same registry:
- **Freeform (natural language):** a single LangGraph classification call reasons about an ambiguous or exploratory message and, if it recognizes a match, invokes the matching registry action itself. If it doesn't call a tool, its plain-text reply is just a grounded answer.
- **Explicit (`/` command):** the researcher picks a known action directly from a dropdown, the UI prompts for missing parameters, and it calls the *same* backend action directly — no classification, no ambiguity, faster.

**Rubric — registry-eligible vs. freeform-only:**
- **Registry-eligible** when the outcome is unambiguous once invoked (rerun a named stage, regenerate a named plot with a stated change, rephrase a named section) — the system doesn't need to reason about *what* to do, only execute it.
- **Freeform-only** when the value is in the reasoning itself — stress-testing an idea, comparing pasted content against stored steps, asking "why," deciding whether a request needs a clarifying question first. Deliberately never fully enumerable — this is the permanent escape valve for everything not on the registry, by design.
- Some requests are both: "compare these 5 pasted steps against our methodology" has a clean parameter shape but its execution is inherently an LLM reasoning task, not a deterministic pipeline.

This pattern is validated by Anthropic's own Claude Science product (announced at "The Briefing: AI for Science"): "Claude loads a skill automatically when the work calls for it. Type `/` in the composer to open the skill picker and insert one explicitly" — the same two-entry-point-into-one-registry design, shipped.

### Draft skill registry (v1 starter set — extensible, not exhaustive)

| Command | Backend action | Status |
|---|---|---|
| `/rerun-stage <stage>` | Re-runs any stage on demand | **Reuse** — wraps existing `startStage()`/`_call_stage()` + defensive stage-order guards. Covers "rerun analysis," "run peer review again," "regenerate keywords" as one parameterized command. |
| `/edit-methods <instruction>` | Targeted structured edit to Methods, preview-then-confirm | New — Ticket 5, exposed as a direct entry point. |
| `/rephrase-section <section> <instruction>` | Targeted rewrite of one of the manuscript's 4 fixed top-level sections | New — Ticket 8, exposed as a direct entry point. |
| `/add-plot <description>` | Generates a new plot from scratch via `cmbagent.one_shot()` | New — Ticket 9. |
| `/regenerate-plot <plot> <instruction>` | Regenerates a named existing plot with a stated change | New — Ticket 10, exposed as a direct entry point for when the plot and change are both already known. |

**Deliberately not in the registry:** a "show me step 6" / "find X" lookup command (redundant with the right panel — the composer isn't a finder), and live interactive Plotly-based plot editing (considered, designed, deliberately descoped as disproportionate to the actual researcher need — see Ticket 10's background).

This list is a starting point, not a ceiling — the registry is designed to grow as real usage surfaces more well-defined, repeatable requests.

### Grounded "easy wins" research — verified against real code, supersedes speculative proposals

A later "digital lab" commands/mentions proposal suggested things like `/regress`, `/explain-anomaly`, `/optimize-code`. Rather than accept or reject those from memory, did a systematic pass over the actual `Denario`/`cmbagent` codebases (3 parallel research agents: Denario's full public API + REST surface, cmbagent's real agent/tool roster, and every real file Denario writes per stage).

**Confirmed NOT to exist — these need new agent-level work, not just wiring, so don't scope them as quick registry additions:**
- Statistical regression/correlation analysis on a dataset — zero matches anywhere in cmbagent.
- Anomaly/outlier detection — zero matches.
- Code refactoring/optimization as a distinct capability — no such agent or mode; only a prompt instruction telling the `engineer` agent to write efficient code the first time.
- "Deep research" as a mode distinct from the standard pipeline — `deep_research` is a plain import alias for the exact same `planning_and_control_context_carryover()` function used everywhere else (`cmbagent/__init__.py:25`). Not separate code.

**Confirmed real, working, callable today, with zero REST endpoint — genuine easy wins (thin wrapper, not new agent work):**

| Denario method | What it does | Candidate command |
|---|---|---|
| `research_pilot(data_description)` | Runs the entire pipeline end-to-end in one call | `/run-all` |
| `enhance_data_description(...)` | cmbagent-based enrichment of the data description | `/enhance-description` |
| `get_results(restart_at_step=N)` | Resumes a partially-failed analysis instead of restarting — parameter exists today but `runner.py` calls `get_results()` with zero arguments | `/resume-analysis` |
| `cmbagent.process_single_pdf`/`process_folder` (Mistral OCR, exported at package level, unused by Denario) | Real OCR, PDF → markdown | `/ocr-pdf` |
| `cmbagent.arxiv_filter(input_text)` | Extracts arXiv URLs from text, downloads the PDFs | `/fetch-arxiv` |
| `cmbagent.preprocess_task(...)` | Chains arXiv-download → OCR → summarize in one call | compound command building on the two above |
| `check_idea_futurehouse()` | Alternate novelty-check track (FutureHouse "owl" service) — hardcoded unreachable today (`literature` stage always calls `check_idea(mode='semantic_scholar')`) | possible `/check-novelty` variant — note this adds an external service dependency, unlike the others |

Also found: `RunStageRequest.model_overrides` (`api/models.py:34`) is a field that's defined but **never read anywhere in `runner.py`** — wiring this up would let per-agent model selection (e.g. "regenerate methods using claude-opus-4") actually work, today it silently does nothing.

### "@" mentions — corrected real-file target list

Real, reliably-present files as of the actual code (not the earlier speculative list): `@description` → `data_description.md`, `@idea`/`@hypothesis` → `idea.md`, `@methods` → `methods.md` (+ `methods.json`, still the only structured sidecar that exists), `@results` → `results.md`, `@plots` → `input_files/plots/*.png` (bare directory, no index — enumerate via the existing `GET /projects/{id}/files` recursive lister), `@literature` → `literature.md`, `@referee` → `referee.md`, `@paper`/`@manuscript` → the `paper/paper_v*.tex` files + the API's derived `manuscript.tex` copy. `@keywords` now works too (see fix below).

**⚠️ Critical correctness note — a mention MUST NOT restrict the message to read-only/discussion.** This was caught as a real usability flaw a user would hit immediately: type `@methods, add a robustness check using bootstrapped CIs` expecting an actual edit, and get back a discussion instead, because the mention silently locked the message into an answer-only path. This is wrong and must not be implemented that way. A mention is *only* a context-scoping hint — it tells the classification call (Ticket 3) which file to focus on, nothing more. The **same** classification call, with the **same** `propose_edit`/`propose_run` tools available, still runs regardless of whether a mention is present — "add a robustness check" must still get classified as an edit request and go through `propose_edit(stage='methods', ...)` → preview → confirm, exactly as it would with no mention at all and the stage inferred from context. If a message is genuinely ambiguous between "just discuss this" and "please make this change" (e.g. *"what do you think of the bootstrap approach"*), that's what the existing "paraphrase what was understood, invite steering" interaction-style principle is for — not a reason to hardcode mentions as answer-only. Whoever implements Ticket 2/3 should treat this as a required behavior to test explicitly, not an edge case to discover later — a mention-scoped edit request is exactly as valid as a mention-scoped question.

**User journey — where `@` actually earns its keep across a project's lifecycle** (banked here, still being fleshed out):

| Where the researcher is | Already complete | They type | What `@` does | Why it matters |
|---|---|---|---|---|
| Starting Methods | `@description`, `@idea` | *"Does `@description` mention anything about missing data that could bias this hypothesis?"* | Scopes to just `data_description.md` | Builds the `@`-means-"look here specifically" habit early, even when there's little else to disambiguate yet |
| Drafting Methods | `@description`, `@idea` | *"Compare the regression approach I'm about to write against what `@idea` actually claims — does OLS make sense given the causal claim there?"* | Scopes to `idea.md` as the comparison target | Prevents methods from silently drifting from what the hypothesis argues |
| Methods just generated | `@methods` | *"Why does `@methods` step 3 use Pearson instead of Spearman?"* | Scopes to `methods.md`/`methods.json` so "step 3" resolves unambiguously | `@methods` picks *which* file; the actual justification still comes from the separate chat-history grounding mechanism |
| Analysis just finished | `@idea`, `@results` | *"Does `@results` actually support the claim in `@idea`, or did we overstate it?"* | Two mentions in one message, nothing else pulled in | Cross-stage comparison as an explicit ask, not an accidental byproduct of dumping the whole project in |
| Reviewing a figure | `@plots` | *"Which plot in `@plots` shows the strongest correlation?"* | Scopes to the plots folder, not `results.md` prose | Separates "what the numbers say" from "what the images show" |
| Drafting the manuscript | `@manuscript`, `@results` | *"Does the abstract in `@manuscript` overstate what `@results` actually found?"* | Reads only manuscript + results | Real scientific-integrity check; only works cleanly if unrelated stages aren't also dragged in |
| Checking prior art | `@literature` | *"Did `@literature` find anything that already tested this exact hypothesis?"* | Scopes to `literature.md` | Low-ambiguity baseline case |
| After peer review | `@referee`, `@manuscript` | *"Summarize the harshest criticism in `@referee` and check whether `@manuscript` already addresses it."* | Reads both, nothing else | Matters most once 6+ stages exist and "answer from everything" gets slow/noisy |
| Final polish | `@keywords`, `@manuscript` | *"Do `@keywords` actually match what's emphasized in `@manuscript`?"* | Scopes to the two smallest, most specific files | Catches an extraction miss right before submission |

Pattern across all rows: `@` is never required — it's an escape hatch from the default "concatenate every completed stage" behavior, and its value grows as more stages accumulate (ties directly to the token-growth risk already flagged on the context-assembly ticket).

**Second user journey — researchers wanting to ADD their own context via `@`, not just reference existing content.** This is a genuinely different mechanic from the journey above, and mapping it out honestly splits into three categories, not one:

| Where the researcher is | They type | What they're adding | Ephemeral or persistent? | What actually handles it |
|---|---|---|---|---|
| Before Methods is generated | *"`@description` — one thing I didn't mention: the 2021 sensor readings had a known calibration drift, factor that into the methods you write."* | A caveat not in any saved file | Persistent — should shape generation | Not a new mechanism. This is just the free-text prompt Methods generation already accepts; `@description` scopes what existing content the assistant reads alongside the new note |
| Reviewing Idea, wants a quick gut-check | *"`@idea` — hypothetically, if I dropped the causal language, would reviewers still buy this? Don't change anything."* | A one-off hypothetical | Ephemeral — applies to this answer only | Already works today via the grounded-answer path (Phase A) — the note lives in this message's context, nothing gets saved |
| Methods already generated, wants a permanent addition | *"`@methods` — add a robustness check using bootstrapped confidence intervals, my advisor asked for this."* | A real, lasting addition to the stored methodology | Persistent — changes the artifact | This is the Methods edit-preview-confirm flow (Ticket 5) already designed. `@methods` just routes *where* the edit targets; the mechanism is the existing edit ticket, not new `@`-specific behavior |
| Mid-Analysis, wants to flag something without disrupting the run | *"`@results` — just noting for later, don't act now: station 14's sensor had 3 months of missing data, might need a sensitivity check eventually."* | A flagged note meant to persist but not trigger anything yet | Persistent, but **not** an edit and **not** ephemeral | **No real mechanism for this today — a genuine gap, not something to paper over.** Not the conversation history (turn-scoped), not the edit flow (nothing should change right now) |
| Drafting the manuscript, incorporating outside feedback | *"`@manuscript` — a colleague said the discussion undersells the effect size, incorporate their view."* | Third-party feedback content | Persistent — changes the artifact | Same as Methods: the manuscript-section rewrite flow (Ticket 8) already designed, `@manuscript` just routes it |
| Wrapping up, thinking about a future paper | *"`@keywords` — flag 'urban heat island' for a follow-up paper, not this one."* | A note deliberately not for this project | Neither | Out of scope entirely — belongs to a different project's context, not this one's |

**Takeaway: "add your own context via `@`" is three features, not one, and only the middle case is genuinely unbuilt.** Ephemeral notes already work (they're just part of the message, no new engineering). Persistent additions to a stage's real content already have a mechanism — the propose-edit flow already designed for Methods/Paper, with `@` only picking the target, not a new capability. The open gap is the *"remember this, but don't act on it yet"* case — it's not a file edit (nothing should change right now) and it's not conversation history (that's scoped to one session's back-and-forth, not durable across sessions/regenerations). Deliberately not designing a mechanism for this yet: doing it carelessly would also cut against Denario's own human-in-the-loop principle — a silently-stored note that later shapes a regeneration without the researcher seeing it applied at the time defeats "propose, don't auto-execute." If this gets built later, it should surface and require confirmation *at the moment it's actually used*, not just accumulate silently in the background.

**Third user journey — cascading edit from the manuscript back through Methods → Analysis → Paper.** A user-supplied scenario that stress-tested the design and caught one real command-naming error (`/enhance` used where `/methods` was meant) plus a genuinely new requirement (Ticket 5 needs conversation history, not just the instruction string). Corrected version:

| Step | User action | What actually happens | Ticket(s) |
|---|---|---|---|
| 1 | Reviewing the manuscript, notices a Methods step is unclear and Analysis's output doesn't read cleanly either | — | — |
| 2 | Types `@methods`, asks about the unclear step | No-tool-call branch — grounded answer using Methods (+ Idea/description as relevant), no mutation | Ticket 2, 3 |
| 3 | Back-and-forth for a few minutes, arrives at a fix | Full conversation history is part of context on every turn — this is what makes the multi-turn exchange coherent | Ticket 2 |
| 4 | Types `/methods`, "factor in what we just discussed" — **not** `/enhance`, which only ever touches the data description | Classification recognizes an edit request → `propose_edit(stage='methods', ...)`. The edit-generation call needs the recent conversation, not just this one instruction, to resolve "what we discussed" | Ticket 3, 5 |
| 5 | Reviews the preview, confirms | New content written to `methods.md`/`methods.json` — no versioning exists, this simply becomes the only current content | Ticket 5 |
| 6 | — | Analysis and Paper are already complete, both downstream of Methods — now stale. Guard should flag this explicitly, not stay silent and not auto-cascade | Ticket 6 |
| 7 | Confirms the proposed Analysis rerun | Rerun reads `methods.md` from disk — already the new content from step 5. No special "remember the new methods from chat" mechanism needed; this is just normal file-based pipeline propagation | Ticket 6, 7 |
| 8 | — | Once Analysis produces new `results.md`, Paper is now stale too — same flag-and-propose pattern repeats | Ticket 6 |
| 9 | Confirms Paper regeneration | `get_paper()` reads the new `methods.md` and new `results.md` automatically — manuscript reflects the full chain of changes | (Paper regen — not yet its own ticket) |

**Edge case worth naming:** if the researcher shortcuts to "rerun analysis with the new methods" in one message before ever confirming the Methods edit from step 5, that's a compound request — classification needs to sequence it as two proposed steps (confirm the pending edit, then rerun), not merge or silently pick one. Already a documented Ticket 3 requirement; this is a concrete instance of it.

### Three real bugs found during this research — already fixed, independent of compose-bar status

1. **Referee stage was unreadable via the API.** `api/runner.py`'s `STAGE_FILES["referee"]` said `referee_report.md`; the real file (`denario/config.py`'s `REFEREE_FILE`) is `referee.md`. Fixed the API constant + matching hardcoded frontend strings in `stageConfig.ts`/`stageRunner.ts`/`ComponentLibraryPt2` specimens.
2. **Keywords stage never wrote a file at all.** `Denario.get_keywords()` only set an in-memory field. Added `KEYWORDS_FILE` to `denario/config.py` and made `get_keywords()` write `input_files/keywords.md`, reusing `show_keywords()`'s existing markdown-formatting logic (handles both the UNESCO-list and AAS-dict-with-URLs shapes) — verified end-to-end with a mocked `cmbagent.get_keywords` for both branches.
3. **Literature Review had the same naming mismatch, frontend-only.** `literature_review.md` was hardcoded in 4 places; real file is `literature.md`. Cosmetic (doesn't break real fetches) but fixed for consistency.

All verified: Python syntax-checked, frontend typechecked, the affected Storybook test re-run clean.

**Note on status:** the candidate commands above (`/run-all`, `/enhance-description`, `/resume-analysis`, `/ocr-pdf`, `/fetch-arxiv`, etc.) are research findings, not yet-formalized tickets — they inherit the same "not ready to build" status as Tickets 1-11 below, just with much better grounding than the earlier speculative proposals. The three bugs above are the only things from this research that were actually executed, since fixing a wrong filename constant is independent of the compose-bar problem-statement pause.

### Command parameters: picker vs. free text — and a real naming pass

**Rule:** a parameter gets a picker (reusing the exact same real data the `@` mention list already uses) when its valid values are a small, enumerable, real set. It stays free text when it's genuinely open-ended prose.

- **Picker:** `<stage>` (exactly 8 real, fixed stages — reuses the `@mention` stage list; also guards against typos like "analize") and `<plot>` (plots have arbitrary timestamp-suffixed filenames with no memorable name to type — a picker with thumbnails, reusing the plots folder listing, is the only usable UX).
- **Free text:** `<description>`, `<instruction>`, `<question>` — anything that's genuinely open-ended stays natural language, consistent with "not a rigid command parser."

**Renamed, with parameter type marked:**

| Command | Parameter(s) | Real backend call |
|---|---|---|
| `/rerun [stage: picker]` | picker | Existing `startStage()`/`_call_stage()` |
| `/autopilot` | none | `Denario.research_pilot(data_description)` |
| `/resume` | none | `Denario.get_results(restart_at_step=N)` |
| `/enhance` | none — fixed single target (the data description) | `Denario.enhance_data_description(...)` |
| `/plot [description: free text]` | free text | `cmbagent.one_shot(agent='engineer', ...)` |
| `/replot [plot: picker] [instruction: free text]` | picker + free text | Same `one_shot()` + VLM `plot_judge` |
| `/scan-pdf` | none (attached file) | `cmbagent.process_single_pdf`/`process_folder` |
| `/arxiv [text: free text]` | free text | `cmbagent.arxiv_filter(input_text)` |
| `/ingest-refs` | none (attached files) | `cmbagent.preprocess_task(...)` |
| `/camb [question: free text]` | free text | `cmbagent.one_shot(agent='camb_context', ...)` |
| `/classy [question: free text]` | free text | `cmbagent.one_shot(agent='classy_context', ...)` |
| `/prior-art` | none | `Denario.check_idea_futurehouse()` |

**Important scoping note on `/enhance`:** it stays a fixed, single-target command (always the data description) to remain a true easy win — it's one specific backend function with exactly one valid target, so no picker is needed or possible. **A generalized "`/enhance` any stage, picker + instruction" is a different, bigger thing** — that's the same shape as `/edit-methods`/`/rephrase-section` (new per-stage LLM logic to generate an edit from an instruction), not a wrapper around an existing function, so it would not belong in the "achievable with current backend" tier if built that way.

**Clarified: "stages rendered more than once" doesn't mean multiple saved versions to pick between — that doesn't exist.** There is no undo/version history anywhere in `ProjectRunner` (confirmed multiple times this session) — every regeneration overwrites the previous content, so at any moment there's exactly one current version of a stage on disk, nothing to pick *between*. A version-history picker would require building real version tracking first (ties to the provenance-tracking gap already logged as out of scope for the compose bar) — it's not a UI question, it's a missing capability.

### Noted for later (not v1, don't reinvent awkwardly when the time comes)
- **Scoped confirmations**: Claude Science's permission model supports Once / Always / This conversation / This project / Global rather than re-confirming every action forever. Worth adding once the basic propose/confirm flow (Tickets 5, 7) is proven out.
- **An independent verification pass**: Claude Science runs an automatic "reviewer" step that re-checks its own claims against the actual execution record. A lightweight version of this could verify Phase-A-style grounded answers against real stage content before they reach the researcher — stronger than relying on system-prompt discipline alone.
- **Provenance tracking** (generating code + execution log + environment per artifact) is the real, proper fix for the plot→script traceability gap found during Ticket 10's research (see below) — out of scope for the compose bar itself, since it would mean re-architecting how Denario's Analysis stage saves its own artifacts. **Concrete design reference found 2026-07-20** (see the `ai4s-research/open-science` investigation section below): a two-ledger pattern — an append-only *artifact* ledger (`path, version, tool, session_id, content|diff, env, run_id`) and a separate append-only *run* ledger (`run_id, command, hashed entry-script, outputs[], env, log`), joined only by `run_id`, plus content-addressed side-stores for env/log dedup (`env/<hash>.txt`, `logs/<hash>.txt`). Environment capture only needs to be `pip freeze` + interpreter version + platform string, not a container/VM snapshot — this gap doesn't need heavy infrastructure to close. Denario is actually better-positioned to implement this than that reference project was: it orchestrates script execution directly (`experiment.py`/`cmbagent`), so it can record the run→output link with certainty at execution time, rather than reconstructing it via a wall-clock mtime-window filesystem diff the way that project has to (a real misattribution risk it accepts because it doesn't control the arbitrary bash commands its own agent invokes).
- **Should Keywords stop being a sequential pipeline stage and become an ungated action/command instead?** Raised 2026-07-19, after finishing the Keywords stage's real structured-schema work (`denario/structured_keywords.py`/`keywords_parser.py`) and confirming end-to-end that it doesn't feed back into anything: it reads the already-compiled `manuscript.tex` and writes `keywords.md`/`.json`, but nothing downstream consumes that output, and it gates nothing (it's the last stage). This lines up with real-world research done the same day: most journals/conferences (APS/PhySH, JHEP, NeurIPS/ICML's OpenReview keywords) treat keywords as separate submission-portal metadata, not something embedded in the manuscript itself — so Keywords' current disconnection from `manuscript.tex` is arguably *correct* by convention, but that also means it isn't really a "stage" in the same sense Idea→Methods→Analysis→Paper are (each strictly required for the next). Today it's just folded into the generic `/rerun-stage <stage>` registry entry (see the skill registry table above) — worth deciding whether it instead becomes its own always-available, ungated action (not gated behind pipeline sequence/lock state at all) rather than a numbered pipeline stage a researcher has to sequentially unlock and approve. Not scoped further — genuinely a "which model fits" product question, not a technical one; revisit once the compose-bar problem statement itself is unpaused.

## `ai4s-research/open-science` investigation (2026-07-20) — an open-source "Claude Science" alternative

Investigated directly (source code, contributor/commit history, license file, independent benchmark verification — not the project's own README claims) after the user asked about it as a reference for this compose-bar work. **Verdict: don't adopt the project, but it surfaces one genuinely strong design pattern (recorded above) and a few smaller validated reference points.**

**Maturity/risk, checked independently:** ~18 days old (created 2026-07-03), 8 contributors but 95.2% of all commits from a single author, clustered on 3 non-contiguous recent days — a solo sprint, not sustained collaborative development. 855 stars / 97 forks is disproportionate to that contributor depth and coincides with a marketing article published 2 days after repo creation. Real, current bug reports exist in exactly the risk areas that matter most (local file permissions, SSE/UI freezes, session handling). LICENSE file genuinely exists and is MIT for the core app — but the project's own license note self-discloses its bundled "skills" layer is separately/unclearly licensed per-skill, so nothing from that layer should be lifted without individual verification. Its headline "#1 on ResearchClawBench" claim points to a real, independent benchmark, but that benchmark's own leaderboard currently shows no scored runs and doesn't list this project — unverifiable as stated, not confirmed false. Architecturally it's a Tauri desktop app (sidecar process spawning, native filesystem/git access, embedded SQLite, single-instance-per-machine) — nearly everything distinctive about it has no analog in a browser-frontend + remote-backend model like Denario's, so there's no code to port, only ideas.

**Worth taking:**
- The provenance/run-ledger pattern — recorded in the "Noted for later" section above, this is the strongest finding.
- The `/`-command parsing reference — recorded in Ticket 11 above.
- **"Skill descriptions as the classifier"** — its freeform path has no bespoke classification code at all; every registered action's `name`+`description` stays in the model's context and the model's own tool-use loop decides whether/what to invoke (the same convention as Claude Skills). This is a real alternative to this doc's Ticket 3 (a purpose-built LangGraph classification node) — noted here as a considered alternative, not adopted: Denario's registry actions are typed backend functions with clean parameter shapes, which stays more precise and testable than markdown-prompt-driven skill selection, so Ticket 3's planned approach still looks right, but the alternative is worth having on record rather than rediscovering later.
- **Permission-mode-as-config** (defaulted to "approve," seeded once, never silently overridden) validates the spirit of this doc's "propose then confirm, never silently auto-apply" principle — but at a different layer: it gates risky *primitives* (shell/file/network calls), not *skill selection* itself. A skill can be silently auto-chosen and start running before any confirmation fires. Worth noting as a nuance, not a pattern to copy as-is, since this doc's design gates at the action-proposal layer, earlier in the flow.

**Not learned from, architecturally different, not a loss:** its `ai4s-agent` "sequential skill chaining" is a markdown checklist executed inside one continuous LLM session, coordinated only by a shared filename-slug convention between stages — no graph, no typed state, no dynamic re-routing, no nested calls. Weaker than a LangGraph classifier/router node on every axis that matters for testability and control flow; useful only as a cautionary contrast, not a pattern to imitate. Its "OpenCode client abstraction" likewise isn't a multi-LLM-provider abstraction technique — it's "embed an external agent binary and put a thin RPC client in front of it," which has no lesson for a Python backend (like Denario's) that already calls OpenAI/Anthropic/Google directly.

## Suggested build order

**1 → 2 → 3 → 4** are shared prerequisites (schema field, context assembly, the core classifier, streaming). **5 → 6 → 7** (Methods edit → safety guards → run) form one chunk. **8, 9+10** are independent chunks, pickable in parallel once 1-4 exist. **11** (the `/` dropdown) can start as soon as Ticket 5 or 7 has at least one real action to expose.

---

## Status: none of these are ready to build

Every ticket below is labeled **(Do not do)** — reason: not enough context on the problem statement. We cannot proceed to implementation because we do not yet fully know how to articulate the changes we want to make to Denario. This isn't a rejection of any individual ticket's technical content — it's a decision to stop iterating ticket-by-ticket and first reach real clarity on the underlying problem, after repeated rounds of proposing something concrete and finding it didn't match the actual intent (an early literal-lookup "Phase 0," the AG2 engine choice, the shared-registry pivot, and the rationale/context-grounding mechanism twice in a row — Ticket 1 below still reflects the rejected framing and needs rework once this resumes). Keep this list as a record of what's been explored, not a queue to execute.

---

## Ticket 1 — Add a `rationale` field to the Methods schema *(Do not do — reason: not enough context on the problem statement)*

**Description:** Each generated step/point should capture *why* it was chosen, written at generation time, so the assistant can later answer "why did you use X" from a real saved reason instead of inventing one.

**Files:** `DenarioBackend/denario/structured_method.py` (schema), `DenarioBackend/denario/method.py` (Rigorous/cmbagent track prompt), `DenarioBackend/denario/langgraph_agents/methods.py` (Standard/fast track prompt)

**Edge cases:** Projects generated before this field existed will have no rationale — must say so plainly, never fabricate one after the fact. Both tracks need independent verification that they actually populate it — this codebase has already hit a cross-track parity gap once before on structured output, so don't assume parity.

## Ticket 2 — Context-assembly helper *(Do not do — reason: not enough context on the problem statement)*

**Description:** One backend function that gathers every currently-complete stage's content into a single grounding context, reusing the existing per-stage result reader. No new context file, no duplicate content store — Denario's own principle is that every stage output is already a physical file on disk.

**Files:** `DenarioBackend/api/runner.py` (`ProjectRunner._read_result()` at lines 470-493; new `assemble_context()`)

**Edge cases:** Must span every completed stage, not just the active one — cross-stage questions ("what keywords come from these stages so far") need this. Token cost grows as more stages finish (a full manuscript is long) — acceptable for v1, but measure before optimizing, don't guess. Must exclude raw attached data files and execution logs by design — scope is bounded to what a researcher actually reviewed and approved at each stage gate.

**Note (not yet explored) — `state.json` may already be a convenient source for this.** Noticed while inspecting a real in-progress project: `api/runner.py`'s `state.json` already caches each completed stage's `title`/`content`/`structured` (and `tags`, `duration_sec`, `generated_at`) in one file per project — the same shape `_read_result()` builds per-stage, just already aggregated across every stage in a single place. Worth checking, once this ticket is actually built, whether `assemble_context()` can just read `state.json`'s `results` dict directly instead of re-reading/re-parsing individual stage files one at a time — could simplify the implementation, though `state.json` is API-layer bookkeeping (excluded from the file-listing endpoint), not a Denario-generated artifact, so confirm it's reliably kept in sync before depending on it as a source of truth.

## Ticket 3 — Assistant classification endpoint (the core LangGraph node) *(Do not do — reason: not enough context on the problem statement)*

**Description:** The single entry point every compose-bar message goes through. A LangGraph tool-calling node with `propose_edit(stage, instruction)`/`propose_run(stage)` tools available; if it doesn't call a tool, its plain-text reply is the grounded answer. This one call handles answering, editing, and running — not three separate mechanisms.

**Files:** new `DenarioBackend/api/routes/assistant.py`, `DenarioBackend/denario/langgraph_agents/methods.py` (pattern to mirror), `DenarioBackend/api/runner.py` (`_get_den()` at lines 125-130)

**Edge cases:** Must go through `ProjectRunner._get_den()` — never instantiate a second `Denario(project_dir=...)` directly, or state/API keys fork away from the lock-guarded instance `ProjectRunner` already owns per project. Must refuse anything outside the project ("what's the World Cup score") rather than attempt an answer. Compound requests ("add this and rerun analysis") must become multiple proposed steps, not one call that silently merges or picks one. "Step 6" must resolve via one fixed convention (section-number-first, sub-step second) shared by every ticket that addresses a step.

## Ticket 4 — Two-step streaming (POST submit + GET stream) *(Do not do — reason: not enough context on the problem statement)*

**Description:** The ask endpoint has to be POST (free text + potentially large pasted content doesn't belong in a query string); the browser's native `EventSource` (used by the existing `streamStage()`) can only stream over GET, with no body and no custom headers. So: (1) `POST /projects/{id}/assistant/ask` submits the message and returns a request id, (2) the frontend opens a native `EventSource` GET to `/projects/{id}/assistant/stream/{request_id}` to receive streamed tokens — mirroring `streamStage()` almost directly.

**Files:** `Denario/src/api/client.ts` (`streamStage()` — pattern to mirror), `DenarioBackend/api/routes/stages.py:77-95` (existing SSE pattern), `DenarioBackend/api/runner.py:405-414`

**Edge cases:** Don't introduce a second streaming transport (e.g. `fetch().body.getReader()`, or WebSockets) alongside the existing `EventSource`-based one — keep exactly one streaming convention in the app. Decide what happens if the GET stream never connects, or connects twice for the same request id.

## Ticket 5 — Methods edit preview/confirm *(Do not do — reason: not enough context on the problem statement)*

**Description:** Turns a natural-language instruction ("add these three new steps to the original methods") into a schema-constrained proposed edit to Methods, shown as a preview and only saved on explicit confirmation. Two calls: `POST /projects/{id}/stages/{stage}/edit/preview` (LLM returns updated JSON conforming to the existing schema, nothing saved yet) and `POST /projects/{id}/stages/{stage}/edit/confirm` (actually re-saves both files).

**Requirement found via a realistic multi-step scenario, not optional:** the instruction passed to `/edit/preview` is not always self-contained. "Factor in what we just discussed" is a reference to several prior conversation turns (e.g. a back-and-forth where the researcher and the assistant worked out a methodological fix together via `@methods` questions), not something resolvable from the literal command text alone. The edit-generation call must receive the recent conversation history as part of its own context, not just the stage's current JSON + the instruction string — otherwise it has nothing to resolve "what we discussed" against.

**Files:** new edit preview/confirm endpoints, `DenarioBackend/denario/structured_method.py` (schema + `render_methodology_markdown()` reuse)

**Edge cases:** Never call `Denario.set_method()` directly for this — confirmed it only does a raw overwrite of `methods.md` (`denario.py:128-131`) with no awareness of the `methods.json` sidecar, silently desyncing the structured JSON the frontend's result cards depend on. Cancelling the preview must leave both `methods.md` and `methods.json` completely untouched. Only clean for Methods today — Analysis has no structured schema yet. There is no versioning anywhere — once confirmed, the new content simply overwrites the old; there is no "old vs. new" to arbitrate, only whatever currently exists on disk.

## Ticket 6 — Stage-order defensive guards *(Do not do — reason: not enough context on the problem statement)*

**Description:** A real backend check preventing a stage's output from being overwritten or rerun in a way that silently invalidates already-completed downstream stages. Confirmed (not assumed) there is no existing guard for this today.

**Concrete scenario this exists for:** researcher is reviewing a completed manuscript, edits Methods via `/methods` to fix a flagged assumption (Ticket 5), and confirms it. Analysis and Paper are both already complete at that point — both were generated from the *previous* Methods and are now stale. The guard's job is to surface this explicitly ("Analysis and Paper were generated from the previous Methods and are now out of date") and *propose* — never auto-execute — a rerun of Analysis, then the same stale-flag-and-propose pattern again for Paper once Analysis finishes. Denario's own file-based propagation (each stage reads the previous stage's file, not conversation history) means the rerun automatically picks up the new Methods once confirmed — no special chat-context-passing is needed for the rerun itself, only for generating the edit in the first place (see Ticket 5).

**Files:** `DenarioBackend/api/routes/stages.py:21-45` (`run_stage()`), `DenarioBackend/api/runner.py:390-401` (`approve_stage()`)

**Edge cases:** Must block both re-running an upstream stage *and* directly overwriting its file via `approve_stage()` — today the only thing stopping either is UI button state (`canNavigate`/`_statuses`), which a backend-triggered action bypasses entirely. Needs a clear, honest message surfaced to the researcher, not a silent rejection.

## Ticket 7 — Propose-run action *(Do not do — reason: not enough context on the problem statement)*

**Description:** Wires a natural-language or `/rerun-stage` request into the existing stage-run mechanism, shown as a proposed action requiring explicit confirmation before anything actually runs. No new execution engine — glue onto `startStage`/`_call_stage`.

**Files:** `Denario/src/utils/stageRunner.ts` (`startStage()`), `DenarioBackend/api/runner.py` (`_call_stage`)

**Edge cases:** Must reuse Ticket 6's guards, not bypass them. A misclassified "run analysis" must never fire for real before confirmation — this is a genuinely expensive, hard-to-undo action (no undo/versioning exists anywhere in `ProjectRunner`).

## Ticket 8 — Manuscript section rewrite *(Do not do — reason: not enough context on the problem statement; also see superseded note below)*

**Superseded by `LATEX_EDITOR_TICKETS.md` Ticket 4, decided 2026-07-20:** once the LaTeX editor ships, the editor's raw `.tex` buffer becomes the source of truth for Paper edits, and a full-document LLM rewrite (whole current text + instruction → whole new text) replaces this ticket's structured-field approach for *any* post-generation Paper edit — content or structural. Reason: this ticket's mechanism regenerates the entire manuscript from `save_paper()`'s internal field state, which has no way to see a manual edit sitting in the editor buffer and would silently discard it, and it can't express structural changes (new packages/macros/sections) at all since the template is fixed to exactly 4 sections. Left here for the record of what was originally scoped, not to be built as described below.

**Original description (pre-editor, now superseded):** Targeted rewrite of one of the manuscript's four fixed top-level sections (Introduction/Methods/Results/Conclusions) — simpler than the Methods edit since each section is just a plain string field, not a nested schema. Verified `manuscript.tex` always has exactly these 4 sections, in this order, code-enforced (not just prompted) via `latex.py:250-264` plus duplicate-header stripping in `tools.py`.

**Files:** `DenarioBackend/denario/paper_agents/latex.py:215-276` (`save_paper()`), `DenarioBackend/denario/paper_agents/parameters.py:10-22` (`PAPER` TypedDict), `DenarioBackend/denario/paper_agents/tools.py:252-273` (`clean_section()`)

**Edge cases:** Only the 4 top-level sections are code-guaranteed — a request naming a subsection ("the 2nd subsection of Results") needs live parsing and must say so explicitly if ambiguous, never guess. Rewritten content must actually recompile to valid LaTeX/PDF, not just look right as a string.

## Ticket 9 — One-shot code-execution wiring *(Do not do — reason: not enough context on the problem statement)*

**Description:** Exposes cmbagent's lighter-weight single-engineer-agent primitive (`one_shot()`) through Denario and the API for the first time — the shared foundation both new-plot generation (`/add-plot`) and plot regeneration (Ticket 10) need.

**Watch item — re-evaluate build approach when this resumes, don't default to the wrapper below:** cmbagent's own upstream GitHub repo is building a `cmbagent_mcp` module — an MCP server exposing `run_one_shot` (and eventually other cmbagent modes) as a network-callable tool for LLM agents, with a roadmap toward AG2 agent + MCP toolkit integration. As of now it's early (their own "Phase 1 of 4," one tool implemented, no agent orchestration wired yet) and it fronts a *separate* cmbagent HTTP backend service, not the in-process package Denario currently imports — so it's not something to build against today. But if it matures, Denario's assistant (a LangGraph node, which can act as an MCP client) could consume cmbagent's own MCP tool server directly instead of Denario writing and maintaining its own `run_one_shot_task()` wrapper below. Check cmbagent's status on this specifically before starting this ticket for real.

**Files:** new `Denario.run_one_shot_task()` in `DenarioBackend/denario/denario.py`, `cmbagent.one_shot()` (verify only — vendored dependency, `cmbagent.py:2041`)

**Edge cases:** Verify the one-shot engineer agent actually has the same file/data access it has inside the full multi-agent swarm — not guaranteed automatic (per-context tool lists aren't guaranteed to carry over). Must replicate the existing convention of moving generated plots into `project_dir/input_files/plots/` (per `denario.py:769-779`), or the frontend's existing plot-serving path won't pick them up.

## Ticket 10 — Plot regeneration + review *(Do not do — reason: not enough context on the problem statement)*

**Description:** Treats a plot critique ("this line isn't clear enough") as a from-scratch regeneration via Ticket 9 + a VLM plot-judge, not a code patch — because there is **no data structure anywhere connecting a plot's filename to the script that produced it** (verified: `denario/experiment.py:116` only carries forward a flat list of image paths from cmbagent's `context_variables["displayed_images"]`; the working directories where the original scripts briefly exist aren't even copied into `project_dir`). Feed the one-shot engineer agent the current plot image, the analysis context, and the critique; it redraws an improved version informed by seeing what exists today. Shown as a candidate static image, with explicit **Save** (moves the PNG into `input_files/plots/` under a stable filename, overwriting the previous version) and **Add to manuscript** (inserts a new `\includegraphics` block + LLM-drafted caption on first embed; just overwrites the PNG + recompiles if the filename is already referenced) actions.

**Background — considered and deliberately descoped:** A declarative chart-spec + dual Plotly/matplotlib renderer (Plotly for a read-only interactive frontend preview, matplotlib for canonical export) was fully designed for precise parameter-level edits ("make this line dashed," "use accessible colors"). Descoped from v1: it's a lot of new surface area (new frontend dependency, cross-library feature-parity risk, Save/manuscript-sync edge cases) to buy back iteration latency most researchers won't exercise more than a handful of times per plot, when the regenerate-and-review loop already covers the same need with infrastructure Ticket 9 needs anyway. Revisit only if usage shows many (5+) style-iteration rounds per plot.

**Files:** Ticket 9's wiring, `DenarioBackend/denario/denario.py:769-779` (plots-folder convention), `DenarioBackend/denario/paper_agents/latex.py`

**Edge cases:** A vague critique must trigger a clarifying question about which plot/what aspect before regenerating, not a guess. Regeneration must not silently drift the plot's actual substance (data, chart type) when the ask was purely stylistic. "Add to manuscript" must distinguish first-time embedding from re-saving an already-embedded plot via a plain filename search inside the target section's string — not code tracing. Save has no undo (consistent with the rest of the app) — must be an explicit, deliberate click, never automatic.

## Ticket 11 — "/" skill dropdown (frontend) *(Do not do — reason: not enough context on the problem statement)*

**Description:** The explicit entry point into the same action registry the freeform assistant uses — typing "/" opens a list of available actions, prompts for missing parameters, and calls the same backend action directly, skipping classification entirely.

**Reference implementation worth reading, not copying:** `ai4s-research/open-science`'s `Composer.tsx` (see investigation section below) implements exactly this shape — a regex gate (`/^\/\S*$/`) detects `/`-typing, matches against a live command list, "chips" the command on selection or whitespace-commit, and falls through to a normal freeform message if the typed `/word` doesn't match anything registered. Small, clean, and directly comparable to what this ticket needs.

**Files:** `Denario/src/pages/StagePage/ConversationThread.tsx` (`ComposeBar`) — additive here, not a separate component tree

**Edge cases:** Must only list actions actually implemented at that point in rollout — no dead/unbuilt entries. Must produce identical results to the freeform path for the same underlying action — these two entry points must never drift into separate implementations over time.

---

## Verification checklist (per ticket, as each is actually built)

- **Skill registry (11):** same backend action produces identical results via `/` dropdown vs. a freeform message the classifier correctly matches — confirm no drift into two code paths. Dropdown lists only implemented actions.
- **Streaming (4):** confirm tokens deliver incrementally (Network tab: POST returning a request id, then a GET stream connecting) rather than blocking on the full response.
- **Classifier (3):** a literal reference ("what's step 6") and an out-of-scope question ("World Cup score") both handled correctly through the same path. An in-scope open question answered grounded in real stage content (not hallucinated) — spot-check against the actual structured JSON. Pasted-content comparison addresses specific sections/substeps by number, not a generic gloss. **Required, not optional:** confirm a mention-scoped edit request ("`@methods`, add a robustness check using bootstrapped CIs") is correctly classified as `propose_edit`, not silently downgraded to a discussion — this is a documented required behavior (see the `@` mentions section above), not an edge case to discover after the fact.
- **Rationale field (1):** run one real Methods generation on *each* track after adding the field and confirm both actually populate it — don't assume parity.
- **Methods edit (5):** edit instruction produces valid schema-conforming JSON; shown as preview, not saved, until confirm; cancelling leaves both files untouched; confirming updates both consistently.
- **Stage-order guards (6) + propose-run (7):** a proposed run is shown, not executed, until confirmed; the defensive check rejects running a stage whose prerequisites aren't complete.
- **Manuscript rewrite (8):** "rephrase section 2" resolves to the Methods string field every time on a real generated manuscript; rewritten string recompiles to valid LaTeX/PDF; a subsection request either resolves via live parsing or says it's ambiguous rather than guessing.
- **One-shot wiring (9):** verify `one_shot()`'s plot output path directly with a small standalone script before wiring the endpoint.
- **Plot regeneration (10):** vague critique triggers a clarifying question first; regenerated plot is a plausible improvement, not a silent no-op or unrelated redraw; a precise ask ("use accessible colors") applies without the figure's substance drifting; Save/Add-to-manuscript behave per the edge cases above on a real generated manuscript.
