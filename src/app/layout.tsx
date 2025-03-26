import './globals.css';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import Sidebar from '@/components/Sidebar';
import AuthProvider from '@/lib/auth/AuthProvider';

import Providers from './providers';

export const metadata = {
    title: 'MindPlace',
    description: 'Your snippets at your fingertips.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>
        <Providers>
          <AuthProvider>
            <Sidebar />
            {/* Shift content to the right */}
            <Box sx={{ marginLeft: '240px', padding: 2 }}>
              {children}
            </Box>
          </AuthProvider>
        </Providers>
        </body>
        </html>
    );
}
