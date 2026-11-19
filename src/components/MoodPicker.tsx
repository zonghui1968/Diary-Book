import { MOODS } from '../domain/constants';
import type { MoodId } from '../domain/types';

interface MoodPickerProps {
  value: MoodId | undefined;
  onChange: (mood: MoodId | undefined) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="mood-picker" role="group" aria-label="今天的心情">
      {MOODS.map((mood) => {
        const active = value === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            className={`mood-option${active ? ' is-active' : ''}`}
            aria-label={mood.label}
            aria-pressed={active}
            title={`心情：${mood.label}`}
            onClick={() => onChange(active ? undefined : mood.id)}
          >
            <span className="mood-emoji" aria-hidden="true">
              {mood.emoji}
            </span>
            <span className="mood-label">{mood.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={`mood-option mood-option--clear${value === undefined ? ' is-active' : ''}`}
        aria-label="不记录心情"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        不记录
      </button>
    </div>
  );
}