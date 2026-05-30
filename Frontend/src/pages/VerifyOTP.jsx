import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOTP, resendOTP } from "../services/authService";
import useAuthStore from "../store/authStore";

const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

const SpinnerIcon = () => (
    <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default function VerifyOTP() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { login } = useAuthStore();

    const email = location.state?.email || "";

    const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
    const [error,     setError]     = useState("");
    const [loading,   setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState("");
    const [countdown, setCountdown] = useState(60);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) navigate("/register");
    }, [email]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length < 6) { setError("Please enter all 6 digits"); return; }
        setLoading(true);
        setError("");
        try {
            const data = await verifyOTP(email, otpString);
            login(data);
            navigate(data.user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP. Please try again.");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setResending(true);
        setResendMsg("");
        try {
            await resendOTP(email);
            setResendMsg("New OTP sent to your email!");
            setCountdown(60);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setResendMsg(err.response?.data?.message || "Failed to resend OTP.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#eef2ff" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── NAVBAR ── */}
            <nav className="sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 h-12 bg-white border-b border-[#e0e7ff]">
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, fontWeight: 700, color: "#4f46e5" }}>
                    LibraryOS
                </span>
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                    style={{ fontSize: 11, fontWeight: 500, color: "#6b7280" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#4f46e5"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
                >
                    <ArrowLeftIcon /> Back to home
                </button>
            </nav>

            {/* ── BODY ── */}
            <div className="flex flex-1 min-h-0">

                {/* ── SIDEBAR (desktop only) ── */}
                <aside className="hidden lg:flex shrink-0 flex-col relative overflow-hidden"
                    style={{ width: "46%", background: "#4f46e5" }}>
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
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#c7d2fe" }}>Almost there — one step left</span>
                            </div>

                            {/* Headline */}
                            <h2 style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 32, color: "#fff", lineHeight: 1.2, marginBottom: 12
                            }}>
                                Check your<br />
                                <span style={{ color: "#a5b4fc" }}>inbox</span>
                            </h2>
                            <p style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.75, maxWidth: 280 }}>
                                We sent a 6-digit verification code to your email. Enter it to activate your LibraryOS account.
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[["256-bit", "Encrypted"], ["10 min", "Code expiry"], ["6-digit", "Secure OTP"], ["99.9%", "Uptime"]].map(([n, l]) => (
                                <div key={l} style={{
                                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 12, padding: 14
                                }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{n}</div>
                                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN FORM ── */}
                <main className="flex-1 flex items-center justify-center px-5 sm:px-10 md:px-14 py-10 overflow-y-auto"
                    style={{ background: "#eef2ff" }}>
                    <div className="w-full max-w-sm">

                        {/* Card */}
                        <div style={{
                            background: "#fff", borderRadius: 16,
                            border: "1px solid #e0e7ff", padding: "28px 26px"
                        }}>
                            {/* Mail icon badge */}
                            <div style={{
                                width: 44, height: 44, background: "#eef2ff",
                                borderRadius: 12, display: "flex", alignItems: "center",
                                justifyContent: "center", marginBottom: 16, color: "#4f46e5"
                            }}>
                                <MailIcon />
                            </div>

                            {/* Header */}
                            <div style={{ marginBottom: 20 }}>
                                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1e1b4b", margin: "0 0 4px" }}>
                                    Verify your email
                                </h1>
                                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                                    Code sent to{" "}
                                    <span style={{ color: "#4f46e5", fontWeight: 600 }}>{email}</span>
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    marginBottom: 16, padding: "8px 10px", borderRadius: 8,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderLeft: "3px solid #ef4444", color: "#dc2626", fontSize: 12
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* OTP inputs */}
                            <div
                                style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}
                                onPaste={handlePaste}
                            >
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (inputRefs.current[i] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        autoComplete="one-time-code"
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        style={{
                                            width: 44, height: 52,
                                            textAlign: "center", fontSize: 20, fontWeight: 700,
                                            fontFamily: "'DM Sans', sans-serif",
                                            borderRadius: 9, outline: "none",
                                            border: `1.5px solid ${error ? "#fca5a5" : digit ? "#4f46e5" : "#e0e7ff"}`,
                                            background: error ? "#fef2f2" : digit ? "#f5f3ff" : "#f9fafb",
                                            color: error ? "#dc2626" : digit ? "#4f46e5" : "#1e1b4b",
                                            transition: "border-color 0.15s, background 0.15s",
                                        }}
                                        onFocus={e => {
                                            if (!error) e.target.style.borderColor = "#4f46e5";
                                            if (!error && !digit) e.target.style.background = "#f5f3ff";
                                        }}
                                        onBlur={e => {
                                            if (!digit && !error) {
                                                e.target.style.borderColor = "#e0e7ff";
                                                e.target.style.background = "#f9fafb";
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || otp.join("").length < 6}
                                style={{
                                    width: "100%", height: 38, borderRadius: 9,
                                    background: loading || otp.join("").length < 6 ? "#a5b4fc" : "#4f46e5",
                                    border: "none",
                                    cursor: loading || otp.join("").length < 6 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                    fontFamily: "'DM Sans', sans-serif",
                                    transition: "background 0.2s",
                                }}
                            >
                                {loading
                                    ? <><SpinnerIcon /> Verifying…</>
                                    : <><span>Verify email</span><ArrowRightIcon /></>
                                }
                            </button>

                            {/* Expiry progress bar */}
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 5 }}>
                                    <span>Code expires in</span>
                                    <span style={{ color: "#6b7280", fontWeight: 600 }}>10 min</span>
                                </div>
                                <div style={{ width: "100%", height: 3, background: "#e0e7ff", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        width: `${(countdown / 60) * 100}%`,
                                        height: "100%", background: "#4f46e5",
                                        borderRadius: 4, transition: "width 1s linear"
                                    }} />
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ margin: "16px 0", height: 1, background: "#e0e7ff" }} />

                            {/* Resend */}
                            <div style={{ textAlign: "center" }}>
                                {resendMsg && (
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: 6, marginBottom: 10, fontSize: 12,
                                        color: resendMsg.includes("Failed") ? "#dc2626" : "#16a34a"
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2">
                                            {resendMsg.includes("Failed")
                                                ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                                                : <polyline points="20 6 9 17 4 12"/>
                                            }
                                        </svg>
                                        {resendMsg}
                                    </div>
                                )}
                                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                                    Didn't get the code?{" "}
                                    <button
                                        onClick={handleResend}
                                        disabled={countdown > 0 || resending}
                                        style={{
                                            background: "none", border: "none", padding: 0,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 12, fontWeight: 700, cursor: countdown > 0 || resending ? "default" : "pointer",
                                            color: countdown > 0 || resending ? "#9ca3af" : "#4f46e5"
                                        }}
                                    >
                                        {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                                    </button>
                                </p>
                                <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>
                                    Wrong email?{" "}
                                    <button
                                        onClick={() => navigate("/register")}
                                        style={{
                                            background: "none", border: "none", padding: 0,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 11, fontWeight: 700, color: "#4f46e5", cursor: "pointer"
                                        }}
                                    >
                                        Go back
                                    </button>
                                </p>
                            </div>
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