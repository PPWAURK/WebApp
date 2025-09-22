import { Router } from "express";
import { db } from "../db";

const router = Router();

// Liste de tous les restaurants
router.get("/", async (_req, res) => {
  try {
    const [rows]: any = await db.query(
      "SELECT id, name, address FROM restaurants"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur chargement restaurants :", err);
    res.status(500).json({ error: "Erreur récupération restaurants" });
  }
});

export default router;
