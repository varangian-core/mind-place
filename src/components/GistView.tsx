"use client";

import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiUpload, 
  FiImage, 
  FiType, 
  FiList,
  FiCode,
  FiLink,
  FiMinus,
  FiChevronRight,
  FiHash
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
        const textarea = document.querySelector('textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = content.indexOf('\n', end);
        const currentLine = lineEnd === -1 
            ? content.substring(lineStart)
            : content.substring(lineStart, lineEnd);
        
        let newContent = content;
        let cursorOffset = 0;
        let newSelectionLength = 0;

        switch (format) {
            case 'h1':
            case 'h2':
            case 'h3':
                const level = parseInt(format[1]);
                const hashes = '#'.repeat(level);
                if (currentLine.trim().startsWith('#')) {
                    // Remove existing header if already a header
                    newContent = 
                        content.substring(0, lineStart) +
                        currentLine.replace(/^#+\s*/, '') +
                        content.substring(lineEnd);
                    cursorOffset = -currentLine.match(/^#+\s*/)?.[0]?.length || 0;
                } else {
                    // Add header formatting
                    newContent = 
                        content.substring(0, lineStart) +
                        `${hashes} ${currentLine}` +
                        content.substring(lineEnd);
                    cursorOffset = hashes.length + 1;
                }
                break;

            case 'list':
                if (currentLine.match(/^[*-]\s/)) {
                    // Remove list formatting if already a list
                    newContent = 
                        content.substring(0, lineStart) +
                        currentLine.replace(/^[*-]\s/, '') +
                        content.substring(lineEnd);
                    cursorOffset = -2;
                } else {
                    // Add list formatting
                    newContent = 
                        content.substring(0, lineStart) +
                        `- ${currentLine}` +
                        content.substring(lineEnd);
                    cursorOffset = 2;
                }
                break;

            case 'numberedList':
                if (currentLine.match(/^\d+\.\s/)) {
                    // Remove numbered list formatting if already numbered
                    newContent = 
                        content.substring(0, lineStart) +
                        currentLine.replace(/^\d+\.\s/, '') +
                        content.substring(lineEnd);
                    cursorOffset = -currentLine.match(/^\d+\.\s/)?.[0]?.length || 0;
                } else {
                    // Add numbered list formatting
                    const lineNumber = content.substring(0, lineStart).split('\n').filter(l => l.match(/^\d+\.\s/)).length + 1;
                    newContent = 
                        content.substring(0, lineStart) +
                        `${lineNumber}. ${currentLine}` +
                        content.substring(lineEnd);
                    cursorOffset = `${lineNumber}. `.length;
                }
                break;

            case 'bold':
                if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
                    // Remove bold formatting if already bold
                    newContent = 
                        content.substring(0, start) +
                        selectedText.slice(2, -2) +
                        content.substring(end);
                    cursorOffset = -2;
                    newSelectionLength = -4;
                } else {
                    // Add bold formatting
                    newContent = 
                        content.substring(0, start) +
                        `**${selectedText || 'bold text'}**` +
                        content.substring(end);
                    cursorOffset = 2;
                    newSelectionLength = selectedText ? 0 : 9;
                }
                break;

            case 'tab':
                newContent = 
                    content.substring(0, start) + 
                    '    ' + 
                    content.substring(end);
                cursorOffset = 4;
                break;

            case 'italic':
                if (selectedText.startsWith('_') && selectedText.endsWith('_')) {
                    newContent = 
                        content.substring(0, start) +
                        selectedText.slice(1, -1) +
                        content.substring(end);
                    cursorOffset = -1;
                    newSelectionLength = -2;
                } else {
                    newContent = 
                        content.substring(0, start) +
                        `_${selectedText || 'italic text'}_` +
                        content.substring(end);
                    cursorOffset = 1;
                    newSelectionLength = selectedText ? 0 : 11;
                }
                break;

            case 'code':
                newContent = 
                    content.substring(0, start) +
                    '```\n' + 
                    (selectedText || 'code block') + 
                    '\n```' +
                    content.substring(end);
                cursorOffset = 4;
                newSelectionLength = selectedText ? 0 : 10;
                break;

            case 'image':
                newContent = 
                    content.substring(0, start) +
                    `![alt text](${selectedText || 'image-url'})` +
                    content.substring(end);
                cursorOffset = 2;
                newSelectionLength = selectedText ? 0 : 9;
                break;

            case 'link':
                newContent = 
                    content.substring(0, start) +
                    `[link text](${selectedText || 'url'})` +
                    content.substring(end);
                cursorOffset = 1;
                newSelectionLength = selectedText ? 0 : 8;
                break;

            case 'divider':
                newContent = 
                    content.substring(0, start) +
                    '\n---\n' +
                    content.substring(end);
                cursorOffset = 5;
                break;
        
            case 'h1':
                newContent = 
                    content.substring(0, start) + 
                    formats.header(1, selectedText) + 
                    content.substring(end);
                cursorOffset = 2;
                break;
            case 'h2':
                newContent = 
                    content.substring(0, start) + 
                    formats.header(2, selectedText) + 
                    content.substring(end);
                cursorOffset = 3;
                break;
            case 'h3':
                newContent = 
                    content.substring(0, start) + 
                    formats.header(3, selectedText) + 
                    content.substring(end);
                cursorOffset = 4;
                break;
            case 'list':
                newContent = 
                    content.substring(0, start) + 
                    formats.list(selectedText) + 
                    content.substring(end);
                cursorOffset = 2;
                break;
            case 'numberedList':
                newContent = 
                    content.substring(0, start) + 
                    formats.numberedList(selectedText) + 
                    content.substring(end);
                cursorOffset = 3;
                break;
            case 'quote':
                newContent = 
                    content.substring(0, start) + 
                    formats.quote(selectedText) + 
                    content.substring(end);
                cursorOffset = 2;
                break;
            case 'divider':
                newContent = 
                    content.substring(0, start) + 
                    formats.divider + 
                    content.substring(end);
                cursorOffset = 4;
                break;
            default:
                newContent = 
                    content.substring(0, start) + 
                    formats[format as keyof typeof formats] + 
                    (selectedText ? selectedText : '') + 
                    content.substring(end);
                cursorOffset = typeof formats[format as keyof typeof formats] === 'string' 
                    ? formats[format as keyof typeof formats].length 
                    : 0;
        }
        
        setContent(newContent);
        
        // Set cursor position after insertion
        setTimeout(() => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.selectionStart = start + cursorOffset;
                textarea.selectionEnd = start + cursorOffset + (selectedText.length + newSelectionLength || 0);
                textarea.focus();
            }
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
                <Box sx={{ 
                    my: 2,
                    borderRadius: 1,
                    overflow: 'hidden'
                }}>
                    <SyntaxHighlighter 
                        style={theme.palette.mode === 'dark' ? vscDarkPlus : oneDark} 
                        language={match[1]} 
                        PreTag="div" 
                        {...props}
                        customStyle={{
                            margin: 0,
                            padding: '1em',
                            fontSize: '0.9em'
                        }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </Box>
            ) : (
                <code style={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    padding: '0.2em 0.4em',
                    borderRadius: 3,
                    fontSize: '0.9em',
                    fontFamily: 'monospace'
                }}>
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
            return <Typography component="h1" sx={{ 
                fontSize: '2em',
                fontWeight: 700,
                mt: 3, 
                mb: 2,
                lineHeight: 1.3,
                color: theme.palette.text.primary
            }}>{children}</Typography>;
        },
        h2({ children }: unknown) {
            return <Typography component="h2" sx={{ 
                fontSize: '1.5em',
                fontWeight: 600,
                mt: 2.5, 
                mb: 1.5,
                lineHeight: 1.3,
                color: theme.palette.text.primary
            }}>{children}</Typography>;
        },
        h3({ children }: unknown) {
            return <Typography component="h3" sx={{ 
                fontSize: '1.17em',
                fontWeight: 600,
                mt: 2, 
                mb: 1,
                lineHeight: 1.3,
                color: theme.palette.text.primary
            }}>{children}</Typography>;
        },
        p({ children }: unknown) {
            return <Typography component="p" sx={{ mb: 2 }}>{children}</Typography>;
        },
        strong({ children }: unknown) {
            return <strong style={{ fontWeight: 600 }}>{children}</strong>;
        },
        em({ children }: unknown) {
            return <em style={{ fontStyle: 'italic' }}>{children}</em>;
        },
        ul({ children }: unknown) {
            return <Box component="ul" sx={{ 
                pl: 4, 
                mb: 2,
                listStyleType: 'disc',
                '& ul': { listStyleType: 'circle' },
                '& ul ul': { listStyleType: 'square' }
            }}>{children}</Box>;
        },
        ol({ children }: unknown) {
            return <Box component="ol" sx={{ 
                pl: 4, 
                mb: 2,
                listStyleType: 'decimal',
                '& ol': { listStyleType: 'lower-alpha' },
                '& ol ol': { listStyleType: 'lower-roman' }
            }}>{children}</Box>;
        },
        li({ children }: unknown) {
            return <Box component="li" sx={{ 
                mb: 1,
                '& > p': { display: 'inline', m: 0 }
            }}>{children}</Box>;
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
        <Box component="div" sx={{ p: 4, maxWidth: '800px', mx: 'auto' }}>
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
                <Box sx={{ 
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    p: 3,
                    borderRadius: 1,
                    '& *': {
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                    },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                        color: theme.palette.text.primary,
                        lineHeight: 1.3,
                        '&:first-of-type': { mt: 0 }
                    },
                    '& p': {
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        mb: 2
                    },
                    '& strong': {
                        fontWeight: 700,
                        color: theme.palette.text.primary
                    },
                    '& em': {
                        fontStyle: 'italic'
                    },
                    '& ul, & ol': {
                        mb: 2,
                        pl: 4
                    },
                    '& li': {
                        mb: 1
                    },
                    '& blockquote': {
                        borderLeft: `4px solid ${theme.palette.divider}`,
                        pl: 2,
                        my: 2,
                        color: theme.palette.text.secondary,
                        fontStyle: 'italic'
                    }
                }}>
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
                                        ['className']
                                    ],
                                    span: [
                                        ...(defaultSchema.attributes?.span || []),
                                        ['className']
                                    ]
                                }
                            }]
                        ]}
                        components={components}
                        skipHtml={false}
                        unwrapDisallowed={false}
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
                                variant={currentLine.trim().startsWith('# ') ? "contained" : "outlined"}
                                size="small"
                                startIcon={<FiHash />}
                                onClick={() => addFormatting('h1')}
                            >H1</Button>
                        </Tooltip>
                        <Tooltip title="Heading 2 (Cmd+2)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiType />}
                                onClick={() => addFormatting('h2')}
                            >H2</Button>
                        </Tooltip>
                        <Tooltip title="Heading 3 (Cmd+3)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiHash />}
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
                        <Tooltip title="Bullet List (Cmd+L)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiList />}
                                onClick={() => addFormatting('list')}
                            >Bullets</Button>
                        </Tooltip>
                        <Tooltip title="Numbered List (Cmd+Shift+L)">
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<FiList />}
                                onClick={() => addFormatting('numberedList')}
                            >Numbers</Button>
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
                            // Handle tab key
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                addFormatting('tab');
                                return;
                            }

                            // Handle enter key for lists
                            if (e.key === 'Enter') {
                                const textarea = e.target as HTMLTextAreaElement;
                                const start = textarea.selectionStart;
                                const lineStart = content.lastIndexOf('\n', start - 1) + 1;
                                const currentLine = content.substring(lineStart, start);
                                
                                // Continue numbered lists
                                if (currentLine.match(/^\d+\.\s/)) {
                                    e.preventDefault();
                                    const lineNumber = parseInt(currentLine.match(/^\d+/)?.[0] || '0');
                                    const newLine = `\n${lineNumber + 1}. `;
                                    setContent(prev => 
                                        prev.substring(0, start) + 
                                        newLine + 
                                        prev.substring(start)
                                    );
                                    setTimeout(() => {
                                        textarea.selectionStart = start + newLine.length;
                                        textarea.selectionEnd = start + newLine.length;
                                    }, 0);
                                    return;
                                }

                                // Continue bullet lists
                                if (currentLine.match(/^[*-]\s/)) {
                                    e.preventDefault();
                                    setContent(prev => 
                                        prev.substring(0, start) + 
                                        '\n- ' + 
                                        prev.substring(start)
                                    );
                                    setTimeout(() => {
                                        textarea.selectionStart = start + 3;
                                        textarea.selectionEnd = start + 3;
                                    }, 0);
                                    return;
                                }
                            }

                            // Handle formatting shortcuts
                            if (e.metaKey || e.ctrlKey) {
                                e.preventDefault();
                                switch (e.key) {
                                    case 'b': addFormatting('bold'); break;
                                    case 'i': addFormatting('italic'); break;
                                    case '1': addFormatting('h1'); break;
                                    case '2': addFormatting('h2'); break;
                                    case '3': addFormatting('h3'); break;
                                    case 'l': 
                                        e.shiftKey 
                                            ? addFormatting('numberedList') 
                                            : addFormatting('list'); 
                                        break;
                                    case 'k': addFormatting('code'); break;
                                    case 'q': addFormatting('quote'); break;
                                    case 'd': addFormatting('divider'); break;
                                }
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
