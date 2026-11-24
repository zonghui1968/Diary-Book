import { useRef, useState, type KeyboardEvent } from 'react';
import {
  fontFamilyOf,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  MOOD_BY_ID,
} from '../domain/constants';
import { FontPicker } from './FontPicker';
import { formatChineseDate, relativeDayLabel, weekdayLabel } from '../domain/date';
import type {
  Attachment,
  DiaryEntry,
  EntryDraft,
  EntryMetaSelection,
} from '../domain/types';
import { AttachmentPanel } from './AttachmentPanel';
import { ClimatePicker } from './ClimatePicker';
import { MoodPicker } from './MoodPicker';
import { WeatherPicker } from './WeatherPicker';

const EMPTY_ATTACHMENTS: Attachment[] = [];
const META_KEYS = ['weather', 'mood', 'temperature', 'wind'] as const;

interface EntryEditorProps {
  date: string;
  entry: DiaryEntry | undefined;
  today: string;
  onSave: (draft: EntryDraft) => void;
  onDelete: () => void;
  /** 天气/气温/风力等未保存也会触发，供书写区即时换肤 */
  onMetaChange?: (meta: EntryMetaSelection) => void;
}

export function EntryEditor({
  date,
  entry,
  today,
  onSave,
  onDelete,
  onMetaChange,
}: EntryEditorProps) {
  const [draft, setDraft] = useState<EntryDraft>(() => ({
    title: entry?.title ?? '',
    content: entry?.content ?? '',
    font: entry?.font,
    mood: entry?.mood,
    weather: entry?.weather,
    temperature: entry?.temperature,
    wind: entry?.wind,
    attachments: entry?.attachments ?? EMPTY_ATTACHMENTS,
  }));
  const [saved, setSaved] = useState(false);
  const savedAttachmentsRef = useRef(entry?.attachments ?? EMPTY_ATTACHMENTS);

  const savedTitle = entry?.title ?? '';
  const savedContent = entry?.content ?? '';
  const isDirty =
    draft.title !== savedTitle ||
    draft.content !== savedContent ||
    (draft.font ?? undefined) !== entry?.font ||
    (draft.mood ?? undefined) !== entry?.mood ||
    (draft.weather ?? undefined) !== entry?.weather ||
    (draft.temperature ?? undefined) !== entry?.temperature ||
    (draft.wind ?? undefined) !== entry?.wind ||
    draft.attachments !== savedAttachmentsRef.current;
  const isEmpty =
    draft.title.trim().length === 0 &&
    draft.content.trim().length === 0 &&
    (draft.attachments?.length ?? 0) === 0;
  const relative = relativeDayLabel(date, today);
  const selectedMood = draft.mood ? MOOD_BY_ID[draft.mood] : undefined;

  const changeDraft = (patch: Partial<EntryDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaved(false);
    if (onMetaChange && META_KEYS.some((key) => key in patch)) {
      onMetaChange({
        weather: next.weather ?? undefined,
        mood: next.mood ?? undefined,
        temperature: next.temperature ?? undefined,
        wind: next.wind ?? undefined,
      });
    }
  };

  const save = () => {
    if (isEmpty) {
      return;
    }
    onSave(draft);
    savedAttachmentsRef.current = draft.attachments ?? EMPTY_ATTACHMENTS;
    setSaved(true);
  };

  const handleSaveShortcut = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      save();
    }
  };

  return (
    <article className="editor" onKeyDown={handleSaveShortcut}>
      <header className="editor-head">
        <div>
          <p className="editor-date">
            {formatChineseDate(date)} · {weekdayLabel(date)}
            {relative && <span className="editor-relative">{relative}</span>}
            {selectedMood && (
              <span
                className="editor-mood"
                role="img"
                aria-label={`心情：${selectedMood.label}`}
                title={`心情：${selectedMood.label}`}
              >
                {selectedMood.emoji}
              </span>
            )}
          </p>
          <h2>{entry ? '编辑这一天' : '写下这一天'}</h2>
        </div>
        <div className="editor-actions">
          {entry && (
            <button type="button" className="button button--ghost" onClick={onDelete}>
              删除
            </button>
          )}
          <button
            type="button"
            className="button button--primary"
            onClick={save}
            disabled={isEmpty || !isDirty}
          >
            保存
          </button>
        </div>
      </header>

      <input
        className="editor-title"
        value={draft.title}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="给今天起个标题…"
        aria-label="日记标题"
        onChange={(event) => changeDraft({ title: event.target.value })}
      />

      <div className="editor-toolbar" role="toolbar" aria-label="编辑工具">
        <FontPicker
          value={draft.font ?? undefined}
          onChange={(font) => changeDraft({ font })}
        />
        <span className="editor-hint">正文会自动保存在本机浏览器中</span>
        <MoodPicker
          value={draft.mood ?? undefined}
          onChange={(mood) => changeDraft({ mood })}
        />
        <WeatherPicker
          value={draft.weather ?? undefined}
          onChange={(weather) => changeDraft({ weather })}
        />
        <ClimatePicker
          temperature={draft.temperature ?? undefined}
          wind={draft.wind ?? undefined}
          onTemperatureChange={(temperature) => changeDraft({ temperature })}
          onWindChange={(wind) => changeDraft({ wind })}
        />
      </div>

      <textarea
        className="editor-content editor-content--ruled"
        value={draft.content}
        maxLength={MAX_CONTENT_LENGTH}
        placeholder="今天发生了什么？此刻在想什么？"
        aria-label="日记正文"
        style={{ fontFamily: fontFamilyOf(draft.font ?? undefined) }}
        onChange={(event) => changeDraft({ content: event.target.value })}
      />

      <AttachmentPanel
        attachments={draft.attachments ?? EMPTY_ATTACHMENTS}
        onChange={(attachments) => changeDraft({ attachments })}
      />

      <footer className="editor-footer">
        <span>{draft.content.length} 字</span>
        <span className={saved && !isDirty ? 'save-state is-saved' : 'save-state'}>
          {saved && !isDirty ? '已保存' : isDirty ? '有未保存的修改' : ''}
        </span>
      </footer>
    </article>
  );
}