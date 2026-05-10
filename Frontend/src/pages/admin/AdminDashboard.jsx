import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// ─── Data 

const statCards = [
  {
    label: "Total books",
    value: "1,240",
    sub: "+18 this month",
    subColor: "text-green-600",
    accent: "border-l-indigo-500",
    iconBg: "bg-indigo-50",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Currently issued",
    value: "87",
    sub: "+5 today",
    subColor: "text-green-600",
    accent: "border-l-green-500",
    iconBg: "bg-green-50",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    label: "Overdue",
    value: "12",
    sub: "+3 since yesterday",
    subColor: "text-amber-600",
    accent: "border-l-amber-500",
    iconBg: "bg-amber-50",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    label: "Fine revenue",
    value: "₹4,320",
    sub: "₹360 pending",
    subColor: "text-gray-400",
    accent: "border-l-red-500",
    iconBg: "bg-red-50",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
];

const issuances = [
  { initials: "RS", bg: "bg-teal-100", text: "text-teal-700", name: "Riya S.", book: "Atomic Habits", due: "Apr 20", overdue: false },
  { initials: "AM", bg: "bg-purple-100", text: "text-purple-700", name: "Arjun M.", book: "Clean Code", due: "Mar 5!", overdue: true },
  { initials: "PK", bg: "bg-blue-100", text: "text-blue-700", name: "Priya K.", book: "Deep Work", due: "Apr 25", overdue: false },
  { initials: "VR", bg: "bg-teal-100", text: "text-teal-700", name: "Vivek R.", book: "The Alchemist", due: "Mar 28!", overdue: true },
  { initials: "NS", bg: "bg-purple-100", text: "text-purple-700", name: "Neha S.", book: "Zero to One", due: "Apr 30", overdue: false },
];

const dailyData = [3,5,8,6,9,4,7,5,6,8,10,7,5,9,6,4,8,7,9,5,6,8,4,7,6,3];

const chartData = {
  labels: Array.from({ length: 26 }, (_, i) => `Apr ${i + 1}`),
  datasets: [
    {
      data: dailyData,
      backgroundColor: dailyData.map((v) => (v >= 9 ? "#6366f1" : "#c7d2fe")),
      borderRadius: 3,
      borderSkipped: false,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} issuances` } },
  },
  scales: {
    x: {
      ticks: { maxTicksLimit: 6, font: { size: 11 }, color: "#9ca3af", autoSkip: true },
      grid: { display: false },
      border: { display: false },
    },
    y: { display: false, grid: { display: false } },
  },
};

// ─── Component 

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-5 flex flex-col gap-4 font-sans">

      {/* Alert banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
        <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-400 text-red-500 font-bold text-[10px] shrink-0">!</span>
        <span>12 books are overdue — users have been notified.</span>
        <a href="/admin/overdue" className="ml-1 text-indigo-600 font-semibold hover:underline">View all</a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white border border-gray-200 border-l-4 ${card.accent} rounded-xl p-4 flex items-start justify-between`}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                {card.label}
              </p>
              <p className="text-[28px] font-bold leading-none text-gray-900">{card.value}</p>
              <p className={`text-xs mt-1.5 ${card.subColor}`}>{card.sub}</p>
            </div>
            <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-[1fr_1.5fr] gap-4">

        {/* Recent issuances table */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-gray-900">Recent issuances</h2>
            <button className="text-xs text-indigo-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 hover:bg-indigo-50 transition">
              View all
            </button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["User", "Book", "Due", "Status"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 px-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issuances.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${row.bg} ${row.text} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                        {row.initials}
                      </div>
                      <span className="text-gray-800 font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-gray-600">{row.book}</td>
                  <td className={`py-2.5 px-2 font-medium ${row.overdue ? "text-red-600" : "text-gray-700"}`}>
                    {row.due}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${row.overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.overdue ? "bg-red-500" : "bg-green-500"}`} />
                      {row.overdue ? "Overdue" : "Issued"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issuances chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Issuances this month</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily issuances — April 2026</p>
            </div>
            <span className="text-3xl font-bold text-indigo-500">87</span>
          </div>

          <div className="relative w-full h-40">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-3">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xl font-bold text-indigo-700">1,153</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Total books</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xl font-bold text-green-700">87</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Issued</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3">
              <p className="text-xl font-bold text-rose-600">12</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Overdue</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}