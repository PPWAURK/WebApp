import { Router } from "express";
import { db } from "../db";

const router = Router();

// 🔹 Récupérer tous les postes
router.get("/", async (_req, res) => {
  try {
    const [rows]: any = await db.query("SELECT * FROM employee_positions ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("❌ 获取岗位失败:", err);
    res.status(500).json({ error: "获取岗位失败" });
  }
});

// 🔹 Ajouter un poste
router.post("/", async (req, res) => {
  const { name } = req.body;
  try {
    const [result]: any = await db.query(
      "INSERT INTO employee_positions (name) VALUES (?)",
      [name]
    );
    res.json({ id: result.insertId, name });
  } catch (err) {
    console.error("❌ 添加岗位失败:", err);
    res.status(500).json({ error: "添加岗位失败" });
  }
});

// 🔹 Supprimer un poste
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM employee_positions WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 删除岗位失败:", err);
    res.status(500).json({ error: "删除岗位失败" });
  }
});

export default router;
