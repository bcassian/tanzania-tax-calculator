import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
      <SignUp />
    </main>
  );
}
