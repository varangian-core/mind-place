import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Check if we're in a browser environment or if DATABASE_URL is missing
        const isBrowser = typeof window !== 'undefined';
        if (isBrowser || !process.env.DATABASE_URL) {
            // We can't use localStorage on the server
            // Return empty array - client will handle loading from localStorage
            return NextResponse.json({ 
                topics: [],
                usingLocalStorage: true 
            });
        }
        
        const topics = await prisma.topic.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { snippets: true }
                }
            }
        });
        
        return NextResponse.json({ topics });
    } catch (error: unknown) {
        console.error('Error fetching topics:', error);
        return NextResponse.json({ 
            topics: [],
            usingLocalStorage: true,
            error: error.message
        });
    }
}

export async function POST(req: Request) {
    try {
        const { name, description, icon } = await req.json(); // Add icon to the request body
        if (!name) {
            return NextResponse.json({ error: 'Topic name is required' }, { status: 400 });
        }

        // Check if we're in a browser environment or if DATABASE_URL is missing
        const isBrowser = typeof window !== 'undefined';
        if (isBrowser || !process.env.DATABASE_URL) {
            // We can't use localStorage on the server
            // Return a response that tells the client to use localStorage
            return NextResponse.json({ 
                usingLocalStorage: true,
                topic: { 
                    id: `topic-${Date.now()}`, 
                    name, 
                    description,
                    createdAt: new Date().toISOString() 
                }
            }, { status: 201 });
        }

        const topic = await prisma.topic.create({
            data: { 
                name,
                description,
                icon // Include icon in the database
            }
        });

        return NextResponse.json({ topic }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating topic:', error);
        // We can't access req.body directly in the catch block
        // Return a generic response
        return NextResponse.json({ 
            usingLocalStorage: true,
            error: error.message,
            topic: { 
                id: `topic-${Date.now()}`, 
                name: 'Error creating topic',
                description: 'Please try again',
                createdAt: new Date().toISOString() 
            }
        }, { status: 201 });
    }
}
