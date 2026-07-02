import styles from './Text.module.css';

export type TextVariant =
  | 'document-title'
  | 'step-heading'
  | 'body-prose'
  | 'ui-label'
  | 'ui-body'
  | 'code'
  | 'ui-caption';

const variantTags: Record<TextVariant, keyof JSX.IntrinsicElements> = {
  'document-title': 'h1',
  'step-heading':   'h2',
  'body-prose':     'p',
  'ui-label':       'span',
  'ui-body':        'span',
  'code':           'code',
  'ui-caption':     'span',
};

interface TextProps {
  variant: TextVariant;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function Text({ variant, children, as, className }: TextProps) {
  const Tag = (as ?? variantTags[variant]) as keyof JSX.IntrinsicElements;
  return (
    <Tag className={[styles[variant], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
