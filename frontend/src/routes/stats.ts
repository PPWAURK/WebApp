import { Router } from "express";
import { db } from "../db";

const router = Router();

// GET /api/stats/restaurant/:restaurantId/supplier/:supplierId?date=YYYY-MM-DD
router.get("/restaurant/:restaurantId/supplier/:supplierId", async (req, res) => {
  const { restaurantId, supplierId } = req.params;
  const { date, startDate, endDate } = req.query; // ⚡ supporte plusieurs modes

  try {
    let query = `
      SELECT p.name, SUM(oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.restaurant_id = ? AND p.supplier_id = ?
    `;
    const params: any[] = [restaurantId, supplierId];

    // ⚡ Filtre par jour
    if (date) {
      query += " AND o.order_date = ?";
      params.push(date);
    }

    // ⚡ Filtre par intervalle (mois, année…)
    if (startDate && endDate) {
      query += " AND o.order_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    query += " GROUP BY p.name ORDER BY total_quantity DESC";

    const [rows]: any = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur stats :", err);
    res.status(500).json({ error: "Erreur récupération statistiques" });
  }
});



export default router;
