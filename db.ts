import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "farm.db");
const db = new Database(DB_PATH);

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      phone TEXT,
      role TEXT CHECK(role IN ('Admin', 'Farm Manager', 'Veterinary Officer', 'Farm Staff', 'Investor')),
      department TEXT,
      full_name TEXT,
      approved INTEGER DEFAULT 0
    )
  `);

  // Animals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      species TEXT CHECK(species IN ('Goats', 'Cattle', 'Sheep', 'Camels', 'Ostrich', 'Poultry', 'Guinea fowl', 'Other livestock')),
      breed TEXT,
      dam_id TEXT,
      sire_id TEXT,
      sex TEXT CHECK(sex IN ('Male', 'Female')),
      dob DATE,
      birth_weight REAL,
      location TEXT,
      status TEXT CHECK(status IN ('Alive', 'Sold', 'Dead')),
      photo_url TEXT,
      investor_id INTEGER,
      FOREIGN KEY(investor_id) REFERENCES users(id)
    )
  `);

  // Weight logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id TEXT,
      weight REAL,
      log_date DATE,
      created_by INTEGER,
      FOREIGN KEY(animal_id) REFERENCES animals(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);

  // Breeding records — redesigned to support dam/sire mating model
  db.exec(`
    CREATE TABLE IF NOT EXISTS breeding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id TEXT,
      dam_id TEXT,
      sire_id TEXT,
      event_type TEXT CHECK(event_type IN ('Estrus', 'Mating', 'Birth')) DEFAULT 'Mating',
      event_date DATE,
      mating_date DATE,
      expected_due_date DATE,
      partner_id TEXT,
      offspring_count INTEGER,
      birth_weights TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Pending PD',
      pd_status TEXT,
      approved INTEGER DEFAULT 0,
      FOREIGN KEY(animal_id) REFERENCES animals(id)
    )
  `);

  // Migration: add new columns to existing breeding_records table
  const breedingCols = db.prepare("PRAGMA table_info(breeding_records)").all() as any[];
  const breedingColNames = breedingCols.map((c: any) => c.name);
  const breedingMigrations = [
    { col: 'dam_id', def: 'TEXT' },
    { col: 'sire_id', def: 'TEXT' },
    { col: 'mating_date', def: 'DATE' },
    { col: 'expected_due_date', def: 'DATE' },
    { col: 'status', def: "TEXT DEFAULT 'Pending PD'" },
    { col: 'pd_status', def: 'TEXT' },
  ];
  breedingMigrations.forEach(m => {
    if (!breedingColNames.includes(m.col)) {
      try { db.exec(`ALTER TABLE breeding_records ADD COLUMN ${m.col} ${m.def}`); } catch (e) { /* ignore */ }
    }
  });

  // Health incidents — severity extended to support Medium & High from frontend
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id TEXT,
      reporter_id INTEGER,
      incident_date DATE,
      symptoms TEXT,
      diagnosis TEXT,
      treatment TEXT,
      severity TEXT,
      status TEXT CHECK(status IN ('Open', 'Under Treatment', 'Closed')),
      FOREIGN KEY(animal_id) REFERENCES animals(id),
      FOREIGN KEY(reporter_id) REFERENCES users(id)
    )
  `);

  // Migration: if old health_incidents has the narrow severity CHECK constraint, recreate table
  try {
    // Test insert with 'High' severity — if it fails, the old constraint is in place
    const testStmt = db.prepare(
      "INSERT INTO health_incidents (animal_id, reporter_id, incident_date, symptoms, diagnosis, treatment, severity, status) VALUES ('__test__', 1, '2000-01-01', 't', 't', 't', 'High', 'Open')"
    );
    testStmt.run();
    db.prepare("DELETE FROM health_incidents WHERE animal_id = '__test__'").run();
  } catch (constraintErr: any) {
    if (constraintErr.message && constraintErr.message.includes('CHECK constraint')) {
      // Migrate: copy data to temp, recreate, copy back
      db.exec(`
        ALTER TABLE health_incidents RENAME TO health_incidents_old;
        CREATE TABLE health_incidents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          animal_id TEXT,
          reporter_id INTEGER,
          incident_date DATE,
          symptoms TEXT,
          diagnosis TEXT,
          treatment TEXT,
          severity TEXT,
          status TEXT CHECK(status IN ('Open', 'Under Treatment', 'Closed'))
        );
        INSERT INTO health_incidents SELECT id, animal_id, reporter_id, incident_date, symptoms, diagnosis, treatment, severity, status FROM health_incidents_old;
        DROP TABLE health_incidents_old;
      `);
    }
  }

  // Vaccination management
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id TEXT,
      vaccine_name TEXT,
      dose TEXT,
      scheduled_date DATE,
      administered_date DATE,
      administered_by INTEGER,
      supervising_vet INTEGER,
      status TEXT CHECK(status IN ('Pending', 'Completed', 'Missed')),
      approved_by_manager INTEGER DEFAULT 0,
      FOREIGN KEY(animal_id) REFERENCES animals(id),
      FOREIGN KEY(administered_by) REFERENCES users(id),
      FOREIGN KEY(supervising_vet) REFERENCES users(id)
    )
  `);

  // Feed management — add stock_kg column if it doesn't exist (migration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      unit TEXT,
      cost_per_unit REAL,
      protein_pct REAL,
      energy_mj REAL,
      stock_kg REAL
    )
  `);

  // Migration: add stock_kg to existing feed_ingredients table
  const feedCols = db.prepare("PRAGMA table_info(feed_ingredients)").all() as any[];
  if (!feedCols.find((c: any) => c.name === 'stock_kg')) {
    try { db.exec("ALTER TABLE feed_ingredients ADD COLUMN stock_kg REAL"); } catch (e) { /* ignore */ }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id TEXT,
      ingredient_id INTEGER,
      quantity REAL,
      log_date DATE,
      cost REAL,
      FOREIGN KEY(animal_id) REFERENCES animals(id),
      FOREIGN KEY(ingredient_id) REFERENCES feed_ingredients(id)
    )
  `);

  // Approval Workflow
  db.exec(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER,
      entity_type TEXT,
      entity_id TEXT,
      action_type TEXT CHECK(action_type IN ('Create', 'Update', 'Delete')),
      old_data TEXT, -- JSON
      new_data TEXT, -- JSON
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')),
      reviewer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY(requester_id) REFERENCES users(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    )
  `);

  // Activity Logging
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Financials — supports both type+category (legacy) and simple category/sale model
  db.exec(`
    CREATE TABLE IF NOT EXISTS financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('Income', 'Expense')),
      category TEXT,
      amount REAL,
      record_date DATE,
      description TEXT,
      reference_id TEXT,
      created_by INTEGER,
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);

  // Migration: add reference_id to existing financials table
  const finCols = db.prepare("PRAGMA table_info(financials)").all() as any[];
  if (!finCols.find((c: any) => c.name === 'reference_id')) {
    try { db.exec("ALTER TABLE financials ADD COLUMN reference_id TEXT"); } catch (e) { /* ignore */ }
  }

  // Tasks
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
      priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')),
      due_date DATE,
      assigned_to INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assigned_to) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);

  // Seed default Admin
  const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get() as any;
  const adminHash = bcrypt.hashSync("admin", 10);

  if (!admin) {
    db.prepare(`
      INSERT INTO users (username, password, role, full_name, approved, email) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("admin", adminHash, "Admin", "System Administrator", 1, "admin@farm.com");
  } else {
    // Ensure existing admin is approved and has correct password for demo
    db.prepare("UPDATE users SET approved = 1, password = ?, role = 'Admin' WHERE username = 'admin'").run(adminHash);
  }

  // Seed some initial feed ingredients if empty
  const ingredientCount = db.prepare("SELECT COUNT(*) as count FROM feed_ingredients").get() as any;
  if (ingredientCount.count === 0) {
    const ingredients = [
      ['Maize', 'kg', 0.5, 9, 13.5],
      ['Soybean Meal', 'kg', 1.2, 44, 12.0],
      ['Brewer\'s Spent Grain', 'kg', 0.4, 24, 11.5],
      ['Forage', 'kg', 0.1, 7, 8.5]
    ];
    const insert = db.prepare("INSERT INTO feed_ingredients (name, unit, cost_per_unit, protein_pct, energy_mj) VALUES (?, ?, ?, ?, ?)");
    ingredients.forEach(i => insert.run(...i));
  }

  // Seed some animals if empty
  const animalCount = db.prepare("SELECT COUNT(*) as count FROM animals").get() as any;
  if (animalCount.count === 0) {
    const animals = [
      ['GT-001', 'Goats', 'Boer', 'Female', '2023-01-15', 3.5, 'Paddock A', 'Alive'],
      ['GT-002', 'Goats', 'Kalahari Red', 'Male', '2023-02-10', 3.8, 'Paddock A', 'Alive'],
      ['CT-001', 'Cattle', 'Brahman', 'Female', '2022-11-20', 25.0, 'Paddock B', 'Alive'],
      ['SH-001', 'Sheep', 'Dorper', 'Male', '2023-03-05', 4.2, 'Paddock C', 'Alive']
    ];
    const insert = db.prepare("INSERT INTO animals (id, species, breed, sex, dob, birth_weight, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    animals.forEach(a => insert.run(...a));

    // Seed some weights
    const weightInsert = db.prepare("INSERT INTO weight_logs (animal_id, weight, log_date, created_by) VALUES (?, ?, ?, ?)");
    weightInsert.run('GT-001', 3.5, '2023-01-15', 1);
    weightInsert.run('GT-001', 15.2, '2023-05-15', 1);
    weightInsert.run('GT-001', 28.5, '2023-09-15', 1);
  }

  // Seed some health incidents
  const healthCount = db.prepare("SELECT COUNT(*) as count FROM health_incidents").get() as any;
  if (healthCount.count === 0) {
    db.prepare(`
      INSERT INTO health_incidents (animal_id, reporter_id, incident_date, symptoms, diagnosis, treatment, severity, status)
      VALUES ('GT-001', 1, '2023-10-12', 'Limping, swollen hoof', 'Foot Rot', 'Oxytetracycline 10ml', 'Moderate', 'Closed')
    `).run();
  }

  // Seed some financials
  const financialCount = db.prepare("SELECT COUNT(*) as count FROM financials").get() as any;
  if (financialCount.count === 0) {
    const records = [
      ['Income', 'Livestock Sale', 1200.0, '2023-11-01', 'Sold 3 goats'],
      ['Expense', 'Feed', 450.0, '2023-11-05', 'Purchased 500kg maize'],
      ['Expense', 'Veterinary', 150.0, '2023-11-10', 'Routine checkup and vaccinations']
    ];
    const insert = db.prepare("INSERT INTO financials (type, category, amount, record_date, description, created_by) VALUES (?, ?, ?, ?, ?, 1)");
    records.forEach(r => insert.run(...r));
  }

  // Seed some tasks
  const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as any;
  if (taskCount.count === 0) {
    const tasks = [
      ['Repair Paddock A Fence', 'The north corner fence is sagging.', 'Pending', 'High', '2023-11-25', 1, 1],
      ['Order Winter Feed', 'Stock up on maize and soybean meal.', 'In Progress', 'Medium', '2023-11-30', 1, 1],
      ['Vaccinate New Kids', 'Administer PPR vaccine to the 5 new goat kids.', 'Pending', 'High', '2023-11-22', 1, 1]
    ];
    const insert = db.prepare("INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    tasks.forEach(t => insert.run(...t));
  }
}

export default db;
