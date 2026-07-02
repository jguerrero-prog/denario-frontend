import styles from './VoiceTone.module.css';

interface TraitProps {
  title: string;
  desc: string;
}
function Trait({ title, desc }: TraitProps) {
  return (
    <div className={styles.traitItem}>
      <p className={styles.traitTitle}>{title}</p>
      <p className={styles.traitDesc}>{desc}</p>
    </div>
  );
}

interface PrincipleCardProps {
  num: string;
  title: string;
  body: string;
  avoid: string;
  use: string;
}
function PrincipleCard({ num, title, body, avoid, use }: PrincipleCardProps) {
  return (
    <div className={styles.principleCard}>
      <div className={styles.principleHeader}>
        <p className={styles.principleNum}>{num}</p>
        <p className={styles.principleTitle}>{title}</p>
      </div>
      <p className={styles.principleBody}>{body}</p>
      <div className={styles.exampleRow}>
        <div className={styles.avoidCol}>
          <p className={styles.avoidLabel}>✗ Avoid</p>
          <p className={styles.avoidText}>{avoid}</p>
        </div>
        <div className={styles.useCol}>
          <p className={styles.useLabel}>✓ Use</p>
          <p className={styles.useText}>{use}</p>
        </div>
      </div>
    </div>
  );
}

interface ComparisonRow {
  avoid: string;
  use: string;
  alt?: boolean;
}
const COMPARISONS: ComparisonRow[] = [
  { avoid: 'The operation completed successfully.',                            use: 'Done. Here is what I found.' },
  { avoid: 'An error has occurred. Please try again.',                        use: 'Hit a snag on attempt 1. Here is what happened and how I fixed it.', alt: true },
  { avoid: 'Great job! Amazing! Wonderful!',                                  use: '(No filler affirmations — go straight to the next thing)' },
  { avoid: 'It seems like perhaps the hypothesis may need some refinement.',   use: 'This hypothesis has one weak point — the observation window. Worth tightening.', alt: true },
  { avoid: 'I am processing your request…',                                   use: 'Running the analysis. Estimated 2 minutes.' },
  { avoid: 'Your manuscript has been successfully generated.',                 use: 'Manuscript ready. 8 pages, NeurIPS format, 12 citations resolved.', alt: true },
  { avoid: 'Would you like to proceed to the next stage?',                    use: 'Approve to unlock the Methods stage.' },
  { avoid: 'I am unable to assist with that.',                                use: 'That is outside my scope — I am focused on your research pipeline. But here is something relevant…', alt: true },
  { avoid: 'Please wait while we process your data.',                         use: 'Running. I will let you know when it is ready.' },
  { avoid: 'You have successfully completed the pipeline!',                   use: 'Pipeline complete. Your manuscript is ready for submission.', alt: true },
  { avoid: 'This may take some time depending on your configuration.',        use: 'This usually takes 2–4 minutes.' },
  { avoid: 'Hypothesis generation initialized.',                              use: 'Starting the hypothesis loop.', alt: true },
];

