import { MOODS, isMoodId } from '../domain/constants';
import type { MoodId } from '../domain/types';

interface MoodPickerProps {
  value: MoodId | undefined;
  onChange: (mood: MoodId | undefined) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="mood-picker">
      <div className="mood-select">
        <select
          aria-label="今天的心情"
          title="心情"
          value={value ?? ''}
          onChange={(event) => {
            const next = event.currentTarget.value;
            onChange(isMoodId(next) ? next : undefined);
          }}
        >
          <option value="">不记录</option>
          {MOODS.map((mood) => (
            <option key={mood.id} value={mood.id}>
              {`${mood.emoji} ${mood.label}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}