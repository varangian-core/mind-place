import dynamic from 'next/dynamic';

const SnippetManager = dynamic(
  () => import('@/components/SnippetManager'),
  { 
    ssr: false,
    loading: () => <p>Loading...</p>
  }
);

export default function Page() {
    return (
        <main>
            <SnippetManager />
        </main>
    );
}
