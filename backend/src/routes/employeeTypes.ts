import { Router } from "express";
import { db } from "../db";

const router = Router();

// 🔹 获取所有员工类型
router.get("/", async (req, res) => {
  try {
    const [rows]: any = await db.query("SELECT * FROM employee_types ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ 获取员工类型失败:", err);
    res.status(500).json({ error: "获取员工类型失败" });
  }
});

export default router;
