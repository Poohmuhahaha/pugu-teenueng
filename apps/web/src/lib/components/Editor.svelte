<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { Editor } from '@tiptap/core';
  import type { Block } from '@lifeos/core';

  export let initial: Block[] = [];
  export let placeholder = 'Type / for commands, [[ to link…';

  let element: HTMLDivElement;
  let editor: Editor | null = null;
  const dispatch = createEventDispatcher<{ change: Block[] }>();

  // Convert a list of LifeOS Block objects to the ProseMirror doc that TipTap consumes.
  function blocksToDoc(blocks: Block[]) {
    if (!blocks.length) {
      return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
    return {
      type: 'doc',
      content: blocks.map((b) => {
        switch (b.type) {
          case 'heading':
            return { type: 'heading', attrs: { level: (b.attrs?.level as number) ?? 1 }, content: textRun(b.content) };
          case 'paragraph':
            return { type: 'paragraph', content: textRun(b.content) };
          case 'todo':
            return { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: !!b.attrs?.done }, content: [{ type: 'paragraph', content: textRun(b.content) }] }] };
          case 'bulletList':
          case 'orderedList':
            return { type: b.type, content: ((b.content as unknown[]) ?? []).map((c) => ({ type: 'listItem', content: [{ type: 'paragraph', content: textRun(c) }] })) };
          case 'codeBlock':
            return { type: 'codeBlock', attrs: b.attrs ?? {}, content: textRun(b.content) };
          case 'divider':
            return { type: 'horizontalRule' };
          default:
            return { type: 'paragraph', content: textRun(b.content) };
        }
      }),
    };
  }

  function textRun(c: unknown) {
    if (typeof c === 'string' && c) return [{ type: 'text', text: c }];
    if (Array.isArray(c)) return c.filter((s) => typeof s === 'string').map((s) => ({ type: 'text', text: s as string }));
    return [];
  }

  // Convert ProseMirror JSON back into LifeOS Block[].
  function docToBlocks(doc: { content?: Array<Record<string, unknown>> }): Block[] {
    const blocks: Block[] = [];
    for (const node of doc.content ?? []) {
      const type = node.type as string;
      const content = collectText(node);
      const id = Math.random().toString(36).slice(2);
      switch (type) {
        case 'heading':
          blocks.push({ id, type: 'heading', attrs: { level: (node.attrs as { level?: number })?.level ?? 1 }, content });
          break;
        case 'paragraph':
          blocks.push({ id, type: 'paragraph', content });
          break;
        case 'taskList':
          for (const item of ((node.content as Array<Record<string, unknown>>) ?? [])) {
            const attrs = item.attrs as { checked?: boolean } | undefined;
            blocks.push({ id, type: 'todo', attrs: { done: !!attrs?.checked }, content: collectText(item) });
          }
          break;
        case 'bulletList':
        case 'orderedList':
          blocks.push({
            id,
            type: type === 'bulletList' ? 'bulletList' : 'orderedList',
            content: ((node.content as Array<Record<string, unknown>>) ?? []).map((li) => collectText(li)),
          });
          break;
        case 'codeBlock':
          blocks.push({ id, type: 'codeBlock', attrs: node.attrs as Record<string, unknown> | undefined, content });
          break;
        case 'horizontalRule':
          blocks.push({ id, type: 'divider', content: '' });
          break;
      }
    }
    return blocks;
  }

  function collectText(node: Record<string, unknown>): string {
    if (node.type === 'text' && typeof node.text === 'string') return node.text;
    const inner = (node.content as Array<Record<string, unknown>>) ?? [];
    return inner.map(collectText).join('');
  }

  onMount(async () => {
    // Lazy-load TipTap so it stays optional for non-editor pages.
    const { Editor: TipTap } = await import(/* @vite-ignore */ '@tiptap/core');
    const StarterKit = (await import(/* @vite-ignore */ '@tiptap/starter-kit')).default;
    const TaskList = (await import(/* @vite-ignore */ '@tiptap/extension-task-list')).default;
    const TaskItem = (await import(/* @vite-ignore */ '@tiptap/extension-task-item')).default;
    const Placeholder = (await import(/* @vite-ignore */ '@tiptap/extension-placeholder')).default;

    editor = new TipTap({
      element,
      extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true }), Placeholder.configure({ placeholder })],
      content: blocksToDoc(initial),
      onUpdate: ({ editor: e }) => {
        dispatch('change', docToBlocks(e.getJSON() as { content?: Array<Record<string, unknown>> }));
      },
    });
  });

  onDestroy(() => editor?.destroy());

  export function getBlocks(): Block[] {
    if (!editor) return initial;
    return docToBlocks(editor.getJSON() as { content?: Array<Record<string, unknown>> });
  }
</script>

<div bind:this={element} class="editor"></div>

<style>
  .editor {
    min-height: 240px;
    padding: 16px;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 10px;
    background: var(--surface, #fff);
    font-size: 15px;
    line-height: 1.7;
  }
  :global(.editor .ProseMirror) { outline: none; min-height: 220px; }
  :global(.editor .ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    color: var(--muted, #9ca3af);
    pointer-events: none;
    float: left;
    height: 0;
  }
  :global(.editor h1) { font-size: 24px; font-weight: 700; margin: 12px 0 6px; }
  :global(.editor h2) { font-size: 20px; font-weight: 700; margin: 10px 0 4px; }
  :global(.editor h3) { font-size: 16px; font-weight: 700; margin: 8px 0 4px; }
  :global(.editor ul) { padding-left: 22px; }
  :global(.editor ol) { padding-left: 22px; }
  :global(.editor pre) { background: var(--surface-alt, #fafafa); padding: 10px 14px; border-radius: 8px; font-size: 13px; }
  :global(.editor hr) { border: none; border-top: 1px solid var(--border, #e5e5e5); margin: 16px 0; }
  :global(.editor ul[data-type="taskList"]) { list-style: none; padding: 0; }
  :global(.editor ul[data-type="taskList"] li) { display: flex; gap: 8px; align-items: flex-start; }
</style>
