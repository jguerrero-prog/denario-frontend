import { useState } from 'react';
import styles from './LoginPage.module.css';

type LoginVariant = 'idle' | 'loading' | 'error' | 'success';

const BRAND_COLORS = [
  { color: '#16A34A', label: 'green' },
  { color: '#EA580C', label: 'orange' },
  { color: '#2563EB', label: 'blue' },
  { color: '#7C3AED', label: 'purple' },
];

function GoogleIcon() {
  return (
    <svg className={styles.ssoIcon} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className={styles.ssoIcon} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
      <path d="M9 0C4.03 0 0 4.03 0 9a9 9 0 006.165 8.54c.45.082.615-.196.615-.434 0-.214-.008-.78-.012-1.53-2.504.544-3.033-1.207-3.033-1.207-.41-1.04-1-1.317-1-1.317-.817-.559.062-.547.062-.547.902.063 1.378.927 1.378.927.8 1.372 2.1.976 2.611.747.082-.58.313-.977.569-1.201-1.993-.227-4.09-.997-4.09-4.437 0-.98.35-1.781.924-2.41-.093-.228-.4-1.141.087-2.378 0 0 .754-.242 2.47.921A8.59 8.59 0 019 4.352a8.59 8.59 0 012.25.303c1.714-1.163 2.467-.921 2.467-.921.489 1.237.182 2.15.09 2.378.575.629.923 1.43.923 2.41 0 3.449-2.1 4.207-4.098 4.43.322.278.608.826.608 1.665 0 1.201-.011 2.171-.011 2.467 0 .24.162.52.619.432A9.003 9.003 0 0018 9C18 4.03 13.97 0 9 0z" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1.5 8c0 0 2.5-5 6.5-5s6.5 5 6.5 5-2.5 5-6.5 5-6.5-5-6.5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.8 6.7A2 2 0 009.3 9.2M4.7 4.6C3 5.8 1.5 7.8 1.5 8c0 0 2.5 5 6.5 5a6.3 6.3 0 003.3-.95M7.1 3.04C7.4 3.01 7.7 3 8 3c4 0 6.5 5 6.5 5a11 11 0 01-1.55 2.12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1.5 7L7.5 13L18.5 1" stroke="#2D6A2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

function LegalFooter() {
  return (
    <div className={styles.legalFooter}>
      <span className={styles.legalText}>By signing in you agree to the</span>
      <a className={styles.legalLink} href="#">Terms of Service</a>
      <span className={styles.legalText}>and</span>
      <a className={styles.legalLink} href="#">Privacy Policy</a>
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

function SuccessCard() {
  return (
    <div className={styles.successCard}>
      <div className={styles.successContent}>
        <div className={styles.successIconWrapper}>
          <CheckIcon />
        </div>
        <div className={styles.successText}>
          <p className={styles.successHeading}>You are in.</p>
          <p className={styles.successSub}>Taking you to your workspace…</p>
        </div>
      </div>
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          {BRAND_COLORS.map(({ color, label }) => (
            <div key={label} className={styles.progressSegment} style={{ background: color }} />
          ))}
        </div>
        <p className={styles.progressEmail}>Logged in as researcher@mit.edu</p>
      </div>
    </div>
  );
}

export function LoginPage({ variant = 'idle' }: { variant?: LoginVariant }) {
  const [showPassword, setShowPassword] = useState(false);
  const isLoading = variant === 'loading';
  const isError = variant === 'error';
  const isSuccess = variant === 'success';

  return (
    <div className={styles.page}>
      <Branding />

      {isSuccess ? (
        <SuccessCard />
      ) : (
        <form className={isError ? styles.errorForm : styles.card} noValidate>
          {/* Header */}
          <div className={styles.headerText}>
            <h1 className={styles.welcomeHeading}>Welcome back.</h1>
            <p className={styles.welcomeSub}>
              {isLoading ? 'Signing you in…' : 'Sign in to your research workspace.'}
            </p>
          </div>

          <div className={styles.spacer28} />

          {/* SSO buttons */}
          <div className={`${styles.ssoStack} ${isLoading ? styles.faded : ''}`}>
            <button className={styles.ssoButton} type="button" disabled={isLoading}>
              <GoogleIcon />
              Continue with Google
            </button>
            <button className={styles.ssoButton} type="button" disabled={isLoading}>
              <GitHubIcon />
              Continue with GitHub
            </button>
          </div>

          <div className={styles.spacer24} />

          {/* Divider */}
          <div className={`${styles.divider} ${isLoading ? styles.faded : ''}`}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerLabel}>or sign in with email</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Error banner */}
          {isError && (
            <>
              <div className={styles.spacer16} />
              <div className={styles.errorBanner} role="alert">
                <ErrorBadge />
                <p className={styles.errorBannerText}>
                  No account found for this email. Check the spelling or request access.
                </p>
              </div>
            </>
          )}

          <div className={styles.spacer20} />

          {/* Input stack */}
          <div className={styles.inputStack}>
            {/* Email */}
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel} htmlFor="login-email">Email address</label>
              <div className={`${styles.inputBox} ${isLoading ? styles.inputBoxFilled : ''}`}>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@institution.edu"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.passwordGroup}>
              <div className={styles.fieldContainer}>
                <label
                  className={`${styles.fieldLabel} ${isError ? styles.fieldLabelError : ''}`}
                  htmlFor="login-password"
                >
                  Password
                </label>
                <div className={`${styles.inputBox} ${isLoading ? styles.inputBoxFilled : ''} ${isError ? styles.inputBoxError : ''}`}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  {!isLoading && (
                    <button
                      className={styles.eyeButton}
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  )}
                </div>
              </div>

              {isError ? (
                <div className={styles.fieldErrorRow}>
                  <ErrorBadge />
                  <p className={styles.fieldErrorText}>
                    That password does not match. Try again, or reset it below.
                  </p>
                </div>
              ) : null}

              <div className={styles.forgotRow}>
                <a className={styles.forgotLink} href="#">
                  {isError ? 'Reset your password →' : 'Forgot your password?'}
                </a>
              </div>
            </div>
          </div>

          <div className={styles.spacer24} />

          {/* Submit button */}
          <button
            className={`${styles.primaryButton} ${isLoading ? styles.primaryButtonLoading : ''}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <span className={styles.spinner} aria-hidden="true" />}
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className={styles.spacer28} />

          {/* Sign-up row */}
          <div className={`${styles.signupRow} ${isLoading ? styles.faded : ''}`}>
            <p className={styles.signupLabel}>New to Denario?</p>
            <a className={styles.signupLink} href="#">Request access →</a>
          </div>
        </form>
      )}

      <LegalFooter />
      <StemStrip />
    </div>
  );
}
