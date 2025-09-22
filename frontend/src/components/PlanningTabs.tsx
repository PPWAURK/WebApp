import "./PlanningTabs.css";

export type Employee = {
    id: number;
    name: string;
};

export type ScheduleItem = {
    date: string;
    weekday: string;
    role_id: number;
    role_name: string;
    shift_type: string; // AM / PM / FULLDAY
    employees: Employee[];
};

type PlanningTabsProps = {
    schedules: ScheduleItem[];
};

const roleColors: Record<string, string> = {
    "Accueil": "#FFD700",
    "Service": "#ADFF2F",
    "Bar": "#87CEEB",
    "Pâte": "#FFA07A",
    "Entrée chaude": "#FF6347",
    "Entrée froide": "#40E0D0",
    "Polyvalent": "#DA70D6",
    "Cuisine": "#FFA500",
    "Salle": "#98FB98",
};

const shiftTimeMapByRole: Record<string, Record<string, string>> = {
    "FULLDAY": {
        "Cuisine": "11H00-15H30 / 18H00-23H00",
        "Salle": "10H30-14H30 / 17H30-23H00",
        "Bar": "11H00-15H30 / 18H00-23H00",
    },
    "AM": {
        "Cuisine": "10H30-19H30",
        "Salle": "11H00-19H30",
        "Bar": "11H00-15H30",
    },
    "PM": {
        "Cuisine": "14H30-23H00",
        "Salle": "15H00-23H00",
        "Bar": "17H00-23H00",
    },
};

export default function PlanningTabs({ schedules }: PlanningTabsProps) {
    if (!schedules || schedules.length === 0) return <p>Aucun planning disponible</p>;

    // Grouper par rôle + shift
    const groupedByRole: Record<string, ScheduleItem[]> = {};
    schedules.forEach((s) => {
        const key = `${s.role_id}-${s.shift_type}`;
        if (!groupedByRole[key]) groupedByRole[key] = [];
        groupedByRole[key].push(s);
    });

    const days = Array.from(new Set(schedules.map((s) => s.date))).sort();

    // Tri : AM → FULLDAY → PM
    const sortedGroups = Object.entries(groupedByRole).sort(([_, a], [__, b]) => {
        const shiftOrder: Record<string, number> = { "AM": 0, "FULLDAY": 1, "PM": 2 };
        return (shiftOrder[a[0].shift_type] ?? 3) - (shiftOrder[b[0].shift_type] ?? 3);
    });

    return (
        <div className="planning-table">
            <table>
                <thead>
                <tr>
                    <th>Fonction</th>
                    <th>Horaires</th>
                    {days.map((d) => {
                        const sample = schedules.find((s) => s.date === d);
                        return (
                            <th key={d}>
                                {sample?.weekday} <br />
                                <span className="date">{d}</span>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {sortedGroups.map(([key, shifts]) => {
                    const { role_name, shift_type } = shifts[0];

                    // Horaires selon rôle, fallback sur shift_type si rôle absent
                    const displayShift =
                        shiftTimeMapByRole[shift_type]?.[role_name] ||
                        shiftTimeMapByRole[shift_type]?.["Salle"] || // fallback
                        shift_type;

                    const colspanTracker: Record<number, boolean> = {}; // suivi des cellules fusionnées horizontalement

                    return (
                        <tr key={key}>
                            <td style={{ background: roleColors[role_name] || "#eee" }}>
                                {role_name}
                            </td>
                            <td>{displayShift}</td>

                            {days.map((d, dayIndex) => {
                                if (colspanTracker[dayIndex]) return null;

                                const shift = shifts.find((s) => s.date === d);

                                if (!shift || shift.employees.length === 0) {
                                    // calcul du colspan pour les jours vides consécutifs
                                    let colspan = 1;
                                    for (let i = dayIndex + 1; i < days.length; i++) {
                                        const nextShift = shifts.find((s) => s.date === days[i]);
                                        if (!nextShift || nextShift.employees.length === 0) {
                                            colspan++;
                                            colspanTracker[i] = true;
                                        } else break;
                                    }

                                    return (
                                        <td key={d} colSpan={colspan} className="empty">
                                            -
                                        </td>
                                    );
                                }

                                return (
                                    <td key={d}>
                                        {shift.employees.map((e) => (
                                            <div key={e.id} className="employee-cell">
                                                {e.name}
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
