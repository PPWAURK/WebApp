import React, { useEffect, useState } from 'react';
import './QueueDisplay.css';

interface QueueEntry {
    id: string;
    people: number;
    special: string;
    timestamp: number;
}

interface QueueDisplayProps {
    queue: QueueEntry[];
    totalPeople: number;
    firstTimestamp: number | null;
    onRemove: (id: string) => void;
    onClear: () => void;
}

const humanDate = (ms: number) => new Date(ms).toLocaleString('zh-CN');

// Fonction pour convertir la clé spéciale en texte chinois
const getSpecialChineseText = (special: string): string => {
    const specialMap: Record<string, string> = {
        'none': '无特殊',
        'disabled': '残障人士',
        'elder': '老人',
        'pregnant': '孕妇',
        'child': '小孩',
        'stroller': '婴儿车'
    };
    return specialMap[special] || special;
};

// 计算单个客户的排队时长
const getCustomerElapsedTime = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    const sec = Math.floor(elapsed / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) return `${h}小时 ${m}分钟 ${s}秒`;
    if (m > 0) return `${m}分钟 ${s}秒`;
    return `${s}秒`;
};

// 计算整个队列的总时长（保留原有功能）
const getTotalElapsedTime = (since: number | null) => {
    if (!since) return '—';
    const elapsed = Date.now() - since;
    const sec = Math.floor(elapsed / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) return `${h}小时 ${m}分钟 ${s}秒`;
    if (m > 0) return `${m}分钟 ${s}秒`;
    return `${s}秒`;
};

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue, totalPeople, firstTimestamp, onRemove, onClear }) => {
    const [, tick] = useState(0);

    // 每秒更新一次时间显示
    useEffect(() => {
        const id = setInterval(() => tick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="queue-display">
            <h3 className="queue-display__title">⏳ 排队中</h3>

            <div className="queue-display__info">
                <div className="queue-display__total">
                    <div className="queue-display__label">👤 当前排队人数（人头计）：</div>
                    <div className="queue-display__number">{totalPeople}</div>
                </div>

                <div className="queue-display__time">
                    <div className="queue-display__label">开始排队时间：</div>
                    <div className="queue-display__value">
                        {firstTimestamp ? humanDate(firstTimestamp) : '尚未开始'}
                    </div>
                    <div className="queue-display__elapsed">
                        ⏰ 队列总时长：{getTotalElapsedTime(firstTimestamp)}
                    </div>
                </div>
            </div>

            <div className="queue-display__list">
                {queue.length === 0 && (
                    <div className="queue-display__empty">⏳ 排队中</div>
                )}

                {queue.map((entry, index) => (
                    <div key={entry.id} className="queue-display__item">
                        <div className="queue-display__item-header">
                            <span className="queue-display__position">#{index + 1}</span>
                            <span className="queue-display__people">{entry.people} 人</span>
                            <span className="queue-display__special">
                                • {getSpecialChineseText(entry.special)}
                            </span>
                        </div>

                        <div className="queue-display__item-details">
                            <div className="queue-display__timestamp">
                                ⏱️ 加入时间：{humanDate(entry.timestamp)}
                            </div>
                            <div className="queue-display__customer-time">
                                 已排队：{getCustomerElapsedTime(entry.timestamp)}
                            </div>
                        </div>

                        <button
                            className="queue-display__remove"
                            onClick={() => onRemove(entry.id)}
                        >
                            👍 已入座
                        </button>
                    </div>
                ))}
            </div>

            <div className="queue-display__actions">
                <button className="queue-display__clear" onClick={onClear}>
                    🗑️ 清空队列
                </button>
            </div>
        </div>
    );
};

export default QueueDisplay;