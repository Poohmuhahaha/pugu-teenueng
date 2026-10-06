const fs = require('fs');
const entriesPage = fs.readFileSync('apps/admin/src/routes/entries/+page.svelte', 'utf8');

const scriptLogicToAdd = `
  let creatingSchema = false;
  let newSlug = '';
  let newName = '';
  let newFields = [{ name: 'title', type: 'text', required: true }];
  let schemaErr = '';
  let confirmingSchemaDelete = null;

  function addField() { newFields = [...newFields, { name: '', type: 'text', required: false }]; }
  function removeField(i) { newFields = newFields.filter((_, idx) => idx !== i); }

  async function submitSchema() {
    schemaErr = '';
    const res = await fetch('/api/v1/content-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: newSlug.trim().toLowerCase(),
        name: newName.trim(),
        schema: { fields: newFields.filter((f) => f.name.trim()) },
      }),
    });
    if (!res.ok) { schemaErr = await res.text(); return; }
    newSlug = ''; newName = ''; newFields = [{ name: 'title', type: 'text', required: true }];
    creatingSchema = false;
    await loadTypes();
  }

  async function deleteSchema(t) {
    const res = await fetch(\`/api/v1/content-types/\${t.id}\`, { method: 'DELETE' });
    if(res.ok) {
      await loadTypes();
      confirmingSchemaDelete = null;
    }
  }

  const fieldColor = {
    text: 'badge-muted', richtext: 'badge-violet', number: 'badge-blue',
    date: 'badge-orange', select: 'badge-emerald', relation: 'badge-pink',
    file: 'badge-warning', checkbox: 'badge-success',
  };
`;

let newEntriesScript = entriesPage.replace(
  'let err = \'\';',
  'let err = \'\';\n' + scriptLogicToAdd
);

const schemaHtml = `
  <div class="content-header" in:fade={{duration: 200}}>
    <div class="content-title">
      <h2>Database Schemas</h2>
      <span class="badge badge-muted">{types.length} Collections</span>
    </div>
    <button class="btn btn-primary" on:click={() => (creatingSchema = true)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      New Schema
    </button>
  </div>

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Slug</th>
          <th>Fields</th>
          <th>Created</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each types as t, i (t.id)}
          <tr use:reveal={{ delay: i * 0.02, y: 8 }}>
            <td>
              <a class="type-name-link" href="#" on:click|preventDefault={() => pickSlug(t.slug)}>
                <div class="type-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                </div>
                {t.name}
              </a>
            </td>
            <td><code>/{t.slug}</code></td>
            <td>
              <div class="type-fields-inline">
                {#each t.schema.fields.slice(0, 3) as f}
                  <span class="badge {fieldColor[f.type] ?? 'badge-muted'}">{f.name}</span>
                {/each}
                {#if t.schema.fields.length > 3}
                  <span class="badge badge-muted">+{t.schema.fields.length - 3}</span>
                {/if}
              </div>
            </td>
            <td class="type-date">{new Date(t.createdAt).toLocaleDateString()}</td>
            <td style="text-align: right;">
              <div class="type-actions">
                <a class="link-action" href={\`/content-types/\${t.id}/permissions\`}>Permissions</a>
                {#if confirmingSchemaDelete === t.id}
                  <span class="confirm-inline" in:fly={{ x: 4, duration: 140 }}>
                    Delete?
                    <button class="link-action danger" on:click={() => deleteSchema(t)}>Yes</button>
                    <button class="link-action" on:click={() => (confirmingSchemaDelete = null)}>Cancel</button>
                  </span>
                {:else}
                  <button class="link-action danger" on:click={() => (confirmingSchemaDelete = t.id)}>Delete</button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  {#if creatingSchema}
    <div class="modal-overlay" on:click={() => (creatingSchema = false)}>
      <div class="modal-card panel" on:click|stopPropagation>
        <div class="modal-header">
          <h3>Create Content Type</h3>
          <button class="modal-close-btn" on:click={() => (creatingSchema = false)}>×</button>
        </div>
        <form class="modal-body stack" on:submit|preventDefault={submitSchema}>
          <div class="field">
            <label class="field-label" for="ct-slug">Slug</label>
            <input id="ct-slug" bind:value={newSlug} placeholder="personal-crm" pattern="[a-z][a-z0-9-]*" required class="modern-input" />
            <span class="field-hint">lowercase, hyphen-separated. Becomes the URL: <code>/api/v1/&lt;slug&gt;</code></span>
          </div>
          <div class="field">
            <label class="field-label" for="ct-name">Display name</label>
            <input id="ct-name" bind:value={newName} placeholder="Personal CRM" required class="modern-input" />
          </div>

          <div class="fields-section" style="margin-top: 16px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="font-weight:bold;">Schema fields</span>
              <button type="button" class="btn btn-secondary btn-sm" on:click={addField}>+ Add field</button>
            </div>
            <div class="field-rows" style="display:flex; flex-direction:column; gap:8px;">
              {#each newFields as f, i (i)}
                <div class="field-row" style="display:flex; gap:8px; align-items:center;">
                  <input bind:value={f.name} placeholder="field name" class="modern-input" style="flex:1;" />
                  <select bind:value={f.type} class="modern-input" style="width:120px;">
                    <option value="text">text</option>
                    <option value="richtext">richtext</option>
                    <option value="number">number</option>
                    <option value="date">date</option>
                    <option value="select">select</option>
                    <option value="relation">relation</option>
                    <option value="file">file</option>
                    <option value="checkbox">checkbox</option>
                  </select>
                  <label class="required-toggle" style="display:flex; align-items:center; gap:4px; font-size:12px;">
                    <input type="checkbox" bind:checked={f.required} />
                    <span>required</span>
                  </label>
                  {#if newFields.length > 1}
                    <button type="button" class="btn btn-ghost btn-sm" style="padding:4px; color:red;" on:click={() => removeField(i)}>×</button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          {#if schemaErr}<div class="form-error" style="color:red; margin-top:8px;">{schemaErr}</div>{/if}
          <div class="form-actions" style="margin-top: 16px;">
            <button type="button" class="btn btn-secondary" on:click={() => (creatingSchema = false)}>Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
`;

