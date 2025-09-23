// src/routes/schedule.ts
import { Router } from "express";
import { db } from "../db";
import { addDays, format } from "date-fns";
import ExcelJS from "exceljs";

export const scheduleRouter = Router();

let employeeIndex = 0; // round-robin

// Fonction réutilisable pour générer les schedules
async function generateWeekSchedules(startDate: string) {
  const start = new Date(startDate);
  const schedules: any[] = [];

  const [allEmployees]: any = await db.query(`
    SELECT e.id, e.name, e.off_day_1, e.off_day_2, e.base_type,
           GROUP_CONCAT(epa.position_id) AS positions
    FROM employees e
           LEFT JOIN employee_position_assignments epa ON e.id = epa.employee_id
    GROUP BY e.id
  `);

  if (allEmployees.length === 0) return schedules;

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(start, i);
    const dayIndex = currentDate.getDay();
    const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weekday = weekdays[dayIndex];
    const shiftDate = format(currentDate, "yyyy-MM-dd");

    const [rules]: any = await db.query(
      `SELECT r.id AS role_id, r.name AS role_name, rr.shift_type, rr.required_count
       FROM role_shift_requirements rr
              JOIN roles r ON rr.role_id = r.id
       WHERE rr.weekday = ?`,
      [weekday]
    );

    for (const rule of rules) {
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

      for (let j = 0; j < rule.required_count; j++) {
        let tries = 0;
        let emp: any = null;

        while (tries < allEmployees.length) {
          const candidate = allEmployees[employeeIndex % allEmployees.length];
          employeeIndex++;
          tries++;

          const positions =
            candidate.positions && candidate.positions.length > 0
              ? candidate.positions.split(",").map((p: string) => parseInt(p))
              : [];

          const goodForRole =
            positions.includes(rule.role_id) || candidate.base_type;

          const notOffDay =
            candidate.off_day_1 !== weekday && candidate.off_day_2 !== weekday;

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

// Route Excel stylé avec copie de mise en forme
scheduleRouter.get("/generate-week-xlsx", async (req, res) => {
  try {
    const startDateStr = req.query.startDate as string;
    if (!startDateStr) return res.status(400).send("startDate manquant");

    const schedules = await generateWeekSchedules(startDateStr);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile("./data/Planning.xlsx");

    const sheet = workbook.getWorksheet("Planning");
    if (!sheet) return res.status(500).send("La feuille 'Planning' n'existe pas dans le template");

    // Ligne modèle pour copier la mise en forme
    const templateRow = sheet.getRow(2); // ligne 2 comme modèle
    let rowIndex = 3; // commencer après la ligne modèle

    schedules.forEach((shift: any) => {
      const row = sheet.getRow(rowIndex);

      // Copier le style cellule par cellule
      templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const targetCell = row.getCell(colNumber);
        targetCell.style = { ...cell.style };
      });

      // Remplir les valeurs
      row.getCell(1).value = shift.date;
      row.getCell(2).value = shift.weekday;
      row.getCell(3).value = shift.role_name;
      row.getCell(4).value = shift.shift_type;
      row.getCell(5).value = shift.employees.map((e: any) => e.name).join(", ");

      row.commit();
      rowIndex++;
    });

    // Envoyer le fichier Excel
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=planning_${startDateStr}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Erreur generate-week-xlsx:", err);
    res.status(500).send("Erreur génération Excel");
  }
});
