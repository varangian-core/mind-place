"use client";

import { Box, Typography, Button, Tooltip, TextField, Tabs, Tab, useTheme } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiUpload, 
  FiImage, 
  FiType, 
  FiHeading,
  FiList,
  FiCode,
  FiLink,
  FiMinus,
  FiChevronRight
} from 'react-icons/fi';
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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif']
        },
        maxFiles: 1,
        onDrop: acceptedFiles => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                const reader = new FileReader();
                reader.onload = () => {
                    const markdownImage = `![${file.name}](${reader.result})`;
                    setContent(prev => `${prev}\n${markdownImage}\n`);
                };
                reader.readAsDataURL(file);
            }
        }
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                setTabIndex(prev => prev === 0 ? 1 : 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addFormatting = (format: string) => {
        const formats = {
            h1: '\n# Heading 1\n',
            h2: '\n## Heading 2\n',
            h3: '\n### Heading 3\n',
            bold: '**bold text**',
            italic: '_italic text_',
            code: '```\ncode block\n```',
            image: '![alt text](image-url)',
            link: '[link text](url)',
            list: '- List item',
            quote: '> Block quote',
            divider: '\n---\n',
            tab: '    ' // 4 spaces for tab
        };
        
        const textarea = document.querySelector('textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        let newContent = content;
        let cursorOffset = 0;
        
        switch (format) {
            case 'tab':
                newContent = 
                    content.substring(0, start) + 
                    '    ' + 
                    content.substring(end);
                cursorOffset = 4;
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'quote':
            case 'divider':
                newContent = 
                    content.substring(0, start) + 
                    formats[format as keyof typeof formats] + 
                    content.substring(end);
                break;
            default:
                newContent = 
                    content.substring(0, start) + 
                    formats[format as keyof typeof formats] + 
                    (selectedText ? selectedText : '') + 
                    content.substring(end);
                cursorOffset = formats[format as keyof typeof formats].length;
        }
        
        setContent(newContent);
        
        // Set cursor position after insertion
        setTimeout(() => {
            textarea.selectionStart = start + cursorOffset;
            textarea.selectionEnd = start + cursorOffset + (selectedText.length || 0);
            textarea.focus();
        }, 0);
    };

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
                <Box {...getRootProps()} sx={{ 
                    border: isDragActive ? '2px dashed #1976d2' : '1px dashed #ccc',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
                }}>
                    <input {...getInputProps()} />
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mb: 2,
                        flexWrap: 'wrap'
                    }}>
                        <Tooltip title="Heading 1 (Cmd+1)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiHeading />}
                                onClick={() => addFormatting('h1')}
                            >H1</Button>
                        </Tooltip>
                        <Tooltip title="Heading 2 (Cmd+2)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiHeading />}
                                onClick={() => addFormatting('h2')}
                            >H2</Button>
                        </Tooltip>
                        <Tooltip title="Heading 3 (Cmd+3)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiHeading />}
                                onClick={() => addFormatting('h3')}
                            >H3</Button>
                        </Tooltip>
                        <Tooltip title="Bold (Cmd+B)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiType />}
                                onClick={() => addFormatting('bold')}
                            >B</Button>
                        </Tooltip>
                        <Tooltip title="List (Cmd+L)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiList />}
                                onClick={() => addFormatting('list')}
                            >List</Button>
                        </Tooltip>
                        <Tooltip title="Code (Cmd+K)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiCode />}
                                onClick={() => addFormatting('code')}
                            >Code</Button>
                        </Tooltip>
                        <Tooltip title="Link (Cmd+Shift+L)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiLink />}
                                onClick={() => addFormatting('link')}
                            >Link</Button>
                        </Tooltip>
                        <Tooltip title="Quote (Cmd+Q)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiChevronRight />}
                                onClick={() => addFormatting('quote')}
                            >Quote</Button>
                        </Tooltip>
                        <Tooltip title="Divider (Cmd+D)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiMinus />}
                                onClick={() => addFormatting('divider')}
                            >Divider</Button>
                        </Tooltip>
                        <Tooltip title="Tab (Tab)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => addFormatting('tab')}
                            >Tab</Button>
                        </Tooltip>
                        <Tooltip title="Upload Image">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiUpload />}
                                onClick={e => {
                                    e.stopPropagation();
                                    document.getElementById('file-upload')?.click();
                                }}
                            >Image</Button>
                        </Tooltip>
                    </Box>
                    
                    <TextField
                        label="Edit Markdown Content"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        fullWidth
                        multiline
                        rows={15}
                        onKeyDown={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                                switch (e.key) {
                                    case 'b':
                                        e.preventDefault();
                                        addFormatting('bold');
                                        break;
                                    case 'i':
                                        e.preventDefault();
                                        addFormatting('italic');
                                        break;
                                    case '1':
                                        e.preventDefault();
                                        addFormatting('h1');
                                        break;
                                    case '2':
                                        e.preventDefault();
                                        addFormatting('h2');
                                        break;
                                    case '3':
                                        e.preventDefault();
                                        addFormatting('h3');
                                        break;
                                    case 'l':
                                        e.preventDefault();
                                        addFormatting('list');
                                        break;
                                    case 'k':
                                        e.preventDefault();
                                        addFormatting('code');
                                        break;
                                    case 'q':
                                        e.preventDefault();
                                        addFormatting('quote');
                                        break;
                                    case 'd':
                                        e.preventDefault();
                                        addFormatting('divider');
                                        break;
                                }
                            } else if (e.key === 'Tab') {
                                e.preventDefault();
                                addFormatting('tab');
                            }
                        }}
                        sx={{
                            fontFamily: 'monospace',
                            '& .MuiInputBase-input': {
                                fontSize: '0.875rem',
                                lineHeight: 1.5,
                            }
                        }}
                    />
                    
                    {isDragActive && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            zIndex: 1
                        }}>
                            <Typography variant="h6" color="primary">
                                Drop image to upload
                            </Typography>
                        </Box>
                    )}
                </Box>
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
