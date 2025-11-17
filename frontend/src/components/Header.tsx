import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/img/ZHAOLOGO.svg";
import toast from "react-hot-toast";
import "./Header.css";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = () => {
        switch (location.pathname) {
            case "/":
                return "Connection";
            case "/commandes":
                return "Commandes";
            case "/statistiques":
                return "Statistiques";
            case "/employes":
                return "Employés";
            case "/planning":
                return "Planning";
            case "/recettes":
                return "Recettes";
            case "/queue":
                return "Sa fait la queue !";
            default:
                return "Connection";
        }
    };

    const handleRecettesClick = (e: React.MouseEvent) => {
        const token = localStorage.getItem("token");
        if (!token) {
            e.preventDefault(); // 阻止 Link 默认跳转
            toast.error("Connectez-vous dabord！");
            navigate("/login"); // 自动跳到登录页
            return;
        }
        setMenuOpen(false); // 有 token 则关闭菜单
    };

    return (
        <header className="header">
            <img src={logo} alt="Logo" className="logo" />
            <h1>{getTitle()}</h1>

            <button
                className={`menu-btn ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
            >
                ☰
            </button>

            <nav className={`side-menu ${menuOpen ? "show" : ""}`}>
                <ul>
                    <li>
                        <Link to="/login" onClick={() => setMenuOpen(false)}>
                            🏠 Accueil
                        </Link>
                    </li>
                    <li>
                        <Link to="/commandes" onClick={() => setMenuOpen(false)}>
                            📦 Commandes
                        </Link>
                    </li>
                    <li>
                        <Link to="/statistiques" onClick={() => setMenuOpen(false)}>
                            📊 Statistiques
                        </Link>
                    </li>
                    <li>
                        <Link to="/employes" onClick={() => setMenuOpen(false)}>
                            🧑🏻‍💼​ Employés
                        </Link>
                    </li>
                    <li>
                        <Link to="/planning" onClick={() => setMenuOpen(false)}>
                            📆​ Planning
                        </Link>
                    </li>
                    <li>
                        <Link to="/recettes" onClick={handleRecettesClick}>
                            📖 Recettes
                        </Link>
                    </li>
                    <li>
                        <Link to="/queue" onClick={() => setMenuOpen(false)}>
                            🟢 Queue
                        </Link>
                    </li>
                    <li>
                        <Link to="/WorkHours" onClick={() => setMenuOpen(false)}>
                            🟢 Queue
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
