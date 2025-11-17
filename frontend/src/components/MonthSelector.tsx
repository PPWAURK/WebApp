// components/MonthSelector.tsx
import React, { useState, useEffect } from 'react';
import './MonthSelector.css';

interface MonthSelectorProps {
    value: string; // YYYY-MM format
    onChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

    const months = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    const selectedDate = new Date(value + '-01');
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    // 当 value 改变时，更新当前年份
    useEffect(() => {
        setCurrentYear(selectedYear);
    }, [selectedYear]);

    const handleMonthSelect = (monthIndex: number) => {
        const newMonth = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
        onChange(newMonth);
        setIsOpen(false);
    };

    const navigateYear = (direction: 'prev' | 'next') => {
        setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
    };

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.month-selector-custom')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="month-selector">
            <label>选择月份查看统计</label>
            <div className="month-selector-custom">
                <div
                    className={`month-selector-display ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{selectedYear}年 {months[selectedMonth]}</span>
                    <span className={`month-selector-arrow ${isOpen ? 'open' : ''}`}>▼</span>
                </div>

                {isOpen && (
                    <div className="month-selector-dropdown">
                        <div className="month-selector-header">
                            <button
                                className="month-selector-nav"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateYear('prev');
                                }}
                                type="button"
                            >
                                ◀
                            </button>
                            <span className="month-selector-year">{currentYear}年</span>
                            <button
                                className="month-selector-nav"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateYear('next');
                                }}
                                type="button"
                            >
                                ▶
                            </button>
                        </div>
                        <div className="month-selector-grid">
                            {months.map((month, index) => (
                                <button
                                    key={month}
                                    className={`month-selector-item ${
                                        currentYear === selectedYear && index === selectedMonth ? 'selected' : ''
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMonthSelect(index);
                                    }}
                                    type="button"
                                >
                                    {month}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthSelector;