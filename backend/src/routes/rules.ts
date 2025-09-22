import { Router } from "express";
import { db } from "../db";

const ruleRouter = Router();

// 获取所有规则
ruleRouter.get("/", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM role_shift_requirements");
  res.json(rows);
});

// Validation helpers
// Validation helpers
const validWeekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const validShiftTypes = ["FULLDAY", "AM", "PM"];
const validBaseTypes = ["CUISINE", "SALLE", "BAR"];

function validateRule(role_id: any, base_type: any, weekday: any, shift_type: any, required_count: any) {
  if (!validBaseTypes.includes(base_type)) {
    return "base_type invalide (CUISINE, SALLE, BAR)";
  }
  if (!validWeekdays.includes(weekday)) {
    return "weekday invalide (doit être MON..SUN)";
  }
  if (!validShiftTypes.includes(shift_type)) {
    return "shift_type invalide (FULLDAY, AM, PM)";
  }
  if (!Number.isInteger(required_count) || required_count <= 0) {
    return "required_count doit être un entier positif";
  }
  if (!Number.isInteger(role_id) || role_id <= 0) {
    return "role_id invalide";
  }
  return null;
}

// 新增规则
ruleRouter.post("/", async (req, res) => {
  const { role_id, base_type, weekday, shift_type, required_count } = req.body;

  const error = validateRule(role_id, base_type, weekday, shift_type, required_count);
  if (error) return res.status(400).json({ error });

  try {
    const [roles]: any = await db.query("SELECT id FROM roles WHERE id=?", [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({ error: "role_id invalide (aucun rôle trouvé)" });
    }

    const [result]: any = await db.query(
      "INSERT INTO role_shift_requirements (role_id, base_type, weekday, shift_type, required_count) VALUES (?, ?, ?, ?, ?)",
      [role_id, base_type, weekday, shift_type, required_count]
    );

    res.json({ id: result.insertId, role_id, base_type, weekday, shift_type, required_count });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "Une règle existe déjà pour ce rôle, ce jour et ce shift",
      });
    }
    console.error("❌ Erreur ajout règle:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la règle" });
  }
});

// 修改规则
ruleRouter.put("/:id", async (req, res) => {
  const { role_id, base_type, weekday, shift_type, required_count } = req.body;

  const error = validateRule(role_id, base_type, weekday, shift_type, required_count);
  if (error) return res.status(400).json({ error });

  try {
    await db.query(
      "UPDATE role_shift_requirements SET role_id=?, base_type=?, weekday=?, shift_type=?, required_count=? WHERE id=?",
      [role_id, base_type, weekday, shift_type, required_count, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur update règle:", err);
    res.status(500).json({ error: "Erreur serveur lors de la modification" });
  }
});


// 删除规则
ruleRouter.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM role_shift_requirements WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur suppression règle:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

export default ruleRouter; // ✅ export par défaut
