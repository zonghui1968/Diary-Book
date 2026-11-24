import { useMemo, useState } from 'react';
import { BookShell } from './components/BookShell';
import { EntryList } from './components/EntryList';
import { NotebookPage } from './components/NotebookPage';
import { PageTurn, type PageTurnDirection } from './components/PageTurn';
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
  const [turnDirection, setTurnDirection] = useState<PageTurnDirection>('next');

  const selectedEntry = getEntry(selectedDate);
  const isToday = selectedDate === currentDay;

  const sortedDates = useMemo(
    () => entries.map((entry) => entry.date).sort((a, b) => a.localeCompare(b)),
    [entries],
  );
  const selectedIndex = sortedDates.indexOf(selectedDate);
  // 没有 entry 的日期概念上排在最后一页之后
  const pageNumber = selectedIndex >= 0 ? selectedIndex + 1 : sortedDates.length + 1;
  const pageCount = sortedDates.length + (selectedIndex >= 0 ? 0 : 1);
  const prevDate = useMemo(() => {
    const earlier = sortedDates.filter((date) => date < selectedDate);
    return earlier.length > 0 ? earlier[earlier.length - 1] : undefined;
  }, [sortedDates, selectedDate]);
  const nextDate = useMemo(
    () => sortedDates.find((date) => date > selectedDate),
    [sortedDates, selectedDate],
  );

  const navigateTo = (value: string, direction: PageTurnDirection) => {
    if (value === selectedDate || !isValidDateString(value)) {
      return;
    }
    setTurnDirection(direction);
    setSelectedDate(value);
  };

  const changeDate = (value: string) => {
    if (isValidDateString(value) && value !== selectedDate) {
      navigateTo(value, value > selectedDate ? 'next' : 'prev');
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
                  onClick={() => navigateTo(currentDay, 'next')}
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
              onSelect={changeDate}
            />
          </aside>

          <section className="editor-pane">
            <nav className="page-nav" aria-label="翻页">
              <button
                type="button"
                className="button button--ghost button--small page-nav-button"
                aria-label="上一页"
                disabled={!prevDate}
                onClick={() => prevDate && navigateTo(prevDate, 'prev')}
              >
                ← 上一页
              </button>
              <button
                type="button"
                className="button button--ghost button--small page-nav-button"
                aria-label="下一页"
                disabled={!nextDate}
                onClick={() => nextDate && navigateTo(nextDate, 'next')}
              >
                下一页 →
              </button>
            </nav>

            <PageTurn
              key={selectedDate}
              direction={turnDirection}
              pageKey={selectedDate}
            >
              <NotebookPage
                date={selectedDate}
                entry={selectedEntry}
                today={currentDay}
                pageNumber={pageNumber}
                pageCount={pageCount}
                onSave={saveSelected}
                onDelete={deleteSelected}
              />
            </PageTurn>
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