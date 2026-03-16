import { Express } from "express";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "farm-secret-key";

export function setupApi(app: Express) {
  // Middleware to check auth
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Activity Logger Utility
  const logActivity = (userId: number, action: string, entityType: string, entityId: string, details: string) => {
    try {
      db.prepare(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, action, entityType, entityId, details);
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  };

  // Auth
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for username: ${username}`);

      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`User found: ${user.username}, approved: ${user.approved}`);

      if (!user.approved) {
        console.log(`User not approved: ${username}`);
        return res.status(403).json({ error: "Your account is pending approval by an administrator." });
      }

      const valid = bcrypt.compareSync(password, user.password);
      console.log(`Password valid: ${valid}`);

      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.full_name } });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password, fullName, email, phone, requestedRole, department } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(`
        INSERT INTO users (username, password, full_name, email, phone, role, department, approved) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(username, hashedPassword, fullName, email, phone, requestedRole, department);
      res.status(201).json({ success: true, message: "Registration successful. Please wait for admin approval." });
    } catch (e: any) {
      console.error("Registration error:", e);
      res.status(400).json({ error: e.message.includes("UNIQUE") ? "Username already exists" : e.message });
    }
  });

  // User Management (Admin only)
  app.get("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Farm Manager') return res.status(403).json({ error: "Forbidden" });
    const users = db.prepare("SELECT id, username, full_name, role, approved, email, phone, department FROM users").all();
    res.json(users);
  });

  app.get("/api/investors", authenticate, (req: any, res) => {
    const investors = db.prepare("SELECT id, full_name FROM users WHERE role = 'Investor' AND approved = 1").all();
    res.json(investors);
  });

  app.delete("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: "Forbidden" });
    if (req.params.id === '1') return res.status(400).json({ error: "Cannot delete primary admin" });
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    logActivity(req.user.id, "Delete User", "User", req.params.id, `Deleted user ${req.params.id}`);
    res.json({ success: true });
  });

  app.post("/api/users/:id/approve", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: "Forbidden" });
    const { role } = req.body;
    db.prepare("UPDATE users SET approved = 1, role = ? WHERE id = ?").run(role, req.params.id);
    logActivity(req.user.id, "Approve User", "User", req.params.id, `Approved user with role ${role}`);
    res.json({ success: true });
  });

  // Reject a pending user (sets approved=-1, does not delete)
  app.post("/api/users/:id/reject", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: "Forbidden" });
    db.prepare("UPDATE users SET approved = -1 WHERE id = ?").run(req.params.id);
    logActivity(req.user.id, "Reject User", "User", req.params.id, `Rejected user ${req.params.id}`);
    res.json({ success: true });
  });

  // Update the role of an existing approved user
  app.patch("/api/users/:id/role", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Farm Manager') return res.status(403).json({ error: "Forbidden" });
    const { role } = req.body;
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    logActivity(req.user.id, "Update User Role", "User", req.params.id, `Role changed to ${role}`);
    res.json({ success: true });
  });

  // Admin/Farm Manager: create a user directly (bypasses approval flow)
  app.post("/api/users/create", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Farm Manager') return res.status(403).json({ error: "Forbidden" });
    const { username, password, fullName, email, phone, role, department } = req.body;
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ error: "username, password, fullName and email are required" });
    }
    try {
      const hashed = bcrypt.hashSync(password, 10);
      db.prepare(`
        INSERT INTO users (username, password, full_name, email, phone, role, department, approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(username, hashed, fullName, email, phone || '', role || 'Farm Staff', department || '');
      logActivity(req.user.id, "Create User", "User", username, `Created user ${username} with role ${role}`);
      res.status(201).json({ success: true });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: "Username already exists" });
      res.status(400).json({ error: e.message });
    }
  });

  // Approval Workflow Engine
  app.post("/api/approvals/request", authenticate, (req: any, res) => {
    const { entityType, entityId, actionType, oldData, newData } = req.body;
    try {
      db.prepare(`
        INSERT INTO approval_requests (requester_id, entity_type, entity_id, action_type, old_data, new_data, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending')
      `).run(req.user.id, entityType, entityId, actionType, JSON.stringify(oldData), JSON.stringify(newData));
      res.status(201).json({ success: true, message: "Request submitted for approval" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/approvals/pending", authenticate, (req: any, res) => {
    if (!['Admin', 'Farm Manager'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    const requests = db.prepare(`
      SELECT ar.*, u.full_name as requester_name 
      FROM approval_requests ar
      JOIN users u ON ar.requester_id = u.id
      WHERE ar.status = 'Pending'
    `).all();
    res.json(requests);
  });

  app.post("/api/approvals/:id/review", authenticate, (req: any, res) => {
    if (!['Admin', 'Farm Manager'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    const { status } = req.body;
    const request = db.prepare("SELECT * FROM approval_requests WHERE id = ?").get(req.params.id) as any;

    if (!request) return res.status(404).json({ error: "Request not found" });

    db.prepare("UPDATE approval_requests SET status = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(status, req.user.id, req.params.id);

    if (status === 'Approved') {
      const newData = JSON.parse(request.new_data);
      // Handle actual data update based on entity type
      if (request.entity_type === 'Animal' && request.action_type === 'Delete') {
        db.prepare("DELETE FROM animals WHERE id = ?").run(request.entity_id);
      }
      // Add more entity handlers as needed
    }

    logActivity(req.user.id, "Review Approval", "ApprovalRequest", req.params.id, `Reviewed as ${status}`);
    res.json({ success: true });
  });

  // Animals
  app.get("/api/animals", authenticate, (req: any, res) => {
    let animals;
    if (req.user.role === 'Investor') {
      animals = db.prepare("SELECT * FROM animals WHERE investor_id = ?").all(req.user.id);
    } else {
      animals = db.prepare("SELECT * FROM animals").all();
    }
    res.json(animals);
  });

  app.get("/api/animals/:id", authenticate, (req: any, res) => {
    const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(req.params.id);
    if (!animal) return res.status(404).json({ error: "Animal not found" });
    res.json(animal);
  });

  app.post("/api/animals", authenticate, (req: any, res) => {
    const { id, species, breed, dam_id, sire_id, dob, sex, birth_weight, location, status, photo_url, investor_id } = req.body;
    try {
      db.prepare(`
        INSERT INTO animals (id, species, breed, dam_id, sire_id, dob, sex, birth_weight, location, status, photo_url, investor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, species, breed, dam_id, sire_id, dob, sex, birth_weight, location, status, photo_url, investor_id);
      logActivity(req.user.id, "Create Animal", "Animal", id, `Created ${species} ${breed}`);
      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/animals/:id", authenticate, (req: any, res) => {
    const { species, breed, dam_id, sire_id, dob, sex, birth_weight, location, status, photo_url, investor_id } = req.body;
    try {
      db.prepare(`
        UPDATE animals SET species=COALESCE(?,species), breed=COALESCE(?,breed),
          dam_id=COALESCE(?,dam_id), sire_id=COALESCE(?,sire_id), dob=COALESCE(?,dob),
          sex=COALESCE(?,sex), birth_weight=COALESCE(?,birth_weight), location=COALESCE(?,location),
          status=COALESCE(?,status), photo_url=COALESCE(?,photo_url), investor_id=COALESCE(?,investor_id)
        WHERE id=?
      `).run(species, breed, dam_id, sire_id, dob, sex, birth_weight, location, status, photo_url, investor_id, req.params.id);
      logActivity(req.user.id, "Update Animal", "Animal", req.params.id, `Updated animal profile`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/animals/:id/health", authenticate, (req, res) => {
    const records = db.prepare("SELECT * FROM health_incidents WHERE animal_id = ? ORDER BY incident_date DESC").all(req.params.id);
    res.json(records);
  });

  app.get("/api/animals/:id/breeding", authenticate, (req, res) => {
    const records = db.prepare(
      "SELECT * FROM breeding_records WHERE dam_id = ? OR sire_id = ? ORDER BY mating_date DESC, event_date DESC"
    ).all(req.params.id, req.params.id);
    res.json(records);
  });

  app.get("/api/animals/:id/vaccinations", authenticate, (req, res) => {
    const records = db.prepare("SELECT * FROM vaccinations WHERE animal_id = ? ORDER BY administered_date DESC").all(req.params.id);
    res.json(records);
  });

  // Weight Logs & ADG
  app.get("/api/animals/:id/weights", authenticate, (req, res) => {
    const weights = db.prepare("SELECT * FROM weight_logs WHERE animal_id = ? ORDER BY log_date ASC").all(req.params.id);
    res.json(weights);
  });

  app.post("/api/weights", authenticate, (req: any, res) => {
    const { animal_id, weight, log_date } = req.body;
    db.prepare("INSERT INTO weight_logs (animal_id, weight, log_date, created_by) VALUES (?, ?, ?, ?)")
      .run(animal_id, weight, log_date, req.user.id);
    logActivity(req.user.id, "Record Weight", "Animal", animal_id, `Recorded weight: ${weight}kg`);
    res.status(201).json({ success: true });
  });

  // Feed Formulation
  app.get("/api/feed/ingredients", authenticate, (req, res) => {
    const ingredients = db.prepare("SELECT * FROM feed_ingredients").all();
    res.json(ingredients);
  });

  app.post("/api/feed/ingredients", authenticate, (req: any, res) => {
    const { name, protein_pct, energy_mj, cost_per_unit, unit, stock_kg } = req.body;
    try {
      db.prepare(`
        INSERT INTO feed_ingredients (name, protein_pct, energy_mj, cost_per_unit, unit, stock_kg)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, Number(protein_pct), Number(energy_mj), Number(cost_per_unit), unit || 'kg', Number(stock_kg) || 0);
      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/feed/consumption", authenticate, (req, res) => {
    const consumption = db.prepare(`
      SELECT fc.*, fi.name as ingredient_name 
      FROM feed_consumption fc
      JOIN feed_ingredients fi ON fc.ingredient_id = fi.id
      ORDER BY log_date DESC
    `).all();
    res.json(consumption);
  });

  app.post("/api/feed/formulate", authenticate, (req: any, res) => {
    const { ingredients } = req.body; // Array of { id, quantity }
    let totalProtein = 0;
    let totalEnergy = 0;
    let totalCost = 0;
    let totalWeight = 0;

    ingredients.forEach((item: any) => {
      const ing = db.prepare("SELECT * FROM feed_ingredients WHERE id = ?").get(item.id) as any;
      if (ing) {
        totalWeight += item.quantity;
        totalProtein += (ing.protein_pct / 100) * item.quantity;
        totalEnergy += ing.energy_mj * item.quantity;
        totalCost += ing.cost_per_unit * item.quantity;
      }
    });

    res.json({
      protein_pct: totalWeight > 0 ? (totalProtein / totalWeight) * 100 : 0,
      energy_mj_per_kg: totalWeight > 0 ? totalEnergy / totalWeight : 0,
      cost_per_kg: totalWeight > 0 ? totalCost / totalWeight : 0,
      total_weight: totalWeight
    });
  });

  // Health & Vaccinations
  app.get("/api/health-records", authenticate, (req: any, res) => {
    const incidents = db.prepare("SELECT * FROM health_incidents ORDER BY incident_date DESC").all();
    res.json(incidents);
  });

  app.post("/api/health/incidents", authenticate, (req: any, res) => {
    const { animal_id, symptoms, diagnosis, treatment, severity } = req.body;
    db.prepare(`
      INSERT INTO health_incidents (animal_id, reporter_id, incident_date, symptoms, diagnosis, treatment, severity, status)
      VALUES (?, ?, CURRENT_DATE, ?, ?, ?, ?, 'Open')
    `).run(animal_id, req.user.id, symptoms, diagnosis, treatment, severity);
    logActivity(req.user.id, "Report Health Incident", "Animal", animal_id, `Reported ${severity} incident`);
    res.status(201).json({ success: true });
  });

  app.patch("/api/health-records/:id", authenticate, (req: any, res) => {
    const { diagnosis, treatment, severity, status } = req.body;
    try {
      db.prepare(`
        UPDATE health_incidents SET
          diagnosis=COALESCE(?,diagnosis), treatment=COALESCE(?,treatment),
          severity=COALESCE(?,severity), status=COALESCE(?,status)
        WHERE id=?
      `).run(diagnosis, treatment, severity, status, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/vaccinations/pending", authenticate, (req, res) => {
    const pending = db.prepare(`
      SELECT v.*, a.species, a.breed 
      FROM vaccinations v
      JOIN animals a ON v.animal_id = a.id
      WHERE v.status = 'Pending'
    `).all();
    res.json(pending);
  });

  app.patch("/api/vaccinations/:id", authenticate, (req: any, res) => {
    const { status, administered_date } = req.body;
    try {
      db.prepare("UPDATE vaccinations SET status=?, administered_date=COALESCE(?,administered_date) WHERE id=?")
        .run(status, administered_date || null, req.params.id);
      logActivity(req.user.id, "Update Vaccination", "Vaccination", req.params.id, `Status set to ${status}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Schedule a new vaccination
  app.post("/api/vaccinations", authenticate, (req: any, res) => {
    const { animal_id, vaccine_name, dose, scheduled_date, supervising_vet } = req.body;
    try {
      if (!animal_id || !vaccine_name || !scheduled_date) {
        return res.status(400).json({ error: "animal_id, vaccine_name and scheduled_date are required" });
      }
      db.prepare(`
        INSERT INTO vaccinations (animal_id, vaccine_name, dose, scheduled_date, administered_by, supervising_vet, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending')
      `).run(animal_id, vaccine_name, dose || '', scheduled_date, req.user.id, supervising_vet || null);
      logActivity(req.user.id, "Schedule Vaccination", "Vaccination", animal_id, `Scheduled ${vaccine_name} for ${animal_id}`);
      res.status(201).json({ success: true });
    } catch (e: any) {
      console.error('Vaccination POST error:', e);
      res.status(400).json({ error: e.message });
    }
  });

  // Get all vaccinations (not just pending)
  app.get("/api/vaccinations", authenticate, (req, res) => {
    const vacs = db.prepare(`
      SELECT v.*, a.species, a.breed
      FROM vaccinations v
      JOIN animals a ON v.animal_id = a.id
      ORDER BY v.scheduled_date ASC
    `).all();
    res.json(vacs);
  });

  // Breeding
  app.get(["/api/breeding", "/api/breeding-records"], authenticate, (req, res) => {
    const records = db.prepare(`
      SELECT * FROM breeding_records ORDER BY mating_date DESC, event_date DESC
    `).all();
    res.json(records);
  });

  app.post("/api/breeding", authenticate, (req: any, res) => {
    const { dam_id, sire_id, mating_date, expected_due_date, notes, event_type } = req.body;
    try {
      if (!dam_id) return res.status(400).json({ error: "dam_id is required" });
      db.prepare(`
        INSERT INTO breeding_records (dam_id, sire_id, animal_id, event_type, event_date, mating_date, expected_due_date, notes, status)
        VALUES (?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, 'Pending PD')
      `).run(
        dam_id,
        sire_id || null,
        dam_id,
        event_type || 'Mating',
        mating_date || new Date().toISOString().split('T')[0],
        expected_due_date || null,
        notes || ''
      );
      logActivity(req.user.id, "Record Mating", "BreedingRecord", dam_id, `Mating recorded for dam ${dam_id}`);
      res.status(201).json({ success: true });
    } catch (e: any) {
      console.error('Breeding POST error:', e);
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/breeding/:id", authenticate, (req: any, res) => {
    const { status, pd_status, expected_due_date, notes } = req.body;
    try {
      db.prepare(`
        UPDATE breeding_records SET
          status=COALESCE(?,status), pd_status=COALESCE(?,pd_status),
          expected_due_date=COALESCE(?,expected_due_date), notes=COALESCE(?,notes)
        WHERE id=?
      `).run(status, pd_status, expected_due_date, notes, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/estrus-alerts", authenticate, (req, res) => {
    // Real estrus alerts: females with expected_due_date in next 21 days
    const alerts = db.prepare(`
      SELECT br.id, br.dam_id as animal_id, br.mating_date, br.expected_due_date,
             br.status, a.species, a.breed
      FROM breeding_records br
      LEFT JOIN animals a ON br.dam_id = a.id
      WHERE br.expected_due_date IS NOT NULL
        AND br.expected_due_date >= date('now')
        AND br.expected_due_date <= date('now', '+21 days')
      ORDER BY br.expected_due_date ASC
    `).all();
    res.json(alerts);
  });

  // Financials
  app.get("/api/financials", authenticate, (req, res) => {
    const records = db.prepare("SELECT * FROM financials ORDER BY record_date DESC").all();
    res.json(records);
  });

  app.post("/api/financials", authenticate, (req: any, res) => {
    const { description, amount, category, type, record_date, reference_id } = req.body;
    try {
      // Infer type from category if not provided
      const txnType = type || (category === 'Income' ? 'Income' : 'Expense');
      db.prepare(`
        INSERT INTO financials (type, category, description, amount, record_date, reference_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        txnType,
        category || 'General',
        description,
        Number(amount),
        record_date || new Date().toISOString().split('T')[0],
        reference_id || null,
        req.user.id
      );
      logActivity(req.user.id, "Record Transaction", "Financial", '', `${txnType} ${category}: ${description} $${amount}`);
      res.status(201).json({ success: true });
    } catch (e: any) {
      console.error('Financials POST error:', e);
      res.status(400).json({ error: e.message });
    }
  });

  // Tasks
  app.get("/api/tasks", authenticate, (req: any, res) => {
    let tasks;
    if (req.user.role === 'Admin' || req.user.role === 'Farm Manager') {
      tasks = db.prepare(`
        SELECT t.*, u.full_name as assigned_to_name 
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        ORDER BY t.due_date ASC
      `).all();
    } else {
      tasks = db.prepare(`
        SELECT t.*, u.full_name as assigned_to_name 
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.assigned_to = ?
        ORDER BY t.due_date ASC
      `).all(req.user.id);
    }
    res.json(tasks);
  });

  app.post("/api/tasks", authenticate, (req: any, res) => {
    const { title, description, priority, due_date, assigned_to } = req.body;
    try {
      db.prepare(`
        INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by)
        VALUES (?, ?, 'Pending', ?, ?, ?, ?)
      `).run(title, description, priority, due_date, assigned_to || req.user.id, req.user.id);
      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/tasks/:id", authenticate, (req: any, res) => {
    const { status, priority, due_date, title, description, assigned_to } = req.body;
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as any;
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only Admin/Manager or assigned user can update
    if (req.user.role !== 'Admin' && req.user.role !== 'Farm Manager' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) { updates.push("status = ?"); params.push(status); }
    if (priority) { updates.push("priority = ?"); params.push(priority); }
    if (due_date) { updates.push("due_date = ?"); params.push(due_date); }
    if (title) { updates.push("title = ?"); params.push(title); }
    if (description) { updates.push("description = ?"); params.push(description); }
    if (assigned_to) { updates.push("assigned_to = ?"); params.push(assigned_to); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }

    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Farm Manager') {
      return res.status(403).json({ error: "Forbidden" });
    }
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Reports
  app.get("/api/reports/health-trends", authenticate, (req: any, res) => {
    const days = parseInt(req.query.days) || 30;
    const trends = db.prepare(`
      SELECT incident_date as record_date, COUNT(*) as count 
      FROM health_incidents 
      WHERE incident_date >= date('now', '-' || ? || ' days')
      GROUP BY incident_date 
      ORDER BY incident_date ASC
    `).all(days);
    res.json(trends);
  });

  app.get("/api/reports/feed-projections", authenticate, (req, res) => {
    const projections = db.prepare(`
      SELECT ingredient_id, SUM(quantity) * 30 as projected_30d, SUM(quantity) * 90 as projected_90d
      FROM feed_consumption
      GROUP BY ingredient_id
    `).all();
    // If empty, return some mock data for visualization
    if (projections.length === 0) {
      return res.json([
        { ingredient_id: 'Maize', projected_30d: 1500, projected_90d: 4500 },
        { ingredient_id: 'Soybean', projected_30d: 800, projected_90d: 2400 }
      ]);
    }
    res.json(projections);
  });

  // Dashboard Stats
  app.get("/api/stats", authenticate, (req: any, res) => {
    const totalAnimals = db.prepare("SELECT COUNT(*) as count FROM animals").get() as any;
    const speciesCount = db.prepare("SELECT species, COUNT(*) as count FROM animals GROUP BY species").all();
    const mortalityRate = db.prepare("SELECT (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM animals)) as rate FROM animals WHERE status = 'Dead'").get() as any;
    const vacTotal = db.prepare("SELECT COUNT(*) as count FROM vaccinations").get() as any;
    const vacCompleted = db.prepare("SELECT COUNT(*) as count FROM vaccinations WHERE status = 'Completed'").get() as any;
    const activeIncidents = db.prepare("SELECT COUNT(*) as count FROM health_incidents WHERE status = 'Open'").get() as any;
    const vaccinationCompliance = vacTotal.count > 0
      ? Math.round((vacCompleted.count / vacTotal.count) * 100)
      : 0;
    res.json({
      totalAnimals: totalAnimals.count,
      speciesDistribution: speciesCount,
      mortalityRate: mortalityRate.rate || 0,
      vaccinationCompliance,
      activeIncidents: activeIncidents.count
    });
  });

  // Notifications (from activity_logs)
  app.get("/api/notifications", authenticate, (req: any, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '20');
      const logs = db.prepare(`
        SELECT al.*, u.full_name as actor_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.timestamp DESC
        LIMIT ?
      `).all(limit);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Insights
  app.post("/api/ai/insights", authenticate, async (req, res) => {
    const animals = db.prepare("SELECT * FROM animals").all();
    const health = db.prepare("SELECT * FROM health_incidents ORDER BY incident_date DESC LIMIT 20").all();

    if (!process.env.GEMINI_API_KEY) {
      // No key configured — return static fallback immediately
      return res.json([
        { title: "Herd Health Monitoring", insight: `You have ${animals.length} animals registered. Regular health checks and vaccination schedules are essential for preventing disease outbreaks.`, priority: "high" },
        { title: "Breeding Optimisation", insight: "Track expected due dates to prepare for kidding/calving season ahead of time.", priority: "medium" },
        { title: "Feed Cost Management", insight: "Analyse your feed consumption per species and adjust ration formulation to reduce cost per kg of gain.", priority: "medium" },
        { title: "Financial Health", insight: "Maintain a monthly review of income vs expenses. Diversify revenue streams.", priority: "low" },
        { title: "Enable Live AI Insights", insight: "Set GEMINI_API_KEY in your .env file to enable AI-powered strategic insights tailored to your actual farm data.", priority: "low", isStatic: true }
      ]);
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `As an expert agricultural consultant for a large-scale livestock operation, analyze this farm data and provide 3-5 high-level strategic insights. 
    Focus on:
    1. Herd health risks and disease outbreaks.
    2. Growth performance optimization.
    3. Production forecasting.
    
    Data Summary:
    Animals: ${JSON.stringify(animals)}
    Recent Health Incidents: ${JSON.stringify(health)}
    
    Return the response as a JSON array of objects with 'title', 'insight', and 'priority' (high, medium, low).`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || '[]'));
    } catch (e) {
      // Graceful fallback: return static insights so the UI is never broken
      res.json([
        { title: "Herd Health Monitoring", insight: `You have ${animals.length} animals registered. Regular health checks and vaccination schedules are essential for preventing disease outbreaks.`, priority: "high" },
        { title: "Breeding Optimisation", insight: "Review your mating records regularly. Tracking expected due dates helps you prepare for kidding/calving season in advance.", priority: "medium" },
        { title: "Feed Cost Management", insight: "Analyse your feed consumption per species and adjust ration formulation to reduce cost per kg of gain.", priority: "medium" },
        { title: "Financial Health", insight: "Maintain a monthly review of income vs expenses. Diversify revenue streams — consider value-added products from your herd.", priority: "low" },
        { title: "Enable AI Insights", insight: "Set GEMINI_API_KEY in your .env file to enable live AI-powered strategic insights tailored to your actual farm data.", priority: "low", isStatic: true }
      ]);
    }
  });
}
