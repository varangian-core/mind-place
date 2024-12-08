import SnippetManager from '@/components/SnippetManager';

export default async function Page() {
    // You can do server-side fetching here if needed, or just return the Client Component.
    return (
        <main>
            <SnippetManager />
        </main>
    );
}
