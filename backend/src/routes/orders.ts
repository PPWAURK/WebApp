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

  const orderDate =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : new Date().toISOString().slice(0, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 🔹 Infos restaurant
    const [restRows]: any = await conn.query(
        "SELECT name, address FROM restaurants WHERE id = ?",
        [restaurant_id]
    );
    const restaurantName = restRows?.[0]?.name || "Restaurant inconnu";
    const restaurantAddress = restRows?.[0]?.address || "Adresse non renseignée";

    // 🔹 1) Insertion dans orders
    const [orderResult]: any = await conn.query(
        "INSERT INTO orders (restaurant_id, order_date) VALUES (?, ?)",
        [restaurant_id, orderDate]
    );
    const orderId = orderResult.insertId;

    // 🔹 2) Insertion des produits commandés (quantity > 0)
    const values = items
        .filter((it: any) => Number(it.quantity) > 0)
        .map((it: any) => [orderId, it.id, Number(it.quantity)]);

    if (values.length > 0) {
      const placeholders = values.map(() => "(?,?,?)").join(",");
      const flat = values.flat();
      await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity) VALUES ${placeholders}`,
          flat
      );
    }

    await conn.commit();

    // 🔹 3) Récupération des quantités commandées
    const [ordered]: any = await db.query(
        `SELECT p.id, p.supplier_id, oi.quantity
         FROM order_items oi
                JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    // Créer une map {productId: quantity}
    const qtyMap = Object.fromEntries(ordered.map((o: any) => [o.id, o.quantity]));

    // 🔹 4) Récupération de TOUS les fournisseurs impliqués dans la commande
    const supplierIds = Array.from(new Set(items.map((it: any) => it.supplier_id))).filter(Boolean);

    let allProducts: any[] = [];

    for (const supplierId of supplierIds) {
      if (supplierId === 3) {
        // ⚙️ Supplier 3 → tous les produits dans l’ordre de la table
        const [prods]: any = await db.query(
            `SELECT id, name, name_cn, unit, reference, supplier_id
           FROM products
           WHERE supplier_id = 3
           ORDER BY id ASC`
        );
        const merged = prods.map((p: any) => ({
          ...p,
          quantity: qtyMap[p.id] || 0,
        }));
        allProducts.push(...merged);
      } else {
        // ⚙️ Autres fournisseurs → uniquement les produits commandés
        const filtered = ordered.filter((o: any) => o.supplier_id === supplierId);
        if (filtered.length > 0) {
          const ids = filtered.map((o: any) => o.id);
          const [prods]: any = await db.query(
              `SELECT id, name, name_cn, unit, reference, supplier_id
             FROM products
             WHERE id IN (?)
             ORDER BY id ASC`,
              [ids]
          );
          const merged = prods.map((p: any) => ({
            ...p,
            quantity: qtyMap[p.id] || 0,
          }));
          allProducts.push(...merged);
        }
      }
    }

    // ---------------------------
    // 5) Génération du PDF
    // ---------------------------
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

    // 🔹 Logo
    const logoPath = path.resolve("assets/ZhaoLogo.png");
    doc.image(logoPath, (doc.page.width - doc.page.width / 2) / 2, 20, {
      width: doc.page.width / 2,
      height: 100,
    });

    // 🔹 Polices
    const fontRegular = path.resolve("assets/fonts/NotoSansSC-Regular.ttf");
    const fontBold = path.resolve("assets/fonts/NotoSansSC-Bold.ttf");
    doc.registerFont("NotoSans", fontRegular);
    doc.registerFont("NotoSans-Bold", fontBold);

    // 🔹 En-tête
    doc.moveDown(8);
    doc.font("NotoSans-Bold").fontSize(20).text("Bon de Commande", { align: "center" });
    doc.moveDown();
    doc.font("NotoSans-Bold").fontSize(14).text(`Restaurant : `, { continued: true });
    doc.font("NotoSans").text(restaurantName);
    doc.font("NotoSans-Bold").text(`Adresse : `, { continued: true });
    doc.font("NotoSans").text(restaurantAddress);
    doc.font("NotoSans-Bold").text(`Date de livraison : `, { continued: true });
    doc.font("NotoSans").text(orderDate);
    doc.moveDown();

    // ---------- Tableau ----------
    // ---------- Tableau ----------
    const showReference = allProducts.some((it: any) => it.supplier_id === 3);

    const startX = 10;
    let startY = 280;
    const tableWidth = showReference ? 585 : 585;
    const rowHeight = 25;
    const colWidths = showReference
        ? [50, 75, 180, 180, 100] // N°, Code, Produit, Produit CN, Quantité/Unit
        : [50, 200, 220, 115];   // N°, Produit, Produit CN, Quantité/Unit

    const drawRowBorders = (y: number) => {
      doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();
      let xCursor = startX;
      colWidths.forEach((w) => {
        doc.moveTo(xCursor, y).lineTo(xCursor, y + rowHeight).stroke();
        xCursor += w;
      });
      doc.moveTo(startX + tableWidth, y).lineTo(startX + tableWidth, y + rowHeight).stroke();
    };

    // 🔹 En-tête tableau
    doc.font("NotoSans-Bold").fontSize(12);
    const headers = showReference
        ? ["N°", "Code", "Produit", "Produit (CN)", "Quantité/Unit"]
        : ["N°", "Produit", "Produit (CN)", "Quantité/Unit"];

    headers.forEach((header, i) => {
      const xPos = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      doc.text(header, xPos, startY + 7, { width: colWidths[i] - 10 });
    });
    drawRowBorders(startY);
    startY += rowHeight;

    // 🔹 Contenu tableau
    allProducts.forEach((item: any, i: number) => {
      if (startY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        startY = 50;

        // répéter en-tête
        doc.font("NotoSans-Bold").fontSize(12);
        headers.forEach((header, i) => {
          const xPos = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
          doc.text(header, xPos, startY + 7, { width: colWidths[i] - 10 });
        });
        drawRowBorders(startY);
        startY += rowHeight;
      }

      const qtyNum = Number(item.quantity) || 0;
      const isZero = qtyNum === 0 && item.supplier_id === 3;
      doc.fillColor(isZero ? "gray" : "black");

      const row = showReference
          ? [String(i + 1), item.reference || "", item.name, item.name_cn || "", `${item.quantity}`]
          : [String(i + 1), item.name, item.name_cn || "", `${item.quantity}`];

      row.forEach((cell, j) => {
        const xPos = startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0) + 5;
        const yPos = startY + 7;

        if ((showReference && j === 4) || (!showReference && j === 3)) {
          doc.font("NotoSans").fontSize(12).text(cell, xPos, yPos, { continued: true });
          doc.font("NotoSans-Bold").fontSize(12).text(` ${item.unit || ""}`, {
            width: colWidths[j] - 10,
          });
        } else {
          doc.font("NotoSans").fontSize(12).text(cell, xPos, yPos, {
            width: colWidths[j] - 10,
          });
        }
      });

      drawRowBorders(startY);
      startY += rowHeight;
      doc.fillColor("black");
    });

    doc.moveTo(startX, startY).lineTo(startX + tableWidth, startY).stroke();
    doc.end();


  } catch (err) {
    await conn.rollback();
    console.error("❌ Erreur :", err);
    res.status(500).json({ error: "Erreur enregistrement/génération PDF" });
  } finally {
    conn.release();
  }
});

export default router;
