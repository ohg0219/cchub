'use client';

interface LoginButtonProps {
  label: string;
}

export function LoginButton({ label }: LoginButtonProps) {
  return (
    <a
      href="/auth/login"
      className="rounded-md bg-gray-800 border border-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
    >
      {label}
    </a>
  );
}
