"use client";

import dynamic from 'next/dynamic';

const SnippetManager = dynamic(
  () => import('./SnippetManager'),
  { 
    ssr: false,
    loading: () => <p>Loading...</p>
  }
);

export default function SnippetManagerClient() {
    return <SnippetManager />;
}
