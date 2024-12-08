import '../styles/globals.css';
import '../styles/tailwind.css';
import type { ReactNode } from 'react';

export const metadata = {
    title: 'MindPlace',
    description: 'Your snippets at your fingertips.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
