// src/routes/schedule.ts
import { Router } from "express";
import { db } from "../db";
import { addDays, format } from "date-fns";
export const scheduleRouter = Router();

let employeeIndex = 0;

async function generateWeekSchedules(startDate: string) {
  const start = new Date(startDate);
  const schedules: any[] = [];

  // Récupération de tous les employés et leurs positions
  const [allEmployees]: any = await db.query(`
    SELECT e.id, e.name, e.off_day_1, e.off_day_2, e.base_type, e.is_part_time,
           GROUP_CONCAT(epa.position_id) AS positions
    FROM employees e
           LEFT JOIN employee_position_assignments epa ON e.id = epa.employee_id
    GROUP BY e.id
  `);

  if (allEmployees.length === 0) return schedules;

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Mapping role_id → position_id
  const roleToPositionMap: Record<number, number> = {
    1: 5, // Accueil
    2: 6, // Service
    3: 7, // Bar
    4: 3, // Pâte
    5: 1, // Entrée chaude (Chaud)
    6: 2, // Entrée froide (Froid)
    7: 4, // Polyvalent
  };

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(start, i);
    const weekday = weekdays[currentDate.getDay()];
    const shiftDate = format(currentDate, "yyyy-MM-dd");

    console.log(`📅 Génération des shifts pour le ${shiftDate} (${weekday})`);

    const assignedToday = new Set<number>();

    const [rules]: any = await db.query(
        `SELECT r.id AS role_id, r.name AS role_name, rr.shift_type, rr.required_count
         FROM role_shift_requirements rr
                JOIN roles r ON rr.role_id = r.id
         WHERE rr.weekday = ?`,
        [weekday]
    );

    for (const rule of rules) {
      console.log(` 📝 Création shift pour rôle ${rule.role_name} (${rule.shift_type})`);

      const [shiftResult]: any = await db.query(
          `INSERT INTO shifts (role_id, shift_date, start_time, end_time, required_count, shift_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rule.role_id,
            shiftDate,
            rule.shift_type === "FULLDAY" ? "11:00" : rule.shift_type === "AM" ? "11:00" : "14:30",
            rule.shift_type === "FULLDAY" ? "23:00" : rule.shift_type === "AM" ? "19:30" : "23:00",
            rule.required_count,
            rule.shift_type,
          ]
      );
      const shiftId = shiftResult.insertId;
      const assignedEmployees: any[] = [];

      for (let j = 0; j < rule.required_count; j++) {
        let emp: any = null;

        // Étape 1 : employés du type correct
        const candidatesSameType = allEmployees.filter((e: any) => {
          const positions = e.positions ? e.positions.split(",").map((p: string) => parseInt(p)) : [];
          const goodForRole = positions.includes(roleToPositionMap[rule.role_id]);
          const notOffDay = e.off_day_1 !== weekday && e.off_day_2 !== weekday;
          const notAlreadyAssigned = !assignedToday.has(e.id);
          const partTimeOk = !e.is_part_time || ["FRI", "SAT", "SUN"].includes(weekday);
          return e.base_type === rule.role_name.toUpperCase() && goodForRole && notOffDay && notAlreadyAssigned && partTimeOk;
        });

        if (candidatesSameType.length > 0) {
          emp = candidatesSameType[employeeIndex % candidatesSameType.length];
          employeeIndex++;
        } else {
          // Étape 2 : fallback sur autre type
          const candidatesOtherType = allEmployees.filter((e: any) => {
            const positions = e.positions ? e.positions.split(",").map((p: string) => parseInt(p)) : [];
            const goodForRole = positions.includes(roleToPositionMap[rule.role_id]);
            const notOffDay = e.off_day_1 !== weekday && e.off_day_2 !== weekday;
            const notAlreadyAssigned = !assignedToday.has(e.id);
            const partTimeOk = !e.is_part_time || ["FRI", "SAT", "SUN"].includes(weekday);
            return e.base_type !== rule.role_name.toUpperCase() && goodForRole && notOffDay && notAlreadyAssigned && partTimeOk;
          });

          if (candidatesOtherType.length > 0) {
            emp = candidatesOtherType[employeeIndex % candidatesOtherType.length];
            employeeIndex++;
          }
        }

        if (emp) {
          await db.query("INSERT INTO schedule (shift_id, employee_id) VALUES (?, ?)", [shiftId, emp.id]);
          assignedEmployees.push({ id: emp.id, name: emp.name });
          assignedToday.add(emp.id);
        } else {
          console.warn(`⚠️ Aucun employé disponible pour ${rule.role_name} le ${shiftDate}`);
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

      console.log(` 👥 Employés assignés pour ${rule.role_name}:`, assignedEmployees.map((e: any) => e.name));
    }
  }

  return schedules;
}

// Route JSON classique
scheduleRouter.post("/generate-week", async (req, res) => {
  try {
    const { startDate } = req.body;
    const schedules = await generateWeekSchedules(startDate);
    res.json({ success: true, schedules });
  } catch (err) {
    console.error("❌ Erreur generate-week:", err);
    res.status(500).json({ success: false });
  }
});

scheduleRouter.get("/", async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT s.*, r.name AS role_name
      FROM schedule sc
      JOIN shifts s ON sc.shift_id = s.id
      JOIN roles r ON s.role_id = r.id
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur GET /schedule:", err);
    res.status(500).json({ success: false });
  }
});
