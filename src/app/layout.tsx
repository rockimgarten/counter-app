import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Rig Clicker",
    description: "An app to count stuff with custom counters",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}