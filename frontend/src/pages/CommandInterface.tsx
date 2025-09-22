import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import CategoryTabs from "../components/Categorytabs";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer";
import type { Product } from "../components/ProductCard";
import TypeFilter from "../components/TypeFilter";
import "./CommandeInterface.css";

const categories = [
  "Zhao Labo",
  "Super Store",
  "Emballage",
  "Star Boisson",
  "KEDY pack",
  "Verger de souama",
];

export default function CommandInterface() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Zhao Labo");
  const [date, setDate] = useState<string>("");
  const [restaurants, setRestaurants] = useState<{ id: number; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  
const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
const selectedQtyRef = useRef<Record<number, number>>(selectedQuantities);
useEffect(() => { selectedQtyRef.current = selectedQuantities; }, [selectedQuantities]);

  // 🔥 Charger les restaurants au montage
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get("https://api.zhaoplatforme.com/api/restaurants");
        setRestaurants(res.data);
        if (res.data.length > 0) {
          setRestaurantId(res.data[0].id); // 👉 par défaut le premier resto
        }
      } catch (err) {
        console.error("Erreur chargement restaurants :", err);
      }
    };
    fetchRestaurants();
  }, []);

  // 🔥 Charger les produits quand la catégorie change
  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const supplierId = categories.indexOf(selectedCategory) + 1;
      const typeQuery = selectedType ? `?type=${selectedType}` : "";

      const res = await axios.get(
        `https://api.zhaoplatforme.com/api/products/supplier/${supplierId}${typeQuery}`
      );

      const newProducts: Product[] = res.data.map((p: Product) => ({
  ...p,
  quantity: 0,
  price: Number(p.price ?? 0),
}));

setProducts((prev: Product[]) => {
  // 👉 fusionne avec les produits déjà sélectionnés
  const updated = newProducts.map((p: Product) => {
    const existing = prev.find((old) => old.id === p.id);
    return existing ? { ...p, quantity: existing.quantity } : p;
  });

  // 👉 garde les anciens sélectionnés
  const preserved = prev.filter(
    (old: Product) => old.quantity > 0 && !updated.some((u: Product) => u.id === old.id)
  );

  return [...updated, ...preserved];
});

    } catch (err) {
      console.error("Erreur chargement produits :", err);
    }
  };

  // ⚡ uniquement pour la catégorie 2 on garde les produits sélectionnés
  if (categories.indexOf(selectedCategory) + 1 === 2) {
    fetchProducts();
  } else {
    // 👉 catégorie normale : reset
    fetchProducts();
  }
}, [selectedCategory, selectedType]);


// 🔥 Reset du filtre quand on quitte la catégorie 2
useEffect(() => {
  const supplierId = categories.indexOf(selectedCategory) + 1;
  if (supplierId !== 2) {
    setSelectedType(null);
    setSelectedQuantities({}); // si tu veux garder les sélections seulement pour la cat 2
  }
}, [selectedCategory]);

 const handleIncrease = (id: number) => {
  setSelectedQuantities((prev) => {
    const nextQty = (prev[id] || 0) + 1;
    const next = { ...prev, [id]: nextQty };
    // Mettre à jour l'affichage immédiat si produit visible
    setProducts((prevProducts) => prevProducts.map(p => p.id === id ? { ...p, quantity: nextQty } : p));
    return next;
  });
};

