<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import { untrack } from 'svelte';
  import { OrbitControls } from '@threlte/extras';
  import BaseMesh from './BaseMesh.svelte';
  import PoleMesh from './PoleMesh.svelte';
  import type { Params } from '$lib/schema';
  import { polePositionKey, effectivePoleHeight } from '$lib/heightFunctions';
  import { generatePolePositions } from '$lib/poleLayout';
  import * as THREE from 'three';

  let {
    params,
    onSculpt
  }: {
    params: Params;
    onSculpt: (h: Record<string, number>) => void;
  } = $props();

  // Snapshot initial values so the camera position doesn't jump when params change.
  const initialDistance = untrack(() => Math.max(80, params.gridSize * 1.6 + params.maxHeight));

  // ── Sculpt state ──────────────────────────────────────────────────────────
  let isSculpting = $state(false);
  let isPainting = $state(false);
  let lastMouseY = 0;
  // Visual ring position
  let brushX = $state(0);
  let brushZ = $state(0);
  // Anchor mode: frozen on pointerdown, used for applyBrush throughout the stroke
  let paintAnchorX = 0;
  let paintAnchorZ = 0;
  // Path mode: last position where brush was applied (for stride spacing)
  let lastAppliedX = 0;
  let lastAppliedZ = 0;
  let isShiftHeld = $state(false);
  let brushVisible = $state(false);

  // Track shift key while sculpting
  $effect(() => {
    if (!isSculpting) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Shift') isShiftHeld = true; }
    function onKeyUp(e: KeyboardEvent) { if (e.key === 'Shift') isShiftHeld = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      isShiftHeld = false;
    };
  });

  // Three.js objects used for raycasting
  let raycaster = new THREE.Raycaster();
  let hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  let canvasEl: HTMLElement | null = null;
  let cameraRef: THREE.PerspectiveCamera | null = null;

  function updateHitPlane() {
    hitPlane.constant = -params.baseHeight;
  }

  function getWorldPointer(e: PointerEvent): THREE.Vector3 | null {
    if (!canvasEl || !cameraRef) return null;
    const rect = canvasEl.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(hitPlane, target);
    return hit ? target : null;
  }

  function applyBrush(worldX: number, worldZ: number, heightDelta: number) {
    const { brushRadius, brushStrength, gridSize, heightFunction, waveFrequency, minHeight, maxHeight } = params;
    const half = gridSize / 2;
    const positions = generatePolePositions(params);
    const newHeights = { ...params.customHeights };

    for (const { x, z } of positions) {
      const dist = Math.sqrt((x - worldX) ** 2 + (z - worldZ) ** 2);
      if (dist >= brushRadius) continue;
      const weight = Math.exp(-3 * (dist / brushRadius) ** 2);
      const key = polePositionKey(x, z);
      const current = effectivePoleHeight(x, z, half, heightFunction, waveFrequency, minHeight, maxHeight, newHeights);
      const next = Math.max(minHeight, Math.min(maxHeight, current + heightDelta * weight * brushStrength));
      newHeights[key] = next;
    }

    onSculpt(newHeights);
  }

  function pathDelta() {
    return params.brushStrength * 0.1 * (isShiftHeld ? -1 : 1);
  }

  function onPointerDown(e: PointerEvent) {
    if (!isSculpting) return;
    e.preventDefault();
    updateHitPlane();
    const hit = getWorldPointer(e);

    if (params.sculptMode === 'path') {
      if (hit) {
        brushX = hit.x;
        brushZ = hit.z;
        lastAppliedX = hit.x;
        lastAppliedZ = hit.z;
        applyBrush(hit.x, hit.z, pathDelta());
      }
      isPainting = true;
      brushVisible = true;
    } else {
      // Anchor mode
      if (hit) {
        paintAnchorX = hit.x;
        paintAnchorZ = hit.z;
        brushX = hit.x;
        brushZ = hit.z;
      }
      isPainting = true;
      lastMouseY = e.clientY;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!isSculpting) return;

    if (params.sculptMode === 'path') {
      updateHitPlane();
      const hit = getWorldPointer(e);
      if (hit) {
        brushX = hit.x;
        brushZ = hit.z;
        brushVisible = true;
        if (isPainting) {
          const dist = Math.sqrt((hit.x - lastAppliedX) ** 2 + (hit.z - lastAppliedZ) ** 2);
          if (dist >= params.brushRadius * 0.2) {
            applyBrush(hit.x, hit.z, pathDelta());
            lastAppliedX = hit.x;
            lastAppliedZ = hit.z;
          }
        }
      }
    } else {
      // Anchor mode
      if (isPainting) {
        brushVisible = true;
        const dy = lastMouseY - e.clientY; // positive = drag up = raise
        lastMouseY = e.clientY;
        const delta = dy * (params.gridSize / 5000);
        if (Math.abs(delta) > 0.0001) {
          applyBrush(paintAnchorX, paintAnchorZ, delta);
        }
      } else {
        // Hovering: let the ring follow the cursor
        updateHitPlane();
        const hit = getWorldPointer(e);
        if (hit) {
          brushX = hit.x;
          brushZ = hit.z;
          brushVisible = true;
        }
      }
    }
  }

  function onPointerUp() {
    isPainting = false;
  }

  function onPointerLeave() {
    brushVisible = false;
    isPainting = false;
  }

  function toggleMode() {
    isSculpting = !isSculpting;
    if (!isSculpting) {
      brushVisible = false;
      isPainting = false;
    }
  }
