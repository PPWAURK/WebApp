// routes/employeeWorkHours.js
import { Router } from "express";
import { db } from "../db";

const router = Router();
console.log("Employee work hours router loaded");

// 🔹 获取员工某月的工作时间 (GET)
router.get("/employee/:employeeId/month/:month", async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { employeeId, month } = req.params;

        const [workHours]: any = await conn.query(
            `SELECT * FROM employee_work_hours 
       WHERE employee_id = ? AND month_year = ? 
       ORDER BY work_date`,
            [employeeId, month]
        );

        res.json(workHours);
    } catch (err) {
        console.error("❌ 获取工作时间失败:", err);
        res.status(500).json({ error: "获取工作时间失败" });
    } finally {
        conn.release();
    }
});

// 🔹 获取团队某月所有工作时间 (GET)
router.get("/month/:month", async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { month } = req.params;

        const [workHours]: any = await conn.query(
            `SELECT ewh.*, e.name as employee_name, e.base_type
       FROM employee_work_hours ewh
       JOIN employees e ON ewh.employee_id = e.id
       WHERE ewh.month_year = ? 
       ORDER BY e.name, ewh.work_date`,
            [month]
        );

        res.json(workHours);
    } catch (err) {
        console.error("❌ 获取团队工作时间失败:", err);
        res.status(500).json({ error: "获取团队工作时间失败" });
    } finally {
        conn.release();
    }
});

// 🔹 添加或更新工作时间 (POST)
router.post("/", async (req, res) => {
    const { employee_id, work_date, hours_worked, notes } = req.body;

    // 验证数据
    if (!employee_id || !work_date || hours_worked === undefined) {
        return res.status(400).json({ error: "缺少必要数据" });
    }

    const month_year = work_date.substring(0, 7); // YYYY-MM
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 检查是否已存在该日期的记录
        const [existing]: any = await conn.query(
            "SELECT id FROM employee_work_hours WHERE employee_id = ? AND work_date = ?",
            [employee_id, work_date]
        );

        let action = "";

        if (existing.length > 0) {
            // 更新记录
            await conn.query(
                `UPDATE employee_work_hours 
         SET hours_worked = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = ? AND work_date = ?`,
                [hours_worked, notes, employee_id, work_date]
            );
            action = "update";
        } else {
            // 新增记录
            await conn.query(
                `INSERT INTO employee_work_hours 
         (employee_id, work_date, hours_worked, month_year, notes)
         VALUES (?, ?, ?, ?, ?)`,
                [employee_id, work_date, hours_worked, month_year, notes]
            );
            action = "create";
        }

        await conn.commit();

        // 返回更新后的数据
        const [updated]: any = await conn.query(
            `SELECT ewh.*, e.name as employee_name, e.base_type
       FROM employee_work_hours ewh
       JOIN employees e ON ewh.employee_id = e.id
       WHERE ewh.employee_id = ? AND ewh.work_date = ?`,
            [employee_id, work_date]
        );

        res.json({
            message: action === "create" ? "工作时间添加成功" : "工作时间更新成功",
            action,
            data: updated[0]
        });
    } catch (err) {
        await conn.rollback();
        console.error("❌ 保存工作时间失败:", err);

        res.status(500).json({ error: "保存工作时间失败" });
    } finally {
        conn.release();
    }
});

// 🔹 删除工作时间记录 (DELETE)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        const [result]: any = await conn.query(
            "DELETE FROM employee_work_hours WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "工作时间记录未找到" });
        }

        res.json({ message: "工作时间记录删除成功" });
    } catch (err) {
        console.error("❌ 删除工作时间失败:", err);
        res.status(500).json({ error: "删除工作时间失败" });
    } finally {
        conn.release();
    }
});

// 🔹 获取员工月度统计 (GET)
router.get("/stats/employee/:employeeId/month/:month", async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { employeeId, month } = req.params;

        const [stats]: any = await conn.query(
            `SELECT 
          COUNT(*) as days_worked,
          SUM(hours_worked) as total_hours,
          AVG(hours_worked) as average_hours_per_day,
          MIN(hours_worked) as min_hours,
          MAX(hours_worked) as max_hours
       FROM employee_work_hours 
       WHERE employee_id = ? AND month_year = ?`,
            [employeeId, month]
        );

        res.json(stats[0] || {});
    } catch (err) {
        console.error("❌ 获取统计数据失败:", err);
        res.status(500).json({ error: "获取统计数据失败" });
    } finally {
        conn.release();
    }
});

// 🔹 检查月度加班情况 (GET)
router.get("/overtime/month/:month", async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { month } = req.params;

        const [overtime]: any = await conn.query(
            `SELECT 
          e.id, 
          e.name,
          YEARWEEK(ewh.work_date) as week_number,
          SUM(ewh.hours_worked) as weekly_hours,
          e.max_hours_per_week
       FROM employee_work_hours ewh
       JOIN employees e ON ewh.employee_id = e.id
       WHERE ewh.month_year = ?
       GROUP BY e.id, YEARWEEK(ewh.work_date)
       HAVING weekly_hours > e.max_hours_per_week`,
            [month]
        );

        res.json(overtime);
    } catch (err) {
        console.error("❌ 检查加班情况失败:", err);
        res.status(500).json({ error: "检查加班情况失败" });
    } finally {
        conn.release();
    }
});

// 🔹 检查每日加班情况 (GET)
router.get("/overtime-daily/month/:month", async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { month } = req.params;

        const [overtime]: any = await conn.query(
            `SELECT 
          e.id, 
          e.name,
          ewh.work_date,
          ewh.hours_worked,
          e.max_hours_per_day
       FROM employee_work_hours ewh
       JOIN employees e ON ewh.employee_id = e.id
       WHERE ewh.month_year = ? AND ewh.hours_worked > e.max_hours_per_day`,
            [month]
        );

        res.json(overtime);
    } catch (err) {
        console.error("❌ 检查每日加班失败:", err);
        res.status(500).json({ error: "检查每日加班失败" });
    } finally {
        conn.release();
    }
});

export default router;