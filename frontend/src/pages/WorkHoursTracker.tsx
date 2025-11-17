import React, { useState, useMemo } from "react";

interface WorkDay {
    date: string;
    hours: number;
}

const WorkHoursTracker: React.FC = () => {
    // Génération dynamique du mois en cours
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const [workDays, setWorkDays] = useState<WorkDay[]>(() =>
        Array.from({ length: daysInMonth }, (_, i) => ({
            date: new Date(year, month, i + 1).toISOString().split("T")[0],
            hours: 0,
        }))
    );

    const handleChange = (index: number, value: string) => {
        const newWorkDays = [...workDays];
        newWorkDays[index].hours = parseFloat(value) || 0;
        setWorkDays(newWorkDays);
    };

    const totals = useMemo(() => {
        let totalHours = 0;
        let totalDays = 0;

        workDays.forEach((day) => {
            const h = day.hours;
            if (h > 0) {
                totalHours += h;
                totalDays += h >= 7 ? 1 : 0.5;
            }
        });

        return { totalHours, totalDays };
    }, [workDays]);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Suivi des heures du mois</h1>

            <table style={styles.table}>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Heures travaillées</th>
                </tr>
                </thead>
                <tbody>
                {workDays.map((day, index) => (
                    <tr key={day.date}>
                        <td>{day.date}</td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={day.hours || ""}
                                onChange={(e) => handleChange(index, e.target.value)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div style={styles.summary}>
                <h3>Résumé du mois</h3>
                <p>🕒 Total d’heures : {totals.totalHours.toFixed(2)} h</p>
                <p>📅 Total de jours travaillés : {totals.totalDays} jours</p>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: "20px",
        maxWidth: "600px",
        margin: "auto",
        fontFamily: "Arial, sans-serif",
    },
    title: {
        textAlign: "center",
        marginBottom: "20px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "20px",
    },
    summary: {
        textAlign: "center",
        backgroundColor: "#f2f2f2",
        padding: "10px",
        borderRadius: "10px",
    },
};

export default WorkHoursTracker;
