// src/components/TypeFilter.tsx
import "./TypeFilter.css"
interface TypeFilterProps {
  selected: number | null;
  onSelect: (type: number | null) => void;
}

const types = [
  { id: 1, label: "Produis frais" },
  { id: 2, label: "Produits secs" },
  { id: 3, label: "Produits surgelés" },
  { id: 4, label: "Repas employés" },
];

export default function TypeFilter({ selected, onSelect }: TypeFilterProps) {
  return (
    <div className="type-filter">
      <button
        className={!selected ? "active" : ""}
        onClick={() => onSelect(null)}
      >
        Tous
      </button>
      {types.map((t) => (
        <button
          key={t.id}
          className={selected === t.id ? "active" : ""}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
