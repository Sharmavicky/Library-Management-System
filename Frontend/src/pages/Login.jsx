import { useState } from "react";
import LibrarySidebar from "../Components/LibrarySidebar";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import useAuthStore  from "../store/authStore";

export default function LoginPage({ onNavigateRegister }) {
    const { login } = useAuthStore();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await loginUser(email, password);

            // save token to localStorage
            login(data);

            // redirect based on role
            if (data.user.role === "admin") navigate("/admin/dashboard"); // admin dashboard
            else navigate("/dashboard"); // member dashboard
            
        } catch (err) {
            // show error message from backend
            setError(err.response?.data?.message || "Login failed!! Please try again");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";

    const labelClass = "text-[11px] font-semibold uppercase tracking-widest text-gray-500";
    const buttonClass = "w-1/2 text-white bg-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition";

    return (
        <div className="flex w-screen h-screen overflow-hidden">
            {/* Sidebar — 1/3 */}
            <LibrarySidebar />

            {/* Main — 2/3 */}
            <main className="w-2/3 h-full bg-white flex items-center justify-center px-16">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-500 mb-7">Sign in to your member account</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                                required
                                className={inputClass}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white cursor-pointer hover:bg-indigo-700 active:scale-[0.98] transition"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Error Message */}
                    {error && (
                        <div className="m-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <hr className="my-5 border-t border-gray-200" />

                    {/* sign in as admin button or create account button */}
                    <div className="flex flex-row items-center justify-center gap-2">
                        {["Sign-in as Admin", "Create Account"].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() =>
                                    idx === 0
                                    ? navigate("/admin/login")
                                    : navigate("/register")
                                }
                                className={buttonClass}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {onNavigateRegister && (
                        <p className="mt-5 text-center text-sm text-gray-500">
                            Don&apos;t have an account?{" "}
                            <button
                                onClick={onNavigateRegister}
                                className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer text-sm p-0"
                            >
                                Create one
                            </button>
                        </p>
                    )}

                </div>
            </main>
        </div>
    );
}