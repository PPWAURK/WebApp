// Recettes.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import toast, { Toaster } from "react-hot-toast";
import './Recettes.css'

type Recette = {
    name: string;
    image: string;
    ingredients: string[];
    steps: string[];
};

export default function Recettes({ onLogout }: { onLogout: () => void }) {
    const navigate = useNavigate();
    const [recettes, setRecettes] = useState<Recette[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);

    // 登出
    const handleLogout = () => {
        localStorage.removeItem("token");
        onLogout();
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        const fetchRecettes = async () => {
            try {
                const res = await fetch("https://api.zhaoplatforme.com/api/recettes", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("未授权");
                const data = await res.json();
                setRecettes(data);
            } catch {
                toast.error("登录已过期，请重新登录");
                navigate("/login", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchRecettes();
    }, [navigate]);

    const openModal = (recette: Recette) => {
        setSelectedRecette(recette);
        setOpen(true);
    };

    if (loading) return <div>加载中...</div>;
    if (!recettes.length) return <div>暂无配方</div>;

    return (
        <div className="recette-page">
            <Toaster position="top-center" />
            <Header />

            <div style={{ textAlign: "right", margin: "10px 20px" }}>
                <button onClick={handleLogout}>Déconnection</button>
            </div>

            <h1>Recettes pour boissons et desserts</h1>

            <div className="recette-list">
                {recettes.map((item, index) => (
                    <div key={index} className="recette-card" onClick={() => openModal(item)}>
                        <img src={item.image} className="recette-image" />
                        <p className="recette-title">{item.name}</p>
                    </div>
                ))}
            </div>

            {open && selectedRecette && (
                <div className="modal-overlay" onClick={() => setOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{selectedRecette.name}</h2>

                        <h3>Ingrédients：</h3>
                        <ul>
                            {selectedRecette.ingredients.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>

                        <h3>Manipulations：</h3>
                        <ol>
                            {selectedRecette.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>

                        <button onClick={() => setOpen(false)}>关闭</button>
                    </div>
                </div>
            )}
        </div>
    );
}
