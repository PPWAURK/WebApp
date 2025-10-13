// src/routes/role.ts
import { Router } from "express";
import { db } from "../db";

export const roleRouter = Router();

// GET /api/roles - récupérer tous les rôles
roleRouter.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM role`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// GET /api/roles/:id - récupérer un rôle par id
roleRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT * FROM role WHERE id = ?`,
            [id]
        );
        if ((rows as any).length === 0) {
            return res.status(404).json({ message: "Rôle non trouvé" });
        }
        res.json((rows as any)[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});
