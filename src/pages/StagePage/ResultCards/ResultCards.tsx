import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePipelineStore } from '../../../store/pipelineStore';
import { startStage } from '../../../utils/stageRunner';
import { api } from '../../../api/client';
import { nextStage, STAGE_CONFIG } from '../../../config/stageConfig';
import { ParamSelect, ParamToggle, ParamNumber } from '../../../components/molecules/ParamControls/ParamControls';
import { PlotLightbox } from '../../../components/PlotLightbox/PlotLightbox';
import { PublicationCard } from '../../../components/molecules/PublicationCard/PublicationCard';
import { InlineMarkdown } from '../../../utils/MarkdownBlock';
import { usePdfAvailability } from '../../../hooks/usePdfAvailability';
import type {
  StageId,
  StageResult,
  IdeaResultData,
  IdeaSuggestion,
  MethodsResultData,
  AnalysisResultData,
  PaperResultData,
  LiteratureResultData,
  RefereeResultData,
  KeywordsResultData,
} from '../../../types/pipeline';
import styles from './ResultCards.module.css';

const ChartBarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="10" width="4" height="8" rx="1" fill="#8B837C" />
    <rect x="8" y="6" width="4" height="12" rx="1" fill="#8B837C" />
    <rect x="14" y="2" width="4" height="16" rx="1" fill="#8B837C" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M10.5 1.5H4.5A1.5 1.5 0 0 0 3 3v12a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 15 15V6l-4.5-4.5Z" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 1.5V6H15M6 9h6M6 12h4" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" />
    <path d="M8 4l2 2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="7" height="7" rx="1" />
    <path d="M9 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2" />
  </svg>
);

const CheckSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7l3 3 6-6" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6.5h2v6H2z" />
    <path d="M5.5 6.5l1.5-4a1.2 1.2 0 0 1 2.3.6L9 6h2.3a1 1 0 0 1 1 1.2l-.9 4.3a1 1 0 0 1-1 .8H5.5z" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7.5h2v-6H2z" />
    <path d="M5.5 7.5l1.5 4a1.2 1.2 0 0 0 2.3-.6L9 8h2.3a1 1 0 0 0 1-1.2l-.9-4.3a1 1 0 0 0-1-.8H5.5z" />
  </svg>
);

