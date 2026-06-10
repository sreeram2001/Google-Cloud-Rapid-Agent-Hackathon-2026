import type { Metadata } from "next";
import { Outfit, Sora } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

export const metadata: Metadata = {
    title: "HireIntOS — AI Interview Platform",
    description: "Multi-persona AI interview platform powered by Google Gemini",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${outfit.variable} ${sora.variable}`}>
            <body className="bg-spotify-black text-spotify-text antialiased font-[family-name:var(--font-sans)]">
                {children}
            </body>
        </html>
    );
}
