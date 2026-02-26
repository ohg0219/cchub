'use client';

import { useState } from 'react';

interface CliBlockProps {
  command: string;
}

export function CliBlock({ command }: CliBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 시 silent fail
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm">
      <div>
        <span className="text-gray-500">$</span>
        <span className="ml-2 text-green-400">{command}</span>
      </div>
      <button
        onClick={handleCopy}
        className="ml-4 shrink-0 text-xs text-gray-400 hover:text-white transition-colors"
        aria-label="명령어 복사"
      >
        {copied ? '복사됨 ✓' : '복사'}
      </button>
    </div>
  );
}
