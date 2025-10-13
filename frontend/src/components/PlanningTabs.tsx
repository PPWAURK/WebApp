import React, { useState, useEffect } from "react";
import "./PlanningTabs.css";
import CustomSelect from "./CustomSelect";

function formatShiftTime(timeRange: string) {
    if (!timeRange) return "";
    return timeRange.split("-").map((time) => time.slice(0, 5)).join("-");
}

function getColorFromIdAndName(id: number, name: string): string {
    const base = id + name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue = base % 360;
    const saturation = 70;
    const lightness = 55;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export type Employee = {
    id: number;
    name: string;
    base_type: string[];
    positions: string[];
};

export type ScheduleItem = {
    date: string;
    weekday: string;
    role_id: number;
    role_name: string;
    area: "Salle" | "Cuisine";
    shift_time: string;
    employees: Employee[];
};

type PlanningTabsProps = {
    schedules: ScheduleItem[];
};

type SelectedCell = { role_name: string; date: string; area: "Salle" | "Cuisine"; shift_time: string };

export default function PlanningTabs({ schedules }: PlanningTabsProps) {
    const [schedulesState, setSchedulesState] = useState<ScheduleItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [replacements, setReplacements] = useState<Record<string, Employee>>({});
    const [employeeColors, setEmployeeColors] = useState<Record<number, string>>({});

    useEffect(() => {
        setSchedulesState(schedules);
    }, [schedules]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch("https://api.zhaoplatforme.com/api/employees");
                const data: Employee[] = await res.json();
                setEmployees(data);

                const colors: Record<number, string> = {};
                data.forEach((emp) => {
                    colors[emp.id] = getColorFromIdAndName(emp.id, emp.name);
                });
                setEmployeeColors(colors);
            } catch (err) {
                console.error("Erreur récupération employés :", err);
            }
        };
        fetchEmployees();
    }, []);

    const handleSelectChange = (shift: ScheduleItem, empId: string) => {
        const emp = employees.find((e) => e.id === parseInt(empId));
        if (!emp) return;

        const newSchedules = schedulesState.map((s) =>
            s.role_id === shift.role_id &&
            s.weekday === shift.weekday &&
            s.shift_time === shift.shift_time &&
            s.area === shift.area
                ? { ...s, employees: [emp] }
                : s
        );
        setSchedulesState(newSchedules);
        setSelectedCell(null);
    };

    const handleReplacementSelect = (area: "Salle" | "Cuisine", date: string, empId: string) => {
        const emp = employees.find((e) => e.id === parseInt(empId));
        if (!emp) return;
        setReplacements((prev) => ({ ...prev, [`${area}-${date}`]: emp }));
        setSelectedCell(null);
    };

    if (employees.length === 0) return <div>Chargement des employés...</div>;

    const weekdayOrder: Record<string, number> = {
        Lundi: 1,
        Mardi: 2,
        Mercredi: 3,
        Jeudi: 4,
        Vendredi: 5,
        Samedi: 6,
        Dimanche: 7,
    };

    const days = Array.from(new Set(schedulesState.map((s) => s.weekday || s.date))).sort(
        (a, b) => (weekdayOrder[a] || 0) - (weekdayOrder[b] || 0)
    );

    const weekdays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const weekends = ["Samedi", "Dimanche"];
    const weekDaysDates = days.filter((d) => weekdays.includes(d));
    const weekendDates = days.filter((d) => weekends.includes(d));
    const areas: ("Salle" | "Cuisine")[] = ["Salle", "Cuisine"];

    const renderTable = (dates: string[], schedulesToUse: ScheduleItem[]) => (
        <table>
            <thead>
            <tr>
                <th>Horaires</th>
                <th>Fonction</th>
                {dates.map((d) => (
                    <th key={d}>{d}</th>
                ))}
            </tr>
            </thead>
            <tbody>
            {areas.map((area) => {
                const grouped = schedulesToUse
                    .filter((s) => s.area === area && dates.includes(s.weekday || s.date))
                    .reduce<Record<string, ScheduleItem[]>>((acc, s) => {
                        const key = s.role_name;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(s);
                        return acc;
                    }, {});

                return (
                    <React.Fragment key={area}>
                        <tr>
                            <td colSpan={dates.length + 2}>{area}</td>
                        </tr>

                        {Object.entries(grouped).map(([role_name, items]) => {
                            const allShiftTimes = Array.from(
                                new Set(items.map((s) => formatShiftTime(s.shift_time)))
                            ).join(" / ");

                            return (
                                <tr key={role_name}>
                                    <td style={{ textAlign: "center" }}>{allShiftTimes}</td>
                                    <td style={{ fontWeight: "bold" }}>{role_name}</td>

                                    {dates.map((d) => {
                                        const shift = items.find((s) => s.weekday === d || s.date === d);
                                        if (!shift) return <td key={d} className="empty">-</td>;

                                        const isOpen =
                                            selectedCell?.role_name === role_name &&
                                            selectedCell?.date === d &&
                                            selectedCell?.area === area &&
                                            selectedCell?.shift_time === shift.shift_time;

                                        return (
                                            <td
                                                key={d}
                                                className="shift-cell"
                                                style={{ cursor: "pointer" }}
                                                onClick={() =>
                                                    setSelectedCell(
                                                        isOpen
                                                            ? null
                                                            : {
                                                                role_name,
                                                                date: d,
                                                                area,
                                                                shift_time: shift.shift_time,
                                                            }
                                                    )
                                                }
                                            >
                                                {shift.employees.length > 0
                                                    ? shift.employees.map((e) => (
                                                        <div
                                                            key={e.id}
                                                            className="employee-cell"
                                                            style={{
                                                                backgroundColor: employeeColors[e.id] || "#999",
                                                                color: "white",
                                                                textAlign: "center",
                                                                margin: "2px",
                                                                padding: "4px 6px",
                                                                borderRadius: "6px",
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {e.name}
                                                        </div>
                                                    ))
                                                    : "-"}

                                                {isOpen && (
                                                    <CustomSelect
                                                        options={employees
                                                            .filter(
                                                                (emp) =>
                                                                    emp.base_type.includes(area.toUpperCase()) ||
                                                                    emp.positions.includes(area) ||
                                                                    (area === "Salle" && emp.positions.includes("Bar"))
                                                            )
                                                            .map((emp) => emp.name)}
                                                        value={shift.employees[0]?.name || ""}
                                                        onChange={(val) => {
                                                            const emp = employees.find((e) => e.name === val);
                                                            if (emp) handleSelectChange(shift, String(emp.id));
                                                        }}
                                                    />
                                                )}

                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        <tr key="remplacant">
                            <td style={{ textAlign: "center" }}>-</td>
                            <td style={{ fontWeight: "bold" }}>Remplaçant</td>
                            {dates.map((d) => {
                                const isOpen =
                                    selectedCell?.role_name === "Remplaçant" &&
                                    selectedCell?.date === d &&
                                    selectedCell?.area === area;

                                const emp = replacements[`${area}-${d}`];

                                return (
                                    <td
                                        key={d}
                                        className="shift-cell"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            setSelectedCell(
                                                isOpen ? null : { role_name: "Remplaçant", date: d, area, shift_time: "" }
                                            )
                                        }
                                    >
                                        {emp ? (
                                            <div
                                                key={emp.id}
                                                className="employee-cell"
                                                style={{
                                                    backgroundColor: employeeColors[emp.id] || "#999",
                                                    color: "white",
                                                    textAlign: "center",
                                                    margin: "2px",
                                                    padding: "4px 6px",
                                                    borderRadius: "6px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {emp.name}
                                            </div>
                                        ) : (
                                            "-"
                                        )}

                                        {isOpen && (
                                            <CustomSelect
                                                options={employees
                                                    .filter(
                                                        (emp) =>
                                                            emp.base_type.includes(area.toUpperCase()) ||
                                                            emp.positions.includes(area) ||
                                                            (area === "Salle" && emp.positions.includes("Bar"))
                                                    )
                                                    .map((emp) => emp.name)}
                                                value={replacements[`${area}-${d}`]?.name || ""}
                                                onChange={(val) => {
                                                    const emp = employees.find((e) => e.name === val);
                                                    if (emp) handleReplacementSelect(area, d, String(emp.id));
                                                }}
                                            />
                                        )}

                                    </td>
                                );
                            })}
                        </tr>
                    </React.Fragment>
                );
            })}
            </tbody>
        </table>
    );

    return (
        <div className="planning-table">
            {weekDaysDates.length > 0 && renderTable(weekDaysDates, schedulesState)}
            {weekendDates.length > 0 && renderTable(weekendDates, schedulesState)}
        </div>
    );
}
