import { useRef, useState, type KeyboardEvent } from 'react';
import {
  fontFamilyOf,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  MOOD_BY_ID,
} from '../domain/constants';
import { FontPicker } from './FontPicker';
import { formatChineseDate, relativeDayLabel, weekdayLabel } from '../domain/date';
import type { Attachment, DiaryEntry, EntryDraft } from '../domain/types';
import { AttachmentPanel } from './AttachmentPanel';
import { MoodPicker } from './MoodPicker';
import { WeatherPicker } from './WeatherPicker';

const EMPTY_ATTACHMENTS: Attachment[] = [];

interface EntryEditorProps {
  date: string;
  entry: DiaryEntry | undefined;
  today: string;
  onSave: (draft: EntryDraft) => void;
  onDelete: () => void;
}

export function EntryEditor({ date, entry, today, onSave, onDelete }: EntryEditorProps) {
  const [draft, setDraft] = useState<EntryDraft>(() => ({
    title: entry?.title ?? '',
    content: entry?.content ?? '',
    font: entry?.font,
    mood: entry?.mood,
    weather: entry?.weather,
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
    draft.attachments !== savedAttachmentsRef.current;
  const isEmpty =
    draft.title.trim().length === 0 &&
    draft.content.trim().length === 0 &&
    (draft.attachments?.length ?? 0) === 0;
  const relative = relativeDayLabel(date, today);
  const selectedMood = draft.mood ? MOOD_BY_ID[draft.mood] : undefined;

  const changeDraft = (patch: Partial<EntryDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
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
        </div>
      </header>

      <input
        className="editor-title"
        value={draft.title}
        maxLength={MAX_TITLE_LENGTH}
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
        <div className="editor-meta">
          <span>{draft.content.length} 字</span>
          <span className={saved && !isDirty ? 'save-state is-saved' : 'save-state'}>
            {saved && !isDirty ? '已保存' : isDirty ? '有未保存的修改' : ''}
          </span>
        </div>
        <div
          className="editor-actions editor-actions--footer"
          role="group"
          aria-label="日记操作"
        >
          <button
            type="button"
            className="button button--primary"
            onClick={save}
            disabled={isEmpty || !isDirty}
          >
            保存
          </button>
          {entry && (
            <button type="button" className="button button--ghost" onClick={onDelete}>
              删除
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}