import React, { useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    LabelList,
} from "recharts";
import MonthSelector from "../components/MonthSelector";
import "./WorkHours.css";
import Header from "../components/Header.tsx";

type WorkHourEntry = {
    id: number;
    employee_id: number;
    work_date: string;
    hours_worked: number;
    notes?: string;
    employee_name?: string;
    base_type?: string;
};

type Employee = {
    id: number;
    name: string;
    level: number;
    max_hours_per_day: number;
    max_hours_per_week: number;
    base_type: string;
};

const API_BASE = "https://api.zhaoplatforme.com/api";

export default function WorkHours() {
    const [entries, setEntries] = useState<WorkHourEntry[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

    // form state
    const [date, setDate] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    });
    const [hoursInput, setHoursInput] = useState<number>(8);
    const [minutesInput, setMinutesInput] = useState<number>(0);
    const [note, setNote] = useState<string>("");

    // month selector
    const [month, setMonth] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().slice(0, 7);
    });

    // 获取所有员工
    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/employees`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("Erreur lors du chargement des employés");

            const data = await response.json();
            console.log("👥 获取到的员工数据:", data);
            setEmployees(data);

            // 设置第一个员工为默认选择
            if (data.length > 0) {
                setSelectedEmployee(data[0].id);
                console.log("✅ 设置默认员工:", data[0].id, data[0].name);
            }
        } catch (error) {
            console.error("❌ Erreur chargement employés:", error);
            alert("加载员工列表失败");
        }
    };

    // 获取工作时间数据
    const fetchWorkHours = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/work-hours/month/${month}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("Erreur lors du chargement");

            const data = await response.json();
            console.log("📊 获取到的工作时间数据:", data);
            setEntries(data);
        } catch (error) {
            console.error("❌ Erreur chargement heures:", error);
            alert("加载工作时间失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (employees.length > 0 && selectedEmployee) {
            fetchWorkHours();
        }
    }, [month, employees, selectedEmployee]);

    // Add or update via API
    const handleAddOrUpdate = async () => {
        if (!selectedEmployee) {
            alert("请先选择员工");
            return;
        }

        const totalHours = Number(hoursInput) + Number(minutesInput) / 60;
        if (!date) {
            alert("请选择日期");
            return;
        }

        console.log("🔄 准备保存数据:", {
            employee_id: selectedEmployee,
            work_date: date,
            hours_worked: totalHours,
            notes: note
        });

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/work-hours`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    employee_id: selectedEmployee,
                    work_date: date,
                    hours_worked: Number(totalHours.toFixed(2)),
                    notes: note
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "保存失败");
            }

            alert(result.message);
            console.log("✅ 保存成功:", result);

            // 重新加载数据
            fetchWorkHours();

            // 重置表单
            setDate(new Date().toISOString().slice(0, 10));
            setHoursInput(8);
            setMinutesInput(0);
            setNote("");

        } catch (error) {
            console.error("❌ 保存工作时间失败:", error);

        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除这条记录吗？")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/work-hours/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Erreur suppression");

            const result = await response.json();
            alert(result.message);

            fetchWorkHours();

        } catch (error) {
            console.error("❌ Erreur suppression heures:", error);
            alert("删除工作时间失败");
        }
    };

    const handleEdit = (e: WorkHourEntry) => {
        setDate(e.work_date);
        const whole = Math.floor(e.hours_worked);
        const minutes = Math.round((e.hours_worked - whole) * 60);
        setHoursInput(whole);
        setMinutesInput(minutes);
        setNote(e.notes ?? "");
        setSelectedEmployee(e.employee_id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Filter entries for selected employee and month
    const employeeMonthEntries = useMemo(() => {
        if (!selectedEmployee) return [];
        return entries
            .filter((e) => e.employee_id === selectedEmployee)
            .sort((a, b) => a.work_date.localeCompare(b.work_date));
    }, [entries, selectedEmployee]);

    // Stats for selected employee
    const totalDays = employeeMonthEntries.length;
    const totalHours = employeeMonthEntries.reduce((s, e) => s + e.hours_worked, 0);

    // Build histogram data
    const histogramData = useMemo(() => {
        if (!selectedEmployee) return [];

        const [y, m] = month.split("-").map((x) => Number(x));
        if (!y || !m) return [];

        const daysInMonth = new Date(y, m, 0).getDate();
        const map = new Map<string, number>();

        for (let d = 1; d <= daysInMonth; d++) {
            const dd = String(d).padStart(2, "0");
            const iso = `${month}-${dd}`;
            map.set(iso, 0);
        }

        for (const e of employeeMonthEntries) {
            const currentHours = map.get(e.work_date) || 0;
            map.set(e.work_date, currentHours + e.hours_worked);
        }

        const arr = Array.from(map.entries()).map(([dateStr, h]) => {
            // 确保 h 是数字
            const hoursValue = typeof h === 'number' ? h : Number(h) || 0;
            return {
                date: dateStr,
                day: dateStr.slice(-2),
                hours: Number(hoursValue.toFixed(2)),
            };
        });

        console.log("📊 图表数据:", arr);
        return arr;
    }, [month, employeeMonthEntries, selectedEmployee]);

    // Clear month for selected employee
    const clearMonth = async () => {
        if (!confirm("确定要清空本月的所有工时记录吗？此操作不可撤销。")) return;

        try {
            const deletePromises = employeeMonthEntries.map(entry =>
                fetch(`${API_BASE}/work-hours/${entry.id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                })
            );

            await Promise.all(deletePromises);
            alert("本月记录已清空");
            fetchWorkHours();

        } catch (error) {
            console.error("❌ Erreur suppression mois:", error);
            alert("清空记录失败");
        }
    };

    // Export CSV
    const exportCSV = () => {
        const selectedEmployeeName = employees.find(emp => emp.id === selectedEmployee)?.name || `员工 ${selectedEmployee}`;

        const rows = [["日期", "工时(小时)", "备注", "员工"]];
        const rowsThis = employeeMonthEntries.map((e) => [
            e.work_date,
            String(e.hours_worked),
            e.notes ?? "",
            selectedEmployeeName
        ]);

        const csvContent = [...rows, ...rowsThis]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workhours_${month}_${selectedEmployeeName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 获取当前选中的员工名称
    const selectedEmployeeName = selectedEmployee
        ? employees.find(emp => emp.id === selectedEmployee)?.name
        : '请选择员工';

    return (
        <div>
            <Header/>
            <div className="workhours-root">
                <h2>工时登记与月统计</h2>

                <section className="workhours-form">
                    {/* 选择员工 */}
                    <label>
                        选择员工
                        <select
                            value={selectedEmployee || ""}
                            onChange={(e) => {
                                const newEmployeeId = e.target.value ? Number(e.target.value) : null;
                                setSelectedEmployee(newEmployeeId);
                                console.log("👤 切换员工:", newEmployeeId);
                            }}
                        >
                            <option value="">请选择员工</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.base_type})
                                </option>
                            ))}
                        </select>
                    </label>

                    {selectedEmployee && (
                        <div style={{
                            background: '#f8f9fa',
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '15px',
                            border: '1px solid #E4AFB0'
                        }}>
                            <strong>当前选中的员工:</strong> {selectedEmployeeName}
                        </div>
                    )}

                    <label>
                        选择日期
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>

                    <div className="workhours-row">
                        <label>
                            小时（整小时）
                            <input
                                type="number"
                                min={0}
                                value={hoursInput}
                                onChange={(e) => setHoursInput(Math.max(0, Number(e.target.value)))}
                            />
                        </label>
                        <label>
                            分钟
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={minutesInput}
                                onChange={(e) => {
                                    let v = Number(e.target.value);
                                    if (isNaN(v)) v = 0;
                                    if (v < 0) v = 0;
                                    if (v > 59) v = 59;
                                    setMinutesInput(Math.floor(v));
                                }}
                            />
                        </label>
                    </div>

                    <label>
                        备注（可选）
                        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：加班、请假..." />
                    </label>

                    <div className="workhours-actions">
                        <button onClick={handleAddOrUpdate} disabled={loading || !selectedEmployee}>
                            {loading ? "处理中..." : "添加/更新记录"}
                        </button>
                        <button onClick={() => {
                            setDate(new Date().toISOString().slice(0, 10));
                            setHoursInput(8);
                            setMinutesInput(0);
                            setNote("");
                        }}>
                            重置表单
                        </button>
                    </div>
                </section>

                {selectedEmployee ? (
                    <>
                        <section className="workhours-controls">
                            <MonthSelector value={month} onChange={setMonth} />

                            <div className="workhours-stats">
                                <div>总工作天数：<strong>{totalDays}</strong></div>
                                <div>总工时（小时）：<strong>{totalHours.toFixed(2)}</strong></div>
                                <div>平均每天工时：<strong>{totalDays ? (totalHours / totalDays).toFixed(2) : "0.00"}</strong></div>
                            </div>

                            <div className="workhours-exports">
                                <button onClick={exportCSV} disabled={employeeMonthEntries.length === 0}>
                                    导出 CSV
                                </button>
                                <button onClick={clearMonth} disabled={employeeMonthEntries.length === 0}>
                                    清空本月记录
                                </button>
                            </div>
                        </section>

                        <section className="workhours-chart">
                            <h3>{month} — 每日工时分布 ({selectedEmployeeName})</h3>
                            <div className="workhours-chart-container">
                                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                    <BarChart
                                        data={histogramData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: any) => [`${value} 小时`, "工时"]}
                                            labelFormatter={(label) => `日期: ${month}-${label}`}
                                        />
                                        <Bar
                                            dataKey="hours"
                                            name="工时（小时）"
                                            fill="#AB1E24"
                                            radius={[6, 6, 0, 0]}
                                        >
                                            <LabelList
                                                dataKey="hours"
                                                position="top"
                                                formatter={(value: any) => {
                                                    if (value === undefined || value === null) return "";
                                                    const num = Number(value);
                                                    return isNaN(num) ? "" : num.toFixed(1);
                                                }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="workhours-list">
                            <h3>本月记录 ({selectedEmployeeName})</h3>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: "20px" }}>加载中...</div>
                            ) : (
                                <table>
                                    <thead>
                                    <tr>
                                        <th>日期</th>
                                        <th>工时（小时）</th>
                                        <th>备注</th>
                                        <th>操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {employeeMonthEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center" }}>本月暂无记录</td>
                                        </tr>
                                    )}
                                    {employeeMonthEntries.map((e) => (
                                        <tr key={e.id}>
                                            <td>{e.work_date}</td>
                                            <td>{e.hours_worked.toFixed(2)}</td>
                                            <td>{e.notes}</td>
                                            <td className="actions">
                                                <button onClick={() => handleEdit(e)}>编辑</button>
                                                <button onClick={() => handleDelete(e.id)}>删除</button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </>
                ) : (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#f8f9fa",
                        borderRadius: "10px",
                        marginTop: "20px"
                    }}>
                        <h3>请先选择员工</h3>
                        <p>从上方下拉菜单中选择一个员工来查看和记录工作时间</p>
                    </div>
                )}
            </div>
        </div>
    );
}