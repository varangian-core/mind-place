"use client";

import React, { useEffect, useState } from 'react';
import { TextField, Button, List, ListItem, Typography, Box } from '@mui/material';

interface Snippet {
    id: string;
    name: string;
}

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        fetch('/api/snippets')
            .then(res => res.json())
            .then(data => {
                setSnippets(data.snippets);
            });
    }, []);

    async function createSnippet() {
        const res = await fetch('/api/snippets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content })
        });
        if (res.ok) {
            const data = await res.json();
            setSnippets(prev => [...prev, data.snippet]);
            setName('');
            setContent('');
        } else {
            console.error('Error creating snippet');
        }
    }

    return (
        <Box className="p-4 max-w-lg mx-auto">
            <Typography variant="h4" component="h1" gutterBottom>
                MindPlace Snippets
            </Typography>

            <Box className="mb-8">
                <Typography variant="h6" gutterBottom>
                    Create a New Snippet
                </Typography>
                <TextField
                    label="Name"
                    variant="outlined"
                    className="mr-2 mb-2"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    size="small"
                />
                <TextField
                    label="Content"
                    variant="outlined"
                    className="mr-2 mb-2"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    size="small"
                    multiline
                    rows={3}
                />
                <Button variant="contained" color="primary" onClick={createSnippet}>
                    Create
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
                Your Snippets
            </Typography>
            <List>
                {snippets.map((snippet) => (
                    <ListItem key={snippet.id} divider>
                        {snippet.name}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
