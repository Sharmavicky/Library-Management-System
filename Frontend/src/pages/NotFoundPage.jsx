import { useNavigate } from "react-router-dom";

const books = [
    { w: "w-[18px]", h: "h-[52px]", bg: "bg-indigo-400", rotate: "" },
    { w: "w-[14px]", h: "h-[38px]", bg: "bg-indigo-300", rotate: "" },
    { w: "w-[20px]", h: "h-[60px]", bg: "bg-indigo-500", rotate: "" },
    { w: "w-[12px]", h: "h-[44px]", bg: "bg-indigo-200", rotate: "-rotate-[15deg] origin-bottom-left" },
    { w: "w-[16px]", h: "h-[30px]", bg: "bg-indigo-100", rotate: "" },
    { w: "w-[18px]", h: "h-[50px]", bg: "bg-indigo-700", rotate: "" },
];

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 py-12">

            {/* Bookshelf illustration */}
            <div className="flex items-end justify-center gap-1 w-40 mb-1">
                {books.map((book, i) => (
                    <div
                        key={i}
                        className={`rounded-t-sm ${book.w} ${book.h} ${book.bg} ${book.rotate}`}
                    />
                ))}
            </div>
            <div className="w-40 h-1 bg-indigo-600 rounded-full" />

            {/* 404 */}
            <h1 className="text-[96px] font-bold leading-none tracking-tighter text-indigo-50 mt-6 select-none">
                4<span className="text-indigo-600">0</span>4
            </h1>

            {/* Message */}
            <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">
                Page not found
            </h2>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-8">
                Looks like this page has gone missing from our shelves. It may have been
                moved, deleted, or never existed.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
                >
                    ← Go back
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 text-sm font-semibold active:scale-[0.98] transition cursor-pointer hover:bg-indigo-600 hover:text-white"
                >
                    Go home
                </button>
            </div>
        </div>
    );
}