</script>

<div class="scene-outer">
  <div
    class="scene-wrapper"
    role="application"
    aria-label="3D viewport"
    bind:this={canvasEl}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointerleave={onPointerLeave}
    style={isSculpting ? 'cursor: crosshair;' : ''}
  >
    <Canvas renderMode="always">
      <!-- Camera — bind ref so raycaster can use it -->
      <T.PerspectiveCamera
        makeDefault
        fov={45}
        near={0.1}
        far={100000}
        position={[initialDistance * 0.8, initialDistance * 0.7, initialDistance]}
        oncreate={(ref) => { cameraRef = ref; }}
      >
        <!-- Allow zoom always; disable rotate & pan during sculpt so scroll = zoom -->
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          target={[0, 15, 0]}
          enableRotate={!isSculpting}
          enablePan={!isSculpting}
        />
      </T.PerspectiveCamera>

      <!-- Lighting -->
      <T.AmbientLight intensity={0.6} />
      <T.DirectionalLight position={[50, 120, 80]} intensity={1.8} castShadow />
      <T.DirectionalLight position={[-60, 40, -60]} intensity={0.4} color="#a5c8ff" />

      <!-- Ground grid helper -->
      <T.GridHelper
        args={[2000, 100, '#1e293b', '#1e293b']}
        position={[0, -0.5, 0]}
      />

      <!-- Brush ring indicator (only in sculpt mode) -->
      {#if isSculpting && brushVisible}
        <T.Mesh position={[brushX, params.baseHeight + 0.2, brushZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <T.RingGeometry args={[params.brushRadius * 0.97, params.brushRadius, 64]} />
          <T.MeshBasicMaterial color={isPainting ? '#f97316' : '#22d3ee'} side={2} />
        </T.Mesh>
      {/if}

      <!-- Scene objects -->
      <BaseMesh {params} />
      <PoleMesh {params} />
    </Canvas>
  </div>

  <!-- Sculpt brush HUD — appears above the toggle button when sculpting -->
  {#if isSculpting}
    <div class="sculpt-hud">
      <div class="hud-section">
        <span class="hud-label">Mode</span>
        <div class="hud-mode-btns">
          <button
            class="hud-mode-btn"
            class:active={params.sculptMode === 'anchor'}
            onclick={() => (params.sculptMode = 'anchor')}
          >Anchor</button>
          <button
            class="hud-mode-btn"
            class:active={params.sculptMode === 'path'}
            onclick={() => (params.sculptMode = 'path')}
          >Path</button>
        </div>
      </div>

      <div class="hud-section">
        <div class="hud-slider-row">
          <span class="hud-label">Radius</span>
          <input type="range" min="5" max="500" step="5" bind:value={params.brushRadius} class="hud-slider" />
          <span class="hud-val">{params.brushRadius}</span>
        </div>
        <div class="hud-slider-row">
          <span class="hud-label">Strength</span>
          <input type="range" min="0.1" max="20" step="0.1" bind:value={params.brushStrength} class="hud-slider" />
          <span class="hud-val">{params.brushStrength.toFixed(1)}</span>
        </div>
      </div>

      {#if Object.keys(params.customHeights).length > 0}
        <button class="hud-clear" onclick={() => onSculpt({})}>
          Clear Sculpt ({Object.keys(params.customHeights).length} poles)
        </button>
      {/if}

      <div class="hud-hint">
        {#if params.sculptMode === 'path'}
          Drag to <strong>raise</strong> &nbsp;·&nbsp; <strong>Shift</strong>+drag to lower
        {:else}
          Drag <strong>up</strong> to raise &nbsp;·&nbsp; drag <strong>down</strong> to lower
        {/if}
        &nbsp;·&nbsp; Scroll to zoom
      </div>
    </div>
  {/if}

  <!-- Mode toggle button — bottom center -->
  <button
    class="mode-toggle"
    class:sculpt-active={isSculpting}
    onclick={toggleMode}
    title={isSculpting ? 'Switch to Orbit mode' : 'Switch to Sculpt mode'}
  >
    {#if isSculpting}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
      Orbit
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      Sculpt
    {/if}
  </button>
</div>

<style>
  .scene-outer {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .scene-wrapper {
    width: 100%;
    height: 100%;
    background: #0d1117;
  }

  /* ── Mode toggle — bottom center ── */
  .mode-toggle {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    background: rgba(15, 23, 42, 0.85);
    color: #94a3b8;
    border: 1px solid #334155;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    user-select: none;
    z-index: 10;
    white-space: nowrap;
  }

  .mode-toggle:hover {
    background: rgba(30, 41, 59, 0.95);
    color: #e2e8f0;
    border-color: #475569;
  }

  .mode-toggle.sculpt-active {
    background: rgba(234, 88, 12, 0.2);
    color: #fb923c;
    border-color: #ea580c;
  }

  .mode-toggle.sculpt-active:hover {
    background: rgba(234, 88, 12, 0.3);
  }

  /* ── Sculpt HUD — above the toggle button ── */
  .sculpt-hud {
    position: absolute;
    bottom: 62px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 12px 14px;
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
  }

  .hud-section {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .hud-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
    flex-shrink: 0;
  }

  .hud-mode-btns {
    display: flex;
    gap: 6px;
  }

  .hud-mode-btn {
    flex: 1;
    padding: 5px 10px;
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .hud-mode-btn:hover {
    background: #263348;
    color: #cbd5e1;
  }

  .hud-mode-btn.active {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border-color: #3b82f6;
  }

  .hud-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hud-slider-row .hud-label {
    width: 52px;
  }

  .hud-slider {
    flex: 1;
    accent-color: #3b82f6;
    cursor: pointer;
    min-width: 0;
  }

  .hud-val {
    font-size: 11px;
    font-weight: 600;
    color: #60a5fa;
    font-variant-numeric: tabular-nums;
    width: 38px;
    text-align: right;
    flex-shrink: 0;
  }

  .hud-clear {
    width: 100%;
    padding: 6px 12px;
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .hud-clear:hover {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.6);
  }

  .hud-hint {
    font-size: 10px;
    color: #475569;
    text-align: center;
    line-height: 1.4;
  }

  .hud-hint strong {
    color: #94a3b8;
  }
</style>
