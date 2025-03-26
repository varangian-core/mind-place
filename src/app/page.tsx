import SnippetManagerClient from '@/components/SnippetManagerClient';
import { useAuth } from '@/lib/auth/useAuth';

export default function Page() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return (
            <main>
                {/* Will add LoginForm here */}
                <div>Please log in</div>
            </main>
        );
    }

    return (
        <main>
            <SnippetManagerClient />
        </main>
    );
}
