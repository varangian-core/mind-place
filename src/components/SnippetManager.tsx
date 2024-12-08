"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Fab, Tooltip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CreateSnippetDialog from './CreateSnippetDialog';

interface Snippet {
    id: string;
    name: string;
    content?: string; // Assuming our API returns content now
}

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

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

    // Truncate content for display
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
            <Typography variant="h4" component="h1" gutterBottom>
                MindPlace Snippets
            </Typography>

            <Box sx={{ height: 400, mb: 4 }}>
                <DataGrid
                    rows={snippets}
                    columns={columns}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[5, 10]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 5, page: 0 }
                        }
                    }}
                />
            </Box>

            {/* Floating action button to create new gist */}
            <Fab
                color="primary"
                aria-label="add"
                onClick={() => setDialogOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
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
