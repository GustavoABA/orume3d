import type { ReactNode } from 'react';

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

const renderInline = (text: string, keyPrefix: string): ReactNode[] =>
  text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="font-semibold text-paper">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="rounded bg-paper/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-accentLight">{part.slice(1, -1)}</code>;
    }

    return part;
  });

type FormattedDescriptionProps = {
  text: string;
};

const FormattedDescription = ({ text }: FormattedDescriptionProps) => {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');

  return (
    <div className="space-y-2 text-sm leading-6 text-muted">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        const key = `description-${index}`;

        if (!line) return <div key={key} className="h-1" aria-hidden="true" />;

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          const content = renderInline(heading[2], key);

          if (level === 1) return <h3 key={key} className="pt-2 font-display text-xl font-semibold text-paper">{content}</h3>;
          if (level === 2) return <h4 key={key} className="pt-2 text-base font-bold text-paper">{content}</h4>;
          return <h5 key={key} className="pt-1 text-sm font-semibold uppercase tracking-wide text-paper/90">{content}</h5>;
        }

        const bullet = line.match(/^[-+]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={key} className="flex gap-2 pl-1">
              <span className="shrink-0 text-accentLight">•</span>
              <span>{renderInline(bullet[1], key)}</span>
            </div>
          );
        }

        const numbered = line.match(/^(\d+)\.\s+(.+)$/);
        if (numbered) {
          return (
            <div key={key} className="flex gap-2 pl-1">
              <span className="shrink-0 tabular-nums text-accentLight">{numbered[1]}.</span>
              <span>{renderInline(numbered[2], key)}</span>
            </div>
          );
        }

        return <p key={key}>{renderInline(line, key)}</p>;
      })}
    </div>
  );
};

export default FormattedDescription;
