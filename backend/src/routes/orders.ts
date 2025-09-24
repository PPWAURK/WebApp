// src/routes/orders.ts
import { Router } from "express";
import PDFDocument from "pdfkit";
import { db } from "../db";
import path from "path";

const router = Router();

router.post("/", async (req, res) => {
  const { restaurant_id, date, items } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ error: "restaurant_id requis" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items vide" });
  }

  // date au format YYYY-MM-DD (sinon aujourd’hui)
  const orderDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().slice(0, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 🔹 Récupérer infos du restaurant
    const [restRows]: any = await conn.query(
      "SELECT name, address FROM restaurants WHERE id = ?",
      [restaurant_id]
    );
    const restaurantName =
      restRows && restRows.length ? restRows[0].name : "Restaurant inconnu";
    const restaurantAddress =
      restRows && restRows.length ? restRows[0].address : "Adresse non renseignée";

    // 1) Insert dans orders
    const [orderResult]: any = await conn.query(
      "INSERT INTO orders (restaurant_id, order_date) VALUES (?, ?)",
      [restaurant_id, orderDate]
    );
    const orderId = orderResult.insertId;

    // 2) Insert bulk dans order_items
    const values = items
      .filter((it: any) => Number(it.quantity) > 0)
      .map((it: any) => [orderId, it.id, Number(it.quantity)]);

    if (values.length === 0) {
      throw new Error("Aucun item avec quantity > 0");
    }

    const placeholders = values.map(() => "(?,?,?)").join(",");
    const flat = values.flat();
    await conn.query(
      `INSERT INTO order_items (order_id, product_id, quantity) VALUES ${placeholders}`,
      flat
    );

    await conn.commit();

    // 🔹 3) Requête pour récupérer les items complets (avec unit)
    const [orderItems]: any = await db.query(
      `SELECT p.name, p.name_cn, p.unit, oi.quantity
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

// 4) Génération du PDF
const doc = new PDFDocument({ margin: 40 });
const chunks: Buffer[] = [];

doc.on("data", (chunk: Buffer) => chunks.push(chunk));
doc.on("end", () => {
  const result = Buffer.concat(chunks);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${restaurantName}_${orderDate}.pdf"`
  );
  res.send(result);
});

const logoPath = path.resolve("assets/ZhaoLogo.png");
doc.image(logoPath, (doc.page.width - doc.page.width / 2) / 2, 20, {
  width: doc.page.width / 2,
  height: 100,
});

// Polices
const fontPath = path.resolve("assets/fonts/NotoSansSC-Regular.ttf");
doc.registerFont("NotoSans", fontPath);

// En-tête
doc.moveDown(8);
doc.font("NotoSans").fontSize(20).text("Bon de Commande", { align: "center" });
doc.moveDown();
doc.font("NotoSans").fontSize(14).text(`Restaurant : ${restaurantName}`);
doc.text(`Adresse : ${restaurantAddress}`);
doc.text(`Date de livraison : ${orderDate}`);
doc.moveDown();

// ---------- Tableau ----------
const startX = 10;
let startY = 280;
const tableWidth = 585;
const rowHeight = 25;
const colWidths = [50, 200, 220, 115]; // ajusté un peu

const drawRowBorders = (y: number) => {
  doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();
  let xCursor = startX;
  colWidths.forEach((w) => {
    doc.moveTo(xCursor, y).lineTo(xCursor, y + rowHeight).stroke();
    xCursor += w;
  });
  doc.moveTo(startX + tableWidth, y).lineTo(startX + tableWidth, y + rowHeight).stroke();
};

// En-tête tableau
doc.font("NotoSans").fontSize(12);
["N°", "Produit", "Produit (CN)", "Quantité/Unit"].forEach((header, i) => {
  const xPos = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
  doc.text(header, xPos, startY + 7, { width: colWidths[i] - 10 });
});
drawRowBorders(startY);
startY += rowHeight;

// Contenu tableau
orderItems.forEach((item: any, i: number) => {
  // Vérifier si on dépasse la page
  if (startY + rowHeight > doc.page.height - 50) {
    doc.addPage();
    startY = 50;

    // Redessiner en-tête sur la nouvelle page
    doc.font("NotoSans").fontSize(12);
    ["N°", "Produit", "Produit (CN)", "Quantité/Unit"].forEach((header, i) => {
      const xPos = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      doc.text(header, xPos, startY + 7, { width: colWidths[i] - 10 });
    });
    drawRowBorders(startY);
    startY += rowHeight;
  }

  // Ligne
  const row = [
    String(i + 1),
    `${item.name}`,
    item.name_cn || "",
    `${item.quantity} ${item.unit || ""}`,
  ];
  row.forEach((cell, j) => {
    doc.font("NotoSans").fontSize(12).text(
      cell,
      startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0) + 5,
      startY + 7,
      { width: colWidths[j] - 10 }
    );
  });

  drawRowBorders(startY);
  startY += rowHeight;
});

doc.moveTo(startX, startY).lineTo(startX + tableWidth, startY).stroke();

doc.end();


  } catch (err) {
    await conn.rollback();
    console.error("❌ Erreur enregistrement commande :", err);
    res.status(500).json({ error: "Erreur enregistrement/génération PDF" });
  } finally {
    conn.release();
  }
});

export default router;
