import { NavLink } from "react-router-dom";

export default function NavSideBar({ navHeading, navItems, user }) {
    // get initials from username e.g. "Vicky Sharma" → "VS"
    const getInitials = (name = "") =>
        name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    // random but consistent color based on username
    const colors = [
        "bg-indigo-500", "bg-green-500", "bg-orange-500",
        "bg-purple-500", "bg-pink-500",  "bg-teal-500"
    ];
    const colorIndex = (user?.username?.charCodeAt(0) || 0) % colors.length;

    return (
        <aside className="w-1/4 min-h-screen bg-white border-r border-gray-100
                          flex flex-col justify-between p-5">
            {/* Top — heading + nav */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                    {navHeading}
                </p>

                <ul className="space-y-1">
                    {navItems.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center justify-between gap-3 px-3 py-2.5
                                     rounded-lg transition text-sm ${
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{ <item.icon /> }</span>
                                    <span>{item.label}</span>
                                </div>
                                {/* badge — e.g. fine count */}
                                {item.badge > 0 && (
                                    <span className="bg-red-500 text-white text-[10px]
                                                     font-bold px-1.5 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom — user profile */}
            {user && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div
                        className={`${colors[colorIndex]} w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}
                    >
                        {getInitials(user.username)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {user.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                                month: "short", year: "numeric"
                            })}
                        </p>
                    </div>
                </div>
            )}
        </aside>
    );
}