// src/routes/schedule.ts
import { Router } from "express";
import { db } from "../db";
import { addDays, format } from "date-fns";

export const scheduleRouter = Router();

let employeeIndex = 0; // round-robin

scheduleRouter.post("/generate-week", async (req, res) => {
  try {
    const { startDate } = req.body;
    const start = new Date(startDate);
    const schedules: any[] = [];

    // récupérer employés + leurs positions
    const [allEmployees]: any = await db.query(`
      SELECT e.id, e.name, e.fixed_off_day, e.base_type,
             GROUP_CONCAT(epa.position_id) AS positions
      FROM employees e
      LEFT JOIN employee_position_assignments epa ON e.id = epa.employee_id
      GROUP BY e.id
    `);

    if (allEmployees.length === 0) {
      return res.json({ success: true, schedules: [] });
    }

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(start, i);
      const dayIndex = currentDate.getDay(); // 0=Sun ... 6=Sat
      const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const weekday = weekdays[dayIndex];
      const shiftDate = format(currentDate, "yyyy-MM-dd");

      // récupérer règles
      const [rules]: any = await db.query(
        `SELECT r.id AS role_id, r.name AS role_name, rr.shift_type, rr.required_count
         FROM role_shift_requirements rr
         JOIN roles r ON rr.role_id = r.id
         WHERE rr.weekday = ?`,
        [weekday]
      );

      for (const rule of rules) {
        // créer shift
        const [shiftResult]: any = await db.query(
          `INSERT INTO shifts (role_id, shift_date, start_time, end_time, required_count, shift_type) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rule.role_id,
            shiftDate,
            rule.shift_type === "FULLDAY"
              ? "11:00"
              : rule.shift_type === "AM"
              ? "11:00"
              : "14:30",
            rule.shift_type === "FULLDAY"
              ? "23:00"
              : rule.shift_type === "AM"
              ? "19:30"
              : "23:00",
            rule.required_count,
            rule.shift_type,
          ]
        );

        const shiftId = shiftResult.insertId;
        const assignedEmployees: any[] = [];

        // assigne en round-robin
        for (let j = 0; j < rule.required_count; j++) {
          let tries = 0;
          let emp: any = null;

          // chercher un employé dispo
          while (tries < allEmployees.length) {
            const candidate = allEmployees[employeeIndex % allEmployees.length];
            employeeIndex++;
            tries++;

            // conditions : pas son jour de repos + correspond au rôle (ou base_type)
            const positions =
              candidate.positions && candidate.positions.length > 0
                ? candidate.positions.split(",").map((p: string) => parseInt(p))
                : [];

            const goodForRole =
              positions.includes(rule.role_id) || candidate.base_type;

            const notOffDay = candidate.fixed_off_day !== weekday;

            if (goodForRole && notOffDay) {
              emp = candidate;
              break;
            }
          }

          if (emp) {
            await db.query(
              "INSERT INTO schedule (shift_id, employee_id) VALUES (?, ?)",
              [shiftId, emp.id]
            );

            assignedEmployees.push({
              id: emp.id,
              name: emp.name,
            });
          }
        }

        schedules.push({
          date: shiftDate,
          weekday,
          role_id: rule.role_id,
          role_name: rule.role_name,
          shift_type: rule.shift_type,
          employees: assignedEmployees,
        });
      }
    }

    res.json({ success: true, schedules });
  } catch (err) {
    console.error("❌ Erreur generate-week:", err);
    res.status(500).json({ success: false});
  }
});
