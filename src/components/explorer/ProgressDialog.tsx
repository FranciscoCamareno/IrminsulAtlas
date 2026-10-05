import { useEffect, useRef, useState } from 'react';
import type { AtlasIndex } from '../../domain/schema';
import { progressSet, type ProgressChoice } from '../../application/progress';

export function choiceLabel(
  choice: ProgressChoice | null,
  milestones: AtlasIndex['milestones'],
): string {
  if (!choice) return 'Sin elegir';
  if (choice.kind === 'none') return 'Aún no he jugado';
  if (choice.kind === 'all') return 'Mostrar todo';
  const extra = progressSet(choice, milestones);
  const optional = milestones.filter(
    (item) => item.track === 'optional' && extra.has(item.id),
  ).length;
  return (
    'Hasta ' +
    (milestones.find((item) => item.id === choice.milestoneId)?.safeLabel ??
      '') +
    (optional ? ` + ${optional} opcional${optional === 1 ? '' : 'es'}` : '')
  );
}

const keyOf = (choice: ProgressChoice | null) =>
  !choice
    ? 'none'
    : choice.kind === 'upto'
      ? 'upto:' + choice.milestoneId
      : choice.kind;
const fromKey = (key: string, optional: readonly string[]): ProgressChoice =>
  key === 'none' || key === 'all'
    ? { kind: key }
    : {
        kind: 'upto',
        milestoneId: key.slice('upto:'.length),
        ...(optional.length ? { optional } : {}),
      };

function ProgressForm({
  firstVisit,
  milestones,
  choice,
  onApply,
  onCancel,
}: {
  firstVisit: boolean;
  milestones: AtlasIndex['milestones'];
  choice: ProgressChoice | null;
  onApply: (choice: ProgressChoice) => void;
  onCancel: () => void;
}) {
  // Mounted only while open, so the draft selection always starts from the
  // current choice without synchronizing state in an effect.
  const [selected, setSelected] = useState(keyOf(choice));
  const [optional, setOptional] = useState<string[]>(
    choice?.kind === 'upto' ? [...(choice.optional ?? [])] : [],
  );
  const optionalMilestones = milestones.filter(
    (item) => item.track === 'optional',
  );
  const options = [
    { key: 'none', label: 'Aún no he jugado' },
    ...milestones
      .filter((item) => item.track === 'main')
      .map((item) => ({
        key: 'upto:' + item.id,
        label: 'Historia principal hasta ' + item.safeLabel,
      })),
    { key: 'all', label: 'Mostrar todo (puede revelar tramas)' },
  ];
  return (
    <form
      className="menu-content"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(fromKey(selected, optional));
      }}
    >
      <h2 id="progress-title">
        {firstVisit ? '¿Hasta dónde has llegado?' : 'Tu progreso de lectura'}
      </h2>
      <p>
        El atlas oculta títulos, textos, relaciones, resultados de búsqueda y
        conteos de lo que aún no habrías visto. Es una ayuda para tu
        experiencia, no un control de acceso: los archivos del sitio siguen
        siendo públicos.
      </p>
      <fieldset>
        <legend className="sr-only">Progreso en la historia principal</legend>
        {options.map((option) => (
          <label key={option.key} className="progress-choice">
            <input
              type="radio"
              name="progress"
              value={option.key}
              checked={selected === option.key}
              onChange={() => setSelected(option.key)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      {optionalMilestones.length > 0 && (
        <fieldset disabled={!selected.startsWith('upto:')}>
          <legend>Misiones opcionales que has completado</legend>
          {optionalMilestones.map((item) => (
            <label key={item.id} className="progress-choice">
              <input
                type="checkbox"
                checked={optional.includes(item.id)}
                onChange={(event) =>
                  setOptional((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id),
                  )
                }
              />
              {item.safeLabel}
            </label>
          ))}
        </fieldset>
      )}
      <small>
        Se guarda solo en este navegador. Puedes cambiarlo cuando quieras.
      </small>
      <div className="progress-actions">
        <button type="submit" className="text-button">
          Aplicar
        </button>
        <button type="button" className="text-button" onClick={onCancel}>
          {firstVisit ? 'Decidir más tarde' : 'Cancelar'}
        </button>
      </div>
    </form>
  );
}

export default function ProgressDialog({
  open,
  firstVisit,
  milestones,
  choice,
  onApply,
  onCancel,
}: {
  open: boolean;
  firstVisit: boolean;
  milestones: AtlasIndex['milestones'];
  choice: ProgressChoice | null;
  onApply: (choice: ProgressChoice) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else if (dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="atlas-menu progress-dialog"
      aria-labelledby="progress-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      {open && (
        <ProgressForm
          firstVisit={firstVisit}
          milestones={milestones}
          choice={choice}
          onApply={onApply}
          onCancel={onCancel}
        />
      )}
    </dialog>
  );
}