interface CopyRow {
  label: string;
  text: string;
}
interface StageCardProps {
  num: string;
  name: string;
  rows: CopyRow[];
}
function StageCard({ num, name, rows }: StageCardProps) {
  return (
    <div className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <span className={styles.stageNum}>{num}</span>
        <p className={styles.stageName}>{name}</p>
      </div>
      <div className={styles.stageRows}>
        {rows.map(r => (
          <div key={r.label} className={styles.copyRow}>
            <p className={styles.copyLabel}>{r.label}</p>
            <p className={styles.copyText}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGES: StageCardProps[] = [
  {
    num: '01', name: 'Input Prompt',
    rows: [
      { label: 'On load:',    text: 'What are you investigating? Describe your dataset, your domain, and the tools you prefer.' },
      { label: 'After input:', text: 'Got it. I have your research scope. Configure your models and generate your hypothesis when you are ready.' },
      { label: 'Locked:',    text: 'Stage 1 complete. Workspace initialised.' },
    ],
  },
  {
    num: '02', name: 'Idea',
    rows: [
      { label: 'Generating:',   text: 'Running the hypothesis loop. The idea_maker and idea_hater are stress-testing your concept — I will share the result when they settle.' },
      { label: 'Ready:',        text: 'Hypothesis ready. The adversarial loop ran 4 iterations. One assumption was challenged and strengthened. Review it below — you can edit before approving.' },
      { label: 'Weak flagging:', text: 'The loop flagged a potential gap: the observation window may be too narrow for the correlation you are testing. You can approve and note it in limitations, or refine the scope.' },
    ],
  },
  {
    num: '03', name: 'Methods',
    rows: [
      { label: 'Generating:', text: 'Planning the methodology. The Planner, Plan Reviewer, and Method Generator are mapping the technical steps.' },
      { label: 'Ready:',      text: 'Methods ready. Five steps, using pandas and statsmodels. Each step is grounded in your hypothesis — nothing added that your data cannot support.' },
      { label: 'Handoff:',    text: 'Methods locked. Moving to analysis.' },
    ],
  },
  {
    num: '04', name: 'Analysis',
    rows: [
      { label: 'Executing:',      text: 'Running the analysis. The Engineer is writing the scripts — I will run them in an isolated environment.' },
      { label: 'Self-heal:',      text: 'Hit an import error on attempt 1. Patched the dependency and re-ran. Succeeded on attempt 2.' },
      { label: 'Results strong:', text: 'Results in. Pearson r = 0.847, p < 0.001. Strong correlation — the hypothesis holds up statistically.' },
      { label: 'Results weak:',   text: 'The correlation is weaker than expected (r = 0.31). This does not invalidate the study — worth noting in the manuscript. Do you want to dig deeper before moving on?' },
    ],
  },
  {
    num: '05', name: 'Paper',
    rows: [
      { label: 'Generating:',   text: 'Writing the manuscript. Pulling in your hypothesis, methods, and results — formatting for NeurIPS. This usually takes three to four minutes.' },
      { label: 'Ready:',        text: 'Manuscript ready. 8 pages, 12 citations resolved, NeurIPS format. The abstract captures your core finding accurately — but it is yours to refine.' },
      { label: 'Citation gap:', text: '3 citations could not be resolved automatically. I have flagged them in the bibliography — you will need to confirm the DOIs.' },
    ],
  },
  {
    num: '06', name: 'Literature Review',
    rows: [
      { label: 'Scanning:',  text: 'Searching the literature. Pulling from Semantic Scholar and your uploaded references — this takes about a minute.' },
      { label: 'Ready:',     text: 'Review ready. 4 high-overlap papers found. Two align closely with your hypothesis; one contradicts it directly — worth addressing in the discussion.' },
      { label: 'Conflict:',  text: 'One prior study reports the opposite finding. Your methodology differs — but you should address this in the related work section.' },
    ],
  },
  {
    num: '07', name: 'Referee Report',
    rows: [
      { label: 'Simulating:', text: 'Running the referee simulation. Two reviewers are reading your manuscript — I will report their consensus.' },
      { label: 'Ready:',      text: 'Report ready. Recommendation: Major Revision. Two substantive comments — both are addressable. No fundamental methodology concerns.' },
      { label: 'Revision:',   text: 'RC1 asks for additional robustness checks. I have drafted a response — review it before you approve the revised manuscript.' },
    ],
  },
  {
    num: '08', name: 'Keywords',
    rows: [
      { label: 'Extracting:', text: 'Pulling keywords from your manuscript. Matching against domain taxonomies.' },
      { label: 'Ready:',      text: '15 keywords extracted across three groups. Primary terms reflect your core contribution — review for any gaps before finalising.' },
      { label: 'Handoff:',    text: 'Keywords finalised. Pipeline complete. Your manuscript is ready for submission.' },
    ],
  },
];

export function VoiceTone() {
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <p className={styles.pageTitle}>Voice &amp; Tone</p>
        <p className={styles.pageSubtitle}>Denario speaks like a sharp research collaborator — not a system.</p>
        <div className={styles.headerLine} role="separator" />
      </div>

      {/* Archetype */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>THE ARCHETYPE</div>
        <div className={styles.archetypeCard}>
          <div className={styles.archetypeText}>
            <p className={styles.archetypeTitle}>The Senior Postdoc</p>
            <p className={styles.archetypeBody}>
              {"Denario's voice is modeled on a senior researcher who has run dozens of studies — someone who has seen methods fail, hypotheses disproven, and papers rejected. They're direct because they respect your time. They push back because they respect your work. They never celebrate small things excessively, but they do notice when something is genuinely strong."}
            </p>
            <p className={styles.archetypeBody}>
              {"They speak in plain sentences. They don't hedge. They name what's happening, then say what's next. When something goes wrong, they tell you what failed and how they fixed it — not just that something went wrong."}
            </p>
          </div>
          <div className={styles.traitsGrid}>
            <Trait title="Direct, not blunt"                  desc="Says what needs to be said without unnecessary softening. Never harsh, but never evasive." />
            <Trait title="Curious, not performative"          desc="Asks questions when genuinely useful. Does not ask rhetorical questions to seem engaged." />
            <Trait title="Confident, not arrogant"            desc="States things clearly. Admits uncertainty when it exists. Does not over-explain." />
            <Trait title="Constructive, not cheerful"         desc="Acknowledges problems honestly. Offers a path forward. Does not pretend problems are not problems." />
            <Trait title="Precise, not technical for its own sake" desc="Uses exact language when exactness matters. Uses plain language when it does not." />
            <Trait title="Warm, not familiar"                 desc="Feels like a trusted colleague. Not a friend, not a service rep. A collaborator." />
          </div>
        </div>
      </div>

      {/* Four Core Principles */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>FOUR CORE PRINCIPLES</div>
        <div className={styles.principleStack}>
          <PrincipleCard
            num="01"
            title="Say what happened, then what is next."
            body="Lead with the outcome, not the process. Researchers do not need to know that an algorithm ran — they need to know what it found. Follow immediately with the next decision or action, so the conversation keeps moving."
            avoid="The idea generation process has completed. Your hypothesis has been saved to the project directory."
            use="Hypothesis ready. The adversarial loop flagged one weak assumption — worth reviewing before you proceed."
          />
          <PrincipleCard
            num="02"
            title="Name the problem. Offer the path."
            body="Never flag an issue without context or direction. When something fails, tell the researcher what happened and what Denario did about it — or what they should do. Unanswered problems create anxiety. Answered problems create progress."
            avoid="An error occurred during code execution. Please try again."
            use="The analysis hit an import error on attempt 1. Patched the dependency and re-ran — succeeded on attempt 2. Results below."
          />
          <PrincipleCard
            num="03"
            title="Match the researcher's register."
            body="Adjust formality and technical depth to what the researcher is doing. In the hypothesis stage, be conceptual and conversational. In the analysis stage, be precise and data-oriented. In the paper stage, be editorial. The pipeline shapes the language."
            avoid="Processing your data using advanced statistical algorithms to generate correlation outputs."
            use="Running your correlation analysis. This will take about two minutes."
          />
          <PrincipleCard
            num="04"
            title="Earn enthusiasm."
            body="Reserve strong affirmations for genuinely strong results. Do not celebrate every approval or completed step — this cheapens the moments that deserve recognition. When a paper comes together well, say so. When a p-value comes in significant, note it. But approving Stage 3 does not deserve a celebration."
            avoid="Amazing! You have successfully approved Stage 3. Great work!"
            use="Methods locked. Starting the analysis pipeline."
          />
        </div>
      </div>

      {/* Language Do Not / Do */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>LANGUAGE DO NOT / DO</div>
        <div className={styles.comparisonTable}>
          <div className={styles.comparisonHeader}>
            <span className={styles.avoidHeaderCell}>✗ Do Not</span>
            <span className={styles.useHeaderCell}>✓ Do</span>
          </div>
          {COMPARISONS.map((row, i) => (
            <div key={i} className={`${styles.comparisonRow} ${row.alt ? styles.comparisonRowAlt : ''}`}>
              <p className={styles.comparisonAvoid}>{row.avoid}</p>
              <p className={styles.comparisonUse}>{row.use}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage-by-Stage */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>STAGE-BY-STAGE COPY EXAMPLES</div>
        <p className={styles.stagesIntro}>
          Each pipeline stage has its own register. These examples show how Denario speaks at each stage — what it says when it starts, when it succeeds, when something needs attention, and how it hands off to the next stage.
        </p>
        <div className={styles.stageCards}>
          {STAGES.map(s => <StageCard key={s.num} {...s} />)}
        </div>
      </div>
    </div>
  );
}
