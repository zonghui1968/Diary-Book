import { useMemo, useState } from 'react';
import { BookShell } from './components/BookShell';
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
import { useEntries, type DataSource } from './hooks/useEntries';

const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  connecting: '正在连接 MySQL…',
  server: '已连接 MySQL',
  local: '本地模式（后端未连接）',
};

export default function App() {
  const currentDay = useMemo(() => todayString(), []);
  const { entries, getEntry, saveEntry, removeEntry, dataSource } = useEntries();
  const [selectedDate, setSelectedDate] = useState(currentDay);
  const [bookOpen, setBookOpen] = useState(false);

  const selectedEntry = getEntry(selectedDate);
  const isToday = selectedDate === currentDay;

  // 页码：按日期升序取当前日期在日记本中的位置；空日期排在最后
  const orderedDates = useMemo(
    () => entries.map((entry) => entry.date).sort((a, b) => a.localeCompare(b)),
    [entries],
  );
  const selectedIndex = orderedDates.indexOf(selectedDate);
  const pageNumber = selectedIndex === -1 ? entries.length + 1 : selectedIndex + 1;
  const pageCount = Math.max(entries.length, pageNumber, 1);

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
    <BookShell
      open={bookOpen}
      onOpen={() => setBookOpen(true)}
      onClose={() => setBookOpen(false)}
      pageNumber={pageNumber}
      pageCount={pageCount}
    >
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
          <span className={`data-source data-source--${dataSource}`} role="status">
            <span className="data-source-dot" aria-hidden="true" />
            {DATA_SOURCE_LABELS[dataSource]}
          </span>
          <span>拾光日记 · 本地版</span>
        </footer>
      </div>
    </BookShell>
  );
}