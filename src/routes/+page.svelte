<script lang="ts">
  import ParameterPanel from '$lib/components/ParameterPanel.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import Scene from '$lib/components/Scene.svelte';
  import { params, STORAGE_KEY } from '$lib/params.svelte';
  import { untrack } from 'svelte';
  import { generatePolePositions } from '$lib/poleLayout';
  import { polePositionKey } from '$lib/heightFunctions';

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

  // ── Sculpt shape preservation across layout changes ──────────────────────

  /**
   * IDW-interpolates sculpted heights from old pole positions to new ones,
   * working in a normalized [-1, 1] space so the shape scales correctly.
   */
  function remapSculpt(
    oldPositions: Array<{ x: number; z: number }>,
    oldHeights: Record<string, number>,
    oldHalfX: number,
    oldHalfZ: number,
    newPositions: Array<{ x: number; z: number }>,
    newHalfX: number,
    newHalfZ: number,
    minH: number,
    maxH: number
  ): Record<string, number> {
    const sculpted = oldPositions
      .filter(({ x, z }) => oldHeights[polePositionKey(x, z)] != null)
      .map(({ x, z }) => ({
        nx: oldHalfX > 0 ? x / oldHalfX : 0,
        nz: oldHalfZ > 0 ? z / oldHalfZ : 0,
        h: oldHeights[polePositionKey(x, z)]
      }));

    if (sculpted.length === 0) return {};

    const result: Record<string, number> = {};
    const radius = 0.6; // search radius in normalized [-1, 1] space

    for (const { x, z } of newPositions) {
      const nx = newHalfX > 0 ? x / newHalfX : 0;
      const nz = newHalfZ > 0 ? z / newHalfZ : 0;

      let totalW = 0;
      let weightedH = 0;
      let count = 0;

      for (const s of sculpted) {
        const d = Math.sqrt((nx - s.nx) ** 2 + (nz - s.nz) ** 2);
        if (d > radius) continue;
        count++;
        const w = 1 / (d * d + 0.001);
        totalW += w;
        weightedH += w * s.h;
      }

      if (count > 0) {
        result[polePositionKey(x, z)] = Math.max(minH, Math.min(maxH, weightedH / totalW));
      }
    }

    return result;
  }

  // Plain variables (not $state) — Effects read/write these but don't subscribe to them.
  let snapPositions: Array<{ x: number; z: number }> = [];
  let snapHeights: Record<string, number> = {};
  let snapHalfX = params.gridWidth / 2;
  let snapHalfZ = params.gridHeight / 2;
  let prevLayoutKey = '';

  // Effect A: whenever the sculpt changes, refresh the position/height snapshot.
  // Reads customHeights reactively; reads positions via untrack to avoid tracking layout params.
  $effect(() => {
    snapHeights = params.customHeights; // subscribe to sculpt changes
    untrack(() => {
      snapPositions = generatePolePositions(params);
      snapHalfX = params.gridWidth / 2;
      snapHalfZ = params.gridHeight / 2;
    });
  });

  // Effect B: whenever the layout changes, remap the sculpt onto the new pole positions.
  // Reads layout params (via the key) reactively; reads snapHeights as a plain variable.
  $effect(() => {
    const key = `${params.gridWidth}|${params.gridHeight}|${params.spacing}|${params.poleLayout}|${params.layoutSeed}`;
    if (key !== prevLayoutKey && prevLayoutKey !== '') {
      if (Object.keys(snapHeights).length > 0) {
        const newPositions = untrack(() => generatePolePositions(params));
        const newHalfX = params.gridWidth / 2;
        const newHalfZ = params.gridHeight / 2;
        const remapped = remapSculpt(
          snapPositions,
          snapHeights,
          snapHalfX,
          snapHalfZ,
          newPositions,
          newHalfX,
          newHalfZ,
          params.minHeight,
          params.maxHeight
        );
        untrack(() => {
          params.customHeights = remapped;
        });
      }
    }
    prevLayoutKey = key;
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
    <Scene {params} onSculpt={(h) => (params.customHeights = h)} />
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-primary);
  }

  .app-sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid var(--border-subtle);
    /* Prevent the sidebar from overflowing the viewport */
    min-height: 0;
  }

  /* Scrollable content area — grows to fill remaining space */
  .sidebar-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-primary);
  }

  /* Always-visible footer that hosts the Export button */
  .sidebar-footer {
    flex-shrink: 0;
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-primary);
  }

  .app-viewport {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
</style>
