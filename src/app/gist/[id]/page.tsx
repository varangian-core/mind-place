// src/app/gist/[id]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import GistView from '@/components/GistView';

interface GistPageProps {
    params: { id: string };
}

export default async function GistPage({ params }: GistPageProps) {
    // Fetch the snippet using the ID from the URL
    const snippet = await prisma.snippet.findUnique({
        where: { id: params.id },
    });

    if (!snippet) {
        notFound(); // If no snippet is found, this triggers a Next.js 404 page.
    }

    // Convert the createdAt Date to an ISO string for the client component
    const snippetForClient = {
        ...snippet,
        createdAt: snippet.createdAt.toISOString()
    };

    // Return the GistView component with the client-friendly snippet data
    return <GistView snippet={snippetForClient} />;
}
