import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getReadAccess, fetchBookText } from "../../services/memberService";

// ─── Reading progress bar ─────────────────────────────────────────────────────
function ProgressBar({ progress }) {
    return (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-transparent">
            <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ReaderSkeleton() {
    return (
        <div className="animate-pulse max-w-2xl mx-auto px-6 py-10">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-32 mb-10" />
            {Array(12).fill(0).map((_, i) => (
                <div key={i} className={`h-3 bg-gray-100 rounded mb-3 ${i % 5 === 4 ? "w-2/3" : "w-full"}`} />
            ))}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BookReader() {
    const { issueId } = useParams();
    const navigate    = useNavigate();
    const scrollRef   = useRef(null);

    // UI state
    const [fontSize,   setFontSize]   = useState(17);      // px
    const [darkMode,   setDarkMode]   = useState(false);
    const [fontFamily, setFontFamily] = useState("serif"); // serif | sans
    const [lineHeight, setLineHeight] = useState(1.9);
    const [progress,   setProgress]   = useState(0);
    const [showMenu,   setShowMenu]   = useState(true);
    const [lastScroll, setLastScroll] = useState(0);

    // ── Step 1: get read access + metadata ───────────────────────────────────
    const {
        data:      accessData,
        isLoading: accessLoading,
        isError:   accessError,
        error:     accessErr,
    } = useQuery({
        queryKey: ["read-access", issueId],
        queryFn:  () => getReadAccess(issueId),
        retry:    false, // don't retry — 403 is intentional (overdue/returned)
    });

    // ── Step 2: fetch the actual text once we have the URL ───────────────────
    const {
        data:      bookText,
        isLoading: textLoading,
    } = useQuery({
        queryKey: ["book-text", accessData?.plainTextUrl],
        queryFn:  () => fetchBookText(accessData.plainTextUrl),
        enabled:  !!accessData?.plainTextUrl,
        staleTime: Infinity, // book text never changes — cache forever
    });

    // ── Track scroll for reading progress + auto-hide menu ───────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            const scrolled = el.scrollTop;
            const total    = el.scrollHeight - el.clientHeight;
            setProgress(total > 0 ? (scrolled / total) * 100 : 0);

            // hide toolbar when scrolling down, show when scrolling up
            if (scrolled > lastScroll + 10) setShowMenu(false);
            if (scrolled < lastScroll - 10) setShowMenu(true);
            setLastScroll(scrolled);
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [lastScroll]);

    // Temporary debug — remove after checking
    useEffect(() => {
        if (bookText) {
            console.log("=== RAW BOOK TEXT (first 500 chars) ===");
            console.log(JSON.stringify(bookText.slice(0, 500)));
            console.log("=== LINES (first 20) ===");
            bookText.split("\n").slice(0, 20).forEach((line, i) => {
            console.log(`[${i}] "${line}"`);
            });
        }
    }, [bookText]);

    // ── Theme classes ─────────────────────────────────────────────────────────
    const bg       = darkMode ? "bg-[#1a1a1a]"   : "bg-[#FAFAF8]";
    const surface  = darkMode ? "bg-[#252525]"   : "bg-white";
    const border   = darkMode ? "border-[#333]"  : "border-gray-200";
    const textMain = darkMode ? "text-[#E8E6E0]" : "text-gray-900";
    const textSub  = darkMode ? "text-[#888]"    : "text-gray-400";
    const navBg    = darkMode ? "bg-[#252525]/95" : "bg-white/95";

    // ── Error state (403 = overdue or returned) ───────────────────────────────
    if (accessError) {
        const err  = accessErr?.response?.data;
        const fine = err?.fine;
        const days = err?.daysOverDue;
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 mb-2">
                        {fine ? "Access blocked — book overdue" : "Access denied"}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        {fine
                            ? `This book is ${days} day${days !== 1 ? "s" : ""} overdue. Outstanding fine: ₹${fine}. Please return the book and clear your fine to continue reading.`
                            : err?.message || "You don't have access to this book."}
                    </p>
                    {fine && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700 font-semibold">
                            Fine: ₹{fine}
                        </div>
                    )}
                    <button
                        onClick={() => navigate("/member/dashboard")}
                        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isLoading = accessLoading || textLoading;

    // ── Format book text — detect headings vs paragraphs ──────────────────────
    const HEADING_RE = /^(chapter|part|book|section|prologue|epilogue|introduction|preface|appendix|act\s+\w+)[\s.\-:IVXivx\d]/i;
    const SHORT_ALL_CAPS_RE = /^[A-Z][A-Z\s\d\-:.]{2,50}$/;

    function parseBook(raw) {
        if (!raw) return [];

    // 1. Normalize Windows line endings
    const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Strip Gutenberg header (everything before the actual content starts)
    //    The header ends at the last occurrence of a line like:
    //    *** START OF THE PROJECT GUTENBERG EBOOK ... ***
    const startMatch = text.match(/\*{3}\s*START OF (?:THE )?PROJECT GUTENBERG.*?\*{3}/i);
    const endMatch   = text.match(/\*{3}\s*END OF (?:THE )?PROJECT GUTENBERG.*?\*{3}/i);
    const body = text.slice(
        startMatch ? startMatch.index + startMatch[0].length : 0,
        endMatch   ? endMatch.index : undefined
    );

    // 3. Split into blocks separated by one or more blank lines
    const blocks = body
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter((block) => block.replace(/\s/g, "").length > 0); // remove whitespace-only blocks

    // 4. Classify each block
    const CHAPTER_RE = /^(chapter|part|book|volume|prologue|epilogue|introduction|preface|appendix|act)\b[\s\w.\-:IVXLC]*$/i;
    const SHORT_CAPS_RE = /^[A-Z][A-Z\s\d.\-:]{1,55}$/;

    return blocks.map((block) => {
        // Unwrap soft-wrapped lines into a single line
        const single = block.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

        const isShort = single.length < 65;
        const isChapterHeading = CHAPTER_RE.test(single);
        const isAllCapsHeading = isShort && SHORT_CAPS_RE.test(single);
        const isCentered = isShort && block.split("\n").every((l) => l.startsWith("  ")); // indented lines = centered in .txt

        if (isChapterHeading) return { type: "chapter", text: single };
        if (isAllCapsHeading || isCentered) return { type: "heading", text: single };
        return { type: "para", text: single };
    });
}

const blocks = parseBook(bookText);

    const title   = accessData?.title   || "Reading";
    const dueDate = accessData?.dueDate
        ? new Date(accessData.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : null;
    const daysLeft = accessData?.daysLeft ?? null;

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <ProgressBar progress={progress} />

            {/* ── Top toolbar — auto-hides on scroll down ── */}
            <div className={`fixed top-0 left-0 right-0 z-40 border-b ${border} ${navBg} backdrop-blur-sm transition-all duration-300 ${
                showMenu ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            }`}>
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                    {/* Back button + title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate("/member/dashboard")}
                            className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer ${textSub} hover:text-indigo-600 transition shrink-0`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back
                        </button>
                        <span className={`text-gray-300 shrink-0`}>|</span>
                        <span className={`text-sm font-medium ${textMain} truncate`}>{title}</span>
                    </div>

                    {/* Reading controls */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Due date pill */}
                        {dueDate && (
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                                daysLeft !== null && daysLeft <= 3
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                            }`}>
                                {daysLeft !== null && daysLeft <= 0
                                    ? "Due today"
                                    : `Due ${dueDate}`}
                            </span>
                        )}

                        {/* Font family toggle */}
                        <button
                            onClick={() => setFontFamily((f) => f === "serif" ? "sans" : "serif")}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer ${border} ${textSub} hover:text-indigo-600 transition`}
                            title="Toggle font"
                        >
                            {fontFamily === "serif" ? "Serif" : "Sans"}
                        </button>

                        {/* Font size controls */}
                        <div className={`flex items-center gap-1 border ${border} rounded-lg px-2 py-1`}>
                            <button
                                onClick={() => setFontSize((s) => Math.max(13, s - 1))}
                                className={`text-base cursor-pointer ${textSub} hover:text-indigo-600 transition w-5 text-center leading-none`}
                            >
                                −
                            </button>
                            <span className={`text-[11px] ${textSub} w-6 text-center`}>{fontSize}</span>
                            <button
                                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                                className={`text-base cursor-pointer ${textSub} hover:text-indigo-600 transition w-5 text-center leading-none`}
                            >
                                +
                            </button>
                        </div>

                        {/* Line height toggle */}
                        <button
                            onClick={() => setLineHeight((l) => l === 1.9 ? 1.5 : l === 1.5 ? 2.2 : 1.9)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer ${border} ${textSub} hover:text-indigo-600 transition`}
                            title="Line spacing"
                        >
                            ≡
                        </button>

                        {/* Dark mode toggle */}
                        <button
                            onClick={() => setDarkMode((d) => !d)}
                            className={`w-8 h-8 rounded-lg border cursor-pointer ${border} flex items-center justify-center ${textSub} hover:text-indigo-600 transition`}
                            title="Toggle dark mode"
                        >
                            {darkMode
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Reading area ── */}
            <div
                ref={scrollRef}
                className="h-screen overflow-y-auto pt-16 pb-24 scroll-smooth"
            >
                <div className="max-w-2xl mx-auto px-6 py-10">

                    {isLoading ? (
                        <ReaderSkeleton />
                    ) : (
                        <>
                            {/* Book title header */}
                            <div className="mb-10 pb-6 border-b border-dashed border-gray-200">
                                <h1 className={`text-2xl font-bold ${textMain} mb-1 leading-snug`}
                                    style={{ fontFamily: fontFamily === "serif" ? "Georgia, serif" : "inherit" }}>
                                    {title}
                                </h1>
                                {daysLeft !== null && (
                                    <p className={`text-sm ${textSub}`}>
                                        {daysLeft > 0
                                            ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to read · Due ${dueDate}`
                                            : `Due today — return after reading`}
                                    </p>
                                )}
                            </div>

                            {blocks.length > 0 ? (
                                blocks.map((block, i) => {
                                    if (block.type === "chapter") {
                                        return (
                                            <div key={i} className="mt-14 mb-6 text-center">
                                            <p className={`text-xs uppercase tracking-widest mb-2 ${textSub}`}>
                                                ─────────────────
                                            </p>
                                            <h2
                                                className={`text-xl font-bold ${textMain}`}
                                                style={{ fontFamily: fontFamily === "serif" ? "Georgia, serif" : "inherit" }}
                                            >
                                                {block.text}
                                            </h2>
                                            <p className={`text-xs uppercase tracking-widest mt-2 ${textSub}`}>
                                                ─────────────────
                                            </p>
                                            </div>
                                        );
                                    }
                                    if (block.type === "heading") {
                                        return (
                                            <h3
                                            key={i}
                                            className={`mt-8 mb-3 text-base font-semibold uppercase tracking-wide ${textSub}`}
                                            style={{ fontFamily: fontFamily === "serif" ? "Georgia, serif" : "inherit" }}
                                            >
                                            {block.text}
                                            </h3>
                                        );
                                    }
                                    return (
                                    <p
                                        key={i}
                                        className={`mb-5 ${textMain}`}
                                        style={{
                                            fontSize: `${fontSize}px`,
                                            lineHeight: lineHeight,
                                            fontFamily: fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "inherit",
                                            textIndent: "1.5em",       // ← classic book indent
                                        }}
                                    >
                                        {block.text}
                                    </p>
                                    );
                                })
                                ) : (
                                <div className={`text-center py-20 ${textSub}`}>
                                    <p className="text-sm">No readable text available for this book.</p>
                                </div>
                            )}

                            {/* End of book */}
                            {blocks.length > 0 && (
                                <div className={`text-center mt-16 pt-8 border-t border-dashed border-gray-200`}>
                                    <p className={`text-sm ${textSub}`}>— End of book —</p>
                                    <button
                                        onClick={() => navigate("/member/dashboard")}
                                        className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                                    >
                                        Back to dashboard
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Bottom reading stats bar — shows on scroll up ── */}
            <div className={`fixed bottom-0 left-0 right-0 border-t ${border} ${navBg} backdrop-blur-sm transition-all duration-300 ${
                showMenu ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}>
                <div className="max-w-3xl mx-auto px-6 py-2.5 flex items-center justify-between">
                    <span className={`text-xs ${textSub}`}>
                        {Math.round(progress)}% read
                        {blocks.length > 0 && ` · ${blocks.filter(b => b.type === "para").length} paragraphs`}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${textSub}`}>
                            Font: {fontSize}px · {fontFamily === "serif" ? "Serif" : "Sans-serif"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}