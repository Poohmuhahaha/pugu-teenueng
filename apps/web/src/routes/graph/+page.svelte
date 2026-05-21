<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { onSyncEvent } from '$lib/sync';

  export let params: any = undefined;

  interface Entry { id: number; data: Record<string, unknown>; contentType?: { slug: string; name: string } }
  interface Backref { id: number; fromEntryId: number; toEntryId: number | null; targetName: string | null; }
  interface Node { id: number; label: string; group: string; x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null; }
  interface Edge { source: number | Node; target: number | Node; }

  let svgEl: SVGSVGElement;
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let collections: Array<{ slug: string; name: string }> = [];
  let entriesBySlug: Record<string, Entry[]> = {};
  let groupColors: Record<string, string> = {};
  let selectedNodeId: number | null = null;
  let simulation: ReturnType<typeof startSim> | null = null;
  let loading = true;
  let width = 0;
  let height = 600;

  async function load() {
    loading = true;
    const typesRes = await fetch('/api/v1/content-types').then((r) => (r.ok ? r.json() : null));
    if (!typesRes || !typesRes.data) {
      collections = [];
      nodes = [];
      edges = [];
      loading = false;
      return;
    }
    collections = typesRes.data.map((t: { slug: string; name: string }) => ({ slug: t.slug, name: t.name }));

    const palette = ['#c9ad93', '#879a77', '#b36b53', '#738c9c', '#c29b63', '#5b7053', '#695a50', '#a65f46'];
    collections.forEach((c, i) => (groupColors[c.slug] = palette[i % palette.length]));

    const allEntries: Entry[] = [];
    for (const c of collections) {
      const res = await fetch(`/api/v1/${c.slug}?pagination[pageSize]=200`).then((r) => (r.ok ? r.json() : null));
      if (res && res.data) {
        entriesBySlug[c.slug] = res.data.map((e: Record<string, unknown>) => ({ ...e, contentType: c }));
        for (const e of entriesBySlug[c.slug]) allEntries.push(e as Entry);
      }
    }

    nodes = allEntries.map((e) => ({
      id: e.id,
      label: String((e as Entry).data?.title ?? (e as Record<string, unknown>).title ?? (e as Record<string, unknown>).name ?? `#${e.id}`).slice(0, 40),
      group: (e as Entry).contentType?.slug ?? 'unknown',
    }));

    // Pull every backref by enumerating entries and asking for outgoing refs
    edges = [];
    const allRefs = await Promise.all(nodes.map((n) => fetch(`/api/v1/backrefs?from=${n.id}`).then((r) => r.json())));
    const knownIds = new Set(nodes.map((n) => n.id));
    allRefs.forEach((res, i) => {
      const from = nodes[i].id;
      for (const r of res.data as Backref[]) {
        if (r.toEntryId && knownIds.has(r.toEntryId)) {
          edges.push({ source: from, target: r.toEntryId });
        }
      }
    });

    loading = false;
    requestAnimationFrame(start);
  }

  function startSim(d3force: typeof import('d3-force')) {
    const sim = d3force
      .forceSimulation<Node>(nodes)
      .force('link', d3force.forceLink<Node, Edge>(edges).id((n) => n.id).distance(80).strength(0.5))
      .force('charge', d3force.forceManyBody().strength(-180))
      .force('center', d3force.forceCenter(width / 2, height / 2))
      .force('collide', d3force.forceCollide(22))
      .on('tick', tick);
    return sim;
  }

  async function start() {
    if (!svgEl || nodes.length === 0) return;
    width = svgEl.clientWidth || 800;
    const d3force = await import(/* @vite-ignore */ 'd3-force');
    simulation = startSim(d3force);
  }

  function tick() {
    nodes = nodes;
    edges = edges;
  }

  function onMouseDown(e: MouseEvent, n: Node) {
    selectedNodeId = n.id;
    n.fx = n.x ?? 0;
    n.fy = n.y ?? 0;
    const onMove = (ev: MouseEvent) => {
      const rect = svgEl.getBoundingClientRect();
      n.fx = ev.clientX - rect.left;
      n.fy = ev.clientY - rect.top;
      simulation?.alphaTarget(0.3).restart();
    };
    const onUp = () => {
      n.fx = null;
      n.fy = null;
      simulation?.alphaTarget(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function navigate(n: Node) {
    goto(`/collections/${n.group}/${n.id}`);
  }

  let unsub: (() => void) | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    load();
    unsub = onSyncEvent((e) => {
      if (e.type === 'entry.created' || e.type === 'entry.updated' || e.type === 'entry.deleted') {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          simulation?.stop();
          simulation = null;
          load();
        }, 600);
      }
    });
  });
  onDestroy(() => {
    simulation?.stop();
    unsub?.();
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  $: selectedNode = nodes.find((n) => n.id === selectedNodeId);
  $: neighborIds = new Set(
    edges
      .filter((e) => (typeof e.source === 'object' ? e.source.id : e.source) === selectedNodeId
                  || (typeof e.target === 'object' ? e.target.id : e.target) === selectedNodeId)
      .flatMap((e) => [typeof e.source === 'object' ? e.source.id : e.source, typeof e.target === 'object' ? e.target.id : e.target])
      .filter((id) => id !== selectedNodeId)
  );
</script>

<div class="graph-head">
  <div>
    <h1>Knowledge Graph</h1>
    <p style="color:var(--muted); font-size:13px; margin:4px 0">{nodes.length} entries · {edges.length} links</p>
  </div>
  <div class="legend">
    {#each collections as c (c.slug)}
      <span class="chip"><span class="dot" style:background={groupColors[c.slug]}></span>{c.name}</span>
    {/each}
  </div>
</div>

{#if loading}
  <p style="color:var(--muted)">Building graph…</p>
{:else if nodes.length === 0}
  <div class="empty">No entries yet. Add some at <a href="http://localhost:5175">admin</a>.</div>
{:else}
  <div class="graph-shell">
    <svg bind:this={svgEl} {width} {height} viewBox={`0 0 ${width || 800} ${height}`} preserveAspectRatio="xMidYMid meet">
      <g>
        {#each edges as e}
          {@const sx = (typeof e.source === 'object' ? e.source.x : 0) ?? 0}
          {@const sy = (typeof e.source === 'object' ? e.source.y : 0) ?? 0}
          {@const tx = (typeof e.target === 'object' ? e.target.x : 0) ?? 0}
          {@const ty = (typeof e.target === 'object' ? e.target.y : 0) ?? 0}
          <line x1={sx} y1={sy} x2={tx} y2={ty} stroke="var(--border)" stroke-opacity="0.5" stroke-width="1.5" />
        {/each}
      </g>
      <g>
        {#each nodes as n (n.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <g
            transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
            on:mousedown={(e) => onMouseDown(e, n)}
            on:dblclick={() => navigate(n)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(n)}
            role="button"
            tabindex="0"
            class:dim={selectedNodeId !== null && n.id !== selectedNodeId && !neighborIds.has(n.id)}
            style="cursor:pointer"
          >
            <circle r="10" fill={groupColors[n.group] ?? 'var(--muted)'} stroke={n.id === selectedNodeId ? 'var(--ink)' : 'var(--bg)'} stroke-width="2.5" />
            <text x="14" y="4" font-size="11" font-weight="600" fill="var(--ink)" stroke="var(--bg)" stroke-width="2" paint-order="stroke fill">{n.label}</text>
          </g>
        {/each}
      </g>
    </svg>
    {#if selectedNode}
      <aside class="panel">
        <button class="close" on:click={() => (selectedNodeId = null)} aria-label="Close">×</button>
        <div class="label">Selected</div>
        <h2>{selectedNode.label}</h2>
        <p style="font-size:12px; color:var(--muted); margin:0 0 14px">in <code>{selectedNode.group}</code></p>
        <button class="btn" on:click={() => navigate(selectedNode)}>Open entry →</button>
        <div class="label" style="margin-top:24px">Neighbors ({neighborIds.size})</div>
        <ul class="neighbors">
          {#each [...neighborIds] as nid}
            {@const node = nodes.find((n) => n.id === nid)}
            {#if node}
              <li><button on:click={() => (selectedNodeId = nid)}>{node.label}</button></li>
            {/if}
          {/each}
          {#if neighborIds.size === 0}<li style="color:var(--muted); font-size:13px">No connections yet.</li>{/if}
        </ul>
      </aside>
    {/if}
  </div>
{/if}

<style>
  .graph-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  h1 { font-size: 26px; letter-spacing: -0.02em; margin: 0; }
  .legend { display: flex; gap: 8px; flex-wrap: wrap; max-width: 480px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .empty { padding: 60px 20px; text-align: center; color: var(--muted); border: 1px dashed var(--border); border-radius: 12px; }
  .graph-shell { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  svg { width: 100%; height: 600px; display: block; }
  g.dim { opacity: 0.25; }
  .panel {
    position: absolute; top: 12px; right: 12px;
    width: 240px;
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }
  .panel .close { position: absolute; top: 8px; right: 8px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: var(--muted); }
  h2 { font-size: 16px; margin: 4px 0 2px; }
  .neighbors { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow-y: auto; }
  .neighbors li button { width: 100%; text-align: left; padding: 6px 8px; background: transparent; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; color: var(--ink); }
  .neighbors li button:hover { background: var(--surface); }
</style>
