import { Router } from "express";
import { db } from "../db";

const router = Router();

// 🔹 Produits d’un fournisseur (optionnellement filtrés par type)
router.get("/supplier/:supplierId", async (req, res) => {
  const { supplierId } = req.params;
  const { type } = req.query; // récupère ?type=1,2,3,4

  try {
    let sql = `
      SELECT id, name, name_cn, supplier_id, image_url, type_product, unit
      FROM products
      WHERE supplier_id = ?
    `;
    const params: any[] = [supplierId];

    if (type) {
      sql += " AND type_product = ?";
      params.push(Number(type));
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Tous les produits
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, name_cn, supplier_id, image_url, type_product, unit 
       FROM products`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Ajouter un produit
router.post("/", async (req, res) => {
  try {
    const { name, name_cn, supplier_id, image_url } = req.body;
    await db.query(
      "INSERT INTO products (name, name_cn, supplier_id, image_url) VALUES (?, ?, ?, ?)",
      [name, name_cn, supplier_id, image_url]
    );
    res.json({ message: "Produit ajouté !" });
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// TEST affichage chinois
router.get("/test/chinois", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, name_cn FROM products ORDER BY id DESC LIMIT 5"
    );
    res.json(rows); // 👉 renvoie brut en JSON
  } catch (err) {
    console.error("❌ Erreur SQL test chinois :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
