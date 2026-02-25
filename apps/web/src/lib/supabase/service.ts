import { createClient } from '@supabase/supabase-js';

// 서버 사이드 전용 — Route Handler에서만 사용
// 절대 클라이언트 컴포넌트에서 import 금지
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
