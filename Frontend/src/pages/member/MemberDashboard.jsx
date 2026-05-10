import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import NavSideBar              from "../../Components/NavSideBar";
import { getMyIssues, getAllBooks, getMyProfile } from "../../services/memberService";
import {
    FiGrid,
    FiSearch,
    FiClock,
    FiAlertCircle,
    FiUser
} from "react-icons/fi";

// ── small reusable components 

// stat card at the top
const StatCard = ({ label, value, sub, color }) => (
    <div className={`bg-white rounded-xl border-l-4 ${color}
                     border border-gray-100 p-5 flex-1`}>
        <p className="text-[11px] font-bold uppercase tracking-widest
                      text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
);

// colored initials avatar for books without cover
const BookAvatar = ({ title = "", coverImage, color = "bg-indigo-500" }) => {
    const initials = title.split(" ").slice(0, 2)
        .map(w => w[0]).join("").toUpperCase();
    return (
        <div className="w-12 h-14 rounded-lg overflow-hidden shrink-0">
            {coverImage ? (
                <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div
                    className={`${color} w-full h-full flex items-center justify-center text-white font-bold text-sm`}
                >
                    {initials}
                </div>
            )}
        </div>
    );
};

// progress bar for due date
const DueDateBar = ({ dueDate }) => {
    const now      = new Date();
    const due      = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const pct      = Math.max(0, Math.min(100, (daysLeft / 14) * 100));
    const color    = daysLeft <= 3  ? "bg-orange-400"
                   : daysLeft <= 7  ? "bg-yellow-400"
                   :                  "bg-green-400";
    return (
        <div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className={`${color} h-1.5 rounded-full`}
                     style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
                Due {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" · "}
                <span className={daysLeft <= 3 ? "text-orange-500 font-semibold" : ""}>
                    {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                </span>
            </p>
        </div>
    );
};

// avatar colors for books
const BOOK_COLORS = [
    "bg-indigo-500", "bg-green-500", "bg-orange-500",
    "bg-purple-500", "bg-pink-500",  "bg-teal-500",
    "bg-red-500",    "bg-blue-500",
];

// ── main component
export default function MemberDashboard() {
    const navigate = useNavigate();

    const [user,         setUser]         = useState(null);
    const [issues,       setIssues]       = useState([]);
    const [books,        setBooks]        = useState([]);
    const [search,       setSearch]       = useState("");
    const [loadingPage,  setLoadingPage]  = useState(true);
    const [loadingBooks, setLoadingBooks] = useState(false);

    // load dashboard data on mount
    useEffect(() => {
        const load = async () => {
            try {
                const [profileRes, issuesRes, booksRes] = await Promise.all([
                    getMyProfile(),
                    getMyIssues(),
                    getAllBooks(1, 10)
                ]);
                setUser(profileRes.member);
                setIssues(issuesRes.issues  || []);
                setBooks(booksRes.books     || []);
            } catch (err) {
                // token invalid — send to login
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                }
            } finally {
                setLoadingPage(false);
            }
        };

        load();
    }, [navigate]);

    // search books
    useEffect(() => {
        const searchBooks = async () => {
            setLoadingBooks(true);
            try {
                const res = await getAllBooks(1, 10, search);
                setBooks(res.books || []);
            } catch {
                setBooks([]);
            }
            finally { setLoadingBooks(false); }
        };

        // debounce — wait 400ms after user stops typing
        const timer = setTimeout(searchBooks, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // nav items with live fine badge
    const fine     = user?.fine || 0;
    const navItems = [
        { label: "My books",       path: "/dashboard",         icon: FiGrid },
        { label: "Browse catalog", path: "/dashboard/catalog", icon: FiSearch },
        { label: "My history",     path: "/dashboard/history", icon: FiClock },
        { label: "My fines",       path: "/dashboard/fines",   icon: FiAlertCircle, badge: fine },
        { label: "Profile",        path: "/dashboard/profile", icon: FiUser },
    ];

    // stats
    const activeIssues  = issues.filter(i => i.status === "active");
    const returnedBooks = issues.filter(i => i.status === "returned");
    const overdueIssues = issues.filter(i => i.status === "overdue");

    if (loadingPage) {
        return (
            <div className="flex w-screen h-screen items-center justify-center bg-gray-50">
                <p className="text-gray-400 text-sm animate-pulse">Loading your library...</p>
            </div>
        );
    }

    return (
        <div className="flex w-screen min-h-screen bg-indigo-100 overflow-hidden">

            {/* ── Sidebar */}
            <NavSideBar
                navHeading="MY LIBRARY"
                navItems={navItems}
                user={user}
            />

            {/* ── Main content  */}
            <main className="flex-1 flex flex-col p-8 overflow-hidden h-screen">

                {/* page title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My books</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        You have {activeIssues.length + overdueIssues.length} book
                        {activeIssues.length + overdueIssues.length !== 1 ? "s" : ""} currently borrowed
                    </p>
                </div>

                {/* ── Stat cards */}
                <div className="flex gap-4 mb-8">
                    <StatCard
                        label="Currently Borrowed"
                        value={activeIssues.length + overdueIssues.length}
                        sub={activeIssues.length > 0
                            ? "Due in 14 days avg."
                            : "No active borrows"}
                        color="border-green-400"
                    />
                    <StatCard
                        label="Total Read"
                        value={returnedBooks.length}
                        sub="All time"
                        color="border-blue-400"
                    />
                    <StatCard
                        label="Outstanding Fines"
                        value={`₹${fine}`}
                        sub={fine === 0 ? "All clear!" : "Please clear dues"}
                        color={fine > 0 ? "border-red-400" : "border-yellow-400"}
                    />
                </div>

                {/* ── Bottom two columns */}
                <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">

                    {/* Currently borrowed */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-100 p-5 flex flex-col overflow-hidden">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">
                            Currently borrowed
                        </h2>

                        {activeIssues.length + overdueIssues.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                No books currently borrowed
                            </p>
                        ) : (
                            <div className="space-y-4 overflow-y-auto flex-1">
                                {[...activeIssues, ...overdueIssues].map((issue, idx) => (
                                    <div key={issue._id} 
                                        className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                                        onClick={() => navigate(`/read/${issue._id}`)}>
                                        <BookAvatar
                                            title={issue.book?.title || ""}
                                            coverImage={issue.book.coverImage}
                                            color={BOOK_COLORS[idx % BOOK_COLORS.length]}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {issue.book?.title}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2
                                                                  py-0.5 rounded-full shrink-0
                                                                  ${issue.status === "overdue"
                                                                    ? "bg-red-100 text-red-600"
                                                                    : "bg-green-100 text-green-700"
                                                                  }`}>
                                                    {issue.status === "overdue" ? "Overdue" : "Issued"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {issue.book?.author}
                                            </p>
                                            <DueDateBar dueDate={issue.dueDate} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Browse catalog */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-100 p-5 flex flex-col overflow-hidden">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">
                            Browse catalog
                        </h2>

                        {/* search */}
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"><FiSearch /></span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search books, authors..."
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg
                                           bg-gray-50 border border-gray-200
                                           outline-none focus:border-indigo-300
                                           focus:ring-2 focus:ring-indigo-50"
                            />
                        </div>

                        {/* book list */}
                        {loadingBooks ? (
                            <p className="text-sm text-gray-400 text-center py-4 animate-pulse">
                                Searching...
                            </p>
                        ) : books.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                                No books found
                            </p>
                        ) : (
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {books.map((book, idx) => (
                                    <div key={book._id}
                                        className="flex items-center justify-between
                                                    gap-3 p-2 rounded-lg hover:bg-indigo-100
                                                    transition cursor-pointer"
                                         onClick={() => navigate(`/books/${book._id}`)}>
                                        <div className="flex items-center gap-3">
                                            <BookAvatar
                                                title={book.title}
                                                coverImage={book.coverImage}
                                                color={BOOK_COLORS[idx % BOOK_COLORS.length]}
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                                    {book.title}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {book.author}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-semibold
                                                          px-2 py-0.5 rounded-full shrink-0
                                                          ${book.availableCopies > 0
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-500"
                                                          }`}>
                                            {book.availableCopies > 0
                                                ? `${book.availableCopies} avail`
                                                : "0 avail"
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}