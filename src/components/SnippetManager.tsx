"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Fab, Tooltip, useTheme, IconButton, Paper, Dialog } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CreateSnippetDialog from './CreateSnippetDialog';
import LinkIcon from '@mui/icons-material/Link';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import FuzzySearchModal from './FuzzySearchModal';
import { loadLocalSnippets, saveLocalSnippets } from '@/lib/localStorageUtils';

interface Topic {
    id: string;
    name: string;
    description?: string;
    _count?: {
        snippets: number;
    };
}

interface Snippet {
    id: string;
    name: string;
    content?: string;
    createdAt: string;
    topicId?: string;
    topic?: Topic;
}

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [topicDialogOpen, setTopicDialogOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false); // For fuzzy search modal
    const [contentToCreate, setContentToCreate] = useState('');
    const [shortcutsOpen, setShortcutsOpen] = useState(false); // For shortcuts help panel
    const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
    const theme = useTheme();


    useEffect(() => {
        fetch('/api/snippets')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Database connection failed');
                }
                return res.json();
            })
            .then(data => {
                console.log('Fetched snippets:', data.snippets);
                setSnippets(data.snippets || []);
                setTopics(data.topics || []);
                setIsUsingLocalStorage(false);
            })
            .catch(error => {
                console.warn('Using localStorage fallback due to:', error.message);
                setSnippets(loadLocalSnippets());
                setTopics(loadLocalTopics());
                setIsUsingLocalStorage(true);
            });
    }, []);

    async function createSnippet(name: string, content: string, topicId?: string) {
        if (isUsingLocalStorage) {
            // Create a new snippet with a unique ID and timestamp
            const newSnippet = createLocalSnippet(name, content, topicId);
            
            // If topicId is provided, find the topic and attach it
            if (topicId) {
                const topic = topics.find(t => t.id === topicId);
                if (topic) {
                    newSnippet.topic = topic;
                }
            }
            
            setSnippets(prev => [...prev, newSnippet]);
            return;
        }
        
        try {
            const res = await fetch('/api/snippets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content, topicId })
            });
            
            if (res.ok) {
                const data = await res.json();
                setSnippets(prev => [...prev, data.snippet]);
            } else {
                throw new Error('Failed to create snippet');
            }
        } catch (error) {
            console.error('Error creating snippet:', error);
            
            // Fallback to localStorage if API fails
            setIsUsingLocalStorage(true);
            
            // Create a new snippet with a unique ID and timestamp
            const newSnippet = createLocalSnippet(name, content, topicId);
            
            setSnippets(prev => [...prev, newSnippet]);
        }
    }
    
    async function createTopic(name: string, description?: string) {
        if (isUsingLocalStorage) {
            const newTopic = createLocalTopic(name, description);
            setTopics(prev => [...prev, newTopic]);
            return newTopic;
        }
        
        try {
            const res = await fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            if (res.ok) {
                const data = await res.json();
                setTopics(prev => [...prev, data.topic]);
                return data.topic;
            } else {
                throw new Error('Failed to create topic');
            }
        } catch (error) {
            console.error('Error creating topic:', error);
            
            // Fallback to localStorage if API fails
            setIsUsingLocalStorage(true);
            const newTopic = createLocalTopic(name, description);
            setTopics(prev => [...prev, newTopic]);
            return newTopic;
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

    // Filter snippets by selected topic
    const filteredSnippets = selectedTopic === 'all' 
        ? snippets 
        : snippets.filter(snippet => 
            snippet.topicId === selectedTopic || 
            (snippet.topic && snippet.topic.id === selectedTopic)
        );
        
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
            field: 'topic',
            headerName: 'Topic',
            width: 150,
            valueGetter: (params) => params.row.topic?.name || 'Uncategorized',
            renderCell: (params) => (
                <Box sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem'
                }}>
                    {params.row.topic?.name || 'Uncategorized'}
                </Box>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 180,
            valueFormatter: (params: any) => {
                console.log('Date value from server:', params.value);
                if (!params.value) return "No date";
                try {
                    const dateVal = new Date(params.value);
                    return dateVal.toLocaleString("en-US", { 
                        timeZone: "America/Los_Angeles",
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return "Invalid date";
                }
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
            // Toggle shortcuts help (Cmd/Ctrl + /)
            else if (modKey && e.key === '/') {
                e.preventDefault();
                setShortcutsOpen(prev => !prev);
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ color: theme.palette.text.primary }}>
                        MindPlace Snippets
                    </Typography>
                    {isUsingLocalStorage && (
                        <Tooltip title="Using browser localStorage (database not connected)">
                            <Box 
                                component="span" 
                                sx={{ 
                                    backgroundColor: theme.palette.warning.main,
                                    color: theme.palette.warning.contrastText,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                LOCAL STORAGE
                            </Box>
                        </Tooltip>
                    )}
                </Box>
                <Tooltip title="Press Cmd/Ctrl + / for keyboard shortcuts">
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}
                        onClick={() => setShortcutsOpen(true)}>
                        Keyboard Shortcuts (Cmd/Ctrl + /)
                    </Typography>
                </Tooltip>
            </Box>
            
            {/* Topic filter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                        variant={selectedTopic === 'all' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setSelectedTopic('all')}
                    >
                        All
                    </Button>
                    {topics.map(topic => (
                        <Button
                            key={topic.id}
                            variant={selectedTopic === topic.id ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => setSelectedTopic(topic.id)}
                        >
                            {topic.name} {topic._count && `(${topic._count.snippets})`}
                        </Button>
                    ))}
                </Box>
                <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setTopicDialogOpen(true)}
                >
                    New Topic
                </Button>
            </Box>

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
                    rows={filteredSnippets}
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
            </Box>

            {/* Updated prop names to onCloseAction and onCreateAction */}
            <CreateSnippetDialog
                open={dialogOpen}
                onCloseAction={() => setDialogOpen(false)}
                onCreateAction={createSnippet}
                initialContent={contentToCreate}
                topics={topics}
            />
            
            {/* Topic Creation Dialog */}
            <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="topic-name"
                        label="Topic Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        id="topic-description"
                        label="Description (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            const nameInput = document.getElementById('topic-name') as HTMLInputElement;
                            const descInput = document.getElementById('topic-description') as HTMLInputElement;
                            
                            if (nameInput && nameInput.value) {
                                createTopic(nameInput.value, descInput?.value || undefined);
                                setTopicDialogOpen(false);
                            }
                        }} 
                        variant="contained"
                    >
                        Create Topic
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Updated prop name to onCloseAction */}
            <FuzzySearchModal
                open={searchOpen}
                onCloseAction={() => setSearchOpen(false)}
                snippets={snippets}
            />

            {/* Keyboard Shortcuts Help Dialog */}
            <Dialog 
                open={shortcutsOpen} 
                onClose={() => setShortcutsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Keyboard Shortcuts
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Global Shortcuts
                    </Typography>
                    <Box component="table" sx={{ width: '100%', mb: 3 }}>
                        <Box component="tbody">
                            <Box component="tr">
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold' }}>Cmd/Ctrl + K</Box>
                                <Box component="td" sx={{ p: 1 }}>Open fuzzy search</Box>
                            </Box>
                            <Box component="tr">
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold' }}>Cmd/Ctrl + N</Box>
                                <Box component="td" sx={{ p: 1 }}>Create new snippet</Box>
                            </Box>
                            <Box component="tr">
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold' }}>Cmd/Ctrl + Shift + V</Box>
                                <Box component="td" sx={{ p: 1 }}>Paste from clipboard</Box>
                            </Box>
                            <Box component="tr">
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold' }}>Cmd/Ctrl + /</Box>
                                <Box component="td" sx={{ p: 1 }}>Toggle this help panel</Box>
                            </Box>
                        </Box>
                    </Box>

                    <Typography variant="h6" gutterBottom>
                        In Editor
                    </Typography>
                    <Box component="table" sx={{ width: '100%' }}>
                        <Box component="tbody">
                            <Box component="tr">
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold' }}>Tab</Box>
                                <Box component="td" sx={{ p: 1 }}>Switch between Edit and Preview tabs</Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
