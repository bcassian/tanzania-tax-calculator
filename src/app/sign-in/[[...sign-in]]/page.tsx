import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
      <SignIn />
    </main>
  );
}
