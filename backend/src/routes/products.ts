import { Router } from "express";
import { db } from "../db";

const router = Router();

// 🔹 Produits d’un fournisseur (optionnellement filtrés par type)
router.get("/supplier/:supplierId", async (req, res) => {
  const { supplierId } = req.params;
  const { type } = req.query;

  try {
    let sql = `
      SELECT id, name, name_cn, supplier_id, image_url, type_product, unit, price
      FROM products
      WHERE supplier_id = ?
    `;
    const params: any[] = [Number(supplierId)];

    if (type) {
      sql += " AND type_product = ?";
      params.push(Number(type));
    }

    const [rows] = await db.query(sql, params);

    // Convertir price en number et remplacer NULL par 0
    const products = (rows as any[]).map(p => ({
      ...p,
      price: p.price !== null ? Number(p.price) : 0,
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Tous les produits
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
        `SELECT id, name, name_cn, supplier_id, image_url, type_product, unit, price
         FROM products`
    );

    const products = (rows as any[]).map(p => ({
      ...p,
      price: p.price !== null ? Number(p.price) : 0,
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Ajouter un produit
router.post("/", async (req, res) => {
  try {
    const { name, name_cn, supplier_id, image_url, price } = req.body;

    await db.query(
        "INSERT INTO products (name, name_cn, supplier_id, image_url, price) VALUES (?, ?, ?, ?, ?)",
        [name, name_cn, supplier_id, image_url, Number(price) || 0]
    );

    res.json({ message: "Produit ajouté !" });
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
