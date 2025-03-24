"use client";

import { Drawer, Box, Typography, Avatar, FormControl, Select, MenuItem, Divider } from '@mui/material';
import React, { useContext } from 'react';

import { ThemeContext, ThemeMode } from '@/app/providers';

export default function Sidebar() {
    const { mode, setMode } = useContext(ThemeContext);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    paddingTop: 2,
                    gap: 2
                },
            }}
        >
            <Box sx={{ textAlign: 'center' }}>
                {/* Cool logo placeholder */}
                <Typography variant="h5" fontWeight="bold" mb={1}>🌀 MindPlace</Typography>
            </Box>

            <Divider sx={{ width: '80%' }} />

            {/* User info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
                <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>Alice</Typography>
            </Box>

            <Divider sx={{ width: '80%' }} />

            {/* Theme mode selection */}
            <Box sx={{ width: '80%' }}>
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as ThemeMode)}
                        sx={{ color: 'text.primary' }}
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="synthwave">Synthwave</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Drawer>
    );
}
