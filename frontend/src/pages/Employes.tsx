import { useState, useEffect } from "react";
import { FaTrash, FaUserPlus } from "react-icons/fa";
import Header from "../components/Header";
import "./Employes.css";

interface Employee {
  id: number;
  name: string;
  level: number;
  off_day_1: string | null;
  off_day_2: string | null;
  base_type: "CUISINE" | "SALLE" | "BAR";
  positions: string[];
}

interface EmployeePosition {
  id: number;
  name: string;
}

export default function Employes() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [editedEmployees, setEditedEmployees] = useState<Record<number, Employee>>({});
  const [loading, setLoading] = useState(true);

  const jours = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const joursLabel: Record<string, string> = {
    MON: "Lundi",
    TUE: "Mardi",
    WED: "Mercredi",
    THU: "Jeudi",
    FRI: "Vendredi",
    SAT: "Samedi",
    SUN: "Dimanche",
  };

  const baseTypes = ["CUISINE", "SALLE", "BAR"];

  // Charger employés + positions
  useEffect(() => {
    Promise.all([
      fetch("https://api.zhaoplatforme.com/api/employees").then((res) => res.json()),
      fetch("https://api.zhaoplatforme.com/api/employee-positions").then((res) => res.json()),
    ])
      .then(([emps, pos]) => {
        setEmployees(emps);
        setPositions(pos);
      })
      .catch((err) => console.error("❌ Erreur fetch:", err))
      .finally(() => setLoading(false));
  }, []);

  // Mise à jour locale
  const handleLocalChange = (id: number, field: keyof Employee, value: any) => {
    setEditedEmployees((prev) => ({
      ...prev,
      [id]: { ...employees.find((e) => e.id === id)!, ...prev[id], [field]: value },
    }));
  };

  // Toggle d’un poste
  const handleTogglePosition = (id: number, posName: string) => {
    const emp = editedEmployees[id] || employees.find((e) => e.id === id)!;
    const current = emp.positions || [];
    const updated = current.includes(posName)
      ? current.filter((p) => p !== posName)
      : [...current, posName];
    handleLocalChange(id, "positions", updated);
  };

  // Suppression employé
  const handleDelete = async (id: number) => {
    const prevEmployees = [...employees];
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));

    try {
      const res = await fetch(`http://localhost:4000/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      setEmployees(prevEmployees);
    }
  };

  // Ajout employé
  const handleAdd = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nouvel employé",
          level: 0,
          off_day_1: "MON",
          off_day_2: null,
          base_type: "SALLE",
          positions: [], // par défaut aucun poste
        }),
      });
      const newEmp = await res.json();
      setEmployees((prev) => [...prev, newEmp]);
    } catch (error) {
      console.error("❌ Erreur ajout:", error);
    }
  };

  // Validation
  const handleValidate = async () => {
    for (const id in editedEmployees) {
      const emp = editedEmployees[id];
      try {
        await fetch(`https://api.zhaoplatforme.com/api/employees/${emp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emp),
        });
      } catch (err) {
        console.error(`❌ Erreur update employé ${emp.id}:`, err);
      }
    }
    setEditedEmployees({});
    // rafraîchir liste
    const res = await fetch("https://api.zhaoplatforme.com/api/employees");
    const data = await res.json();
    setEmployees(data);
  };

  if (loading) return <p>⏳ Chargement...</p>;

  return (
    <div>
      <Header />
      <div className="employes-page">
        <div className="content">
          <div className="title">
            <h2>Gestion des employés</h2>
            <button className="add-btn" onClick={handleAdd}>
              <FaUserPlus /> Ajouter
            </button>
          </div>

          <div className="employes-grid">
            {employees.map((emp) => {
              const edited = editedEmployees[emp.id] || emp;
              return (
                <div className="employe-card" key={emp.id}>
                  <div className="employe-header">
                    <input
                      type="text"
                      value={edited.name}
                      onChange={(e) => handleLocalChange(emp.id, "name", e.target.value)}
                      className="employe-name-input"
                    />
                    <button className="delete-btn" onClick={() => handleDelete(emp.id)}>
                      <FaTrash />
                    </button>
                  </div>

                  {/* Jours de repos */}
                  <div>
                    <label>Repos 1</label>
                    <select
                      value={edited.off_day_1 || "MON"}
                      onChange={(e) => handleLocalChange(emp.id, "off_day_1", e.target.value)}
                    >
                      {jours.map((jour) => (
                        <option key={jour} value={jour}>
                          {joursLabel[jour]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Repos 2</label>
                    <select
                      value={edited.off_day_2 || ""}
                      onChange={(e) => handleLocalChange(emp.id, "off_day_2", e.target.value)}
                    >
                      <option value="">—</option>
                      {jours.map((jour) => (
                        <option key={jour} value={jour}>
                          {joursLabel[jour]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Niveau */}
                  <div>
                    <label>Niveau</label>
                    <select
                      value={edited.level}
                      onChange={(e) => handleLocalChange(emp.id, "level", Number(e.target.value))}
                    >
                      {Array.from({ length: 8 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type de base */}
                  <div>
                    <label>Type de base</label>
                    <select
                      value={edited.base_type}
                      onChange={(e) => handleLocalChange(emp.id, "base_type", e.target.value)}
                    >
                      {baseTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Postes */}
                  <div>
                    <label>Postes</label>
                    <div className="types-checkboxes">
                      {positions.map((p) => (
                        <label key={p.id}>
                          <input
                            type="checkbox"
                            checked={edited.positions?.includes(p.name) || false}
                            onChange={() => handleTogglePosition(emp.id, p.name)}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="validate-btn" onClick={handleValidate}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