const handleDecrease = (id: number) => {
  setSelectedQuantities((prev) => {
    const current = prev[id] || 0;
    const nextQty = Math.max(0, current - 1);
    const next = { ...prev, [id]: nextQty };
    if (nextQty === 0) delete next[id]; // optionnel : retirer les zéros
    // Mettre à jour l'affichage immédiat si produit visible
    setProducts((prevProducts) => prevProducts.map(p => p.id === id ? { ...p, quantity: nextQty } : p));
    return next;
  });
};

  const handleOrder = async () => {
    const orderedItems = products.filter((p) => (p.quantity || 0) > 0);

    if (!restaurantId) {
      alert("⚠️ Choisis un restaurant !");
      return;
    }

    if (orderedItems.length === 0) {
      alert("⚠️ Aucun produit sélectionné !");
      return;
    }

    try {
      const restaurantName =
        restaurants.find((r) => r.id === restaurantId)?.name || "commande";

      const orderData = {
      restaurant_id: restaurantId,
      date: date,
      items: orderedItems,
      };

      const res = await axios.post(
        "https://api.zhaoplatforme.com/api/orders",
        orderData,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${restaurantName}_${orderData.date}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      // Réinitialiser après la commande
      setProducts((prev) => prev.map((p) => ({ ...p, quantity: 0 })));
      setDate("");
    } catch (err) {
      console.error("Erreur lors de la commande :", err);
      alert("❌ Erreur de la génération du PDF");
    }
  };

  // 🔥 Ajoute ce calcul juste avant le return
const categoryId = categories.indexOf(selectedCategory) + 1;

const totalPrice = products.reduce(
  (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
  0
);

return (
  <div className="command-interface">
    <Header />
    <CategoryTabs
      categories={categories}
      selected={selectedCategory}
      onSelect={setSelectedCategory}
    />

    {categoryId === 2 && (
      <div className="special-layout">
        <aside>
          <TypeFilter selected={selectedType} onSelect={setSelectedType} />
        </aside>
        <main>
          <ProductGrid
            className="two-columns"
            products={products}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            categoryId={categoryId}
          />
        </main>
      </div>
    )}

    {categoryId === 4 && (
      <div className="special-layout-cat4">
       
        <div className="informations">
           <h1>✅ Bon à savoir !</h1>
            <h3>- ​🥤​ 这三种饮料买十送一可以混搭！/ Ces 3 types de boissons (Coca, CocaZéro, Orangina), 10+1 offert, peuvent etre melangeés !</h3>
            <h3>- ​🥤​ 这两种饮料买十送一可以混搭！/ Ces 2 types de boissons (Perrier, Evian), 10+1 offert, peuvent etre melangeés !</h3>
            <h3>- ​​🍺​​ 青岛和青岛 IPA 买五送一 / Qingdao et Qingdao IPA 5+1 offert !</h3>
            <h3>- ​​🍺​​ 虎牌啤酒最少要定10桶 / Tiger bier Min 10 fut !</h3>
            <h3>- ​🧃​ 以上三种果汁买十送二可以混搭 / Les Jus de fruits (Pomme, Litchi, Orange) 10+2 offert , peuvent etre melangeés !</h3>
            <h3>- ​💸​ 最低起送价300 HT / Commande minimale：300 HT</h3>
            <h3>- 🕐​ 需最少提前48小时叫货,周日不上班 / Commande à effectuer au moins 48 heures à l'avance，pas de service le dimanche. </h3>
            <h3>- 🎁 ​青岛和果汁赠送的都是半年结算一次 / Les parties offertes de Qingdao et du jus de fruit sont calculées tous les six mois.</h3>
            <h3>- 📞​ 订货号码 / Commande Tel: 0769908004</h3>
        </div>
        <ProductGrid
          className="four-columns" // exemple, tu peux changer le style
          products={products}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          categoryId={categoryId}
        />
        <div className="total-price">
          <h2>Total sélectionné : {totalPrice.toFixed(2)} €</h2>
        </div>
      </div>
    )}

    {categoryId !== 2 && categoryId !== 4 && (
      <>
        <div className="SelectText">
          <label>Choisir un restaurant : </label>
          <select
            className="Select"
            value={restaurantId ?? ""}
            onChange={(e) => setRestaurantId(Number(e.target.value))}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <ProductGrid
          products={products}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          categoryId={categoryId}
        />
      </>
    )}

    <Footer date={date} onDateChange={setDate} onOrder={handleOrder} />
  </div>
);

}
