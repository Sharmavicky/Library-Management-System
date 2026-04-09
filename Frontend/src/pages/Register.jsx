import { useState } from "react";
import LibrarySidebar from "../Components/LibrarySidebar";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate =  useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // check if both password and confirm password are same before hitting API
        if (password !== confirmPassword) {
            setError("Password do not match!!");
            return;
        }

        // check password length
        if (password.length < 6) {
            setError("Password must have 6 characters!!");
            return;
        }

        setLoading(true);

        try {
            const data = await registerUser(username, email, password);

            // save token to localStorage and redirect after success
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // navigate new member to dashboard
            navigate("/dashboard");
        } catch (err) {
            // show error message from backend
            setError(err.response?.data?.message || "Registration failed!! Please try again");
        } finally {
            setLoading(false);
        }
    }

    const inputClass ="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";

    const labelClass = "text-[11px] font-semibold uppercase tracking-widest text-gray-500";

    return (
        <div className="flex w-screen h-screen overflow-hidden">
            {/* Sidebar — 1/3 */}
            <LibrarySidebar />

            {/* Main — 2/3 */}
            <main className="w-2/3 h-full bg-white flex items-center justify-center px-16 overflow-y-auto">
                <div className="w-full max-w-md py-10">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
                    <p className="text-sm text-gray-500 mb-7">Join LibraryOS for free today</p>

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>username</label>
                            <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Librarian"
                            required
                            className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                required
                                className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                                className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Confirm password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                required
                                className={`${inputClass} ${ confirmPassword && confirmPassword !== password
                                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                        : ""
                                }`}
                            />

                            {/* inline mismatch hint while typing */}
                            {confirmPassword && confirmPassword !== password && (
                                <p className="text-xs text-red-500 mt-0.5">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || password !== confirmPassword}
                            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold cursor-pointer text-white hover:bg-indigo-700 active:scale-[0.98] transition"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <hr className="my-5 border-t border-gray-200" />

                    <p className="mt-5 text-center text-sm text-gray-500">
                        Already a member?{" "}
                        <button
                            onClick={() => navigate("/login")}
                            className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer text-sm p-0"
                        >
                            Sign in
                        </button>
                    </p>

                </div>
            </main>
        </div>
    );
}