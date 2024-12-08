// src/app/api/snippets/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const snippets = await prisma.snippet.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ snippets });
}

export async function POST(req: Request) {
    try {
        const { name, content } = await req.json();
        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content required' }, { status: 400 });
        }

        const snippet = await prisma.snippet.create({
            data: { name, content }
        });

        return NextResponse.json({ snippet }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating snippet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
