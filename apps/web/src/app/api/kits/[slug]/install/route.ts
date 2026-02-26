import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // 킷 ID 조회
    const { data: kit, error: kitError } = await supabase
      .from('kits')
      .select('id, install_count')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (kitError || !kit) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
    }

    // 설치 로그 기록
    const body = await request.json().catch(() => ({}));
    await supabase.from('kit_installs').insert({
      kit_id: kit.id,
      cli_version: body.cli_version ?? null,
      agent_type: body.agent_type ?? 'claude-code',
    });

    // 설치 수 증가
    const { data: updated, error: updateError } = await supabase
      .from('kits')
      .update({ install_count: kit.install_count + 1 })
      .eq('id', kit.id)
      .select('install_count')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ install_count: updated.install_count });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
