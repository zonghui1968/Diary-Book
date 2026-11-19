import { useMemo, useState } from 'react';
import { EntryEditor } from './components/EntryEditor';
import { EntryList } from './components/EntryList';
import { APP_NAME, APP_TAGLINE } from './domain/constants';
import {
  formatChineseDate,
  isValidDateString,
  todayString,
  weekdayLabel,
} from './domain/date';
import type { EntryDraft } from './domain/types';
import { useEntries } from './hooks/useEntries';

export default function App() {
  const currentDay = useMemo(() => todayString(), []);
  const { entries, getEntry, saveEntry, removeEntry } = useEntries();
  const [selectedDate, setSelectedDate] = useState(currentDay);

  const selectedEntry = getEntry(selectedDate);
  const isToday = selectedDate === currentDay;

  const changeDate = (value: string) => {
    if (isValidDateString(value)) {
      setSelectedDate(value);
    }
  };

  const saveSelected = (draft: EntryDraft) => {
    saveEntry(selectedDate, draft, new Date().toISOString());
  };

  const deleteSelected = () => {
    const confirmed = window.confirm(
      `确定删除 ${formatChineseDate(selectedDate)} 的日记吗？删除后无法恢复。`,
    );
    if (confirmed) {
      removeEntry(selectedDate);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            拾
          </span>
          <div>
            <h1>{APP_NAME}</h1>
            <p>{APP_TAGLINE}</p>
          </div>
        </div>
        <div className="today-badge">
          <span className="today-badge-label">今天</span>
          <span>
            {formatChineseDate(currentDay)} · {weekdayLabel(currentDay)}
          </span>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <div className="sidebar-head">
            <div>
              <h2>日记本</h2>
              <p>共 {entries.length} 篇</p>
            </div>
            {!isToday && (
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setSelectedDate(currentDay)}
              >
                回到今天
              </button>
            )}
          </div>

          <label className="date-jump">
            <span>翻到某一天</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => changeDate(event.target.value)}
            />
          </label>

          <EntryList
            entries={entries}
            selectedDate={selectedDate}
            today={currentDay}
            onSelect={setSelectedDate}
          />
        </aside>

        <section className="editor-pane">
          <EntryEditor
            key={selectedDate}
            date={selectedDate}
            entry={selectedEntry}
            today={currentDay}
            onSave={saveSelected}
            onDelete={deleteSelected}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>内容只保存在这台设备的浏览器里</span>
        <span>拾光日记 · 本地版</span>
      </footer>
    </div>
  );
}