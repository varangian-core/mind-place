"use client";

// Utility functions for localStorage operations

export interface Topic {
    id: string;
    name: string;
    description?: string;
    icon?: string; // Add this field
    _count?: {
        snippets: number;
    };
}

export interface Snippet {
    id: string;
    name: string;
    content: string;
    createdAt: string;
    topicId?: string;
    topic?: Topic;
}

/**
 * Load all topics from localStorage
 */
export function loadLocalTopics(): Topic[] {
    try {
        const storedTopics = localStorage.getItem('mindplace_topics');
        if (storedTopics) {
            return JSON.parse(storedTopics);
        }
    } catch (error) {
        console.error('Error loading topics from localStorage:', error);
    }
    
    // Default topics if none exist
    const defaultTopics: Topic[] = [
        { id: 'topic-1', name: 'General' },
        { id: 'topic-2', name: 'Code Snippets' },
        { id: 'topic-3', name: 'Notes' }
    ];
    
    saveLocalTopics(defaultTopics);
    return defaultTopics;
}

/**
 * Save topics to localStorage
 */
export function saveLocalTopics(topics: Topic[]): void {
    try {
        localStorage.setItem('mindplace_topics', JSON.stringify(topics));
    } catch (error) {
        console.error('Error saving topics to localStorage:', error);
    }
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
export function createLocalSnippet(name: string, content: string, topicId?: string): Snippet {
    const newSnippet: Snippet = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        content,
        topicId,
        createdAt: new Date().toISOString()
    };
    
    // If topicId is provided, find the topic and attach it
    if (topicId) {
        const topics = loadLocalTopics();
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
            newSnippet.topic = topic;
        }
    }
    
    const snippets = loadLocalSnippets();
    snippets.push(newSnippet);
    saveLocalSnippets(snippets);
    
    return newSnippet;
}

/**
 * Create a new topic in localStorage
 */
export function createLocalTopic(name: string, description?: string): Topic {
    const newTopic: Topic = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        description
    };
    
    const topics = loadLocalTopics();
    topics.push(newTopic);
    saveLocalTopics(topics);
    
    return newTopic;
}

/**
 * Find a topic by ID from localStorage
 */
export function findLocalTopicById(id: string): Topic | null {
    try {
        const topics = loadLocalTopics();
        return topics.find(topic => topic.id === id) || null;
    } catch (error) {
        console.error('Error finding topic in localStorage:', error);
        return null;
    }
}
