<script lang="ts">
  import { exportProjectAsJSON, downloadProjectFile, importProjectFromFile } from '$lib/projectManager';
  import { theme } from '$lib/theme.svelte';
  import type { Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  let isMenuOpen = $state(false);
  let showExportDialog = $state(false);
  let showImportConfirm = $state(false);
  let projectName = $state('My Project');
  let projectDescription = $state('');
  let importing = $state(false);
  let exporting = $state(false);
  let error = $state<string | null>(null);
  let importedMetadata = $state<any>(null);
  let pendingImportParams = $state<Params | null>(null);
  let fileInputRef: HTMLInputElement | null = $state(null);

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function openExportDialog() {
    closeMenu();
    error = null;
    showExportDialog = true;
  }

  function closeExportDialog() {
    showExportDialog = false;
    projectName = 'My Project';
    projectDescription = '';
  }

  async function handleExport() {
    if (!projectName.trim()) {
      error = 'Project name is required';
      return;
    }

    exporting = true;
    error = null;

    try {
      const blob = exportProjectAsJSON(params, projectName.trim(), projectDescription.trim() || undefined);
      const filename = `${projectName.trim().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      downloadProjectFile(blob, filename);
      closeExportDialog();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Export failed';
    } finally {
      exporting = false;
    }
  }

  function triggerFileInput() {
    closeMenu();
    fileInputRef?.click();
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    importing = true;
    error = null;

    try {
      const { metadata, params: importedParams } = await importProjectFromFile(file);
      importedMetadata = metadata;
      pendingImportParams = importedParams;
      showImportConfirm = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Import failed';
    } finally {
      importing = false;
      input.value = '';
    }
  }

  function confirmImport() {
    if (pendingImportParams) {
      Object.assign(params, pendingImportParams);
      showImportConfirm = false;
      importedMetadata = null;
      pendingImportParams = null;
    }
  }

  function cancelImport() {
    showImportConfirm = false;
    importedMetadata = null;
    pendingImportParams = null;
  }

  function toggleTheme() {
    theme.toggle();
  }
</script>

<div class="project-menu-container">
  <button
    class="menu-trigger-btn"
    onclick={toggleMenu}
    title="Open menu"
    aria-label="Open menu"
    aria-expanded={isMenuOpen}
  >
    <!-- Hamburger icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  </button>

  {#if isMenuOpen}
    <div class="menu-backdrop" onclick={closeMenu} role="presentation"></div>
    <div class="menu-dropdown" role="menu">
      <button
        class="menu-item save-item"
        onclick={openExportDialog}
        disabled={exporting}
        role="menuitem"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
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
        Save Project
      </button>

      <button
        class="menu-item load-item"
        onclick={triggerFileInput}
        disabled={importing}
        role="menuitem"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Load Project
      </button>

      <div class="menu-divider"></div>

      <button
        class="menu-item theme-item"
        onclick={toggleTheme}
        role="menuitem"
      >
        {#if theme.current === 'dark'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          Light Mode
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          Dark Mode
        {/if}
      </button>
    </div>
  {/if}

  <input
    bind:this={fileInputRef}
    type="file"
    accept=".json"
    onchange={handleFileSelect}
    style="display: none"
    disabled={importing}
  />

  <!-- Export Dialog -->
  {#if showExportDialog}
    <div class="modal-backdrop" onclick={closeExportDialog} role="presentation"></div>
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      {#if error}
        <p class="modal-error">{error}</p>
      {/if}

      <h3 id="export-title" class="modal-title">Save Project</h3>

      <div class="form-group">
        <label for="project-name" class="form-label">Project Name *</label>
        <input
          id="project-name"
          type="text"
          class="form-input"
          bind:value={projectName}
          placeholder="My Project"
          disabled={exporting}
        />
      </div>

      <div class="form-group">
        <label for="project-desc" class="form-label">Description (optional)</label>
        <textarea
          id="project-desc"
          class="form-textarea"
          bind:value={projectDescription}
          placeholder="Add notes about this project..."
          disabled={exporting}
          rows="3"
        ></textarea>
      </div>

      <div class="modal-actions">
        <button
          class="btn btn-secondary"
          onclick={closeExportDialog}
          disabled={exporting}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={handleExport}
          disabled={exporting || !projectName.trim()}
        >
          {#if exporting}
            <span class="spinner" aria-hidden="true"></span>
            Saving…
          {:else}
            Save
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- Import Confirmation Dialog -->
  {#if showImportConfirm && importedMetadata}
    <div class="modal-backdrop" onclick={cancelImport} role="presentation"></div>
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <h3 id="import-title" class="modal-title">Import Project</h3>

      <div class="import-summary">
        <div class="summary-row">
          <span class="summary-label">Name:</span>
          <span class="summary-value">{importedMetadata.name}</span>
        </div>
        {#if importedMetadata.description}
          <div class="summary-row">
            <span class="summary-label">Description:</span>
            <span class="summary-value">{importedMetadata.description}</span>
          </div>
        {/if}
        <div class="summary-row">
          <span class="summary-label">Created:</span>
          <span class="summary-value">{new Date(importedMetadata.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Last Updated:</span>
          <span class="summary-value">{new Date(importedMetadata.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <p class="import-warning">This will replace all current settings. This action cannot be undone.</p>

      <div class="modal-actions">
        <button
          class="btn btn-secondary"
          onclick={cancelImport}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={confirmImport}
        >
          Import Project
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .project-menu-container {
    position: relative;
  }

  .menu-trigger-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 6px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
  }

  .menu-trigger-btn:hover {
    color: var(--text-label);
    background: var(--bg-panel);
  }

  .menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--bg-primary);
    border: 1px solid var(--border-muted);
    border-radius: 6px;
    padding: 6px 0;
    min-width: 180px;
    z-index: 51;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    outline: none;
  }

  .menu-item:hover:not(:disabled) {
    background: var(--bg-panel);
    color: var(--text-primary);
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-item::before {
    content: '';
  }

  .menu-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 6px 0;
  }

  /* Modal styles */
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
    max-height: 90vh;
    overflow-y: auto;
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
  }

  .form-input:focus,
  .form-textarea:focus {
    border-color: #3b82f6;
  }

  .form-input:disabled,
  .form-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-textarea {
    resize: vertical;
  }

  .import-summary {
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
    font-size: 12px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .summary-row:last-child {
    margin-bottom: 0;
  }

  .summary-label {
    color: var(--text-muted);
    font-weight: 500;
  }

  .summary-value {
    color: var(--text-secondary);
    text-align: right;
    font-weight: 600;
  }

  .import-warning {
    font-size: 11px;
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
    padding: 8px 10px;
    border-radius: 6px;
    margin: 12px 0;
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
    outline: none;
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
    background: var(--bg-panel);
    border-color: var(--text-muted);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
