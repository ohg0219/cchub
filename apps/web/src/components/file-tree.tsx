'use client';

import { useState } from 'react';
import type { FileTreeNode } from '@/lib/supabase/types';

const KIND_ICONS: Record<string, { icon: string; color: string }> = {
  skill:     { icon: '📄', color: 'text-blue-400' },
  hook:      { icon: '⚡', color: 'text-yellow-400' },
  agent:     { icon: '🤖', color: 'text-green-400' },
  claude_md: { icon: '📋', color: 'text-purple-400' },
  other:     { icon: '📄', color: 'text-gray-400' },
};

function TreeNode({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1 py-0.5 text-left text-sm text-gray-300 hover:text-white"
          style={{ paddingLeft: depth * 16 }}
        >
          <span className="text-gray-500">{open ? '▾' : '▸'}</span>
          <span>📁</span>
          <span>{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const { icon, color } = KIND_ICONS[node.kind ?? 'other'];
  return (
    <div
      className={`flex items-center gap-1 py-0.5 text-sm ${color}`}
      style={{ paddingLeft: depth * 16 }}
    >
      <span className="invisible text-gray-500">▸</span>
      <span>{icon}</span>
      <span>{node.name}</span>
    </div>
  );
}

export function FileTree({ nodes }: { nodes: FileTreeNode[] }) {
  if (!nodes.length) {
    return <p className="text-sm text-gray-500">No file info</p>;
  }
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} />
      ))}
    </div>
  );
}
