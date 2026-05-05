<script lang="ts">
  import { exportSTL, exportSplitAsZip } from '$lib/stl';
  import { exportProjectAsJSON, downloadProjectFile } from '$lib/projectManager';
  import { poleCountX, poleCountZ } from '$lib/schema';
  import { numSectionsX, numSectionsZ } from '$lib/sectioning';
  import type { Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  let exporting = $state(false);
  let error = $state<string | null>(null);

  // Save dialog state
  let showSaveDialog = $state(false);
  let saving = $state(false);
  let saveError = $state<string | null>(null);
  let projectName = $state('My Project');
  let projectDescription = $state('');

  function openSaveDialog() {
    saveError = null;
    showSaveDialog = true;
  }

  function closeSaveDialog() {
    showSaveDialog = false;
    projectName = 'My Project';
    projectDescription = '';
    saveError = null;
  }

  async function handleSave() {
    if (!projectName.trim()) {
      saveError = 'Project name is required';
      return;
    }
    saving = true;
    saveError = null;
    try {
      const blob = exportProjectAsJSON(params, projectName.trim(), projectDescription.trim() || undefined);
      const filename = `${projectName.trim().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      downloadProjectFile(blob, filename);
      closeSaveDialog();
    } catch (e) {
      saveError = e instanceof Error ? e.message : 'Save failed';
    } finally {
      saving = false;
    }
  }

  async function handleExport() {
    exporting = true;
    error = null;

    // Yield to the browser to repaint the button state before the heavy work
    await new Promise((resolve) => setTimeout(resolve, 16));

    try {
      if (params.splitEnabled && (numSectionsX(params) > 1 || numSectionsZ(params) > 1)) {
        await exportSplitAsZip(params);
      } else {
        await exportSTL(params);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Export failed';
    } finally {
      exporting = false;
    }
  }

  const nX = $derived(poleCountX(params));
  const nZ = $derived(poleCountZ(params));
  const totalPoles = $derived(nX * nZ);
  const nsX = $derived(numSectionsX(params));
  const nsZ = $derived(numSectionsZ(params));
  const totalSections = $derived(nsX * nsZ);
</script>

<div class="export-area">
  {#if error}
    <p class="export-error">{error}</p>
  {/if}

  <div class="export-row">
    <button class="export-btn" onclick={handleExport} disabled={exporting}>
      {#if exporting}
        <span class="export-spinner" aria-hidden="true"></span>
        Creating zip…
      {:else}
        <svg
          class="export-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"
          />
          <path
            d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
          />
        </svg>
        Export ZIP
      {/if}
    </button>

    <button class="save-btn" onclick={openSaveDialog} title="Save project" aria-label="Save project">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    </button>
  </div>

  <p class="export-meta">
    {#if params.splitEnabled && totalSections > 1}
      {totalSections} sections · {totalPoles} poles · STL + SVG · mm
    {:else}
      {totalPoles} poles · STL + SVG · mm
    {/if}
  </p>
</div>

<!-- Save dialog -->
{#if showSaveDialog}
  <div class="modal-backdrop" onclick={closeSaveDialog} role="presentation"></div>
  <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="save-title">
    {#if saveError}
      <p class="modal-error">{saveError}</p>
    {/if}
    <h3 id="save-title" class="modal-title">Save Project</h3>
    <div class="form-group">
      <label for="save-project-name" class="form-label">Project Name *</label>
      <input
        id="save-project-name"
        type="text"
        class="form-input"
        bind:value={projectName}
        placeholder="My Project"
        disabled={saving}
      />
    </div>
    <div class="form-group">
      <label for="save-project-desc" class="form-label">Description (optional)</label>
      <textarea
        id="save-project-desc"
        class="form-textarea"
        bind:value={projectDescription}
        placeholder="Add notes about this project..."
        disabled={saving}
        rows="3"
      ></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick={closeSaveDialog} disabled={saving}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSave} disabled={saving || !projectName.trim()}>
        {#if saving}
          <span class="modal-spinner" aria-hidden="true"></span>
          Saving…
        {:else}
          Save
        {/if}
      </button>
    </div>
  </div>
{/if}

<style>
  .export-area {
    padding: 14px 16px 20px;
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .export-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1;
    padding: 10px 16px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s;
  }

  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 38px;
    background: var(--bg-panel, #f3f4f6);
    color: var(--text-secondary);
    border: 1px solid var(--border-muted);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .save-btn:hover {
    background: var(--bg-panel);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .modal-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-primary);
    border: 1px solid var(--border-muted);
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    z-index: 101;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .modal-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 16px;
  }

  .modal-error {
    font-size: 11px;
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
    padding: 6px 10px;
    border-radius: 6px;
    margin: 0 0 12px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-label);
    margin-bottom: 6px;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 8px 10px;
    font-size: 12px;
    border: 1px solid var(--border-muted);
    border-radius: 6px;
    background: var(--bg-panel);
    color: var(--text-secondary);
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .form-input:focus,
  .form-textarea:focus {
    border-color: #3b82f6;
  }

  .form-textarea {
    resize: vertical;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-primary {
    background: #3b82f6;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: var(--bg-panel);
    color: var(--text-secondary);
    border: 1px solid var(--border-muted);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--text-muted);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .export-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .export-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .export-meta {
    text-align: center;
    font-size: 10px;
    color: var(--text-muted);
    margin: 8px 0 0;
  }

  .export-error {
    font-size: 11px;
    color: #f87171;
    margin: 0 0 8px;
    padding: 6px 10px;
    background: rgba(248, 113, 113, 0.1);
    border-radius: 6px;
  }
</style>