const emptyStateRegex = /{#if !selectedType}[\s\S]*?{:else}/;
newEntriesScript = newEntriesScript.replace(emptyStateRegex, `{#if !selectedType}\n${schemaHtml}\n  {:else}`);

const cssToAdd = `
  .table-container {
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--c-primary);
    overflow-x: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: left;
  }
  .data-table th {
    background: var(--c-surface-soft);
    padding: 12px 16px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--c-primary);
    border-bottom: 3px solid var(--c-primary);
  }
  .data-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--c-hairline-soft);
    vertical-align: middle;
  }
  .data-table tr:hover td {
    background: var(--c-surface-soft);
  }
  .data-table tr:last-child td {
    border-bottom: none;
  }
  .type-name-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 700;
    color: var(--c-ink);
    text-decoration: none;
  }
  .type-name-link:hover { text-decoration: underline; }
  .type-icon {
    width: 28px; height: 28px;
    background: var(--c-canvas);
    border: 2px solid var(--c-primary);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    color: var(--c-primary);
  }
  .data-table code {
    font-family: var(--font-mono);
    font-size: 12px;
    background: transparent;
    color: var(--c-muted);
  }
  .type-fields-inline { display: flex; gap: 6px; flex-wrap: wrap; }
  .type-fields-inline .badge {
    padding: 2px 8px; font-size: 11px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1);
  }
  .type-date { font-size: 13px; color: var(--c-muted); }
  .type-actions { display: inline-flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .confirm-inline {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    padding: 4px 8px;
    color: var(--c-body);
  }
  .link-action {
    background: transparent; border: none; color: var(--c-muted);
    font: 500 12px/1.4 var(--font-body); padding: 4px 8px; border-radius: var(--r-md);
    cursor: pointer; text-decoration: none; transition: color 0.15s, background 0.15s;
  }
  .link-action:hover { color: var(--c-ink); background: var(--c-hairline-soft); }
  .link-action.danger { color: var(--c-error); }
  .link-action.danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--c-error); }

  /* FIX SIDEBAR LAG/LACKLESS */
  .sidebar-nav {
    overflow-y: auto;
    max-height: calc(100vh - 150px);
  }
`;

newEntriesScript = newEntriesScript.replace('</style>', cssToAdd + '\n</style>');

fs.writeFileSync('apps/admin/src/routes/entries/+page.svelte', newEntriesScript);
console.log('Merged!');
