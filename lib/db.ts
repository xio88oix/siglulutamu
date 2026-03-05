import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "f1picks.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const d = db;

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round INTEGER NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed'))
    );

    CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      UNIQUE(race_id, driver_id),
      UNIQUE(race_id, position)
    );

    CREATE TABLE IF NOT EXISTS race_picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      points INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, race_id)
    );

    CREATE TABLE IF NOT EXISTS picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_picks_id INTEGER NOT NULL REFERENCES race_picks(id) ON DELETE CASCADE,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS position_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finishing_place INTEGER NOT NULL UNIQUE,
      points INTEGER NOT NULL
    );
  `);

  // Seed if empty
  const userCount = (d.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  if (userCount === 0) {
    seedData(d);
  }
}

function seedData(d: Database.Database) {
  // Position points
  const positionPointsData = [
    [1, 50], [2, 30], [3, 20], [4, 10], [5, 9],
    [6, 8], [7, 7], [8, 6], [9, 5], [10, 4],
    [11, 3], [12, 3], [13, 4], [14, 5], [15, 6],
    [16, 7], [17, 8], [18, 9], [19, 10], [20, 20],
    [21, 30], [22, 50],
  ];
  const insertPP = d.prepare("INSERT INTO position_points (finishing_place, points) VALUES (?, ?)");
  for (const [place, pts] of positionPointsData) {
    insertPP.run(place, pts);
  }

  // Users
  const adminHash = bcrypt.hashSync("admin123", 10);
  const martinHash = bcrypt.hashSync("martin123", 10);
  const nancyHash = bcrypt.hashSync("nancy123", 10);
  d.prepare("INSERT INTO users (name, password, is_admin) VALUES (?, ?, ?)").run("admin", adminHash, 1);
  d.prepare("INSERT INTO users (name, password, is_admin) VALUES (?, ?, ?)").run("Martin", martinHash, 0);
  d.prepare("INSERT INTO users (name, password, is_admin) VALUES (?, ?, ?)").run("Nancy", nancyHash, 0);

  // F1 2026 Drivers
  const drivers = [
    ["Max Verstappen", "Red Bull"],
    ["Liam Lawson", "Red Bull"],
    ["Lewis Hamilton", "Ferrari"],
    ["Charles Leclerc", "Ferrari"],
    ["Lando Norris", "McLaren"],
    ["Oscar Piastri", "McLaren"],
    ["George Russell", "Mercedes"],
    ["Andrea Kimi Antonelli", "Mercedes"],
    ["Fernando Alonso", "Aston Martin"],
    ["Lance Stroll", "Aston Martin"],
    ["Pierre Gasly", "Alpine"],
    ["Jack Doohan", "Alpine"],
    ["Nico Hulkenberg", "Sauber"],
    ["Gabriel Bortoleto", "Sauber"],
    ["Carlos Sainz", "Williams"],
    ["Alexander Albon", "Williams"],
    ["Yuki Tsunoda", "RB"],
    ["Isack Hadjar", "RB"],
    ["Oliver Bearman", "Haas"],
    ["Esteban Ocon", "Haas"],
  ];
  const insertDriver = d.prepare("INSERT INTO drivers (name, team) VALUES (?, ?)");
  for (const [name, team] of drivers) {
    insertDriver.run(name, team);
  }

  // 2026 Races
  const races = [
    [1, "Australian GP", "2026-03-15", "closed"],
    [2, "Chinese GP", "2026-03-22", "open"],
    [3, "Japanese GP", "2026-04-05", "open"],
    [4, "Bahrain GP", "2026-04-19", "open"],
    [5, "Saudi Arabian GP", "2026-05-03", "open"],
    [6, "Miami GP", "2026-05-10", "open"],
    [7, "Emilia Romagna GP", "2026-05-24", "open"],
    [8, "Monaco GP", "2026-05-31", "open"],
    [9, "Spanish GP", "2026-06-14", "open"],
    [10, "Canadian GP", "2026-06-21", "open"],
    [11, "Austrian GP", "2026-07-05", "open"],
    [12, "British GP", "2026-07-19", "open"],
    [13, "Hungarian GP", "2026-08-02", "open"],
    [14, "Belgian GP", "2026-08-30", "open"],
    [15, "Dutch GP", "2026-09-06", "open"],
    [16, "Italian GP", "2026-09-13", "open"],
    [17, "Azerbaijan GP", "2026-09-27", "open"],
    [18, "Singapore GP", "2026-10-04", "open"],
    [19, "United States GP", "2026-10-18", "open"],
    [20, "Mexico City GP", "2026-10-25", "open"],
    [21, "São Paulo GP", "2026-11-08", "open"],
    [22, "Las Vegas GP", "2026-11-22", "open"],
    [23, "Qatar GP", "2026-11-29", "open"],
    [24, "Abu Dhabi GP", "2026-12-06", "open"],
  ];
  const insertRace = d.prepare("INSERT INTO races (round, name, date, status) VALUES (?, ?, ?, ?)");
  for (const [round, name, date, status] of races) {
    insertRace.run(round, name, date, status);
  }

  // Get IDs for test data
  const hamiltonId = (d.prepare("SELECT id FROM drivers WHERE name = 'Lewis Hamilton'").get() as { id: number }).id;
  const piastriId = (d.prepare("SELECT id FROM drivers WHERE name = 'Oscar Piastri'").get() as { id: number }).id;
  const strollId = (d.prepare("SELECT id FROM drivers WHERE name = 'Lance Stroll'").get() as { id: number }).id;
  const verstappenId = (d.prepare("SELECT id FROM drivers WHERE name = 'Max Verstappen'").get() as { id: number }).id;
  const norrisId = (d.prepare("SELECT id FROM drivers WHERE name = 'Lando Norris'").get() as { id: number }).id;
  const alonsoId = (d.prepare("SELECT id FROM drivers WHERE name = 'Fernando Alonso'").get() as { id: number }).id;
  const round1Id = (d.prepare("SELECT id FROM races WHERE round = 1").get() as { id: number }).id;
  const martinUserId = (d.prepare("SELECT id FROM users WHERE name = 'Martin'").get() as { id: number }).id;
  const nancyUserId = (d.prepare("SELECT id FROM users WHERE name = 'Nancy'").get() as { id: number }).id;

  // Race results for Round 1
  const insertResult = d.prepare("INSERT INTO race_results (race_id, driver_id, position) VALUES (?, ?, ?)");
  insertResult.run(round1Id, hamiltonId, 1);
  insertResult.run(round1Id, piastriId, 2);
  insertResult.run(round1Id, verstappenId, 3);
  insertResult.run(round1Id, alonsoId, 4);
  insertResult.run(round1Id, norrisId, 5);
  insertResult.run(round1Id, strollId, 22);

  // Nancy's picks: Hamilton, Piastri, Stroll
  // Hamilton=1→50, Piastri=2→30, Stroll=22→50 = 130
  const nancyRP = d.prepare("INSERT INTO race_picks (user_id, race_id, points) VALUES (?, ?, ?)").run(nancyUserId, round1Id, 130);
  const insertPick = d.prepare("INSERT INTO picks (race_picks_id, driver_id) VALUES (?, ?)");
  insertPick.run(nancyRP.lastInsertRowid, hamiltonId);
  insertPick.run(nancyRP.lastInsertRowid, piastriId);
  insertPick.run(nancyRP.lastInsertRowid, strollId);

  // Martin's picks: Verstappen, Piastri, Norris
  // Verstappen=3→20, Piastri=2→30, Norris=5→9 = 59
  const martinRP = d.prepare("INSERT INTO race_picks (user_id, race_id, points) VALUES (?, ?, ?)").run(martinUserId, round1Id, 59);
  insertPick.run(martinRP.lastInsertRowid, verstappenId);
  insertPick.run(martinRP.lastInsertRowid, piastriId);
  insertPick.run(martinRP.lastInsertRowid, norrisId);
}

export default getDb;
