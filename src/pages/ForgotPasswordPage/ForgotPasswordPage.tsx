import { useState } from 'react';
import styles from './ForgotPasswordPage.module.css';

type ForgotVariant = 'email' | 'sent' | 'reset' | 'reset-error' | 'success';

const BRAND_COLORS = [
  { color: '#16A34A', label: 'green' },
  { color: '#EA580C', label: 'orange' },
  { color: '#2563EB', label: 'blue' },
  { color: '#7C3AED', label: 'purple' },
];

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.8 6.7A2 2 0 009.3 9.2M4.7 4.6C3 5.8 1.5 7.8 1.5 8c0 0 2.5 5 6.5 5a6.3 6.3 0 003.3-.95M7.1 3.04C7.4 3.01 7.7 3 8 3c4 0 6.5 5 6.5 5a11 11 0 01-1.55 2.12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 8c0 0 2.5-5 6.5-5s6.5 5 6.5 5-2.5 5-6.5 5-6.5-5-6.5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <path d="M1.5 9L9 16.5L22.5 1.5" stroke="#2D6A2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorBadge() {
  return (
    <div className={styles.errorBadge} aria-hidden="true">
      <span className={styles.errorBadgeText}>!</span>
    </div>
  );
}

function Branding() {
  return (
    <div className={styles.topBranding}>
      <p className={styles.brandName}>Denario</p>
      <div className={styles.colorBar}>
        {BRAND_COLORS.map(({ color, label }) => (
          <div key={label} className={styles.colorBarSegment} style={{ background: color }} />
        ))}
      </div>
      <p className={styles.brandSubtitle}>Scientific AI Assistant</p>
    </div>
  );
}

function StemStrip() {
  return (
    <div className={styles.stemStrip} aria-hidden="true">
      {BRAND_COLORS.map(({ color, label }, i) => (
        <div key={label} className={styles.stemSegment} style={{ background: color, top: `${i * 25}%`, height: '25%' }} />
      ))}
    </div>
  );
}

function PasswordField({ id, label, isError = false }: { id: string; label: string; isError?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.fieldContainer}>
      <label className={`${styles.fieldLabel} ${isError ? styles.fieldLabelError : ''}`} htmlFor={id}>
        {label}
      </label>
      <div className={`${styles.inputBox} ${isError ? styles.inputBoxError : ''}`}>
        <input id={id} type={show ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" />
        <button className={styles.eyeButton} type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide' : 'Show'}>
          {show ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </div>
    </div>
  );
}

function StrengthIndicator({ level }: { level: 'weak' | 'fair' | 'strong' }) {
  const widths = { weak: '25%', fair: '60%', strong: '42%' };
  const labels = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };
  const colors = { weak: '#DC2626', fair: '#EA580C', strong: 'var(--color-brand)' };
  return (
    <div className={styles.strengthIndicator}>
      <div className={styles.strengthTrack}>
        <div className={styles.strengthFill} style={{ width: widths[level], background: colors[level] }} />
      </div>
      <p className={styles.strengthLabel} style={{ color: colors[level] }}>{labels[level]}</p>
    </div>
  );
}

