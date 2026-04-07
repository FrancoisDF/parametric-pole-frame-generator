<script lang="ts">
  import ParameterPanel from '$lib/components/ParameterPanel.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import Scene from '$lib/components/Scene.svelte';
  import { params, STORAGE_KEY } from '$lib/params.svelte';

  let saveTimeout: ReturnType<typeof setTimeout>;

  /**
   * Save params to localStorage whenever they change.
   * Debounced to avoid excessive writes.
   */
  $effect(() => {
    // Touch all properties to establish dependencies
    void (
      params.gridSize +
      params.spacing +
      params.poleDiameter +
      params.minHeight +
      params.maxHeight +
      params.poleShape.length +
      params.baseHeight +
      params.baseMargin +
      params.heightFunction.length +
      params.waveFrequency
    );

    // Debounce saves to avoid excessive writes
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const snapshot = { ...params };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (error) {
          console.warn('Failed to save params to localStorage:', error);
        }
      }
    }, 300);
  });
</script>

<div class="app-layout">
  <!-- Left sidebar: all parameter controls + export -->
  <aside class="app-sidebar">
    <div class="sidebar-content">
      <ParameterPanel {params} />
    </div>
    <div class="sidebar-footer">
      <ExportButton {params} />
    </div>
  </aside>

  <!-- Right: 3D viewport -->
  <main class="app-viewport">
    <Scene {params} />
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .app-sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid #1e293b;
  }

  .sidebar-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .sidebar-footer {
    flex-shrink: 0;
    border-top: 1px solid #1e293b;
  }

  .app-viewport {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
</style>
