import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
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
    } catch (error) {
        console.error('Error fetching snippet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
