"use client";

import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-2xl">
                <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    HireIntOS
                </h1>
                <p className="text-xl text-gray-400 mb-2">
                    AI Multi-Persona Interview Platform
                </p>
                <p className="text-gray-500 mb-10">
                    Practice interviews with AI agents that adapt, challenge, and help you grow.
                    Choose your round. Get real feedback.
                </p>

                <button
                    onClick={() => router.push("/select")}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                    Start Interview →
                </button>

                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        🤝 HR Round
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        📋 Manager Round
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        🧠 Technical Round
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        💻 Coding Round
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-6 text-gray-600 text-sm">
                Powered by Google Gemini &middot; Built with Google ADK &middot; MongoDB Atlas
            </footer>
        </main>
    );
}
