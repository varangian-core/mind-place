"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Topic } from '@/lib/localStorageUtils';

interface CreateSnippetDialogProps {
    open: boolean;
    onCloseAction: () => void; // Renamed from onClose
    onCreateAction: (name: string, content: string, topicId?: string) => void; // Updated to include topicId
    initialContent?: string; // Optional prop for pasted content
    topics: Topic[]; // Available topics
}

export default function CreateSnippetDialog({ open, onCloseAction, onCreateAction, initialContent = '', topics }: CreateSnippetDialogProps) {
    const [name, setName] = useState('');
    const [content, setContent] = useState(initialContent);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedTopicId, setSelectedTopicId] = useState<string>('');
    
    // Update content when initialContent changes
    useEffect(() => {
        if (initialContent) {
            setContent(initialContent);
        }
    }, [initialContent]);

    function handleCreate() {
        onCreateAction(name, content, selectedTopicId || undefined);
        setName('');
        setContent('');
        setSelectedTopicId('');
        onCloseAction();
    }
    
    const handleTopicChange = (event: SelectChangeEvent) => {
        setSelectedTopicId(event.target.value);
    };

    const components = {
        code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        blockquote({ children }: any) {
            return (
                <Box
                    component="blockquote"
                    sx={{
                        borderLeft: '4px solid #ccc',
                        paddingLeft: 2,
                        marginY: 2,
                        color: 'text.secondary',
                        fontStyle: 'italic'
                    }}
                >
                    {children}
                </Box>
            );
        },
        img({ src, alt }: { src?: string; alt?: string }) {
            return (
                <img
                    src={src}
                    alt={alt}
                    style={{
                        maxWidth: '100%',
                        display: 'block',
                        margin: '1em 0'
                    }}
                />
            );
        },
        a({ href, children }: any) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        }
    };

    return (
        <Dialog open={open} onClose={onCloseAction} maxWidth="md" fullWidth>
            <DialogTitle>Create New Gist</DialogTitle>
            <DialogContent className="flex flex-col gap-4 mt-2">
                <TextField
                    label="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="URL"
                    value={name ? `/gist/${name.toLowerCase().replace(/\s+/g, '-')}` : '/gist/new'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                />
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="topic-select-label">Topic</InputLabel>
                    <Select
                        labelId="topic-select-label"
                        id="topic-select"
                        value={selectedTopicId}
                        label="Topic"
                        onChange={handleTopicChange}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {topics.map((topic) => (
                            <MenuItem key={topic.id} value={topic.id}>
                                {topic.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={(e, newVal) => setTabIndex(newVal)}>
                        <Tab label="Edit (Markdown)" />
                        <Tab label="Preview (HTML)" />
                    </Tabs>
                </Box>
                {tabIndex === 0 && (
                    <TextField
                        label="Markdown Content"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        fullWidth
                        multiline
                        rows={10}
                        placeholder="Write your markdown here, including ```code blocks``` and images!"
                    />
                )}
                {tabIndex === 1 && (
                    <Box
                        sx={{
                            p: 2,
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 400
                        }}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
                            {content || '*No content yet.*'}
                        </ReactMarkdown>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCloseAction}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" color="primary">
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
