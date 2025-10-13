import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CommandInterface from "./pages/CommandInterface";
import Statistiques from "./pages/Statistiques";
import Employees from "./pages/Employes"
import {Planning} from "./pages/Planning"
import "./style.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CommandInterface />} />
          <Route path="/commandes" element={<CommandInterface />} />
          <Route path="/statistiques" element={<Statistiques />} />
          <Route path="/employes" element={<Employees />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
