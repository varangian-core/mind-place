import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const snippet = await prisma.snippet.findUnique({
            where: { id: params.id },
        });

        if (!snippet) {
            return NextResponse.json(
                { error: 'Snippet not found' },
                { status: 404 }
            );
        }

        // Convert the createdAt Date to an ISO string for the client component
        const snippetForClient = {
            ...snippet,
            createdAt: snippet.createdAt.toISOString()
        };

        return NextResponse.json({ snippet: snippetForClient });
    } catch (error: unknown) {
        console.error('Error fetching snippet:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
