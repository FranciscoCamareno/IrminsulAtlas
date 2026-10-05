// N-11/N-12: writes the accepted import's dialog of each Archon Quest chapter
// as plain text for reading (ignored by Git). Line refs are `quest.talk.dialog`.
import console from 'node:console';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const store = 'content/imported/animegame';
const pointer = JSON.parse(readFileSync(`${store}/accepted.json`, 'utf8'));
const data = JSON.parse(
  readFileSync(`${store}/versions/${pointer.version}/sources.json`, 'utf8'),
);
const registry = JSON.parse(
  readFileSync('content/editorial/genshin-coverage.json', 'utf8'),
);
const sources = new Map(data.sources.map((source) => [source.id, source]));
mkdirSync('.validation/arcs/text', { recursive: true });
const summary = [];
for (const unit of registry.units.filter(
  (u) => u.category === 'archon-quest',
)) {
  const lines = [
    `# ${unit.actLabel} — ${unit.title}`,
    `# capítulo ${unit.providerRef.chapterId}`,
    '',
  ];
  let count = 0;
  for (const quest of unit.providerRef.mainQuestIds) {
    const source = sources.get(`agd-quest-${quest}-es`);
    if (!source) continue;
    lines.push(`## MISIÓN ${quest}: ${source.title}`);
    if (source.incomplete)
      lines.push(`## (huecos: ${source.incomplete.join('; ')})`);
    for (const conversation of source.conversations) {
      const talk = conversation.id.split('-talk-')[1];
      lines.push(`### diálogo ${talk}`);
      for (const segment of source.segments.filter(
        (s) => s.locator.path === conversation.locator.path,
      )) {
        const dialog = segment.id.split('-dialog-')[1];
        const who =
          segment.speaker.name ??
          (segment.speaker.roleType === 'TALK_ROLE_PLAYER'
            ? 'Viajero'
            : segment.speaker.externalId
              ? `rol ${segment.speaker.externalId}`
              : '—');
        const text =
          segment.text.status === 'available'
            ? segment.text.value.replaceAll('\n', ' ')
            : `[sin texto: ${segment.text.status}]`;
        const branch =
          segment.nextSegmentIds.length > 1
            ? ` [→ ${segment.nextSegmentIds.map((id) => id.split('-dialog-')[1]).join(',')}]`
            : '';
        lines.push(`${quest}.${talk}.${dialog} ${who}: ${text}${branch}`);
        count++;
      }
    }
  }
  writeFileSync(
    `.validation/arcs/text/${unit.providerRef.chapterId}.txt`,
    lines.join('\n') + '\n',
  );
  summary.push({ chapter: unit.providerRef.chapterId, lines: count });
}
console.log(JSON.stringify(summary));
