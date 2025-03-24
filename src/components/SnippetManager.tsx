"use client";

import React, { useEffect, useState, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, Typography, Fab, Tooltip, useTheme, IconButton, Dialog, Button, TextField, DialogTitle, DialogContent, DialogActions, Chip, MenuItem, Select, FormControl, InputLabel, DialogContentText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import * as icons from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { DataGrid, GridColDef } from '@mui/x-data-grid';


import { loadLocalSnippets, loadLocalTopics, createLocalSnippet, createLocalTopic } from '@/lib/localStorageUtils';

import CreateSnippetDialog from './CreateSnippetDialog';
import FuzzySearchModal from './FuzzySearchModal';

interface Topic {
    id: string;
    name: string;
    description?: string;
    icon?: keyof typeof icons;
    color?: string;
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
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [searchOpen, setSearchOpen] = useState(false); // For fuzzy search modal
    const [contentToCreate, setContentToCreate] = useState('');
    const [shortcutsOpen, setShortcutsOpen] = useState(false); // For shortcuts help panel
    const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        
        // Add null checks for active and over objects
        if (!active || !over || !active.id || !over.id) {
            console.error('Invalid drag event:', event);
            return;
        }
        
        if (active.id !== over.id) {
            setTopics((topics) => {
                // Add null checks for topic arrays
                if (!Array.isArray(topics)) {
                    console.error('Topics is not an array:', topics);
                    return topics;
                }
                
                const oldIndex = topics.findIndex(topic => topic?.id === active.id);
                const newIndex = topics.findIndex(topic => topic?.id === over.id);
                
                // Validate indices
                if (oldIndex === -1 || newIndex === -1) {
                    console.error('Invalid indices:', { oldIndex, newIndex });
                    return topics;
                }
                
                const newTopics = arrayMove(topics, oldIndex, newIndex);
                
                // Save new order to localStorage or API
                if (isUsingLocalStorage) {
                    try {
                        saveLocalTopics(newTopics);
                    } catch (error) {
                        console.error('Error saving topics:', error);
                    }
                } else {
                    // TODO: Implement API endpoint for reordering
                }
                
                return newTopics;
            });
        }
    };

    const handleDeleteTopic = async (topicId) => {
        if (window.confirm('Are you sure you want to delete this topic? All associated snippets will be moved to "Uncategorized".')) {
            if (isUsingLocalStorage) {
                // Remove topic and update snippets
                const updatedTopics = topics.filter(topic => topic.id !== topicId);
                setTopics(updatedTopics);
                saveLocalTopics(updatedTopics);
                
                // Update snippets to remove topic association
                const snippets = loadLocalSnippets();
                const updatedSnippets = snippets.map(snippet => {
                    if (snippet.topicId === topicId) {
                        return { ...snippet, topicId: undefined };
                    }
                    return snippet;
                });
                setSnippets(updatedSnippets);
                saveLocalSnippets(updatedSnippets);
            } else {
                // TODO: Implement API endpoint for deletion
            }
        }
    };
    const theme = useTheme();


    useEffect(() => {
        // Only run this effect in the browser
        if (typeof window !== 'undefined') {
            fetch('/api/snippets')
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Database connection failed');
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Fetched snippets:', data);
                    
                    // Check if the API is telling us to use localStorage
                    if (data.usingLocalStorage) {
                        console.warn('API indicated to use localStorage');
                        setSnippets(loadLocalSnippets());
                        setTopics(loadLocalTopics());
                        setIsUsingLocalStorage(true);
                    } else {
                        setSnippets(data.snippets || []);
                        setTopics(data.topics || []);
                        setIsUsingLocalStorage(false);
                    }
                })
                .catch(error => {
                    console.warn('Using localStorage fallback due to:', error.message);
                    setSnippets(loadLocalSnippets());
                    setTopics(loadLocalTopics());
                    setIsUsingLocalStorage(true);
                });
        }
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
    
    async function createTopic(name: string, description?: string, icon?: string) {
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
    
    // Prepare data for DataGrid - ensure all required fields exist
    const safeSnippets = Array.isArray(filteredSnippets) 
        ? filteredSnippets.map(snippet => {
            // Create a safe copy of the snippet
            const safeSnippet = {
                ...snippet,
                id: snippet?.id || `fallback-${Math.random()}`,
                name: snippet?.name || 'Untitled',
                content: snippet?.content || '',
                createdAt: snippet?.createdAt || new Date().toISOString(),
                topicName: snippet?.topic?.name || 'Uncategorized'
            };

            // Additional validation
            if (typeof safeSnippet.id !== 'string') {
                safeSnippet.id = `fallback-${Math.random()}`;
            }
            if (typeof safeSnippet.name !== 'string') {
                safeSnippet.name = 'Untitled';
            }
            if (typeof safeSnippet.content !== 'string') {
                safeSnippet.content = '';
            }
            if (typeof safeSnippet.createdAt !== 'string') {
                safeSnippet.createdAt = new Date().toISOString();
            }
            if (typeof safeSnippet.topicName !== 'string') {
                safeSnippet.topicName = 'Uncategorized';
            }

            return safeSnippet;
        })
        : [];
        
    const columns: GridColDef[] = Array.isArray(safeSnippets) ? [
        { 
            field: 'name', 
            headerName: 'Name', 
            flex: 1, 
            minWidth: 150,
            renderCell: (params) => {
                if (!params.row) return null;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{params.row.name || ''}</span>
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
                );
            }
        },
        {
            field: 'url',
            headerName: 'URL',
            width: 60,
            sortable: false,
            renderCell: (params) => {
                if (!params.row) return null;
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
            field: 'topicName',
            headerName: 'Topic',
            width: 150,
            renderCell: (params) => {
                if (!params.row) return null;
                return (
                    <Box sx={{ 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                    }}>
                        {params.row.topicName || 'Uncategorized'}
                    </Box>
                );
            }
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 180,
            valueFormatter: (params) => {
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
                if (!params.row) return null;
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
    ] : [];

    // Ensure rows is always an array
    const rows = Array.isArray(safeSnippets) ? safeSnippets : [];

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
        <Box sx={{ 
            position: 'relative', 
            height: '100%',
            backgroundColor: theme.palette.background.default,
            padding: 2,
            borderRadius: 2
        }}>
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

            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                backgroundColor: theme.palette.background.paper,
                padding: 2,
                borderRadius: 2
            }}>
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
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                backgroundColor: theme.palette.background.paper,
                padding: 2,
                borderRadius: 2
            }}>
                <DndContext 
                    sensors={useSensors(
                        useSensor(PointerSensor),
                        useSensor(KeyboardSensor, {
                            coordinateGetter: sortableKeyboardCoordinates,
                        })
                    )}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={topics}
                        strategy={verticalListSortingStrategy}
                    >
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button 
                                variant={selectedTopic === 'all' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => setSelectedTopic('all')}
                            >
                                All
                            </Button>
                            {topics.map((topic, index) => (
                                <SortableItem key={topic.id} id={topic.id} index={index}>
                                    <Chip
                                        label={`${topic.name} ${topic._count ? `(${topic._count.snippets})` : ''}`}
                                        onClick={() => {
                                            setEditingTopic(topic);
                                            setTopicDialogOpen(true);
                                        }}
                                        onDelete={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTopic(topic.id);
                                        }}
                                        deleteIcon={
                                            <Tooltip title="Delete topic">
                                                <DeleteIcon />
                                            </Tooltip>
                                        }
                                        variant="outlined"
                                        icon={topic.icon ? React.createElement(icons[topic.icon], { fontSize: 'small' }) : undefined}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover,
                                            },
                                            '& .MuiChip-deleteIcon': {
                                                color: theme.palette.text.secondary,
                                                '&:hover': {
                                                    color: theme.palette.error.main
                                                }
                                            }
                                        }}
                                    />
                                </SortableItem>
                            ))}
                        </Box>
                    </SortableContext>
                </DndContext>
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
                    height: 'calc(100vh - 300px)', // Take up remaining vertical space
                    minHeight: 400, // Minimum height
                    maxHeight: 800, // Maximum height
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)'}`,
                    background: theme.palette.mode === 'dark' 
                        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                        : theme.palette.background.paper,
                    transition: 'background 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row.id || 'fallback-id'}
                    pageSizeOptions={[5, 10]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 5, page: 0 }
                        }
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        flex: 1, // Take up all available space in parent
                        width: '100%'
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
                        },
                        // Fix for black border in light mode
                        '& .MuiDataGrid-main': {
                            border: `1px solid ${theme.palette.divider}`
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
            
            {/* Topic Creation/Edit Dialog */}
            <Dialog 
                open={topicDialogOpen} 
                onClose={() => {
                    setTopicDialogOpen(false);
                    setEditingTopic(null);
                }} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle>{editingTopic ? `Edit "${editingTopic.name}"` : 'Create New Topic'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="topic-name"
                            label="Topic Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            sx={{ flex: 2 }}
                            defaultValue={editingTopic?.name || ''}
                        />
                        <FormControl fullWidth sx={{ flex: 1 }}>
                            <InputLabel>Icon</InputLabel>
                            <Select
                                label="Icon"
                                id="topic-icon"
                                defaultValue={editingTopic?.icon || ''}
                            >
                                <MenuItem value="">None</MenuItem>
                                {icons && Object.entries(icons).map(([name, IconComponent]) => (
                                    <MenuItem key={name} value={name}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {React.createElement(IconComponent, { fontSize: 'small' })}
                                            {name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Color</InputLabel>
                        <Select
                            label="Color"
                            id="topic-color"
                            defaultValue={editingTopic?.color || ''}
                        >
                            <MenuItem value="">Default</MenuItem>
                            <MenuItem value="primary">Primary</MenuItem>
                            <MenuItem value="secondary">Secondary</MenuItem>
                            <MenuItem value="error">Error</MenuItem>
                            <MenuItem value="warning">Warning</MenuItem>
                            <MenuItem value="info">Info</MenuItem>
                            <MenuItem value="success">Success</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        id="topic-description"
                        label="Description (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        defaultValue={editingTopic?.description || ''}
                    />
                    {editingTopic && (
                        <DialogContentText sx={{ mt: 2, color: theme.palette.text.secondary }}>
                            Created snippets: {editingTopic._count?.snippets || 0}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            const nameInput = document.getElementById('topic-name') as HTMLInputElement;
                            const descInput = document.getElementById('topic-description') as HTMLInputElement;
                            
                            if (nameInput && nameInput.value) {
                                const iconInput = document.getElementById('topic-icon') as HTMLSelectElement;
                                const colorInput = document.getElementById('topic-color') as HTMLSelectElement;
                                
                                if (editingTopic) {
                                    // Update existing topic
                                    const updatedTopic = {
                                        ...editingTopic,
                                        name: nameInput.value,
                                        description: descInput?.value || undefined,
                                        icon: iconInput?.value || undefined,
                                        color: colorInput?.value || undefined
                                    };
                                    
                                    if (isUsingLocalStorage) {
                                        const updatedTopics = topics.map(t => 
                                            t.id === editingTopic.id ? updatedTopic : t
                                        );
                                        setTopics(updatedTopics);
                                        saveLocalTopics(updatedTopics);
                                    } else {
                                        // TODO: Implement API endpoint for updating
                                    }
                                } else {
                                    // Create new topic
                                    createTopic(
                                        nameInput.value, 
                                        descInput?.value || undefined,
                                        iconInput?.value || undefined,
                                        colorInput?.value || undefined
                                    );
                                }
                                setTopicDialogOpen(false);
                                setEditingTopic(null);
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
                PaperProps={{
                    sx: {
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            borderWidth: '0 40px 40px 0',
                            borderColor: `transparent ${theme.palette.secondary.main} transparent transparent`,
                            zIndex: 1
                        }
                    }
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Keyboard Shortcuts
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, color: theme.palette.secondary.main }}>
                        Global Shortcuts
                    </Typography>
                    <Box component="table" sx={{ width: '100%', mb: 3 }}>
                        <Box component="tbody">
                            <Box component="tr" sx={{ 
                                '&:nth-of-type(odd)': { 
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.05)' 
                                        : 'rgba(0,0,0,0.02)' 
                                }
                            }}>
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Cmd/Ctrl + K</Box>
                                <Box component="td" sx={{ p: 1 }}>Open fuzzy search</Box>
                            </Box>
                            <Box component="tr" sx={{ 
                                '&:nth-of-type(even)': { 
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.02)' 
                                        : 'rgba(0,0,0,0.01)' 
                                }
                            }}>
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Cmd/Ctrl + N</Box>
                                <Box component="td" sx={{ p: 1 }}>Create new snippet</Box>
                            </Box>
                            <Box component="tr" sx={{ 
                                '&:nth-of-type(odd)': { 
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.05)' 
                                        : 'rgba(0,0,0,0.02)' 
                                }
                            }}>
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Cmd/Ctrl + Shift + V</Box>
                                <Box component="td" sx={{ p: 1 }}>Paste from clipboard</Box>
                            </Box>
                            <Box component="tr" sx={{ 
                                '&:nth-of-type(even)': { 
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.02)' 
                                        : 'rgba(0,0,0,0.01)' 
                                }
                            }}>
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Cmd/Ctrl + /</Box>
                                <Box component="td" sx={{ p: 1 }}>Toggle this help panel</Box>
                            </Box>
                        </Box>
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.secondary.main }}>
                        In Editor
                    </Typography>
                    <Box component="table" sx={{ width: '100%' }}>
                        <Box component="tbody">
                            <Box component="tr" sx={{ 
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.02)' 
                            }}>
                                <Box component="td" sx={{ p: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Tab</Box>
                                <Box component="td" sx={{ p: 1 }}>Switch between Edit and Preview tabs</Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
