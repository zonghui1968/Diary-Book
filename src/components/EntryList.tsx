import { FONT_BY_ID, UNTITLED } from '../domain/constants';
import {
  formatClockTime,
  formatShortDate,
  relativeDayLabel,
} from '../domain/date';
import type { DiaryEntry } from '../domain/types';

interface EntryListProps {
  entries: DiaryEntry[];
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

function previewText(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > 46 ? `${flat.slice(0, 46)}…` : flat;
}

export function EntryList({ entries, selectedDate, today, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="entry-empty">
        日记本还是空的。
        <br />
        从今天开始写第一篇吧。
      </p>
    );
  }

  return (
    <ul className="entry-list" aria-label="日记列表">
      {entries.map((entry) => {
        const relative = relativeDayLabel(entry.date, today);
        const preview = previewText(entry.content);
        const fontLabel = entry.font ? FONT_BY_ID[entry.font].label : undefined;
        return (
          <li key={entry.id}>
            <button
              type="button"
              className={`entry-item${entry.date === selectedDate ? ' is-active' : ''}`}
              onClick={() => onSelect(entry.date)}
              aria-current={entry.date === selectedDate ? 'true' : undefined}
            >
              <span className="entry-item-top">
                <span className="entry-item-date">{formatShortDate(entry.date, today)}</span>
                <span className="entry-item-marks">
                  {relative && <span className="entry-item-relative">{relative}</span>}
                  {fontLabel && (
                    <span className="entry-item-font" title={`字体：${fontLabel}`}>
                      {/* 楷书/行书/草书 → 楷/行/草 */}
                      {fontLabel.slice(0, 1)}
                    </span>
                  )}
                </span>
              </span>
              <span className="entry-item-title">{entry.title || UNTITLED}</span>
              <span className="entry-item-preview">
                {preview || '（空白日记）'}
              </span>
              <span className="entry-item-time">
                最后编辑 {formatClockTime(entry.updatedAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}