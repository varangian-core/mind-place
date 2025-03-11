// src/app/gist/[id]/page.tsx
import ClientGistPage from './page.client';

interface GistPageProps {
    params: { id: string };
}

export default function GistPage({ params }: GistPageProps) {
    // We'll pass the ID to the client component
    // The client component will handle fetching from API or localStorage
    return <ClientGistPage id={params.id} />;
}
