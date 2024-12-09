"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, List, ListItemButton, Typography, IconButton, Box, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Fuse, { FuseResult } from 'fuse.js';

interface Snippet {
    id: string;
    name: string;
    content?: string;
    createdAt: string; // ISO string
}

interface FuzzySearchModalProps {
    open: boolean;
    onCloseAction: () => void; // already renamed for compliance
    snippets: Snippet[];
}

export default function FuzzySearchModal({ open, onCloseAction, snippets }: FuzzySearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FuseResult<Snippet>[]>([]);
    const theme = useTheme();

    const fuse = useMemo(() => {
        return new Fuse(snippets, {
            keys: ['name', 'content'],
            threshold: 0.3,
            ignoreLocation: true,
        });
    }, [snippets]);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }
        const searchResults = fuse.search(query);
        setResults(searchResults);
    }, [query, fuse]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            onCloseAction();
        }
    }

    function handleSelection(snippetId: string) {
        window.open(`/gist/${snippetId}`, '_blank');
        onCloseAction();
    }

    // We'll define some colors based on theme for the diagonal stripe effect
    const primaryColor = theme.palette.primary.main;
    const secondaryColor = theme.palette.secondary.main;
    const backgroundPaper = theme.palette.background.paper;

    return (
        <Dialog
            open={open}
            onClose={onCloseAction}
            fullWidth
            maxWidth="sm"
            sx={{
                '& .MuiPaper-root': {
                    borderRadius: 3, // Rounded corners for the dialog
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    // A subtle bottom border or shadow for separation
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
            >
                Fuzzy Find Snippets
                <IconButton onClick={onCloseAction}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    pt: 2,
                    pb: 0,
                    px: 2,
                    // Give the input area a slight styling
                }}
            >
                <TextField
                    autoFocus
                    fullWidth
                    placeholder="Type to search..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{
                        mb: 2,
                        // Slightly rounded and a subtle border
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />

                <List
                    sx={{
                        // Rounded corners for the list area
                        borderRadius: 2,
                        overflow: 'hidden',
                        pb: 0
                    }}
                >
                    {query && results.length === 0 && (
                        <ListItemButton disabled
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            py: 2,
                                            background: theme.palette.mode === 'dark'
                                                ? `linear-gradient(135deg, ${backgroundPaper} 0%, ${theme.palette.grey[800]} 100%)`
                                                : `linear-gradient(135deg, ${backgroundPaper} 0%, ${theme.palette.grey[200]} 100%)`
                                        }}
                        >
                            <Typography variant="body2" color="text.secondary">No results found</Typography>
                        </ListItemButton>
                    )}
                    {results.map((r) => (
                        <ListItemButton
                            key={r.item.id}
                            onClick={() => handleSelection(r.item.id)}
                            sx={{
                                cursor: 'pointer',
                                py: 1.5,
                                // Diagonal stripe background
                                // We'll create a subtle gradient that blends primary and secondary colors
                                background: `linear-gradient(135deg, ${primaryColor}0A 0%, ${secondaryColor}1A 100%)`,
                                // The above adds a subtle tinted stripe. Adjust "0A"/"1A" for transparency.
                                transition: 'background 0.2s ease',
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${primaryColor}33 0%, ${secondaryColor}33 100%)`
                                },
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{r.item.name}</Typography>
                                {r.item.content && (
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                        {r.item.content}
                                    </Typography>
                                )}
                            </Box>
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>
            {/* Adding a bit of spacing at bottom by a dummy div or adjusting the DialogContent */}
            <Box sx={{ height: 16 }}/>
        </Dialog>
    );
}
