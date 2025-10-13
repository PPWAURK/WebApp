import React, { useState, useEffect } from "react";
import "./OffDaysTable.css";
import CustomSelect from "./CustomSelect";

type Employee = {
    id: number;
    name: string;
};

const dayMap: Record<string, string> = {
    MON: "Lundi",
    TUE: "Mardi",
    WED: "Mercredi",
    THU: "Jeudi",
    FRI: "Vendredi",
    SAT: "Samedi",
    SUN: "Dimanche",
};

type OffDays = Record<number, { off_day_1?: string; off_day_2?: string }>;

export default function OffDaysTable() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [offDays, setOffDays] = useState<OffDays>({});

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch("https://api.zhaoplatforme.com/api/employees");
                const data: Employee[] = await res.json();
                setEmployees(data);
            } catch (err) {
                console.error("Erreur récupération employés :", err);
            }
        };
        fetchEmployees();
    }, []);

    const handleOffDayChange = (empId: number, dayNumber: 1 | 2, value: string) => {
        setOffDays((prev) => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [`off_day_${dayNumber}`]: value,
            },
        }));
    };

    if (employees.length === 0) return <div>Chargement des employés...</div>;

    return (
        <div className="offdays">
            <h3>Jours de repos</h3>
            <table>
                <thead>
                <tr>
                    <th>Employé</th>
                    <th>Jour de repos 1</th>
                    <th>Jour de repos 2</th>
                </tr>
                </thead>
                <tbody>
                {employees.map((emp) => (
                    <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>
                            <CustomSelect
                                value={offDays[emp.id]?.off_day_1 || ""}
                                options={Object.values(dayMap)}
                                onChange={(val) => handleOffDayChange(emp.id, 1, val)}
                            />
                        </td>
                        <td>
                            <CustomSelect
                                value={offDays[emp.id]?.off_day_2 || ""}
                                options={Object.values(dayMap)}
                                onChange={(val) => handleOffDayChange(emp.id, 2, val)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
