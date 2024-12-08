"use client";

import React, { useEffect, useState } from 'react';

export default function SnippetManager() {
    const [snippets, setSnippets] = useState<{id: string, name: string}[]>([]);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        fetch('/api/snippets')
            .then(res => res.json())
            .then(data => {
                setSnippets(data.snippets);
            });
    }, []);

    async function createSnippet() {
        const res = await fetch('/api/snippets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content })
        });
        if (res.ok) {
            const data = await res.json();
            setSnippets([...snippets, data.snippet]);
            setName('');
            setContent('');
        } else {
            console.error('Error creating snippet');
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">MindPlace Snippets</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Create a New Snippet</h2>
                <input
                    className="border p-2 mr-2"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <textarea
                    className="border p-2 mr-2"
                    placeholder="Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <button
                    className="bg-blue-500 text-white p-2"
                    onClick={createSnippet}
                >
                    Create
                </button>
            </div>

            <h2 className="text-xl font-semibold mb-2">Your Snippets</h2>
            <ul className="space-y-2">
                {snippets.map((snippet) => (
                    <li key={snippet.id} className="border-b pb-2">
                        {snippet.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
