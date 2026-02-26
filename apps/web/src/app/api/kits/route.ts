import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const VALID_CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'];
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const has = searchParams.get('has') ?? '';
  const sort = searchParams.get('sort') === 'latest' ? 'latest' : 'popular';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10))
  );

  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    let query = supabase
      .from('kits')
      .select(
        'id,slug,name,description,category,install_count,skills_count,hooks_count,agents_count,has_claude_md,tags',
        { count: 'exact' }
      )
      .eq('is_published', true);

    if (q) {
      query = query.textSearch('fts', q, { type: 'plain', config: 'simple' });
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (has.includes('skills'))    query = query.gt('skills_count', 0);
    if (has.includes('hooks'))     query = query.gt('hooks_count', 0);
    if (has.includes('agents'))    query = query.gt('agents_count', 0);
    if (has.includes('claude_md')) query = query.eq('has_claude_md', true);

    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('install_count', { ascending: false });
    }

    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ data: [], total: 0, page, pageSize }, { status: 500 });
  }
}
