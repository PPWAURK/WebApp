import { Router } from "express";
import { db } from "../db";

const router = Router();

// 🔹 获取所有员工 + leurs postes
router.get("/", async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT e.*, 
             COALESCE(JSON_ARRAYAGG(p.name), JSON_ARRAY()) AS positions
      FROM employees e
      LEFT JOIN employee_position_assignments pa ON e.id = pa.employee_id
      LEFT JOIN employee_positions p ON pa.position_id = p.id
      GROUP BY e.id
      ORDER BY e.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ 获取员工失败:", err);
    res.status(500).json({ error: "获取员工失败" });
  }
});

// 🔹 新增员工
router.post("/", async (req, res) => {
  let { name, level, fixed_off_day, max_hours_per_day, max_hours_per_week, base_type, positions } = req.body;

  level = Number(level) || 1;
  max_hours_per_day = Number(max_hours_per_day) || 8;
  max_hours_per_week = Number(max_hours_per_week) || 40;

  const validDays = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  if (fixed_off_day && !validDays.includes(fixed_off_day)) {
    return res.status(400).json({ error: "fixed_off_day invalide" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ➕ insert employé
    const [result]: any = await conn.query(
      "INSERT INTO employees (name, level, fixed_off_day, max_hours_per_day, max_hours_per_week, base_type) VALUES (?, ?, ?, ?, ?, ?)",
      [name, level, fixed_off_day, max_hours_per_day, max_hours_per_week, base_type]
    );
    const empId = result.insertId;

    // ➕ insert postes (si envoyés)
    if (Array.isArray(positions)) {
      for (const posName of positions) {
        const [[pos]]: any = await conn.query("SELECT id FROM employee_positions WHERE name = ?", [posName]);
        if (pos) {
          await conn.query(
            "INSERT INTO employee_position_assignments (employee_id, position_id) VALUES (?, ?)",
            [empId, pos.id]
          );
        }
      }
    }

    await conn.commit();

    // 🔄 retourne l'employé complet
    const [[employee]]: any = await conn.query(`
      SELECT e.*, COALESCE(JSON_ARRAYAGG(p.name), JSON_ARRAY()) AS positions
      FROM employees e
      LEFT JOIN employee_position_assignments pa ON e.id = pa.employee_id
      LEFT JOIN employee_positions p ON pa.position_id = p.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [empId]);

    res.json(employee);
  } catch (err) {
    await conn.rollback();
    console.error("❌ 添加员工失败:", err);
    res.status(500).json({ error: "添加员工失败" });
  } finally {
    conn.release();
  }
});

// 🔹 修改员工信息
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, level, fixed_off_day, max_hours_per_day, max_hours_per_week, base_type, positions } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE employees 
       SET name = COALESCE(?, name), 
           level = COALESCE(?, level), 
           fixed_off_day = COALESCE(?, fixed_off_day), 
           max_hours_per_day = COALESCE(?, max_hours_per_day),
           max_hours_per_week = COALESCE(?, max_hours_per_week),
           base_type = COALESCE(?, base_type) 
       WHERE id = ?`,
      [name, level, fixed_off_day, max_hours_per_day, max_hours_per_week, base_type, id]
    );

    // ⚡ mettre à jour les postes si envoyés
    if (Array.isArray(positions)) {
      await conn.query("DELETE FROM employee_position_assignments WHERE employee_id = ?", [id]);
      for (const posName of positions) {
        const [[pos]]: any = await conn.query("SELECT id FROM employee_positions WHERE name = ?", [posName]);
        if (pos) {
          await conn.query(
            "INSERT INTO employee_position_assignments (employee_id, position_id) VALUES (?, ?)",
            [id, pos.id]
          );
        }
      }
    }

    await conn.commit();

    // 🔄 retourne l'employé complet
    const [[employee]]: any = await conn.query(`
      SELECT e.*, COALESCE(JSON_ARRAYAGG(p.name), JSON_ARRAY()) AS positions
      FROM employees e
      LEFT JOIN employee_position_assignments pa ON e.id = pa.employee_id
      LEFT JOIN employee_positions p ON pa.position_id = p.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);

    res.json(employee);
  } catch (err) {
    await conn.rollback();
    console.error("❌ 更新员工失败:", err);
    res.status(500).json({ error: "更新员工失败" });
  } finally {
    conn.release();
  }
});

// 🔹 删除员工
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM employees WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 删除员工失败:", err);
    res.status(500).json({ error: "删除员工失败" });
  }
});

export default router;
