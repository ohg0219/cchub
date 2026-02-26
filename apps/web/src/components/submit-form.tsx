'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface GitHubAnalysisResult {
  name: string;
  description: string;
  hasKitYaml: boolean;
  skills: string[];
  hooks: string[];
  agents: string[];
  readmeSummary: string;
}

const CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'] as const;

export function SubmitForm({ userId }: { userId: string }) {
  const t = useTranslations('submit');
  const router = useRouter();

  const [githubUrl, setGithubUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('backend');
  const [tags, setTags] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<GitHubAnalysisResult | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!githubUrl) return;
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(githubUrl)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      setAnalyzed(false);
      setError('');
      try {
        const res = await fetch(`/api/github?url=${encodeURIComponent(githubUrl)}`);
        if (!res.ok) throw new Error('analysis failed');
        const data: GitHubAnalysisResult = await res.json();
        setAnalysisData(data);
        setName(data.name || '');
        setDescription(data.readmeSummary || data.description || '');
        setAnalyzed(true);
      } catch {
        setError(t('error.analysisFailed'));
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!githubUrl || !name || !description || !category) return;
    if (!/^https:\/\/github\.com\//.test(githubUrl)) {
      setError(t('error.invalidUrl'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_repo: githubUrl,
          name,
          description,
          category,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          skills_count: analysisData?.skills.length ?? 0,
          hooks_count: analysisData?.hooks.length ?? 0,
          agents_count: analysisData?.agents.length ?? 0,
          has_claude_md: analysisData?.hasKitYaml ?? false,
        }),
      });

      if (res.status === 409) {
        setError(t('error.duplicate'));
        return;
      }
      if (!res.ok) throw new Error('submit failed');

      const { slug } = await res.json() as { slug: string; id: string };
      router.push(`/kit/${slug}`);
    } catch {
      setError(t('error.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // userId is available for future use (e.g., display name)
  void userId;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* GitHub URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t('form.githubUrl')}
        </label>
        <div className="relative">
          <input
            type="url"
            required
            placeholder={t('form.githubUrlPlaceholder')}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none pr-8"
          />
          {isAnalyzing && (
            <span className="absolute right-2 top-2 text-xs text-gray-400">{t('analyzing')}</span>
          )}
        </div>
        {analyzed && !isAnalyzing && (
          <p className="mt-1 text-xs text-green-400">{t('analyzed')}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t('form.name')}
        </label>
        <input
          type="text"
          required
          placeholder={t('form.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t('form.description')}
        </label>
        <textarea
          required
          rows={3}
          placeholder={t('form.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t('form.category')}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t('form.tags')}
        </label>
        <input
          type="text"
          placeholder={t('form.tagsPlaceholder')}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || isAnalyzing}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? t('form.submitting') : t('form.submit')}
      </button>
    </form>
  );
}
