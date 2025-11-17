import React from 'react';
import './SpecialOption.css';

// Définir un type commun pour les groupes spéciaux
type SpecialGroup = 'none' | 'disabled' | 'elder' | 'pregnant' | 'child' | 'stroller';

interface SpecialOptionProps {
    value: SpecialGroup;
    onChange: (v: SpecialGroup) => void;
}

// Fonction pour convertir la clé technique en texte chinois
const getChineseLabel = (key: SpecialGroup): string => {
    const labelMap: Record<SpecialGroup, string> = {
        'none': '😐 无',
        'disabled': '♿ 残障人士',
        'elder': '🧓 老人',
        'pregnant': '🤱 孕妇',
        'child': '👶 小孩',
        'stroller': '🛒 婴儿车'
    };
    return labelMap[key];
};

const SpecialOption: React.FC<SpecialOptionProps> = ({ value, onChange }) => {
    const items: SpecialGroup[] = ['none', 'disabled', 'elder', 'pregnant', 'child', 'stroller'];

    return (
        <div className="special-option">
            <h3 className="special-option__title">🎯 是否有特殊人群</h3>
            <div className="special-option__buttons">
                {items.map(key => (
                    <button
                        key={key}
                        className={`special-option__button ${value === key ? 'special-option__button--active' : ''}`}
                        onClick={() => onChange(key)}
                    >
                        {getChineseLabel(key)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SpecialOption;