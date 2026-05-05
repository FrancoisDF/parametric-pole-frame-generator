<script lang="ts">
  import { exportSTL, exportSplitAsZip } from '$lib/stl';
  import { poleCountX, poleCountZ } from '$lib/schema';
  import { numSectionsX, numSectionsZ } from '$lib/sectioning';
  import type { Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  let exporting = $state(false);
  let error = $state<string | null>(null);

  async function handleExport() {
    exporting = true;
    error = null;

    // Yield to the browser to repaint the button state before the heavy work
    await new Promise((resolve) => setTimeout(resolve, 16));

    try {
      if (params.splitEnabled && (numSectionsX(params) > 1 || numSectionsZ(params) > 1)) {
        await exportSplitAsZip(params);
      } else {
        exportSTL(params);
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

  <button class="export-btn" onclick={handleExport} disabled={exporting}>
    {#if exporting}
      <span class="export-spinner" aria-hidden="true"></span>
      {#if params.splitEnabled && totalSections > 1}
        Creating zip…
      {:else}
        Generating STL…
      {/if}
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
      {#if params.splitEnabled && totalSections > 1}
        Export as ZIP
      {:else}
        Export STL
      {/if}
    {/if}
  </button>

  <p class="export-meta">
    {#if params.splitEnabled && totalSections > 1}
      {totalSections} sections · {totalPoles} poles · binary STL · mm
    {:else}
      {totalPoles} poles · binary STL · mm
    {/if}
  </p>
</div>

<style>
  .export-area {
    padding: 14px 16px 20px;
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
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
