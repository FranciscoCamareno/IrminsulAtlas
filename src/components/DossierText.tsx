import type { MouseEvent, ReactNode } from 'react';

// Deliberately small Markdown reader: text, paragraphs, headings, lists, tables,
// emphasis, IDs and HTTP(S) links. Raw HTML is escaped by React, never executed.
const documents: Record<string, string> = {
  '00_guia_de_lectura.md': 'guia',
  '01_historia_cronologica.md': 'historia',
  '02_regiones_y_locaciones.md': 'lugares',
  '03_personajes_fundamentales.md': 'personajes',
};
export function dossierHref(id: string) {
  const document = id.startsWith('evt-')
    ? 'historia'
    : id.startsWith('loc-')
      ? 'lugares'
      : 'personajes';
  return '/dossier/' + document + '/#' + encodeURIComponent(id);
}
function safeHref(raw: string): string | undefined {
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).href;
    } catch {
      return undefined;
    }
  }
  const document = documents[raw];
  return document ? '/dossier/' + document + '/' : undefined;
}
type Navigate = (event: MouseEvent<HTMLAnchorElement>) => void;
function inline(text: string, onNavigate?: Navigate): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  return text.split(pattern).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]!);
      return href ? (
        <a key={i} href={href} rel="noreferrer">
          {link[1]}
        </a>
      ) : (
        <span key={i}>{link[1]}</span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) {
      const id = part.slice(1, -1);
      if (/^(evt|per|loc)-[a-z0-9-]+$/.test(id)) {
        return (
          <a
            key={i}
            href={'/?' + (id.startsWith('evt-') ? 'id' : 'entity') + '=' + id}
            onClick={onNavigate}
          >
            {id}
          </a>
        );
      }
      return <code key={i}>{id}</code>;
    }
    return part;
  });
}
export default function DossierText({
  text,
  onNavigate,
}: {
  text: string;
  onNavigate?: Navigate | undefined;
}) {
  const blocks = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="dossier-prose">
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => line.startsWith('|'))) {
          const rows = lines
            .filter((line) => !/^\|[\s:|-]+\|$/.test(line))
            .map((line) =>
              line
                .split('|')
                .slice(1, -1)
                .map((cell) => cell.trim()),
            );
          const [head, ...body] = rows;
          return (
            <div
              className="dossier-table"
              key={index}
              role="region"
              aria-label="Tabla del dossier"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {head?.map((cell, i) => (
                      <th key={i} scope="col">
                        {inline(cell, onNavigate)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, i) => (
                    <tr key={i} id={row[0]?.match(/`(per-[a-z0-9-]+)`/)?.[1]}>
                      {row.map((cell, j) => (
                        <td key={j}>{inline(cell, onNavigate)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const heading = block.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          const id = heading[2]!.match(/`((?:evt|per|loc)-[a-z0-9-]+)`/)?.[1];
          return (
            <h3 key={index} id={id}>
              {inline(
                heading[2]!.replace(/\s+—\s+`(?:evt|per|loc)-[a-z0-9-]+`/, ''),
                onNavigate,
              )}
            </h3>
          );
        }
        if (lines.every((line) => /^- /.test(line)))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.slice(2), onNavigate)}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\d+\. /.test(line)))
          return (
            <ol key={index}>
              {lines.map((line, i) => (
                <li key={i}>
                  {inline(line.replace(/^\d+\. /, ''), onNavigate)}
                </li>
              ))}
            </ol>
          );
        return <p key={index}>{inline(block, onNavigate)}</p>;
      })}
    </div>
  );
}
