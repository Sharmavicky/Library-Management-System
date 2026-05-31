import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const MailIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const EyeIcon = ({ open }) => open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

export default function LoginPage({ onNavigateRegister }) {
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            login(data);
            if (data.user?.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/member/dashboard");
            }
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.requiredVerification) {
                navigate("/verify-otp", { state: { email: errData.email } });
                return;
            }
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#eef2ff" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

            {/* ── NAVBAR ── */}
            <nav className="sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 h-12 bg-white border-b border-[#e0e7ff]">
                <span className="text-sm font-bold text-[#4f46e5]" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "16px" }}>
                    ReadMatrix
                </span>
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280] hover:text-[#4f46e5] transition-colors bg-transparent border-none cursor-pointer"
                >
                    <ArrowLeftIcon /> Back to home
                </button>
            </nav>

            {/* ── BODY ── */}
            <div className="flex flex-1 min-h-0">

                {/* ── SIDEBAR (desktop only) ── */}
                <aside className="hidden lg:flex w-[48%] xl:w-[46%] shrink-0 flex-col relative overflow-hidden" style={{ background: "#4f46e5" }}>
                    {/* Grid overlay */}
                    <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
                        backgroundSize: "32px 32px"
                    }} />
                    {/* Decorative circle */}
                    <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

                    <div className="relative z-10 flex flex-col h-full px-10 py-12 justify-between">
                        {/* Top content */}
                        <div>
                            {/* Badge */}
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 20, padding: "4px 12px", marginBottom: 24
                            }}>
                                <div style={{ width: 5, height: 5, background: "#a5f3fc", borderRadius: "50%" }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#c7d2fe" }}>Trusted by 500+ libraries</span>
                            </div>

                            {/* Headline */}
                            <h2 style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 32, color: "#fff", lineHeight: 1.2, marginBottom: 12
                            }}>
                                Your library,<br />
                                <span style={{ color: "#a5b4fc" }}>managed smarter</span>
                            </h2>
                            <p style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.75, maxWidth: 280 }}>
                                Everything you need to run a modern library — books, members, fines, and analytics — in one clean dashboard.
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[["12k+", "Books managed"], ["3.2k", "Active members"], ["98%", "Return rate"], ["500+", "Libraries"]].map(([n, l]) => (
                                <div key={l} style={{
                                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 12, padding: 14
                                }}>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{n}</div>
                                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN FORM ── */}
                <main className="flex-1 flex items-center justify-center px-5 sm:px-10 md:px-14 py-10 overflow-y-auto" style={{ background: "#eef2ff" }}>
                    <div className="w-full max-w-sm">
                        {/* Card */}
                        <div style={{
                            background: "#fff", borderRadius: 16,
                            border: "1px solid #e0e7ff", padding: "28px 26px"
                        }}>
                            {/* Lock icon */}
                            <div style={{
                                width: 44, height: 44, background: "#eef2ff",
                                borderRadius: 12, display: "flex", alignItems: "center",
                                justifyContent: "center", marginBottom: 16, color: "#4f46e5"
                            }}>
                                <LockIcon />
                            </div>

                            {/* Header */}
                            <div className="mb-5">
                                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1e1b4b", marginBottom: 3 }}>
                                    Welcome back
                                </h1>
                                <p style={{ fontSize: 12, color: "#9ca3af" }}>Sign in to your ReadMatrix account</p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderLeft: "3px solid #ef4444", color: "#dc2626", fontSize: 12
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                                {/* Email */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                                        Email address
                                    </label>
                                    <div style={{
                                        display: "flex", alignItems: "center",
                                        background: "#f5f3ff", border: "1.5px solid #e0e7ff",
                                        borderRadius: 9, padding: "0 12px", height: 40, gap: 8,
                                        transition: "border-color 0.2s"
                                    }}
                                        onFocus={() => { }} // handled via CSS below
                                    >
                                        <span style={{ color: "#a5b4fc", flexShrink: 0 }}><MailIcon /></span>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{
                                                flex: 1, border: "none", background: "transparent",
                                                outline: "none", fontSize: 13, color: "#1e1b4b",
                                                fontFamily: "'DM Sans', sans-serif"
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Password</label>
                                        <button type="button" style={{
                                            fontSize: 10, color: "#6366f1", background: "none",
                                            border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                                        }}>
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div style={{
                                        display: "flex", alignItems: "center",
                                        background: "#f5f3ff", border: "1.5px solid #e0e7ff",
                                        borderRadius: 9, padding: "0 12px", height: 40, gap: 8
                                    }}>
                                        <span style={{ color: "#a5b4fc", flexShrink: 0 }}><LockIcon /></span>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{
                                                flex: 1, border: "none", background: "transparent",
                                                outline: "none", fontSize: 13, color: "#1e1b4b",
                                                fontFamily: "'DM Sans', sans-serif"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPass(!showPass)}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "#a5b4fc", padding: 0, display: "flex", alignItems: "center"
                                            }}
                                        >
                                            <EyeIcon open={showPass} />
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !email || !password}
                                    style={{
                                        width: "100%", height: 38, borderRadius: 9,
                                        background: loading || !email || !password ? "#a5b4fc" : "#4f46e5",
                                        border: "none", cursor: loading || !email || !password ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                        color: "#fff", fontSize: 12, fontWeight: 700,
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: "background 0.2s, transform 0.1s",
                                        marginTop: 4
                                    }}
                                >
                                    {loading ? "Signing in…" : <><span>Sign in</span><ArrowRightIcon /></>}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px" style={{ background: "#e0e7ff" }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>new here?</span>
                                <div className="flex-1 h-px" style={{ background: "#e0e7ff" }} />
                            </div>

                            {/* Create account */}
                            <button
                                onClick={() => navigate("/register")}
                                style={{
                                    width: "100%", height: 36, borderRadius: 9,
                                    background: "transparent", border: "1.5px solid #4f46e5",
                                    color: "#4f46e5", fontSize: 12, fontWeight: 700,
                                    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                                    transition: "background 0.2s, color 0.2s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4f46e5"; }}
                            >
                                Create a free account
                            </button>

                            {onNavigateRegister && (
                                <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
                                    Don't have an account?{" "}
                                    <button
                                        onClick={onNavigateRegister}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "#4f46e5", fontWeight: 700, fontSize: 11,
                                            fontFamily: "'DM Sans', sans-serif"
                                        }}
                                    >
                                        Create one
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* ── FOOTER ── */}
            <footer className="flex items-center justify-between px-6 sm:px-10 h-11 bg-white border-t border-[#e0e7ff]">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", fontFamily: "'DM Serif Display', serif" }}>ReadMatrix</span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>© 2026 ReadMatrix. Built for librarians.</span>
            </footer>
        </div>
    );
}