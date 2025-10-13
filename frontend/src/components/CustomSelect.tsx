import React, { useState, useRef, useEffect } from "react";
import "./CustomSelect.css";

interface CustomSelectProps {
    options: string[];
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

export default function CustomSelect({
                                         options,
                                         value,
                                         placeholder = "— Sélectionner —",
                                         onChange,
                                     }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Fermer quand on clique dehors
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="custom-select" ref={selectRef}>
            <div
                className="custom-select-trigger"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
            >
                {value && value.trim() !== "" ? value : placeholder}
                <span className={`arrow ${open ? "up" : "down"}`} />
            </div>

            {open && (
                <div className="custom-select-options">
                    {options.map((option) => (
                        <div
                            key={option}
                            className={`option ${value === option ? "selected" : ""}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
