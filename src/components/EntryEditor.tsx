import { useState, type KeyboardEvent } from 'react';
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH, MOOD_BY_ID } from '../domain/constants';
import { formatChineseDate, relativeDayLabel, weekdayLabel } from '../domain/date';
import type { DiaryEntry, EntryDraft } from '../domain/types';
import { MoodPicker } from './MoodPicker';

interface EntryEditorProps {
  date: string;
  entry: DiaryEntry | undefined;
  today: string;
  onSave: (draft: EntryDraft) => void;
  onDelete: () => void;
}

export function EntryEditor({ date, entry, today, onSave, onDelete }: EntryEditorProps) {
  const [draft, setDraft] = useState<EntryDraft>({
    title: entry?.title ?? '',
    content: entry?.content ?? '',
    mood: entry?.mood,
  });
  const [saved, setSaved] = useState(false);

  const savedTitle = entry?.title ?? '';
  const savedContent = entry?.content ?? '';
  const isDirty =
    draft.title !== savedTitle ||
    draft.content !== savedContent ||
    (draft.mood ?? undefined) !== entry?.mood;
  const isEmpty = draft.title.trim().length === 0 && draft.content.trim().length === 0;
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
        <span className="editor-hint">正文会自动保存在本机浏览器中</span>
        <MoodPicker
          value={draft.mood ?? undefined}
          onChange={(mood) => changeDraft({ mood })}
        />
      </div>

      <textarea
        className="editor-content"
        value={draft.content}
        maxLength={MAX_CONTENT_LENGTH}
        placeholder="今天发生了什么？此刻在想什么？"
        aria-label="日记正文"
        onChange={(event) => changeDraft({ content: event.target.value })}
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