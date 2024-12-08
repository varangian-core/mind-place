"use client";

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface CreateSnippetDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, content: string) => void;
}

export default function CreateSnippetDialog({ open, onClose, onCreate }: CreateSnippetDialogProps) {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    function handleCreate() {
        onCreate(name, content);
        setName('');
        setContent('');
        onClose();
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create New Gist</DialogTitle>
            <DialogContent className="flex flex-col gap-4 mt-2">
                <TextField
                    label="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" color="primary">Create</Button>
            </DialogActions>
        </Dialog>
    );
}
