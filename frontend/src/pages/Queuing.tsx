// queuing.tsx
import React, { useEffect, useMemo, useState } from 'react';
import PeopleSelector from '../components/queueComponents/PeopleSelector';
import SpecialOption from '../components/queueComponents/SpecialOption';
import QueueDisplay from '../components/queueComponents/QueueDisplay';
import Header from "../components/Header.tsx";
import './Queuing.css';

/* =====================
   Types
   ===================== */
type SpecialGroup = 'none' | 'disabled' | 'elder' | 'pregnant' | 'child' | 'stroller';

type QueueEntry = {
    id: string;
    people: number;
    special: SpecialGroup;
    timestamp: number;
};

/* =====================
   Queue Service Hook
   ===================== */
const STORAGE_KEY = 'queue_app_v1';

function useQueueService() {
    const [queue, setQueue] = useState<QueueEntry[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
        } catch { return []; }
    });

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); }
        catch {
            // ignore errors intentionally
        }
    }, [queue]);

    const add = (people: number, special: SpecialGroup) => {
        const entry: QueueEntry = { id: Math.random().toString(36).slice(2, 9), people, special, timestamp: Date.now() };
        setQueue(q => [...q, entry]);
        return entry;
    };

    const remove = (id: string) => setQueue(q => q.filter(e => e.id !== id));
    const clear = () => setQueue([]);
    const totalPeople = useMemo(() => queue.reduce((s, e) => s + e.people, 0), [queue]);
    const firstTimestamp = queue.length > 0 ? queue[0].timestamp : null;

    return { queue, add, remove, clear, totalPeople, firstTimestamp };
}

/* =====================
   Main Queuing App
   ===================== */
const QueuingApp: React.FC = () => {
    console.log('🎯 QueuingApp component is rendering!');

    const { queue, add, remove, clear, totalPeople, firstTimestamp } = useQueueService();
    const [people, setPeople] = useState<number>(1);
    const [special, setSpecial] = useState<SpecialGroup>('none');

    const handleJoin = () => {
        add(people, special);
        setSpecial('none');
    };

    return (
        <div>
            <Header/>
        <div className="queuing-app">
            <div className="queuing-app__controls">
                <PeopleSelector value={people} onChange={setPeople} />
                <SpecialOption value={special} onChange={setSpecial} />
                <div className="queuing-app__actions">
                    <button className="queuing-app__join" onClick={handleJoin}> ✅ 加入排队</button>
                    <button className="queuing-app__reset" onClick={() => { setPeople(1); setSpecial('none'); }}> 🔄 重置选择</button>
                </div>
            </div>
            <QueueDisplay
                queue={queue}
                totalPeople={totalPeople}
                firstTimestamp={firstTimestamp}
                onRemove={remove}
                onClear={clear}
            />
        </div>
    </div>
    );
};

export default QueuingApp;
