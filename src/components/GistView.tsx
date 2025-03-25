"use client";

import { Box, Typography, Button, Tooltip, TextField, Tabs, Tab, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

interface User {
    id: string;
    name: string;
    email: string;
    timezone?: string;
}

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
    user?: User;
}

interface GistViewProps {
    snippet: Snippet;
    currentUser?: User;
}

export default function GistView({ snippet, currentUser }: GistViewProps) {
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

    // Convert the ISO UTC string to user's timezone
    const userTimezone = currentUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formattedDate = new Date(snippet.createdAt).toLocaleString("en-US", { 
        timeZone: userTimezone,
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const components = {
        code({ inline, className, children, ...props }: unknown) {
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
        blockquote({ children }: unknown) {
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
        a({ href, children }: unknown) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        },
        h1({ children }: unknown) {
            return <Typography variant="h1" component="h1" sx={{ mt: 3, mb: 2 }}>{children}</Typography>;
        },
        h2({ children }: unknown) {
            return <Typography variant="h2" component="h2" sx={{ mt: 2.5, mb: 1.5 }}>{children}</Typography>;
        },
        h3({ children }: unknown) {
            return <Typography variant="h3" component="h3" sx={{ mt: 2, mb: 1 }}>{children}</Typography>;
        },
        p({ children }: unknown) {
            return <Typography paragraph sx={{ mb: 2 }}>{children}</Typography>;
        },
        ul({ children }: unknown) {
            return <Box component="ul" sx={{ pl: 4, mb: 2 }}>{children}</Box>;
        },
        ol({ children }: unknown) {
            return <Box component="ol" sx={{ pl: 4, mb: 2 }}>{children}</Box>;
        },
        li({ children }: unknown) {
            return <Box component="li" sx={{ mb: 1 }}>{children}</Box>;
        },
        table({ children }: unknown) {
            return (
                <Box component="div" sx={{ overflowX: 'auto', mb: 2 }}>
                    <Box component="table" sx={{ minWidth: 650 }}>{children}</Box>
                </Box>
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Created: {formattedDate} ({userTimezone})
                </Typography>
                {snippet.user && (
                    <Typography variant="subtitle2" color="text.secondary">
                        by {snippet.user.name || snippet.user.email}
                    </Typography>
                )}
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabIndex} onChange={(e, newVal) => setTabIndex(newVal)}>
                    <Tab label="View" />
                    <Tab label="Edit" />
                </Tabs>
            </Box>

            {tabIndex === 0 ? (
                <Box sx={{ background: 'rgba(0,0,0,0.05)', p:2, borderRadius:1 }}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[
                            rehypeRaw,
                            [rehypeSanitize, {
                                ...defaultSchema,
                                attributes: {
                                    ...defaultSchema.attributes,
                                    code: [
                                        ...(defaultSchema.attributes?.code || []),
                                        // Allow class names for syntax highlighting
                                        ['className']
                                    ]
                                }
                            }]
                        ]}
                        components={components as unknown}
                        skipHtml={false}
                    >
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
                    sx={{
                        fontFamily: 'monospace',
                        '& .MuiInputBase-input': {
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                        }
                    }}
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
