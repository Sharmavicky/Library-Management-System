import { useNavigate } from "react-router-dom";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { num: "12k+", label: "Books managed" },
  { num: "3.2k", label: "Active members" },
  { num: "98%",  label: "Return rate" },
  { num: "500+", label: "Libraries trust us" },
];

const features = [
    {
        title: "Smart catalogue",
        desc: "Organise 1,200+ books with search, filters, and instant availability status across your entire collection.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        ),
    },
    {
        title: "Member management",
        desc: "Track every member's borrow history, active loans, and outstanding fines from a single profile view.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        ),
    },
    {
        title: "Overdue alerts",
        desc: "Automatically notify members when books are due or overdue, cutting late returns dramatically.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
        ),
    },
    {
        title: "Fine collection",
        desc: "Calculate, track, and record fine payments with a full audit trail and pending balance overview.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        ),
    },
    {
        title: "Issuance analytics",
        desc: "Visual charts of daily issuances, return trends, and popular titles to make data-driven decisions.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        ),
    },
    {
        title: "Role-based access",
        desc: "Separate member and admin portals so staff get full control while members only see what's relevant to them.",
        icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        ),
    },
];

const recentIssuances = [
    { initials: "RS", bg: "bg-teal-100",   text: "text-teal-700",   name: "Riya S.",  overdue: false },
    { initials: "AM", bg: "bg-purple-100", text: "text-purple-700", name: "Arjun M.", overdue: true  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 font-sans">

            {/* ── Navbar ── */}
            <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-indigo-100">
                <span className="text-xl font-bold text-indigo-600">LibraryOS</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/login")} // route to login page
                        className="px-5 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-50 transition"
                    >
                        Sign in
                    </button>
                    <button
                        onClick={() => navigate("/register")} // route to regiter page to create an account
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition"
                    >
                        Get started
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="flex items-center justify-between px-12 py-20 gap-12 bg-white">
                {/* Left */}
                <div className="flex-1 max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        Now with smart overdue alerts
                    </div>
                    <h1 className="text-5xl font-extrabold leading-tight text-indigo-950 mb-5">
                        Your library,{" "}
                        <span className="text-indigo-600">managed smarter</span>
                    </h1>
                    <p className="text-base text-gray-500 leading-relaxed mb-8">
                        LibraryOS brings your entire collection, members, and fine management
                        into one clean dashboard — built for librarians who want clarity, not complexity.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate("/register")} // route to register page
                            className="px-7 py-3 bg-indigo-600 text-white rounded-xl text-base font-bold cursor-pointer hover:bg-indigo-700 active:scale-[0.98] transition"
                        >
                            Create free account
                        </button>
                        <button
                            onClick={() => navigate("/login")} // route to login page
                            className="px-7 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl text-base font-bold cursor-pointer hover:bg-indigo-50 active:scale-[0.98] transition"
                        >
                            Sign in →
                        </button>
                    </div>
                </div>

                {/* Right — Dashboard preview cards */}
                <div className="shrink-0 w-80 flex flex-col gap-3">
                    {/* Total books card */}
                    <div className="bg-indigo-600 rounded-2xl p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300 mb-1">Total books</p>
                        <p className="text-3xl font-extrabold text-white">1,240</p>
                        <p className="text-xs text-indigo-300 mt-1">+18 added this month</p>
                        {/* Mini bar chart */}
                        <div className="flex items-end gap-1 h-10 mt-4">
                            {[60, 75, 55, 90, 70, 100, 80].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-t-sm"
                                    style={{
                                        height: `${h}%`,
                                        background: h === 100 ? "#fff" : "rgba(255,255,255,0.25)",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Mini stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                        { num: "87",    color: "text-indigo-600", label: "Issued"  },
                        { num: "12",    color: "text-red-500",    label: "Overdue" },
                        { num: "₹4.3k", color: "text-green-600",  label: "Fines"   },
                        ].map((s) => (
                            <div key={s.label} className="bg-indigo-50 rounded-xl p-3">
                                <p className={`text-lg font-extrabold ${s.color}`}>{s.num}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent issuances mini card */}
                    <div className="bg-white border border-indigo-100 rounded-2xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                            Recent issuances
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {recentIssuances.map((r) => (
                                <div key={r.initials} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full ${r.bg} ${r.text} text-[10px] font-bold flex items-center justify-center`}>
                                            {r.initials}
                                        </div>
                                        <span className="text-gray-700 font-medium">{r.name}</span>
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                        {r.overdue ? "Overdue" : "Issued"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats strip ── */}
            <div className="grid grid-cols-4 divide-x divide-indigo-100 border-y border-indigo-100 bg-white">
                {stats.map((s) => (
                    <div key={s.label} className="py-7 text-center">
                        <p className="text-3xl font-extrabold text-indigo-600">{s.num}</p>
                        <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Features ── */}
            <section className="px-12 py-16 bg-indigo-50">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Features</p>
                <h2 className="text-3xl font-extrabold text-indigo-950 mb-2">Everything you need to run a library</h2>
                <p className="text-sm text-gray-500 mb-10 max-w-lg leading-relaxed">
                    From cataloguing to fine collection, LibraryOS handles the full lifecycle of your library operations.
                </p>
                <div className="grid grid-cols-3 gap-5">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white border border-indigo-100 rounded-2xl p-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                {f.icon}
                            </div>
                            <h3 className="text-sm font-bold text-indigo-950 mb-1.5">{f.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="flex items-center justify-between px-12 py-14 bg-indigo-600 gap-10">
                <div>
                    <h2 className="text-2xl font-extrabold text-white max-w-md leading-snug">
                        Ready to modernise your library?
                    </h2>
                    <p className="text-sm text-indigo-300 mt-2">
                        Join hundreds of libraries already using LibraryOS to manage their collections.
                    </p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={() => navigate("/register")} // route to register page
                        className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-50 transition"
                    >
                        Create free account
                    </button>
                    <button
                        onClick={() => navigate("/login")} // route to login page
                        className="px-6 py-3 border border-white/50 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-white/10 transition"
                    >
                        Sign in
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="flex items-center justify-between px-12 py-5 bg-white border-t border-indigo-100">
                <span className="text-base font-bold text-indigo-600">LibraryOS</span>
                <span className="text-xs text-gray-400">© 2026 LibraryOS. Built for librarians.</span>
            </footer>

        </div>
    );
}