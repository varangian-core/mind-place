"use client";

// Utility functions for localStorage operations

export interface Snippet {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

/**
 * Load all snippets from localStorage
 */
export function loadLocalSnippets(): Snippet[] {
    try {
        const storedSnippets = localStorage.getItem('mindplace_snippets');
        if (storedSnippets) {
            return JSON.parse(storedSnippets);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
    return [];
}

/**
 * Save snippets to localStorage
 */
export function saveLocalSnippets(snippets: Snippet[]): void {
    try {
        localStorage.setItem('mindplace_snippets', JSON.stringify(snippets));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Find a single snippet by ID from localStorage
 */
export function findLocalSnippetById(id: string): Snippet | null {
    try {
        const snippets = loadLocalSnippets();
        return snippets.find(snippet => snippet.id === id) || null;
    } catch (error) {
        console.error('Error finding snippet in localStorage:', error);
        return null;
    }
}

/**
 * Create a new snippet in localStorage
 */
export function createLocalSnippet(name: string, content: string): Snippet {
    const newSnippet: Snippet = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        content,
        createdAt: new Date().toISOString()
    };
    
    const snippets = loadLocalSnippets();
    snippets.push(newSnippet);
    saveLocalSnippets(snippets);
    
    return newSnippet;
}
