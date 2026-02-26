import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // 동일 origin 내 경로만 허용 (오픈 리다이렉트 방지)
  const redirectTo = next.startsWith('/') ? next : '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[auth/callback] 세션 교환 실패:', error?.message);
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  // profiles upsert — RLS 우회를 위해 service_role 클라이언트 사용
  // (비치명적 — 실패해도 로그인은 성공)
  const serviceClient = createServiceClient();
  const { user } = data;
  const { error: upsertError } = await serviceClient.from('profiles').upsert(
    {
      id: user.id,
      github_username: user.user_metadata['user_name'] as string,
      display_name: (user.user_metadata['full_name'] as string) ?? null,
      avatar_url: (user.user_metadata['avatar_url'] as string) ?? null,
    },
    { onConflict: 'id' }
  );

  if (upsertError) {
    console.error('[auth/callback] profiles upsert 실패:', upsertError.message);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
