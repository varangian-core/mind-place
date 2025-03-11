import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { loadLocalSnippets, loadLocalTopics } from '@/lib/localStorageUtils';

export async function GET() {
    try {
        // Check if we're in a browser environment (for localStorage fallback)
        const isBrowser = typeof window !== 'undefined';
        
        // If we're in a browser or if there's no DATABASE_URL, use localStorage
        if (isBrowser || !process.env.DATABASE_URL) {
            // We can't actually use localStorage on the server, so return empty arrays
            // The client will handle loading from localStorage
            return NextResponse.json({ 
                snippets: [], 
                topics: [],
                usingLocalStorage: true 
            });
        }
        
        const snippets = await prisma.snippet.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tags: true,
                topic: true
            }
        });
        
        const topics = await prisma.topic.findMany({
            orderBy: { name: 'asc' }
        });
        
        console.log('Server fetched snippets:', snippets);
        return NextResponse.json({ snippets, topics });
    } catch (error: any) {
        console.error('Error fetching snippets:', error);
        // Return empty arrays with a flag indicating to use localStorage
        return NextResponse.json({ 
            snippets: [], 
            topics: [],
            usingLocalStorage: true,
            error: error.message
        });
    }
}

export async function POST(req: Request) {
    try {
        const { name, content, tags, topicId } = await req.json();
        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content required' }, { status: 400 });
        }

        // Check if we're in a browser environment or if DATABASE_URL is missing
        const isBrowser = typeof window !== 'undefined';
        if (isBrowser || !process.env.DATABASE_URL) {
            // We can't use localStorage on the server
            // Return a response that tells the client to use localStorage
            return NextResponse.json({ 
                usingLocalStorage: true,
                snippet: { 
                    id: `local-${Date.now()}`, 
                    name, 
                    content, 
                    topicId,
                    createdAt: new Date().toISOString() 
                }
            }, { status: 201 });
        }

        // Store the current time in UTC
        const now = new Date();

        // Create or connect tags
        const tagConnections = tags?.map((tagName: string) => ({
          where: { name: tagName },
          create: { name: tagName }
        })) || [];

        // Prepare data object with optional topic connection
        const data: any = { 
            name, 
            content, 
            createdAt: now,
            tags: {
                connectOrCreate: tagConnections
            }
        };
        
        // Add topic relation if topicId is provided
        if (topicId) {
            data.topic = {
                connect: { id: parseInt(topicId) }
            };
        }

        const snippet = await prisma.snippet.create({
            data,
            include: {
                tags: true,
                topic: true
            }
        });

        return NextResponse.json({ snippet }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating snippet:', error);
        // Return a response that tells the client to use localStorage
        // We can't access req.body directly in the catch block
        // Return a generic response
        return NextResponse.json({ 
            usingLocalStorage: true,
            error: error.message,
            snippet: { 
                id: `local-${Date.now()}`, 
                name: 'Error creating snippet',
                content: 'Please try again',
                createdAt: new Date().toISOString() 
            }
        }, { status: 201 });
    }
}
