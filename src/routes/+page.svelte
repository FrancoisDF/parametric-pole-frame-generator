<script lang="ts">
  import ParameterPanel from '$lib/components/ParameterPanel.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import Scene from '$lib/components/Scene.svelte';
  import { params, STORAGE_KEY } from '$lib/params.svelte';

  let saveTimeout: ReturnType<typeof setTimeout>;

  /**
   * Save all params to localStorage whenever any property changes.
   * JSON.stringify touches every property, so Svelte 5 will track
   * all of them automatically — no need to list them manually.
   */
  $effect(() => {
    // Serialize to trigger reactivity on every param property
    const snapshot = JSON.parse(JSON.stringify(params));

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (err) {
          console.warn('Failed to save params to localStorage:', err);
        }
      }
    }, 300);
  });
</script>

<div class="app-layout">
  <!-- Left sidebar: all parameter controls + export -->
  <aside class="app-sidebar">
    <div class="sidebar-scroll">
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
    /* Prevent the sidebar from overflowing the viewport */
    min-height: 0;
  }

  /* Scrollable content area — grows to fill remaining space */
  .sidebar-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Always-visible footer that hosts the Export button */
  .sidebar-footer {
    flex-shrink: 0;
    border-top: 1px solid #1e293b;
    background: #0f172a;
  }

  .app-viewport {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
</style>
