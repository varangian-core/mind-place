import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, content, tags, topicId } = await req.json();
        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content required' }, { status: 400 });
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
