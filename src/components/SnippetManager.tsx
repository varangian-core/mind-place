"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Fab, Tooltip, useTheme, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CreateSnippetDialog from './CreateSnippetDialog';
import LinkIcon from '@mui/icons-material/Link';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import FuzzySearchModal from './FuzzySearchModal';

interface Snippet {
    id: string;
    name: string;
    content?: string;
    createdAt: string;
}

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false); // For fuzzy search modal
    const [contentToCreate, setContentToCreate] = useState('');
    const theme = useTheme();

    useEffect(() => {
        fetch('/api/snippets')
            .then(res => res.json())
            .then(data => {
                console.log('Fetched snippets:', data.snippets);
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

    const handleCopyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Show some feedback to user
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handlePasteFromClipboard = React.useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            // Open create dialog with pasted content
            setContentToCreate(text);
            setDialogOpen(true);
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    }, []);

    const columns: GridColDef<Snippet>[] = [
        { 
            field: 'name', 
            headerName: 'Name', 
            flex: 1, 
            minWidth: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{params.value}</span>
                    <Tooltip title="Copy content">
                        <IconButton 
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(params.row.content || '');
                            }}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'url',
            headerName: 'URL',
            width: 60,
            sortable: false,
            renderCell: (params) => {
                const snippetId = params.row.id;
                return (
                    <Tooltip title={`Open /gist/${snippetId}`}>
                        <LinkIcon
                            sx={{ cursor: 'pointer' }}
                            onClick={() => window.open(`/gist/${snippetId}`, '_blank')}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 180,
            valueFormatter: (params: any) => {
                console.log('Date value from server:', params.value);
                if (!params.value) return "No date";
                const dateVal = new Date(params.value);
                return isNaN(dateVal.getTime())
                    ? "Invalid date"
                    : dateVal.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
            }
        },
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
        {
            field: 'drive',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: () => (
                <Tooltip title="Stored in Drive">
                    <DriveFileMoveOutlined color="secondary" />
                </Tooltip>
            )
        }
    ];

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;
            
            // Search (Cmd/Ctrl + K)
            if (modKey && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            // New snippet (Cmd/Ctrl + N)
            else if (modKey && e.key === 'n') {
                e.preventDefault();
                setDialogOpen(true);
            }
            // Paste snippet (Cmd/Ctrl + Shift + V)
            else if (modKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                handlePasteFromClipboard();
            }
        }
        
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handlePasteFromClipboard]);

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            {/* Animated SVG background */}
            <Box
                sx={{
                    position: 'absolute',
                    zIndex: -1,
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    opacity: 0.3,
                    '& svg': {
                        width: '200%',
                        height: '200%',
                        animation: 'subtleMove 10s infinite linear alternate'
                    }
                }}
            >
                <svg viewBox="0 0 1440 960" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={theme.palette.primary.main} />
                            <stop offset="100%" stopColor={theme.palette.secondary.main} />
                        </linearGradient>
                    </defs>
                    <path fill="url(#grad)" d="M0,64L80,74.7C160,85,320,107,480,133.3C640,160,800,192,960,218.7C1120,245,1280,267,1360,278.7L1440,288L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"/>
                </svg>
            </Box>

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
                        pagination: {
                            paginationModel: { pageSize: 5, page: 0 }
                        }
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

            <Box sx={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', gap: 2 }}>
                <Tooltip title="Paste from clipboard">
                    <Fab
                        color="secondary"
                        aria-label="paste"
                        onClick={handlePasteFromClipboard}
                    >
                        <ContentPasteIcon />
                    </Fab>
                </Tooltip>
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={() => setDialogOpen(true)}
                >
                    <AddIcon />
                </Fab>

            {/* Updated prop names to onCloseAction and onCreateAction */}
            <CreateSnippetDialog
                open={dialogOpen}
                onCloseAction={() => setDialogOpen(false)}
                onCreateAction={createSnippet}
                initialContent={contentToCreate}
            />

            {/* Updated prop name to onCloseAction */}
            <FuzzySearchModal
                open={searchOpen}
                onCloseAction={() => setSearchOpen(false)}
                snippets={snippets}
            />
        </Box>
    );
}
