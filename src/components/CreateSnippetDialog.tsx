"use client";

import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Tabs, 
  Tab, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Tooltip,
  Typography
} from '@mui/material';
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
import { useDropzone } from 'react-dropzone';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

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
    
    // Update content when initialContent changes
    useEffect(() => {
        if (initialContent) {
            setContent(initialContent);
        }
    }, [initialContent]);

    const addFormatting = (format: string) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        let newContent = content;
        let cursorOffset = 0;

        switch (format) {
            case 'h1': newContent = `${content.substring(0, start)}# ${selectedText || 'Heading 1'}${content.substring(end)}`; cursorOffset = 2; break;
            case 'h2': newContent = `${content.substring(0, start)}## ${selectedText || 'Heading 2'}${content.substring(end)}`; cursorOffset = 3; break;
            case 'bold': newContent = `${content.substring(0, start)}**${selectedText || 'bold text'}**${content.substring(end)}`; cursorOffset = 2; break;
            case 'list': newContent = `${content.substring(0, start)}- ${selectedText || 'List item'}${content.substring(end)}`; cursorOffset = 2; break;
            case 'code': newContent = `${content.substring(0, start)}\`\`\`\n${selectedText || 'code block'}\n\`\`\`${content.substring(end)}`; cursorOffset = 4; break;
            case 'image': newContent = `${content.substring(0, start)}![alt text](${selectedText || 'image-url'})${content.substring(end)}`; cursorOffset = 2; break;
            case 'link': newContent = `${content.substring(0, start)}[link text](${selectedText || 'url'})${content.substring(end)}`; cursorOffset = 1; break;
        }

        setContent(newContent);
        setTimeout(() => {
            textarea.selectionStart = start + cursorOffset;
            textarea.selectionEnd = start + cursorOffset + (selectedText.length || 0);
            textarea.focus();
        }, 0);
    };

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
                <Box sx={{ 
                    my: 2,
                    borderRadius: 1,
                    overflow: 'hidden'
                }}>
                    <SyntaxHighlighter 
                        style={oneDark} 
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
                    backgroundColor: 'rgba(0,0,0,0.1)',
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
        a({ href, children }: unknown) {
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

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabIndex} onChange={(e, newVal) => setTabIndex(newVal)}>
                        <Tab label="Edit" />
                        <Tab label="Preview" />
                    </Tabs>
                </Box>

                {tabIndex === 0 ? (
                    <Box sx={{ 
                        border: isDragActive ? '2px dashed #1976d2' : '1px dashed #ccc',
                        borderRadius: 1,
                        p: 2,
                        mb: 2,
                        backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                        position: 'relative'
                    }}>
                        <Box {...getRootProps()} sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1,
                            pointerEvents: isDragActive ? 'auto' : 'none'
                        }}>
                            <input {...getInputProps()} />
                        </Box>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            mb: 2,
                            flexWrap: 'wrap',
                            '& button': {
                                pointerEvents: 'auto'
                            }
                        }}>
                            <Tooltip title="Heading 1 (Cmd+1)">
                                <Button 
                                    variant="outlined"
                                    size="small"
                                    startIcon={<FiHash />}
                                    onClick={() => addFormatting('h1')}
                                >H1</Button>
                            </Tooltip>
                            <Tooltip title="Bold (Cmd+B)">
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    startIcon={<FiType />}
                                    onClick={() => addFormatting('bold')}
                                >Bold</Button>
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
                            label="Markdown Content"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            fullWidth
                            multiline
                            rows={10}
                            sx={{
                                fontFamily: 'monospace',
                                '& .MuiInputBase-input': {
                                    fontSize: '0.875rem',
                                    lineHeight: 1.6
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
                                zIndex: 2
                            }}>
                                <Typography variant="h6" color="primary">
                                    Drop image to upload
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ 
                        p: 3,
                        borderRadius: 1,
                        minHeight: '300px',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        '& *': {
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }
                    }}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={components}
                        >
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
