import { useState, useEffect } from "react";
import Header from "../components/Header";
import CategoryTabs from "../components/Categorytabs";
import axios from "axios";
import "./Statistiques.css";

const categories = [
  "Zhao Labo",
  "Super Store",
  "Emballage",
  "Star Boisson",
  "KEDY pack",
  "Verger de souama",
];

export default function Statistiques() {
  const [selectedCategory, setSelectedCategory] = useState("Zhao Labo");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(
    null
  );
  const [stats, setStats] = useState<any[]>([]);

  // ⚡ Nouveaux états pour filtrer par période
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Charger la liste des restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get("https://api.zhaoplatforme.com/api/restaurants");
        setRestaurants(res.data);
        if (res.data.length > 0) {
          setSelectedRestaurant(res.data[0].id); // choisir le premier par défaut
        }
      } catch (err) {
        console.error("Erreur chargement restaurants :", err);
      }
    };

    fetchRestaurants();
  }, []);

  // Charger les stats quand restaurant, catégorie ou dates changent
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedRestaurant || !startDate || !endDate) return;

      try {
        const supplierId = categories.indexOf(selectedCategory) + 1;

        const res = await axios.get(
          `https://api.zhaoplatforme.com/api/stats/restaurant/${selectedRestaurant}/supplier/${supplierId}`,
          { params: { startDate, endDate } }
        );

        setStats(res.data);
      } catch (err) {
        console.error("Erreur chargement statistiques :", err);
      }
    };

    fetchStats();
  }, [selectedCategory, selectedRestaurant, startDate, endDate]);

  return (
    <div className="page">
      <Header />

      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Sélecteur de restaurant + période */}
      <div className="SelectText">
        <label htmlFor="restaurant">Restaurant : </label>
        <select className="select"
          value={selectedRestaurant || ""}
          onChange={(e) => setSelectedRestaurant(Number(e.target.value))}
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label>Du : </label>
        <input className="select"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label>Au : </label>
        <input className="select"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <main className="stats-main">
        <div className="stats-grid">
          {stats.map((item, index) => (
            <div className="stats-card" key={index}>
              <div className="stats-icon">
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div className="stats-info">
                <div className="stats-name">{item.name}</div>
                <div className="stats-quantity">x{item.total_quantity}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
