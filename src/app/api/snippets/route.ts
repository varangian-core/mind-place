import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const snippets = await prisma.snippet.findMany({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Server fetched snippets:', snippets);
        return NextResponse.json({ snippets });
    } catch (error: any) {
        console.error('Error fetching snippets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, content } = await req.json();
        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content required' }, { status: 400 });
        }

        // Store the current time in UTC
        const now = new Date();

        const snippet = await prisma.snippet.create({
            data: { name, content, createdAt: now }
        });

        return NextResponse.json({ snippet }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating snippet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
