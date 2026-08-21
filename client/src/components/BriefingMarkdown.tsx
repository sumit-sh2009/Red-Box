import React from 'react';

/**
 * Minimal markdown for grounded briefings: **bold**, *italic*, - bullets.
 * No HTML passthrough — safe for model-generated narrative text.
 */
export const BriefingMarkdown: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');

  const inline = (line: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(line.slice(last, m.index));
      }
      const token = m[0];
      if (token.startsWith('**')) {
        parts.push(
          <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-retro-navy">
            {token.slice(2, -2)}
          </strong>
        );
      } else {
        parts.push(
          <em key={`${keyPrefix}-i-${i++}`} className="italic text-retro-muted">
            {token.slice(1, -1)}
          </em>
        );
      }
      last = m.index + token.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  };

  return (
    <div className={`font-body text-sm text-retro-text leading-relaxed space-y-3 ${className}`}>
      {lines.map((raw, idx) => {
        const line = raw.trimEnd();
        if (!line.trim()) return null; // We use space-y-3 instead of empty divs

        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={idx} className="flex gap-2 pl-3 border-l-2 border-retro-border">
              <span className="text-retro-navy shrink-0">•</span>
              <span>{inline(bullet[1], `l${idx}`)}</span>
            </div>
          );
        }

        if (/^\*[^*]+\*$/.test(line.trim())) {
          return (
            <p key={idx} className="italic text-retro-muted">
              {line.trim().slice(1, -1)}
            </p>
          );
        }

        if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
          return (
            <p key={idx} className="font-semibold text-retro-navy text-base mt-3 mb-1">
              {line.trim().slice(2, -2)}
            </p>
          );
        }

        return <p key={idx}>{inline(line.trim(), `p${idx}`)}</p>;
      })}
    </div>
  );
};
