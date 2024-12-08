import './globals.css';
import type { ReactNode } from 'react';
import Providers from './providers';
import Sidebar from '@/components/Sidebar';
import { Box } from '@mui/material';

export const metadata = {
    title: 'MindPlace',
    description: 'Your snippets at your fingertips.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>
        <Providers>
            <Sidebar />
            {/* Shift content to the right */}
            <Box sx={{ marginLeft: '240px', padding: 2 }}>
                {children}
            </Box>
        </Providers>
        </body>
        </html>
    );
}
