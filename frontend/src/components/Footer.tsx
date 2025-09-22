import  { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Footer.css";

type Props = {
  date: string;
  onDateChange: (date: string) => void;
  onOrder: () => void;
};

export default function Footer({ date, onDateChange, onOrder }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    date ? new Date(date) : null
  );

  return (
    <footer className="footer">
      <DatePicker
        selected={selectedDate}
        onChange={(d) => {
  if (d) {
    setSelectedDate(d);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    onDateChange(localDate); // maintenant c'est correct
  }
}}

        customInput={
          <button className="date-btn">
            {selectedDate
              ? selectedDate.toLocaleDateString("fr-FR")
              : "Choisir la date"}
          </button>
        }
        dateFormat="dd/MM/yyyy"
      />

      <button onClick={onOrder} className="order-btn">
        Commander
      </button>
    </footer>
  );
}
