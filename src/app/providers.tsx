"use client";

import React, { useState, useMemo, ReactNode } from 'react';
import { createTheme, ThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { FormControl, Select, MenuItem, Box } from '@mui/material';

type ThemeMode = 'light' | 'dark' | 'synthwave';

interface ProvidersProps {
    children: ReactNode;
}

function getCustomTheme(mode: ThemeMode) {
    let palette;
    let backgroundGradient;

    switch (mode) {
        case 'light':
            palette = {
                mode: 'light' as PaletteMode,
                primary: { main: '#1976d2' },
                secondary: { main: '#9c27b0' },
                background: { default: '#f5f5f5', paper: '#ffffff' },
                text: { primary: '#000000' }
            };
            backgroundGradient = 'linear-gradient(135deg, #ffffff 0%, #e0f7fa 100%)';
            break;

        case 'dark':
            palette = {
                mode: 'dark' as PaletteMode,
                primary: { main: '#90caf9' },
                secondary: { main: '#f48fb1' },
                background: { default: '#121212', paper: '#1e1e1e' },
                text: { primary: '#ffffff' }
            };
            backgroundGradient = 'linear-gradient(135deg, #121212 0%, #343434 100%)';
            break;

        case 'synthwave':
            palette = {
                mode: 'dark' as PaletteMode, // Still dark mode but funky colors
                primary: { main: '#ff00c3' },
                secondary: { main: '#00f2ff' },
                background: { default: '#0c0322', paper: '#2d046e' },
                text: { primary: '#e6e6fa' }
            };
            backgroundGradient = 'linear-gradient(135deg, #2d046e 0%, #0c0322 100%)';
            break;
    }

    return createTheme({
        palette,
        typography: {
            fontFamily: 'sans-serif',
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        background: backgroundGradient,
                        transition: 'background 0.3s ease',
                    }
                }
            }
        }
    });
}

export default function Providers({ children }: ProvidersProps) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');

    const theme = useMemo(() => getCustomTheme(themeMode), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box className="p-4 flex justify-end gap-2 items-center">
                <FormControl size="small" variant="outlined">
                    <Select
                        value={themeMode}
                        onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
                        sx={{ color: theme.palette.text.primary, borderColor: theme.palette.divider }}
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="synthwave">Synthwave</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {children}
        </ThemeProvider>
    );
}
