import express from "express";
import { authenticate } from "./auth"; // 之前创建的 JWT 验证中间件

const router = express.Router();

// 后端存储配方数据
const recettes = [
    {
        name: "Thé glacé au pamplemousse et au miel",
        image: "/images/TP.jpg",
        ingredients: ["Yuzu 350g", "Sirop de sucre 495g", "Jus de citron 102g"],
        steps: []
    },
    {
        name: "Thé glacé au citron et à la fleur d'osmanthus",
        image: "/images/TG.jpg",
        ingredients: ["Sachet de thé 10 sachets", "Fleur osmanthus 6g", "Eau chaude 1500g", "Sirop de sucre 450g", "Jus de citron 37,5g"],
        steps: [
            "Ajouter l'eau chaude dans le pichet avec les sachets de thé et de l'osmanthus.",
            "Après avoir ajouter l'eau chaude laisser l'infusion pendant 30min.",
            "Filtrer l'osmanthus et les sachets de thé puis ajouter le sirop de sucre et le jus de citron."
        ]
    },
    {
        name: "Sirop de prune acidulée",
        image: "/images/SP.jpg",
        ingredients: ["Poudre de prune 325g","Sucre 190g", "Eau chaude 350g", "Jus de citron 120g"],
        steps: []
    },
    {
        name: "Flan au Thé Vert avec Haricot Rouge et Osmanthus",
        image: "/images/FM.jpg",
        ingredients: ["Crème fraîche 500g", "Lait 1L", "Sucre 275g", "Poudre matcha 19g", "Feuille de gelatine 40g"],
        steps: [
            "Tremper les feuilles de gelatine dans l'eau avec des glaçons",
            "Verser tous les ingrédients(sauf gelatine) dans un bac fermer et cuire 10min à la vapeur puis retirer",
            "Après ajouter les feuilles de gelatine et mélanger, verser en filtrant le mélange dans les modules puis mettre dans le frigo"
        ]
    },
    {
        name: "Mangue fraîche au Riz noir et Lait de Coco",
        image: "/images/RNL.jpg",
        ingredients: ["Riz noir 1kg", "Eau 2400g", "Lait de coco 1L", "Sirop de sucre 500g"],
        steps: [
            "Préparation du riz : une heure à la vapeur",
            "Préparation du lait de coco : mélanger 1L de lait de coco avec 500g de sirop de sucre",
            "Lors de la rélisation du dessert : le dressage du riz est de 50g, une cuillière de 60g pour le lait de coco et 70g (environ 8pc pour la mangue"
        ]
    }
];

// 受保护接口
router.get("/", authenticate, (req, res) => {
    res.json(recettes);
});

export default router;
