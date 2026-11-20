import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const PORT = Number(process.env.PORT ?? 3101);
const DB_CONFIG = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'diary',
  password: process.env.DB_PASSWORD ?? 'diary_pass',
  database: process.env.DB_NAME ?? 'diary_book',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
};

const MOODS = new Set(['happy', 'calm', 'loved', 'sad', 'anxious', 'angry', 'tired']);
const FONTS = new Set(['kai', 'xing', 'cao']);
const WEATHERS = new Set(['sunny', 'cloudy', 'rain', 'snow', 'wind']);
const MAX_ATTACHMENTS = 10;
const TITLE_LIMIT = 160;

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS diary_entries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entry_date CHAR(10) NOT NULL,
  title VARCHAR(160) NOT NULL DEFAULT '',
  content MEDIUMTEXT NOT NULL,
  mood VARCHAR(24) NULL,
  font VARCHAR(24) NULL,
  weather VARCHAR(24) NULL,
  attachments JSON NULL,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  UNIQUE KEY uq_diary_entry_date (entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const UPSERT = `
INSERT INTO diary_entries
  (id, entry_date, title, content, mood, font, weather, attachments, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  mood = VALUES(mood),
  font = VALUES(font),
  weather = VALUES(weather),
  attachments = VALUES(attachments),
  updated_at = VALUES(updated_at)
`;

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** 校验 PUT 请求体；返回错误文案或 null。 */
function validateEntryBody(date, body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return '请求体必须是 JSON 对象';
  }
  if (!isValidDateString(date)) {
    return 'date 必须是真实存在的 YYYY-MM-DD 日期';
  }
  if (body.date !== date) {
    return 'body.date 必须与路径中的日期一致';
  }
  if (typeof body.id !== 'string' || body.id.trim() === '') {
    return 'id 必须是非空字符串';
  }
  if (typeof body.title !== 'string') {
    return 'title 必须是字符串';
  }
  if (body.title.length > TITLE_LIMIT) {
    return `title 不能超过 ${TITLE_LIMIT} 个字符`;
  }
  if (typeof body.content !== 'string') {
    return 'content 必须是字符串';
  }
  if (typeof body.createdAt !== 'string' || typeof body.updatedAt !== 'string') {
    return 'createdAt 与 updatedAt 必须是 ISO 字符串';
  }
  if (body.mood !== undefined && body.mood !== null && !MOODS.has(body.mood)) {
    return 'mood 不合法';
  }
  if (body.font !== undefined && body.font !== null && !FONTS.has(body.font)) {
    return 'font 不合法';
  }
  if (body.weather !== undefined && body.weather !== null && !WEATHERS.has(body.weather)) {
    return 'weather 不合法';
  }
  if (body.attachments !== undefined && body.attachments !== null) {
    if (!Array.isArray(body.attachments)) {
      return 'attachments 必须是数组';
    }
    if (body.attachments.length > MAX_ATTACHMENTS) {
      return `attachments 不能超过 ${MAX_ATTACHMENTS} 项`;
    }
  }
  return null;
}

/** 数据库行（snake_case + JSON 字符串）→ 前端 DiaryEntry（camelCase）。 */
function rowToEntry(row) {
  const entry = {
    id: row.id,
    date: row.entry_date,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.mood) {
    entry.mood = row.mood;
  }
  if (row.font) {
    entry.font = row.font;
  }
  if (row.weather) {
    entry.weather = row.weather;
  }
  if (row.attachments !== null && row.attachments !== undefined) {
    entry.attachments =
      typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments;
  }
  return entry;
}

async function main() {
  let pool;
  try {
    pool = mysql.createPool(DB_CONFIG);
    await pool.query(CREATE_TABLE);
    await pool.query('SELECT 1');
  } catch (error) {
    console.error(
      `无法连接 MySQL（${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}）：${error.message}`,
    );
    console.error('请先运行 npm run db:up，并确认容器 diary-book-mysql 已 healthy。');
    await pool?.end().catch(() => {});
    process.exit(1);
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, database: 'up' });
    } catch (error) {
      res.status(503).json({ ok: false, database: 'down', error: error.message });
    }
  });

  app.get('/api/entries', async (_req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, entry_date, title, content, mood, font, weather, attachments, created_at, updated_at FROM diary_entries ORDER BY entry_date ASC',
      );
      res.json({ entries: rows.map(rowToEntry) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/entries/:date', async (req, res) => {
    const { date } = req.params;
    const invalid = validateEntryBody(date, req.body);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }
    const body = req.body;
    try {
      await pool.execute(UPSERT, [
        body.id,
        date,
        body.title,
        body.content,
        body.mood ?? null,
        body.font ?? null,
        body.weather ?? null,
        Array.isArray(body.attachments) ? JSON.stringify(body.attachments) : null,
        body.createdAt,
        body.updatedAt,
      ]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/entries/:date', async (req, res) => {
    const { date } = req.params;
    if (!isValidDateString(date)) {
      res.status(400).json({ error: 'date 必须是真实存在的 YYYY-MM-DD 日期' });
      return;
    }
    try {
      await pool.execute('DELETE FROM diary_entries WHERE entry_date = ?', [date]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // JSON 解析失败等中间件错误统一返回 JSON
  app.use((error, _req, res, _next) => {
    res.status(400).json({ error: error.message });
  });

  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`拾光日记 API 已启动：http://127.0.0.1:${PORT}`);
    console.log(
      `MySQL：${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`,
    );
  });

  server.on('error', (error) => {
    console.error(`API 监听 127.0.0.1:${PORT} 失败：${error.message}`);
    process.exit(1);
  });

  const shutdown = async () => {
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();