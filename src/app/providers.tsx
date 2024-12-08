"use client";

import React, { useState, useMemo, ReactNode } from 'react';
import { createTheme, ThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const [mode, setMode] = useState<PaletteMode>('light');

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode,
            },
            typography: {
                fontFamily: 'sans-serif',
            }
        }), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="p-4 flex justify-end">
                <IconButton onClick={toggleColorMode} color="inherit">
                    {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
            </div>
            {children}
        </ThemeProvider>
    );
}
