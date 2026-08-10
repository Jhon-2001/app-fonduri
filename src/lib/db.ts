import fs from "fs";
import path from "path";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import { TOP10_REFERENCE } from "./seed-top10";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function persist() {
  if (!db) return;
  ensureDataDir();
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getSql() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) =>
        path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
    });
  }
  return SQL;
}

function columnExists(database: Database, table: string, column: string) {
  const info = rowsFromQuery<{ name: string }>(database, `PRAGMA table_info(${table})`);
  return info.some((c) => c.name === column);
}

function ensureSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      institution TEXT NOT NULL,
      project_title TEXT NOT NULL,
      domain TEXT NOT NULL,
      subdomain TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const extras: Array<[string, string]> = [
    ["app_number", "TEXT"],
    ["county", "TEXT"],
    ["locality", "TEXT"],
    ["status", "TEXT"],
    ["is_reference", "INTEGER"],
  ];

  for (const [col, type] of extras) {
    if (!columnExists(database, "submissions", col)) {
      database.run(`ALTER TABLE submissions ADD COLUMN ${col} ${type}`);
    }
  }
}

function seedTop10(database: Database) {
  const existing = rowsFromQuery<{ c: number }>(
    database,
    "SELECT COUNT(*) as c FROM submissions WHERE is_reference = 1"
  );
  if ((existing[0]?.c ?? 0) > 0) return;

  const systemUser = rowsFromQuery<{ id: number }>(
    database,
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    ["platforma.oficiala"]
  );

  let userId = systemUser[0]?.id;
  if (!userId) {
    database.run("INSERT INTO users (username) VALUES (?)", ["platforma.oficiala"]);
    const created = rowsFromQuery<{ id: number }>(
      database,
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      ["platforma.oficiala"]
    );
    userId = created[0].id;
  }

  for (const row of TOP10_REFERENCE) {
    database.run(
      `INSERT INTO submissions
        (user_id, username, duration_ms, institution, project_title, domain, subdomain,
         created_at, app_number, county, locality, status, is_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        row.institution,
        row.durationMs,
        row.institution,
        `Fișă de proiect – ${row.locality}`,
        row.domain,
        row.domain,
        row.submittedAt,
        row.appNumber,
        row.county,
        row.locality,
        "Depus",
      ]
    );
  }
}

export async function getDb() {
  if (db) return db;

  const sql = await getSql();
  ensureDataDir();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new sql.Database(fileBuffer);
  } else {
    db = new sql.Database();
  }

  ensureSchema(db);
  seedTop10(db);
  persist();
  return db;
}

export type UserRow = {
  id: number;
  username: string;
  created_at: string;
};

export type LeaderboardRow = {
  id: number;
  username: string;
  duration_ms: number;
  project_title: string;
  domain: string;
  created_at: string;
  app_number?: string;
  institution?: string;
  county?: string;
  locality?: string;
  status?: string;
};

export type ApplicationRow = {
  id: number;
  app_number: string;
  username: string;
  institution: string;
  project_title: string;
  domain: string;
  subdomain: string;
  county: string;
  locality: string;
  status: string;
  duration_ms: number;
  created_at: string;
  is_reference: number;
};

function rowsFromQuery<T>(database: Database, sql: string, params: unknown[] = []): T[] {
  const stmt = database.prepare(sql);
  stmt.bind(params as never[]);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export async function upsertUser(username: string): Promise<UserRow> {
  const database = await getDb();
  const existing = rowsFromQuery<UserRow>(
    database,
    "SELECT id, username, created_at FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (existing[0]) return existing[0];

  database.run("INSERT INTO users (username) VALUES (?)", [username]);
  persist();

  const created = rowsFromQuery<UserRow>(
    database,
    "SELECT id, username, created_at FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return created[0];
}

function nextAppNumber(database: Database) {
  const year = new Date().getFullYear();
  const rows = rowsFromQuery<{ c: number }>(
    database,
    "SELECT COUNT(*) as c FROM submissions WHERE is_reference IS NULL OR is_reference = 0"
  );
  const n = (rows[0]?.c ?? 0) + 1;
  return `ADRNV-${year}-${String(n).padStart(6, "0")}`;
}

export async function createSubmission(input: {
  userId: number;
  username: string;
  durationMs: number;
  institution: string;
  projectTitle: string;
  domain: string;
  subdomain: string;
  county?: string;
  locality?: string;
}) {
  const database = await getDb();
  const appNumber = nextAppNumber(database);
  database.run(
    `INSERT INTO submissions
      (user_id, username, duration_ms, institution, project_title, domain, subdomain,
       app_number, county, locality, status, is_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      input.userId,
      input.username,
      input.durationMs,
      input.institution,
      input.projectTitle,
      input.domain,
      input.subdomain,
      appNumber,
      input.county ?? "",
      input.locality ?? "",
      "Depus",
    ]
  );
  persist();
  return { appNumber };
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const database = await getDb();
  return rowsFromQuery<LeaderboardRow>(
    database,
    `SELECT id, username, duration_ms, project_title, domain, created_at,
            app_number, institution, county, locality, status
     FROM submissions
     ORDER BY duration_ms ASC, created_at ASC
     LIMIT ?`,
    [limit]
  );
}

export async function getApplications(filters?: {
  q?: string;
  county?: string;
  domain?: string;
}): Promise<ApplicationRow[]> {
  const database = await getDb();
  let sql = `
    SELECT id,
           COALESCE(app_number, 'ADRNV-' || id) as app_number,
           username,
           institution,
           project_title,
           domain,
           subdomain,
           COALESCE(county, '') as county,
           COALESCE(locality, '') as locality,
           COALESCE(status, 'Depus') as status,
           duration_ms,
           created_at,
           COALESCE(is_reference, 0) as is_reference
    FROM submissions
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.q) {
    sql += ` AND (
      institution LIKE ? OR project_title LIKE ? OR username LIKE ?
      OR COALESCE(app_number, '') LIKE ? OR domain LIKE ?
    )`;
    const like = `%${filters.q}%`;
    params.push(like, like, like, like, like);
  }
  if (filters?.county) {
    sql += " AND county = ?";
    params.push(filters.county);
  }
  if (filters?.domain) {
    sql += " AND (domain LIKE ? OR subdomain LIKE ?)";
    params.push(`%${filters.domain}%`, `%${filters.domain}%`);
  }

  sql += " ORDER BY created_at DESC, id DESC";
  return rowsFromQuery<ApplicationRow>(database, sql, params);
}
