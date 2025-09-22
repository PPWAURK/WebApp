// src/pages/Planning.tsx
import { useEffect, useState } from "react";
import "./Planning.css";
import Header from "../components/Header";
import PlanningTable from "../components/PlanningTabs";


interface Rule {
  id: number;
  role_id: number;
  weekday: string;
  shift_type: string;
  required_count: number;
}

interface Employee {
  id: number;
  name: string;
}

interface ScheduleItem {
  date: string;
  weekday: string;
  role_id: number;
  role_name: string;
  shift_type: string;
  employees: Employee[];
  incomplete?: boolean;
}

export default function Planning() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [activeDay, setActiveDay] = useState<string>("MON");

  // 👉 états pour ajouter une règle
  const [newRoleId, setNewRoleId] = useState<number>(1);
  const [newWeekday, setNewWeekday] = useState<string>("MON");
  const [newShiftType, setNewShiftType] = useState<string>("FULLDAY");
  const [newRequiredCount, setNewRequiredCount] = useState<number>(1);

  // Rôles disponibles (devrait être fetch depuis /roles en vrai)
const roles = [
  { id: 1, name: "Accueil", base_type: "SALLE" },
  { id: 2, name: "Service", base_type: "SALLE" },
  { id: 3, name: "Bar", base_type: "BAR" },
  { id: 4, name: "Pâte", base_type: "CUISINE" },
  { id: 5, name: "Entrée chaude", base_type: "CUISINE" },
  { id: 6, name: "Entrée froide", base_type: "CUISINE" },
  { id: 7, name: "Polyvalent", base_type: "CUISINE" },
];

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const shifts = ["FULLDAY", "AM", "PM"];

  useEffect(() => {
    fetch("https://api.zhaoplatforme.com/api/rules")
      .then((res) => res.json())
      .then(setRules)
      .catch((err) => console.error("Erreur fetch rules:", err));
  }, []);

  // Ajouter une règle
  const handleAddRule = async () => {
    const role = roles.find(r => r.id === newRoleId);

    const body = {
      role_id: newRoleId,
      role_name: role?.name,
      base_type: role?.base_type,
      weekday: newWeekday,
      shift_type: newShiftType,
      required_count: newRequiredCount,
    };
    const res = await fetch("https://api.zhaoplatforme.com/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    setRules([...rules, data]);
  };

  // Modifier une règle
  const handleUpdateRule = async (id: number, field: keyof Rule, value: any) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    setRules(updated);

    const rule = updated.find((r) => r.id === id);
    if (!rule) return;

    const res = await fetch(`https://api.zhaoplatforme.com/api/rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
  };

  // Supprimer une règle
  const handleDeleteRule = async (id: number) => {
    await fetch(`https://api.zhaoplatforme.com/api/rules/${id}`, { method: "DELETE" });
    setRules(rules.filter((r) => r.id !== id));
  };

  // Générer planning
  const handleGenerate = async () => {
    if (!startDate) return alert("Choisir une date de début");
    const res = await fetch("https://api.zhaoplatforme.com/api/schedule/generate-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    setSchedules(data.schedules || []);
  };

  return (
      <div className="planning-page">
        <Header/>
        <h2>📋 Ajouter une règle</h2>
        <div className="add-rule-form">
          <select value={newRoleId} onChange={(e) => setNewRoleId(Number(e.target.value))}>
            {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
            ))}
          </select>

          <select value={newWeekday} onChange={(e) => setNewWeekday(e.target.value)}>
            {weekdays.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
            ))}
          </select>

          <select value={newShiftType} onChange={(e) => setNewShiftType(e.target.value)}>
            {shifts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
            ))}
          </select>

          <input
              type="number"
              value={newRequiredCount}
              min={1}
              onChange={(e) => setNewRequiredCount(Number(e.target.value))}
          />

          <button onClick={handleAddRule}>➕ Ajouter</button>
        </div>
        <h2>📅 Règles existantes</h2>

        {/* Onglets jours de la semaine */}
        <div className="tabs">
          {weekdays.map((w) => (
              <button
                  key={w}
                  className={activeDay === w ? "tab active" : "tab"}
                  onClick={() => setActiveDay(w)}
              >
                {w}
              </button>
          ))}
        </div>

        {/* Règles filtrées */}
        <div className="rules-grid">
          {rules
              .filter((rule) => rule.weekday === activeDay)
              .map((rule) => (
                  <div key={rule.id} className="rule-card">
                    <select
                        value={rule.role_id}
                        onChange={(e) =>
                            handleUpdateRule(rule.id, "role_id", Number(e.target.value))
                        }
                    >
                      {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                      ))}
                    </select>

                    <select
                        value={rule.weekday}
                        onChange={(e) => handleUpdateRule(rule.id, "weekday", e.target.value)}
                    >
                      {weekdays.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                      ))}
                    </select>

                    <select
                        value={rule.shift_type}
                        onChange={(e) =>
                            handleUpdateRule(rule.id, "shift_type", e.target.value)
                        }
                    >
                      {shifts.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                      ))}
                    </select>

                    <input
                        type="number"
                        value={rule.required_count}
                        min={1}
                        onChange={(e) =>
                            handleUpdateRule(rule.id, "required_count", Number(e.target.value))
                        }
                    />

                    <button onClick={() => handleDeleteRule(rule.id)}>🗑️</button>
                  </div>
              ))}
        </div>


        <h2>📅 Générer Planning</h2>
        <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
        />
        <button onClick={handleGenerate}>Générer la semaine</button>

        <div className="planning-result">
          <h3>Résultat</h3>
          {schedules.length === 0 ? (
              <p>Aucun planning généré</p>
          ) : (
              <PlanningTable schedules={schedules}/>
          )}
        </div>

      </div>
  );
}
