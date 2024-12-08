"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Fab, Tooltip, useTheme } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CreateSnippetDialog from './CreateSnippetDialog';

interface Snippet {
    id: string;
    name: string;
    content?: string;
}

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        fetch('/api/snippets')
            .then(res => res.json())
            .then(data => {
                setSnippets(data.snippets || []);
            });
    }, []);

    async function createSnippet(name: string, content: string) {
        const res = await fetch('/api/snippets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content })
        });
        if (res.ok) {
            const data = await res.json();
            setSnippets(prev => [...prev, data.snippet]);
        } else {
            console.error('Error creating snippet');
        }
    }

    function truncateContent(content: string | undefined, length = 50) {
        if (!content) return '';
        return content.length > length ? content.slice(0, length) + '...' : content;
    }

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
        {
            field: 'content',
            headerName: 'Content Preview',
            flex: 2,
            minWidth: 200,
            renderCell: (params) => {
                const fullContent = params.row.content;
                const truncated = truncateContent(fullContent, 50);
                return (
                    <Tooltip title={fullContent || ''}>
                        <span>{truncated}</span>
                    </Tooltip>
                );
            }
        },
    ];

    return (
        <Box className="p-4 max-w-3xl mx-auto" sx={{ height: 500 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
                MindPlace Snippets
            </Typography>

            <Box
                sx={{
                    height: 400,
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)'}`,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                    transition: 'background 0.3s ease'
                }}
            >
                <DataGrid
                    rows={snippets}
                    columns={columns}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[5, 10]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 5, page: 0 } }
                    }}
                    sx={{
                        border: 'none',
                        '.MuiDataGrid-columnHeaders': {
                            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            color: '#fff',
                            fontWeight: 'bold'
                        },
                        '.MuiDataGrid-row': {
                            background: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.02)',
                            '&:hover': {
                                background: theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.05)'
                            }
                        },
                        '.MuiDataGrid-footerContainer': {
                            background: theme.palette.background.paper,
                            borderTop: `1px solid ${theme.palette.divider}`
                        },
                        '.MuiDataGrid-cell': {
                            borderBottom: `1px solid ${theme.palette.divider}`
                        }
                    }}
                />
            </Box>

            <Fab
                color="primary"
                aria-label="add"
                onClick={() => setDialogOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    boxShadow: `0 4px 10px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`
                }}
            >
                <AddIcon />
            </Fab>

            <CreateSnippetDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreate={createSnippet}
            />
        </Box>
    );
}
