import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const VALID_CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json() as {
      github_repo: string;
      name: string;
      description: string;
      category: string;
      tags?: string[];
      github_branch?: string;
      version?: string;
      skills_count?: number;
      hooks_count?: number;
      agents_count?: number;
      has_claude_md?: boolean;
      file_tree?: unknown;
      hooks_meta?: unknown[];
    };

    const { github_repo, name, description, category } = body;
    if (!github_repo || !name || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // slug 생성 (중복 시 suffix 추가)
    const baseSlug = toSlug(name);
    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const { data: existing } = await supabase
        .from('kits')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const { data, error } = await supabase
      .from('kits')
      .insert({
        github_repo,
        name,
        description,
        category,
        tags: body.tags ?? [],
        github_branch: body.github_branch ?? 'main',
        version: body.version ?? '1.0.0',
        skills_count: body.skills_count ?? 0,
        hooks_count: body.hooks_count ?? 0,
        agents_count: body.agents_count ?? 0,
        has_claude_md: body.has_claude_md ?? false,
        file_tree: body.file_tree ?? null,
        hooks_meta: body.hooks_meta ?? [],
        slug,
        author_id: null,
        is_published: false,
        install_count: 0,
      })
      .select('id, slug')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Duplicate repo or slug' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit kit' }, { status: 500 });
  }
}
