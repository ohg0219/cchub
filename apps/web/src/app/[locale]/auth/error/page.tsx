import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: Promise<{ reason?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  no_code: 'OAuth 인증 코드가 없습니다. 로그인을 다시 시도해 주세요.',
  exchange_failed: '세션 교환에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};

const DEFAULT_ERROR_MESSAGE = '알 수 없는 오류가 발생했습니다. 로그인을 다시 시도해 주세요.';

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const message = (reason && ERROR_MESSAGES[reason]) ?? DEFAULT_ERROR_MESSAGE;

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">로그인 오류</h1>
        <p className="text-gray-400 mb-2">{message}</p>
        {reason && (
          <p className="text-xs text-gray-600 mb-8 font-mono">오류 코드: {reason}</p>
        )}

        <Link
          href="/auth/login"
          className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          다시 로그인
        </Link>
      </div>
    </main>
  );
}
