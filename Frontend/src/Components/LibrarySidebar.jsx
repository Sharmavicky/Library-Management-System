export default function LibrarySidebar() {
    return (
        <aside className="w-1/3 min-h-screen bg-indigo-600 text-white px-10 py-12 flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-semibold text-white mb-3">LibraryOS</h2>
                <p className="text-sm text-indigo-200 leading-relaxed">
                Your digital library companion
                </p>
            </div>

            <ul className="list-disc pl-5 flex flex-col gap-4">
                {[
                    "Browse 1,200+ books",
                    "Track your reads",
                    "Manage returns & fines",
                ].map((item) => (
                    <li key={item} className="text-sm text-indigo-100">
                        {item}
                    </li>
                ))}
            </ul>
        </aside>
    );
}