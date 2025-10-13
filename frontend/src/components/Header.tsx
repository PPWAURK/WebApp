import { useState } from "react";
import {Link, useLocation} from "react-router-dom";
import logo from "../assets/img/ZHAOLOGO.svg";
import "./Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();


    const getTitle = () => {
        switch (location.pathname) {
            case "/":
                return "Accueil";
            case "/commandes":
                return "Commandes";
            case "/statistiques":
                return "Statistiques";
            case "/employes":
                return "Employés";
            case "/planning":
                return "Planning";
            default:
                return "Interface de commandes";
        }
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
                        <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Accueil</Link>
                    </li>
                    <li>
                        <Link to="/commandes" onClick={() => setMenuOpen(false)}>📦 Commandes</Link>
                    </li>
                    <li>
                        <Link to="/statistiques" onClick={() => setMenuOpen(false)}>📊 Statistiques</Link>
                    </li>
                    <li>
                        <Link to="/employes" onClick={() => setMenuOpen(false)}>🧑🏻‍💼​ Employés</Link>
                    </li>
                    <li>
                        <Link to="/planning" onClick={() => setMenuOpen(false)}>📆​ Planning</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
