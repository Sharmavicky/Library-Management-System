import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOTP, resendOTP } from "../services/authService";
import useAuthStore from "../store/authStore";

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
        // ── Full screen wrapper ──────────────────────────────────────────────
        // Mobile/tablet : single centred column (bg-gray-50)
        // Desktop (md+)  : two-column split — sidebar left, form right
        <div className="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden">

            {/* ── Left sidebar — hidden on mobile/tablet, visible md+ ── */}
            <aside className="hidden md:flex w-1/3 min-h-screen bg-indigo-600 text-white px-10 py-12 flex-col justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-3">LibraryOS</h2>
                    <p className="text-sm text-indigo-200 leading-relaxed">
                        Your digital library companion
                    </p>
                </div>
                <ul className="list-disc pl-5 flex flex-col gap-4">
                    {["Browse 1,200+ books", "Track your reads", "Manage returns & fines"].map((item) => (
                        <li key={item} className="text-sm text-indigo-100">{item}</li>
                    ))}
                </ul>
            </aside>

            {/* ── Mobile top bar — only visible below md ── */}
            <div className="flex md:hidden items-center justify-between px-5 py-4 bg-indigo-600">
                <span className="text-lg font-bold text-white">LibraryOS</span>
                <button
                    onClick={() => navigate("/register")}
                    className="text-xs text-indigo-200 hover:text-white transition"
                >
                    ← Back
                </button>
            </div>

            {/* ── Main content ── */}
            {/* Mobile/tablet : full width, top-padded card feel
                Desktop       : 2/3 width, centered vertically         */}
            <main className="flex-1 bg-white flex items-start md:items-center justify-center
                             px-5 py-10 sm:px-10 md:px-16 overflow-y-auto">

                <div className="w-full max-w-md">

                    {/* Icon — decorative, visible on mobile to fill the space the sidebar occupied */}
                    <div className="flex md:hidden justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                            </svg>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-7 text-center md:text-left">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            Verify your email
                        </h1>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            We sent a 6-digit code to{" "}
                            <span className="font-medium text-gray-700 break-all">{email}</span>.
                            {" "}Enter it below to activate your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* OTP input boxes
                            Larger boxes on mobile for easy finger tapping
                            Slightly smaller but still comfortable on desktop */}
                        <div
                            className="flex gap-2 sm:gap-3 justify-center mb-6"
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
                                    className={`
                                        w-11 h-13 sm:w-12 sm:h-14
                                        text-center text-xl font-bold
                                        rounded-xl border-2 outline-none transition
                                        touch-manipulation
                                        ${error
                                            ? "border-red-400 bg-red-50 text-red-600"
                                            : digit
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 text-gray-900 focus:border-indigo-400 focus:bg-indigo-50/30"
                                        }
                                    `}
                                />
                            ))}
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="#ef4444" strokeWidth="2" className="shrink-0">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit button — larger tap target on mobile */}
                        <button
                            type="submit"
                            disabled={loading || otp.join("").length < 6}
                            className="w-full py-3.5 sm:py-3 bg-indigo-600 text-white rounded-xl
                                       text-sm font-semibold hover:bg-indigo-700
                                       active:scale-[0.98] transition disabled:opacity-50
                                       touch-manipulation"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin" width="16" height="16"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : "Verify email"}
                        </button>
                    </form>

                    {/* Countdown progress bar — visual indicator of OTP expiry (10 min = 600s) */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                            <span>Code expires in</span>
                            <span className="font-medium text-gray-600">10 min</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-400 rounded-full transition-all duration-1000"
                                style={{ width: `${(countdown / 60) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Resend section */}
                    <div className="mt-5 text-center">
                        {resendMsg && (
                            <div className="flex items-center justify-center gap-1.5 mb-3">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="#16a34a" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <p className="text-sm text-green-600">{resendMsg}</p>
                            </div>
                        )}
                        <p className="text-sm text-gray-500">
                            Didn't get the code?{" "}
                            <button
                                onClick={handleResend}
                                disabled={countdown > 0 || resending}
                                className="text-indigo-600 hover:underline font-medium
                                           disabled:text-gray-400 disabled:no-underline
                                           transition touch-manipulation"
                            >
                                {resending
                                    ? "Sending..."
                                    : countdown > 0
                                    ? `Resend in ${countdown}s`
                                    : "Resend OTP"}
                            </button>
                        </p>
                    </div>

                    {/* Back link */}
                    <p className="mt-4 text-center text-sm text-gray-400">
                        Wrong email?{" "}
                        <button
                            onClick={() => navigate("/register")}
                            className="text-indigo-600 hover:underline touch-manipulation"
                        >
                            Go back
                        </button>
                    </p>

                </div>
            </main>
        </div>
    );
}