import React, { useState } from 'react';
import './PeopleSelector.css';

interface PeopleSelectorProps {
    value: number;
    onChange: (n: number) => void;
}

const PeopleSelector: React.FC<PeopleSelectorProps> = ({ value, onChange }) => {
    const options = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    const [inputValue, setInputValue] = useState<string>(''); // Vide par défaut

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0) {
            onChange(num);
        }
    };

    const handleInputBlur = () => {
        // Si l'input est vide ou invalide, on le vide simplement
        if (!inputValue || isNaN(Number(inputValue)) || Number(inputValue) <= 0) {
            setInputValue('');
        }
    };

    // Quand on clique sur un bouton, on met à jour l'input aussi
    const handleButtonClick = (n: number) => {
        onChange(n);
        setInputValue(n.toString());
    };

    return (
        <div className="people-selector">
            {/* 文字介绍 */}
            <p className="people-selector__description">
                👥 请选择排队人数，或在下方输入人数：
            </p>

            <h3 className="people-selector__title">选择人数 :</h3>

            <div className="people-selector__options">
                {options.map(n => (
                    <button
                        key={n}
                        className={`people-selector__button ${value === n ? 'people-selector__button--active' : ''}`}
                        onClick={() => handleButtonClick(n)}
                    >
                        {n} 人
                    </button>
                ))}
            </div>

            <div className="people-selector__input">
                <input
                    type="number"
                    min={1}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="输入人数"
                />
            </div>
        </div>
    );
};

export default PeopleSelector;