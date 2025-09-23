import { Router } from "express";
import { db } from "../db";

const router = Router();
console.log("Employee router loaded");

// 🔹 获取所有员工 (GET)
router.get("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [employees]: any = await conn.query(`
      SELECT e.*, COALESCE(JSON_ARRAYAGG(p.name), JSON_ARRAY()) AS positions
      FROM employees e
      LEFT JOIN employee_position_assignments pa ON e.id = pa.employee_id
      LEFT JOIN employee_positions p ON pa.position_id = p.id
      GROUP BY e.id
    `);
    res.json(employees);
  } catch (err) {
    console.error("❌ 获取员工失败:", err);
    res.status(500).json({ error: "获取员工失败" });
  } finally {
    conn.release();
  }
});


// 🔹 新增员工 (POST)
router.post("/", async (req, res) => {
  let { name, level, off_day_1, off_day_2, max_hours_per_day, max_hours_per_week, base_type, positions } = req.body;

  level = Number(level) || 1;
  max_hours_per_day = Number(max_hours_per_day) || 8;
  max_hours_per_week = Number(max_hours_per_week) || 40;

  const validDays = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  if (off_day_1 && !validDays.includes(off_day_1)) {
    return res.status(400).json({ error: "off_day_1 invalide" });
  }
  if (off_day_2 && !validDays.includes(off_day_2)) {
    return res.status(400).json({ error: "off_day_2 invalide" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ➕ insert employé
    const [result]: any = await conn.query(
      `INSERT INTO employees 
        (name, level, off_day_1, off_day_2, max_hours_per_day, max_hours_per_week, base_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, level, off_day_1, off_day_2, max_hours_per_day, max_hours_per_week, base_type]
    );
    const empId = result.insertId;

    // ➕ insert postes
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

// 🔹 修改员工信息 (PUT)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, level, off_day_1, off_day_2, max_hours_per_day, max_hours_per_week, base_type, positions } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE employees 
       SET name = COALESCE(?, name), 
           level = COALESCE(?, level),
           off_day_1 = COALESCE(?, off_day_1),
           off_day_2 = COALESCE(?, off_day_2),
           max_hours_per_day = COALESCE(?, max_hours_per_day),
           max_hours_per_week = COALESCE(?, max_hours_per_week),
           base_type = COALESCE(?, base_type)
       WHERE id = ?`,
      [name, level, off_day_1, off_day_2, max_hours_per_day, max_hours_per_week, base_type, id]
    );

    // ⚡ mettre à jour les postes
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

export default router;