export function ForgotPasswordPage({ variant = 'email' }: { variant?: ForgotVariant }) {
  return (
    <div className={styles.page}>
      <Branding />

      {/* ── Screen 1: Email form ── */}
      {variant === 'email' && (
        <div className={styles.card}>
          <a className={styles.backLink} href="#">← Back to sign in</a>
          <div className={styles.spacer24} />
          <h1 className={styles.heading}>Forgot your password?</h1>
          <div className={styles.spacer8} />
          <p className={styles.subtext}>Enter your email and we will send you a reset link.</p>
          <div className={styles.spacer28} />
          <div className={styles.fieldContainer}>
            <label className={styles.fieldLabel} htmlFor="forgot-email">Email address</label>
            <div className={styles.inputBox}>
              <input id="forgot-email" type="email" placeholder="you@institution.edu" autoComplete="email" />
            </div>
          </div>
          <div className={styles.spacer24} />
          <button className={styles.primaryButton} type="button">Send reset link</button>
          <div className={styles.spacer20} />
          <p className={styles.footerNote}>
            Remembered it?{' '}
            <a className={styles.footerLink} href="#">Sign in →</a>
          </p>
        </div>
      )}

      {/* ── Screen 2: Check inbox ── */}
      {variant === 'sent' && (
        <div className={styles.card}>
          <h2 className={styles.headingCentered}>Check your inbox.</h2>
          <div className={styles.spacer10} />
          <p className={styles.subtextCentered}>
            We sent a reset link to{' '}
            <strong className={styles.emailHighlight}>researcher@mit.edu</strong>
          </p>
          <div className={styles.spacer8} />
          <p className={styles.subtextMutedCentered}>The link expires in 30 minutes.</p>
          <div className={styles.spacer28} />
          <div className={styles.dividerLine} />
          <div className={styles.spacer16} />
          <div className={styles.footerLinks}>
            <p className={styles.footerNote}>
              Did not receive it?{' '}
              <a className={styles.footerLink} href="#">Resend</a>
            </p>
            <p className={styles.footerNote}>
              Wrong email?{' '}
              <a className={styles.footerLink} href="#">Go back</a>
            </p>
          </div>
        </div>
      )}

      {/* ── Screen 3: New password (valid) ── */}
      {variant === 'reset' && (
        <div className={styles.card}>
          <a className={styles.backLink} href="#">← Back to sign in</a>
          <div className={styles.spacer24} />
          <h1 className={styles.heading}>Create a new password.</h1>
          <div className={styles.spacer8} />
          <p className={styles.subtext}>Your new password must be at least 8 characters.</p>
          <div className={styles.spacer28} />
          <div className={styles.fieldStack}>
            <div className={styles.fieldGroup}>
              <PasswordField id="new-password" label="New password" />
              <StrengthIndicator level="strong" />
            </div>
            <PasswordField id="confirm-password" label="Confirm new password" />
          </div>
          <div className={styles.spacer24} />
          <button className={styles.primaryButton} type="button">Update password</button>
          <div className={styles.spacer20} />
          <p className={styles.subtextMutedCentered}>This link expires in 30 minutes.</p>
        </div>
      )}

      {/* ── Screen 4: New password (mismatch error) ── */}
      {variant === 'reset-error' && (
        <div className={styles.card}>
          <a className={styles.backLink} href="#">← Back to sign in</a>
          <div className={styles.spacer24} />
          <h1 className={styles.heading}>Create a new password.</h1>
          <div className={styles.spacer28} />
          <div className={styles.fieldStack}>
            <div className={styles.fieldGroup}>
              <PasswordField id="new-password-err" label="New password" />
              <StrengthIndicator level="strong" />
            </div>
            <div className={styles.fieldContainer}>
              <label className={`${styles.fieldLabel} ${styles.fieldLabelError}`} htmlFor="confirm-password-err">
                Confirm new password
              </label>
              <div className={`${styles.inputBox} ${styles.inputBoxError}`}>
                <input id="confirm-password-err" type="password" placeholder="••••••••" autoComplete="new-password" />
                <button className={styles.eyeButton} type="button" aria-label="Show password">
                  <EyeClosedIcon />
                </button>
              </div>
              <div className={styles.fieldErrorRow}>
                <ErrorBadge />
                <p className={styles.fieldErrorText}>Those passwords do not match. Check and try again.</p>
              </div>
            </div>
          </div>
          <div className={styles.spacer24} />
          <button className={styles.disabledButton} type="button" disabled>Update password</button>
        </div>
      )}

      {/* ── Screen 5: Success ── */}
      {variant === 'success' && (
        <div className={styles.card}>
          <div className={styles.successContent}>
            <div className={styles.successIconWrapper}>
              <CheckIcon />
            </div>
            <div className={styles.spacer16} />
            <h2 className={styles.headingCentered}>Password updated.</h2>
            <div className={styles.spacer10} />
            <p className={styles.subtextCentered}>You can now sign in with your new password.</p>
            <div className={styles.spacer28} />
            <button className={styles.primaryButton} type="button">Sign in now →</button>
          </div>
          <div className={styles.spacer16} />
          <p className={styles.subtextMutedCentered} style={{ fontSize: '12px' }}>
            If you did not request this change, contact support immediately.
          </p>
        </div>
      )}

      <StemStrip />
    </div>
  );
}
