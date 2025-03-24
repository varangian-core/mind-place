"use client";

import { Box, CircularProgress, Alert } from '@mui/material';
import React, { useEffect, useState } from 'react';

import GistView from '@/components/GistView';
import { findLocalSnippetById } from '@/lib/localStorageUtils';

interface ClientGistPageProps {
    id: string;
    initialSnippet?: {
        id: string;
        name: string;
        content: string;
        createdAt: string;
        topicId?: string;
        topic?: {
            id: string;
            name: string;
            description?: string;
        };
    } | null;
}

export default function ClientGistPage({ id, initialSnippet }: ClientGistPageProps) {
    const [snippet, setSnippet] = useState(initialSnippet);
    const [loading, setLoading] = useState(!initialSnippet);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If we already have the snippet from server-side props, don't fetch again
        if (initialSnippet) {
            return;
        }

        const fetchSnippet = async () => {
            setLoading(true);
            setError(null);

            try {
                // Try to fetch from API first
                const res = await fetch(`/api/snippets/${id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setSnippet(data.snippet);
                } else {
                    // If API fails, check localStorage
                    const localSnippet = findLocalSnippetById(id);
                    
                    if (localSnippet) {
                        setSnippet(localSnippet);
                    } else {
                        setError('Snippet not found');
                    }
                }
            } catch (error) {
                console.error('Error fetching snippet:', error);
                
                // Try localStorage as fallback
                const localSnippet = findLocalSnippetById(id);
                
                if (localSnippet) {
                    setSnippet(localSnippet);
                } else {
                    setError('Failed to load snippet');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSnippet();
    }, [id, initialSnippet]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !snippet) {
        return (
            <Alert severity="error" sx={{ mt: 4 }}>
                {error || 'Snippet not found'}
            </Alert>
        );
    }

    return <GistView snippet={snippet} />;
}
