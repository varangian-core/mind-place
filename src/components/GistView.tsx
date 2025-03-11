"use client";

import React, { useState } from 'react';
import { Box, Typography, Button, Tooltip, TextField, Tabs, Tab, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Snippet {
    id: string;
    name: string;
    content: string;
    createdAt: string; // ISO string from the server (UTC)
    topicId?: string;
    topic?: {
        id: string;
        name: string;
        description?: string;
    };
}

interface GistViewProps {
    snippet: Snippet;
}

export default function GistView({ snippet }: GistViewProps) {
    const [content, setContent] = useState(snippet.content);
    const [tabIndex, setTabIndex] = useState(0); // 0: view, 1: edit
    const [copied, setCopied] = useState(false);
    const theme = useTheme();

    function copyToClipboard() {
        navigator.clipboard.writeText(content)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));

        setTimeout(() => setCopied(false), 2000);
    }

    // Convert the ISO UTC string to PST for display
    const pstDate = new Date(snippet.createdAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });

    const components = {
        code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
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
                        pl: 2,
                        my: 2,
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
        <Box sx={{ p: 4, maxWidth: '800px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" component="h1">
                    {snippet.name}
                </Typography>
                {snippet.topic && (
                    <Box sx={{ 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.875rem'
                    }}>
                        {snippet.topic.name}
                    </Box>
                )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Created: {pstDate} (PST)
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabIndex} onChange={(e, newVal) => setTabIndex(newVal)}>
                    <Tab label="View" />
                    <Tab label="Edit" />
                </Tabs>
            </Box>

            {tabIndex === 0 ? (
                <Box sx={{ background: 'rgba(0,0,0,0.05)', p:2, borderRadius:1 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
                        {content || '*No content yet.*'}
                    </ReactMarkdown>
                </Box>
            ) : (
                <TextField
                    label="Edit Markdown Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    fullWidth
                    multiline
                    rows={15}
                />
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {tabIndex === 1 && (
                    <Button variant="contained" onClick={() => setTabIndex(0)}>
                        Done Editing
                    </Button>
                )}

                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                    <Button variant="outlined" onClick={copyToClipboard}>
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    );
}
