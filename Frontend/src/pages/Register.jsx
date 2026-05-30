import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import useAuthStore from "../store/authStore";

// ── Icons ──────────────────────────────────────────────────────────────
const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const MailIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const EyeIcon = ({ open }) => open ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const CheckIcon = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ── Feature cards data ─────────────────────────────────────────────────
const features = [
    {
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        title: "Smart catalogue",
        desc: "1,200+ books, instant availability",
    },
    {
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        title: "Overdue alerts",
        desc: "Auto-notify members before due date",
    },
    {
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        title: "Issuance analytics",
        desc: "Visual charts and usage trends",
    },
];

// ── Strength helpers (unchanged logic) ────────────────────────────────
function getStrengthSegments(password) {
    if (!password) return [false, false, false, false];
    const len = password.length;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const score = (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasLetter && hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    return [score >= 1, score >= 2, score >= 3, score >= 4];
}

function getStrengthLabel(segs) {
    const filled = segs.filter(Boolean).length;
    if (filled === 0) return null;
    if (filled === 1) return { text: "Weak", color: "#ef4444" };
    if (filled === 2) return { text: "Fair", color: "#f59e0b" };
    if (filled === 3) return { text: "Good", color: "#4f46e5" };
    return { text: "Strong", color: "#10b981" };
}

function getSegmentColor(filled, index) {
    if (!filled) return "#e5e7eb";
    // const segs = [filled]; // placeholder to determine color band
    return index <= 0 ? "#ef4444" : index <= 1 ? "#f59e0b" : index <= 2 ? "#4f46e5" : "#10b981";
}

// ── Shared input wrapper ───────────────────────────────────────────────
function InputBox({ icon, borderColor, shadow, children }) {
    return (
        <div style={{
            display: "flex", alignItems: "center",
            background: "#f5f3ff",
            border: `1.5px solid ${borderColor || "#e0e7ff"}`,
            borderRadius: 9, height: 40, padding: "0 12px", gap: 8,
            boxShadow: shadow || "none",
        }}>
            <span style={{ color: "#a5b4fc", flexShrink: 0 }}>{icon}</span>
            {children}
        </div>
    );
}

// ── Component ──────────────────────────────────────────────────────────
export default function RegisterPage() {
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordsMatch = confirmPassword === "" || password === confirmPassword;
    const passwordStrong = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const strengthSegs = getStrengthSegments(password);
    const strengthLabel = getStrengthLabel(strengthSegs);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setLoading(true);

        try {
            const data = await registerUser(username, email, password);
            
            if (data.requiredVerification) {
                navigate("/verify-otp", { state: { email: data.email } });
            } else {
                login(data);
                navigate("/member/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        flex: 1, border: "none", background: "transparent",
        outline: "none", fontSize: 13, color: "#1e1b4b",
        fontFamily: "'DM Sans', sans-serif",
    };

    const isDisabled = loading || !passwordsMatch || !password || !username || !email;

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#eef2ff" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

            {/* ── NAVBAR ── */}
            <nav className="sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 h-12 bg-white border-b border-[#e0e7ff]">
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, fontWeight: 700, color: "#4f46e5" }}>
                    LibraryOS
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
                <aside className="hidden lg:flex w-[46%] xl:w-[44%] shrink-0 flex-col relative overflow-hidden" style={{ background: "#1e1b4b" }}>
                    {/* Decorative circles */}
                    <div style={{ position: "absolute", top: -70, right: -70, width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", bottom: 60, left: -50, width: 170, height: 170, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", bottom: 160, right: 40, width: 110, height: 110, borderRadius: "50%", background: "rgba(99,102,241,0.15)" }} />

                    <div className="relative z-10 flex flex-col h-full px-10 py-12 justify-between">
                        {/* Top */}
                        <div>
                            {/* Badge */}
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
                                borderRadius: 20, padding: "4px 12px", marginBottom: 20
                            }}>
                                <div style={{ width: 5, height: 5, background: "#86efac", borderRadius: "50%" }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#c7d2fe" }}>Free forever · No credit card</span>
                            </div>

                            {/* Headline */}
                            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#fff", lineHeight: 1.2, marginBottom: 10 }}>
                                Join <span style={{ color: "#a5b4fc" }}>thousands</span><br />of librarians
                            </h2>
                            <p style={{ fontSize: 12, color: "#818cf8", lineHeight: 1.75, maxWidth: 240 }}>
                                Set up your LibraryOS account in minutes and start managing your collection the smart way.
                            </p>
                        </div>

                        {/* Feature cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {features.map((f) => (
                                <div key={f.title} style={{
                                    display: "flex", alignItems: "flex-start", gap: 10,
                                    padding: 13, background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: "rgba(165,180,252,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, color: "#a5b4fc"
                                    }}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e7ff" }}>{f.title}</div>
                                        <div style={{ fontSize: 10, color: "#818cf8", marginTop: 2 }}>{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN FORM ── */}
                <main className="flex-1 flex items-center justify-center px-5 sm:px-10 md:px-14 py-10 overflow-y-auto" style={{ background: "#eef2ff" }}>
                    <div className="w-full max-w-sm">
                        {/* Card */}
                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e0e7ff", padding: "26px 24px" }}>

                            {/* User-plus icon */}
                            <div style={{
                                width: 42, height: 42, background: "#eef2ff", borderRadius: 12,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: 14, color: "#4f46e5"
                            }}>
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </div>

                            {/* Header */}
                            <div style={{ marginBottom: 18 }}>
                                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "#1e1b4b", marginBottom: 2 }}>
                                    Create your account
                                </h1>
                                <p style={{ fontSize: 11, color: "#9ca3af" }}>Get started — it's completely free</p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    marginBottom: 14, padding: "10px 12px", borderRadius: 9,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderLeft: "3px solid #ef4444", color: "#dc2626", fontSize: 12
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>

                                {/* Username */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Username</label>
                                    <InputBox icon={<UserIcon />}>
                                        <input
                                            type="text"
                                            placeholder="e.g. arjun_reads"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            style={inputStyle}
                                        />
                                    </InputBox>
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Email address</label>
                                    <InputBox icon={<MailIcon />}>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={inputStyle}
                                        />
                                    </InputBox>
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Password</label>
                                    <InputBox
                                        icon={<LockIcon />}
                                        borderColor={password ? (passwordStrong ? "#6366f1" : "#fca5a5") : "#e0e7ff"}
                                        shadow={password ? (passwordStrong ? "0 0 0 3px rgba(99,102,241,0.1)" : "0 0 0 3px rgba(252,165,165,0.2)") : "none"}
                                    >
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="At least 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0, display: "flex", alignItems: "center" }}>
                                            <EyeIcon open={showPass} />
                                        </button>
                                    </InputBox>

                                    {/* Strength meter */}
                                    {password && (
                                        <>
                                            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                                                {strengthSegs.map((filled, i) => (
                                                    <div key={i} style={{
                                                        flex: 1, height: 3, borderRadius: 2,
                                                        background: filled ? getSegmentColor(filled, i) : "#e5e7eb",
                                                        transition: "background 0.3s"
                                                    }} />
                                                ))}
                                            </div>
                                            {strengthLabel && (
                                                <div style={{ fontSize: 10, fontWeight: 600, color: strengthLabel.color, marginTop: 3 }}>
                                                    {strengthLabel.text}
                                                </div>
                                            )}
                                            {/* Criteria pills */}
                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 5 }}>
                                                {[
                                                    { label: "6+ chars", met: passwordStrong },
                                                    { label: "Letter", met: hasLetter },
                                                    { label: "Number", met: hasNumber },
                                                ].map((c) => (
                                                    <span key={c.label} style={{
                                                        display: "flex", alignItems: "center", gap: 5,
                                                        fontSize: 10, color: c.met ? "#10b981" : "#9ca3af"
                                                    }}>
                                                        <span style={{
                                                            width: 13, height: 13, borderRadius: "50%",
                                                            border: c.met ? "none" : "1.5px solid #d1d5db",
                                                            background: c.met ? "#10b981" : "transparent",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", flexShrink: 0
                                                        }}>
                                                            {c.met && <CheckIcon />}
                                                        </span>
                                                        {c.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Confirm password</label>
                                    <InputBox
                                        icon={<ShieldIcon />}
                                        borderColor={confirmPassword ? (passwordsMatch ? "#34d399" : "#fca5a5") : "#e0e7ff"}
                                        shadow={confirmPassword ? (passwordsMatch ? "0 0 0 3px rgba(52,211,153,0.1)" : "0 0 0 3px rgba(252,165,165,0.2)") : "none"}
                                    >
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Repeat your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0, display: "flex", alignItems: "center" }}>
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </InputBox>
                                    {confirmPassword && !passwordsMatch && (
                                        <p style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>Passwords do not match</p>
                                    )}
                                    {confirmPassword && passwordsMatch && (
                                        <p style={{ fontSize: 10, color: "#10b981", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                            <CheckIcon /> Passwords match
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isDisabled}
                                    style={{
                                        width: "100%", height: 38, borderRadius: 9,
                                        background: isDisabled ? "#a5b4fc" : "#4f46e5",
                                        border: "none", cursor: isDisabled ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                        color: "#fff", fontSize: 12, fontWeight: 700,
                                        fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {loading ? "Creating account…" : <><span>Create free account</span><ArrowRightIcon /></>}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
                                <div style={{ flex: 1, height: 1, background: "#e0e7ff" }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>already a member?</span>
                                <div style={{ flex: 1, height: 1, background: "#e0e7ff" }} />
                            </div>

                            <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
                                Already have an account?{" "}
                                <button
                                    onClick={() => navigate("/login")}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "#4f46e5", fontWeight: 700, fontSize: 11,
                                        fontFamily: "'DM Sans', sans-serif"
                                    }}
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            {/* ── FOOTER ── */}
            <footer className="flex items-center justify-between px-6 sm:px-10 h-11 bg-white border-t border-[#e0e7ff]">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", fontFamily: "'DM Serif Display', serif" }}>LibraryOS</span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>© 2026 LibraryOS. Built for librarians.</span>
            </footer>
        </div>
    );
}