function CardHeader({ file, source, timestamp, badgeLabel }: { file: string; source: string; timestamp: string; badgeLabel?: string }) {
  return (
    <div className={styles.cardHeader}>
      <div className={styles.headerLeft}>
        {badgeLabel ? (
          <span className={styles.headerBadgeLabel}>{badgeLabel}</span>
        ) : (
          <>
            <span className={styles.statusDot} />
            <div className={styles.fileChip}>
              <span className={styles.fileChipText}>{file}</span>
            </div>
          </>
        )}
        <div className={styles.headerSep} />
        <span className={styles.headerSource}>{source}</span>
      </div>
      <span className={styles.headerTime}>{timestamp}</span>
    </div>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className={styles.sectionHeading}>{children}</p>;
}

function TagRow({ tags, tagClassName }: { tags?: string[]; tagClassName?: string }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className={styles.tagRow}>
      {tags.map((t) => (
        <div key={t} className={`${styles.tagChip} ${tagClassName ?? ''}`}>
          <span className={styles.tagChipText}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function ActionRow({ ghost, onGhost, primary, onPrimary, ghostClassName, primaryClassName }: {
  ghost: string;
  onGhost?: () => void;
  primary: string;
  onPrimary: () => void;
  ghostClassName?: string;
  primaryClassName?: string;
}) {
  return (
    <div className={styles.actionRow}>
      <button className={`${styles.ghostBtn} ${ghostClassName ?? ''}`} onClick={onGhost}>{ghost}</button>
      <button className={`${styles.primaryBtn} ${primaryClassName ?? ''}`} onClick={onPrimary}>{primary}</button>
    </div>
  );
}

function SuggestionChip({ suggestion, onTry }: { suggestion: IdeaSuggestion; onTry: (s: IdeaSuggestion) => void }) {
  if (!suggestion.actionable) {
    return <span className={styles.suggestionChipStatic}>{suggestion.label}</span>;
  }
  return (
    <button className={styles.suggestionChip} onClick={() => onTry(suggestion)}>
      {suggestion.label}
    </button>
  );
}

interface CardProps {
  result: StageResult;
  onApprove: () => void;
  onOpenFull?: () => void;
}

// Input stage — no card chrome, just a conversational confirmation + proceed button.
// The right panel shows the actual description content.
function InputResultCard({ onApprove }: Pick<CardProps, 'onApprove'>) {
  return (
    <div className={styles.inputConfirm}>
      <p className={styles.inputConfirmText}>
        I've recorded your data description and tool preferences. Review them in the panel on the right, then generate your hypothesis when ready.
      </p>
      <button className={styles.primaryBtn} onClick={onApprove}>
        Generate Hypothesis →
      </button>
    </div>
  );
}

function IdeaResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const ideaData = result.stageData as IdeaResultData | undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(result.title ?? '');
  const [bodyDraft, setBodyDraft] = useState(
    ideaData?.hypothesis ?? result.content
  );
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const addMessage = usePipelineStore(s => s.addMessage);

  function handleCopy() {
    navigator.clipboard.writeText(ideaData?.hypothesis ?? result.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleTrySuggestion(suggestion: IdeaSuggestion) {
    if (!suggestion.actionable || !suggestion.followUpMessage) return;
    addMessage({
      role: 'denario',
      type: 'suggestion-followup',
      content: suggestion.followUpMessage,
      stageId: result.stageId,
      actionLabel: suggestion.actionLabel,
    });
  }

  if (isEditing) {
    return (
      <div className={`${styles.editForm} ${styles.editFormIdea}`}>
        <div className={styles.editFormHeader}>
          <span className={styles.headerBadgeLabel}>Idea</span>
          <span className={`${styles.editingLabel} ${styles.editingLabelIdea}`}>Editing</span>
        </div>

        <div className={styles.editFields}>
          <textarea
            className={`${styles.editInput} ${styles.editInputIdea}`}
            rows={3}
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            autoFocus
          />
          <textarea
            className={`${styles.editTextarea} ${styles.editTextareaIdea}`}
            value={bodyDraft}
            onChange={e => setBodyDraft(e.target.value)}
          />
        </div>

        {ideaData?.scopeNote && (
          <p className={styles.editHint}>Scope constraint from adversarial review preserved</p>
        )}

        <Divider />

        <div className={styles.editActions}>
          <button className={`${styles.editCancelBtn} ${styles.editCancelBtnIdea}`} onClick={() => setIsEditing(false)}>
            Cancel
          </button>
          <button className={`${styles.editSaveBtn} ${styles.editSaveBtnIdea}`} onClick={() => { setIsEditing(false); onApprove(); }}>
            Save & Approve →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Idea" />
      <Divider />
      <p className={`${styles.cardTitle} ${styles.cardTitleIdea}`}>{result.title}</p>
      <p className={`${styles.cardProse} ${styles.cardProseIdea}`}>{result.content}</p>
      <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
      {ideaData?.scopeNote && (
        <div className={styles.ideaConstraint}>
          <p className={styles.ideaConstraintTitle}>{ideaData.scopeNote.title}</p>
          <p className={styles.ideaConstraintBody}>{ideaData.scopeNote.body}</p>
          {ideaData.scopeNote.suggestions && ideaData.scopeNote.suggestions.length > 0 && (
            <div className={styles.suggestionChipRow}>
              {ideaData.scopeNote.suggestions.map(s => (
                <SuggestionChip key={s.id} suggestion={s} onTry={handleTrySuggestion} />
              ))}
            </div>
          )}
        </div>
      )}
      <Divider />
      <div className={styles.ideaBottomRow}>
        <div className={styles.reactionRow}>
          <button className={styles.reactionBtn} onClick={() => setIsEditing(true)} aria-label="Edit hypothesis" title="Edit">
            <PencilIcon />
          </button>
          <button className={styles.reactionBtn} onClick={handleCopy} aria-label="Copy hypothesis" title="Copy">
            {copied ? <CheckSmallIcon /> : <CopyIcon />}
          </button>
          <button
            className={`${styles.reactionBtn} ${feedback === 'up' ? styles.reactionBtnActive : ''}`}
            onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
            aria-label="Good hypothesis"
            title="Good hypothesis"
          >
            <ThumbsUpIcon />
          </button>
          <button
            className={`${styles.reactionBtn} ${feedback === 'down' ? styles.reactionBtnActive : ''}`}
            onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
            aria-label="Needs work"
            title="Needs work"
          >
            <ThumbsDownIcon />
          </button>
        </div>
        <div className={styles.ideaActionsWrap}>
          <ActionRow
            ghost="Open full →" onGhost={onOpenFull}
            primary="Approve & Proceed →" onPrimary={onApprove}
            ghostClassName={styles.ghostBtnIdea}
            primaryClassName={styles.primaryBtnIdea}
          />
        </div>
      </div>
    </div>
  );
}

function MethodsResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const data = result.stageData as MethodsResultData | undefined;
  const sections = data?.sections ?? [];
  const flatSubsteps = sections.flatMap(sec => sec.substeps);

  const [isEditing, setIsEditing] = useState(false);
  const [editingStepIdx, setEditingStepIdx] = useState<number | null>(0);
  const [titleDraft, setTitleDraft] = useState(result.title ?? '');
  const [stepDrafts, setStepDrafts] = useState<Array<{ label: string; description: string }>>(
    () => flatSubsteps.map(s => ({ label: s.label, description: s.body ?? s.points.map(p => p.text).join('\n') }))
  );
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(result.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isEditing) {
    return (
      <div className={`${styles.editForm} ${styles.editFormIdea}`}>
        <div className={styles.editFormHeader}>
          <span className={styles.headerBadgeLabel}>Methods</span>
          <span className={`${styles.editingLabel} ${styles.editingLabelIdea}`}>Editing</span>
        </div>

        <input
          className={`${styles.editTitleInput} ${styles.editTitleInputIdea}`}
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          autoFocus
        />

        <div className={styles.stepStack}>
          {flatSubsteps.map((step, i) => {
            const isActive = editingStepIdx === i;
            return (
              <div
                key={step.number}
                className={`${styles.stepEditItem} ${i < flatSubsteps.length - 1 ? styles.stepEditItemBorder : ''}`}
              >
                <div className={styles.stepEditHeader}>
                  <div className={styles.stepLeft}>
                    <div className={styles.stepBadge}>{step.number}</div>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                  {!isActive && (
                    <button
                      className={styles.stepPencilBtn}
                      onClick={() => setEditingStepIdx(i)}
                      aria-label="Edit step"
                    >
                      <PencilIcon />
                    </button>
                  )}
                </div>
                {isActive && (
                  <>
                    <textarea
                      className={styles.stepDescTextarea}
                      value={stepDrafts[i]?.description ?? ''}
                      onChange={e => {
                        const next = [...stepDrafts];
                        next[i] = { ...next[i], description: e.target.value };
                        setStepDrafts(next);
                      }}
                      rows={4}
                    />
                    <div className={styles.doneEditingRow}>
                      <button className={styles.doneEditingBtn} onClick={() => setEditingStepIdx(null)}>
                        Done editing step
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <Divider />
        <div className={styles.editActions}>
          <button className={`${styles.editCancelBtn} ${styles.editCancelBtnIdea}`} onClick={() => setIsEditing(false)}>Cancel</button>
          <button className={`${styles.editSaveBtn} ${styles.editSaveBtnIdea}`} onClick={() => { setIsEditing(false); onApprove(); }}>Save →</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Methods" />
      <Divider />
      <p className={`${styles.cardTitle} ${styles.cardTitleIdea}`}>{result.title}</p>
      <div className={styles.methodSectionStack}>
        {sections.map(section => (
          <div key={section.number} className={styles.methodSection}>
            <p className={styles.methodSectionTitle}>{section.number}. {section.title}</p>
            <div className={styles.stepStack}>
              {section.substeps.map(({ number, label, body, points, code }, i) => (
                <div key={number} className={`${styles.stepRow} ${i < section.substeps.length - 1 ? styles.stepRowBorder : ''}`}>
                  <div className={styles.stepRowTop}>
                    <div className={styles.stepLeft}>
                      <div className={styles.stepBadge}>{number}</div>
                      <span className={styles.stepLabel}>{label}</span>
                    </div>
                  </div>
                  {body && <p className={styles.stepBodyText}><InlineMarkdown text={body} /></p>}
                  {points.length > 0 && (
                    <ul className={styles.stepPointList}>
                      {points.map((pt, pi) => (
                        <li key={pi} className={styles.stepPoint}><InlineMarkdown text={pt.text} /></li>
                      ))}
                    </ul>
                  )}
                  {code && (
                    <pre className={styles.stepCodeBlock}><code>{code}</code></pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
      <Divider />
      <div className={styles.ideaBottomRow}>
        <div className={styles.reactionRow}>
          <button className={styles.reactionBtn} onClick={() => setIsEditing(true)} aria-label="Edit methods" title="Edit">
            <PencilIcon />
          </button>
          <button className={styles.reactionBtn} onClick={handleCopy} aria-label="Copy methods" title="Copy">
            {copied ? <CheckSmallIcon /> : <CopyIcon />}
          </button>
          <button
            className={`${styles.reactionBtn} ${feedback === 'up' ? styles.reactionBtnActive : ''}`}
            onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
            aria-label="Good methodology"
            title="Good methodology"
          >
            <ThumbsUpIcon />
          </button>
          <button
            className={`${styles.reactionBtn} ${feedback === 'down' ? styles.reactionBtnActive : ''}`}
            onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
            aria-label="Needs work"
            title="Needs work"
          >
            <ThumbsDownIcon />
          </button>
        </div>
        <div className={styles.ideaActionsWrap}>
          <ActionRow
            ghost="Edit method" onGhost={() => setIsEditing(true)}
            primary="Run Analysis →" onPrimary={onApprove}
            ghostClassName={styles.ghostBtnIdea}
            primaryClassName={styles.primaryBtnIdea}
          />
        </div>
      </div>
    </div>
  );
}

function PlotThumb({ name, backendProjectId, onClick }: { name: string; backendProjectId?: string | null; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  const showImage = !!backendProjectId && !failed;

  return (
    <button className={`${styles.plotCell} ${styles.plotCellBtn}`} onClick={onClick}>
      {showImage ? (
        <img
          key={name}
          src={api.fileUrl(backendProjectId, `input_files/plots/${name}`)}
          alt={name}
          className={styles.plotCellImg}
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <ChartBarIcon />
          <span className={styles.plotName}>{name}</span>
        </>
      )}
    </button>
  );
}

function AnalysisResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const data = result.stageData as AnalysisResultData | undefined;
  const plots = data?.plots ?? [];
  const totalPlots = data?.totalPlots ?? plots.length;
  const visiblePlots = plots.slice(0, 3);
  const extraCount = totalPlots - visiblePlots.length;
  const backendProjectId = usePipelineStore(s => s.backendProjectId);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  function openLightbox(idx = 0) { setLightboxIdx(idx); setLightboxOpen(true); }

  return (
    <>
      <div className={`${styles.card} ${styles.cardIdea}`}>
        <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Analysis" />
        <Divider />
        <p className={`${styles.cardTitle} ${styles.cardTitleIdea}`}>{result.title}</p>
        <SectionHeading>Visual Outputs</SectionHeading>
        <div className={styles.plotGrid}>
          {visiblePlots.map((name, i) => (
            <PlotThumb key={name} name={name} backendProjectId={backendProjectId} onClick={() => openLightbox(i)} />
          ))}
          {extraCount > 0 && (
            <button className={`${styles.plotCell} ${styles.plotCellMore} ${styles.plotCellBtn}`} onClick={() => openLightbox(3)}>
              <span className={styles.plotMore}>+{extraCount} more</span>
            </button>
          )}
        </div>
        {totalPlots > 3 && (
          <button className={`${styles.viewAllLink} ${styles.viewAllLinkIdea}`} onClick={() => openLightbox(0)}>
            View all {totalPlots} plots →
          </button>
        )}
        <Divider />
        <SectionHeading>Results Narrative</SectionHeading>
        <p className={styles.cardProse}>{result.content}</p>
        <Divider />
        <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
        <ActionRow
          ghost="Open full →" onGhost={onOpenFull}
          primary="Compile Paper →" onPrimary={onApprove}
          ghostClassName={styles.ghostBtnIdea}
          primaryClassName={styles.primaryBtnIdea}
        />
      </div>
      {lightboxOpen && plots.length > 0 && (
        <PlotLightbox
          plots={plots}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIdx}
          backendProjectId={backendProjectId}
          captions={data?.plotCaptions}
        />
      )}
    </>
  );
}

function PaperResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const data = result.stageData as PaperResultData | undefined;
  const abstract = data?.abstract || result.content;
  const backendProjectId = usePipelineStore(s => s.backendProjectId);
  const pdfAvailable = usePdfAvailability(backendProjectId, 'manuscript.pdf', result.generatedAt);
  // Real compiled PDF exists only when the backend actually had a LaTeX
  // toolchain (see DenarioBackend/docker/Dockerfile.api) — not shown at all
  // when it doesn't, rather than a fake/always-on badge.
  const tags = pdfAvailable ? [...(result.tags ?? []), 'PDF compiled'] : result.tags;

  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Paper" />
      <Divider />
      <p className={`${styles.cardTitle} ${styles.cardTitleIdea}`}>{result.title}</p>
      <SectionHeading>Abstract</SectionHeading>
      <p className={styles.cardProse}>{abstract}</p>
      {pdfAvailable && backendProjectId && (
        <>
          <Divider />
          <SectionHeading>Compiled PDF</SectionHeading>
          <iframe
            src={api.fileUrl(backendProjectId, 'manuscript.pdf', result.generatedAt)}
            title="Compiled manuscript PDF"
            className={styles.pdfPreview}
          />
        </>
      )}
      <Divider />
      <TagRow tags={tags} tagClassName={styles.tagChipIdea} />
      <ActionRow
        ghost="Open full →" onGhost={onOpenFull}
        primary="Literature Review →" onPrimary={onApprove}
        ghostClassName={styles.ghostBtnIdea}
        primaryClassName={styles.primaryBtnIdea}
      />
    </div>
  );
}

function LiteratureResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const data = result.stageData as LiteratureResultData | undefined;
  // Teaser only — the full deduped corpus (often 30+ papers) belongs on the
  // full page, not inline in the conversation thread.
  const teaserPapers = (data?.searchedPapers ?? []).slice(0, 3);

  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Literature" />
      <Divider />
      <p className={styles.cardProse}><InlineMarkdown text={result.content || result.rawContent || ''} /></p>
      {teaserPapers.length > 0 && (
        <div className={styles.publicationTeaser}>
          {teaserPapers.map((paper, i) => (
            <PublicationCard key={paper.url ?? i} paper={paper} />
          ))}
        </div>
      )}
      <Divider />
      <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
      <ActionRow
        ghost="Open full →" onGhost={onOpenFull}
        primary="Referee Report →" onPrimary={onApprove}
        ghostClassName={styles.ghostBtnIdea}
        primaryClassName={styles.primaryBtnIdea}
      />
    </div>
  );
}

function RefereeResultCard({ result, onApprove, onOpenFull }: CardProps) {
  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Referee" />
      <Divider />
      <p className={styles.cardProse}><InlineMarkdown text={result.content || result.rawContent || ''} /></p>
      <Divider />
      <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
      <ActionRow
        ghost="Open full →" onGhost={onOpenFull}
        primary="Approve & Proceed →" onPrimary={onApprove}
        ghostClassName={styles.ghostBtnIdea}
        primaryClassName={styles.primaryBtnIdea}
      />
    </div>
  );
}

function KeywordsResultCard({ result, onApprove, onOpenFull }: CardProps) {
  const data = result.stageData as KeywordsResultData | undefined;
  const keywords = data?.structured?.keywords ?? [];
  return (
    <div className={`${styles.card} ${styles.cardIdea}`}>
      <CardHeader file={result.file} source="Generated by Denario" timestamp={result.durationLabel} badgeLabel="Keywords" />
      <Divider />
      <div className={styles.kwChips}>
        {keywords.map(({ term, url }) => (
          <div key={term} className={styles.kwChip}>
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className={styles.kwChipText}>{term}</a>
            ) : (
              <span className={styles.kwChipText}>{term}</span>
            )}
          </div>
        ))}
      </div>
      <Divider />
      <TagRow tags={result.tags} tagClassName={styles.tagChipIdea} />
      <ActionRow
        ghost="Open full →" onGhost={onOpenFull}
        primary="Finalise →" onPrimary={onApprove}
        ghostClassName={styles.ghostBtnIdea}
        primaryClassName={styles.primaryBtnIdea}
      />
    </div>
  );
}

// ── Error card ─────────────────────────────────────────────────────────────────

const AlertCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7.5" stroke="#B91C1C" strokeWidth="1.25" />
    <path d="M9 5.5v4" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="12" r="0.75" fill="#B91C1C" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <path d="M6.5 2l1.5 1.5L6.5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function ErrorCard({ stageId }: { stageId: StageId }) {
  const stage = usePipelineStore(s => s.pipeline?.stages[stageId]);
  const setStageParam = usePipelineStore(s => s.setStageParam);
  const error = stage?.error ?? 'An unexpected error occurred.';
  const track  = stage?.track ?? 'standard';

  const journalField = STAGE_CONFIG[stageId].paramFields.find(f => f.key === 'journal');
  const journalValue = (stage?.params?.journal as string | undefined) ?? (journalField?.default as string) ?? 'NONE';
  const citationsField = STAGE_CONFIG[stageId].paramFields.find(f => f.key === 'add_citations');
  const citationsValue = (stage?.params?.add_citations as boolean | undefined) ?? (citationsField?.default as boolean) ?? true;
  const kwTypeField = STAGE_CONFIG[stageId].paramFields.find(f => f.key === 'kw_type');
  const kwTypeValue = (stage?.params?.kw_type as string | undefined) ?? (kwTypeField?.default as string) ?? 'unesco';
  const numKeywordsField = STAGE_CONFIG[stageId].paramFields.find(f => f.key === 'num_keywords');
  const numKeywordsValue = (stage?.params?.num_keywords as number | undefined) ?? (numKeywordsField?.default as number) ?? 10;

  function handleRetry() {
    startStage(stageId, track);
  }

  return (
    <div className={styles.errorCard}>
      <div className={styles.errorHeader}>
        <AlertCircleIcon />
        <span className={styles.errorTitle}>Stage failed</span>
      </div>
      <p className={styles.errorMsg}>{error}</p>
      {journalField && (
        <div className={styles.errorJournalRow}>
          <span className={styles.errorJournalLabel}>{journalField.label}</span>
          <ParamSelect
            value={journalValue}
            options={journalField.options ?? []}
            onChange={(v) => setStageParam(stageId, 'journal', v)}
          />
        </div>
      )}
      {citationsField && (
        <div className={styles.errorJournalRow}>
          <span className={styles.errorJournalLabel}>{citationsField.label}</span>
          <ParamToggle
            value={citationsValue}
            onChange={(v) => setStageParam(stageId, 'add_citations', v)}
          />
        </div>
      )}
      {kwTypeField && (
        <div className={styles.errorJournalRow}>
          <span className={styles.errorJournalLabel}>{kwTypeField.label}</span>
          <ParamSelect
            value={kwTypeValue}
            options={kwTypeField.options ?? []}
            onChange={(v) => setStageParam(stageId, 'kw_type', v)}
          />
        </div>
      )}
      {numKeywordsField && (
        <div className={styles.errorJournalRow}>
          <span className={styles.errorJournalLabel}>{numKeywordsField.label}</span>
          <ParamNumber
            value={numKeywordsValue}
            min={numKeywordsField.min}
            max={numKeywordsField.max}
            onChange={(v) => setStageParam(stageId, 'num_keywords', v)}
          />
        </div>
      )}
      <button className={styles.retryBtn} onClick={handleRetry}>
        <RefreshIcon />
        Retry
      </button>
    </div>
  );
}

export function StageResultCard({ stageId }: { stageId: StageId }) {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const pipeline = usePipelineStore(s => s.pipeline);
  const approveStage = usePipelineStore(s => s.approveStage);
  const stage = pipeline?.stages[stageId];
  const result = stage?.result;

  if (stage?.status === 'error') return <ErrorCard stageId={stageId} />;
  if (!result) return null;

  function handleApprove() {
    approveStage(stageId);
    const next = nextStage(stageId);
    if (next && projectId) {
      navigate(`/project/${projectId}/stage/${next}`);
      // Stages that have no track choice start immediately on approval.
      if (next === 'analysis') {
        startStage(next, 'standard');
      }
    }
  }

  function handleOpenFull() {
    if (projectId) navigate(`/project/${projectId}/stage/${stageId}/full`);
  }

  const props = { result, onApprove: handleApprove };
  switch (stageId) {
    case 'input':      return <InputResultCard onApprove={handleApprove} />;
    case 'idea':       return <IdeaResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'methods':    return <MethodsResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'analysis':   return <AnalysisResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'paper':      return <PaperResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'literature': return <LiteratureResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'referee':    return <RefereeResultCard {...props} onOpenFull={handleOpenFull} />;
    case 'keywords':   return <KeywordsResultCard {...props} onOpenFull={handleOpenFull} />;
    default:           return null;
  }
}
