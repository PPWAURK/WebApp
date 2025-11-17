import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import CommandInterface from "./pages/CommandInterface";
import Statistiques from "./pages/Statistiques";
import Employees from "./pages/Employes"
import {Planning} from "./pages/Planning"
import "./style.css";
import Queuing from "./pages/Queuing.tsx";
import {useState} from "react";
import Login from "./pages/Login.tsx";
import Recettes from "./pages/Recettes.tsx";
import WorkHours from "./pages/WorkHours.tsx";

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
    };

    return (
        <Router>
            <div className="App">
                <Routes>

                    <Route path="/login" element={<Login onLogin={setToken} />} />

                    <Route
                        path="/recettes"
                        element={token ? <Recettes onLogout={handleLogout} /> : <Navigate to="/login" replace />}
                    />
                    <Route path="/" element={<Login onLogin={setToken} />} />
                    <Route path="/commandes" element={<CommandInterface />} />
                    <Route path="/statistiques" element={<Statistiques />} />
                    <Route path="/employes" element={<Employees />} />
                    <Route path="/planning" element={<Planning />} />
                    <Route path="/queue" element={<Queuing />} />
                    <Route path="/WorkHours" element={<WorkHours />} />


                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
