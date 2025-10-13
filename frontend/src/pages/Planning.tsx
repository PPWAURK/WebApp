import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Planning.css";
import Header from "../components/Header";
import PlanningTabs, { ScheduleItem } from "../components/PlanningTabs";
import OffDaysTable from "../components/OffDaysTable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


interface Role {
  id: number;
  name: string;
  area: "Salle" | "Cuisine";
  weekday_start1: string;
  weekday_end1: string;
  weekday_start2?: string;
  weekday_end2?: string;
  weekend_start1?: string;
  weekend_end1?: string;
  weekend_start2?: string;
  weekend_end2?: string;
  weekend_start3?: string;
  weekend_end3?: string;
}

export function Planning() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const planningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get<Role[]>("https://api.zhaoplatforme.com/api/roles"); // Ton API
        const weekdays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
        const weekends = ["Samedi", "Dimanche"];

        const items: ScheduleItem[] = [];

        res.data.forEach((role) => {
          // Semaine
          weekdays.forEach((day) => {
            if (role.weekday_start1 && role.weekday_end1) {
              items.push({
                date: "",
                weekday: day,
                role_id: role.id,
                role_name: role.name,
                area: role.area,
                shift_time: `${role.weekday_start1}-${role.weekday_end1}`,
                employees: [],
              });
            }
            if (role.weekday_start2 && role.weekday_end2) {
              items.push({
                date: "",
                weekday: day,
                role_id: role.id,
                role_name: role.name,
                area: role.area,
                shift_time: `${role.weekday_start2}-${role.weekday_end2}`,
                employees: [],
              });
            }
          });

          // Week-end
          weekends.forEach((day) => {
            if (role.weekend_start1 && role.weekend_end1) {
              items.push({
                date: "",
                weekday: day,
                role_id: role.id,
                role_name: role.name,
                area: role.area,
                shift_time: `${role.weekend_start1}-${role.weekend_end1}`,
                employees: [],
              });
            }
            if (role.weekend_start2 && role.weekend_end2) {
              items.push({
                date: "",
                weekday: day,
                role_id: role.id,
                role_name: role.name,
                area: role.area,
                shift_time: `${role.weekend_start2}-${role.weekend_end2}`,
                employees: [],
              });
            }
            if (role.weekend_start3 && role.weekend_end3) {
              items.push({
                date: "",
                weekday: day,
                role_id: role.id,
                role_name: role.name,
                area: role.area,
                shift_time: `${role.weekend_start3}-${role.weekend_end3}`,
                employees: [],
              });
            }
          });
        });

        setSchedules(items);
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles :", error);
      }
    };

    fetchRoles();
  }, []);

  const handleDownloadPDF = async () => {
    if (!planningRef.current) return;

    // Afficher le toast
    toast.info("义总辛苦了🫡，马上给你生成PDF...", {
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    // Attendre la fin du toast avant de générer
    setTimeout(async () => {
      const planningElement = planningRef.current!;
      const canvas = await html2canvas(planningElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const margin = 50;
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width + margin * 2, canvas.height + margin * 2],
      });
      pdf.addImage(imgData, "PNG", margin, margin, canvas.width, canvas.height);
      pdf.save("planning.pdf");
    }, 3500); // délai pour que le toast soit visible
  };


  return (
      <div className="planning-page">
        <ToastContainer />
        <Header />
        <button className="boutton" onClick={handleDownloadPDF}>Télécharger le planning en PDF</button>

        <div className="planning-result" ref={planningRef}>
          <PlanningTabs schedules={schedules} />
          <OffDaysTable />
        </div>

      </div>
  );
}
