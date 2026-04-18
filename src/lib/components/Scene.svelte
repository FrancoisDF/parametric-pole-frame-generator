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

  let { params }: { params: Params } = $props();

  // Snapshot initial values so the camera position doesn't jump when params change.
  const initialDistance = untrack(() => Math.max(80, params.gridSize * 1.6 + params.maxHeight));

  // ── Sculpt state ──────────────────────────────────────────────────────────
  let isSculpting = $state(false);
  let isPainting = $state(false);
  let lastMouseY = 0;
  let brushX = $state(0);
  let brushZ = $state(0);
  let brushVisible = $state(false);

  // Three.js objects used for raycasting (created in SculptScene child)
  let raycaster = new THREE.Raycaster();
  let hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y = 0, shifted per baseHeight

  // Canvas element ref & camera ref passed up from inner component
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
      const next = Math.max(0.01, current + heightDelta * weight * brushStrength);
      newHeights[key] = next;
    }

    params.customHeights = newHeights;
  }

  function onPointerDown(e: PointerEvent) {
    if (!isSculpting) return;
    e.preventDefault();
    isPainting = true;
    lastMouseY = e.clientY;
    const hit = getWorldPointer(e);
    if (hit) { brushX = hit.x; brushZ = hit.z; }
  }

  function onPointerMove(e: PointerEvent) {
    if (!isSculpting) return;
    updateHitPlane();
    const hit = getWorldPointer(e);
    if (hit) {
      brushX = hit.x;
      brushZ = hit.z;
      brushVisible = true;
    }

    if (isPainting && hit) {
      const dy = lastMouseY - e.clientY; // positive = drag up = raise
      lastMouseY = e.clientY;
      // Scale: brushStrength is already factored in applyBrush
      const delta = dy * (params.gridSize / 5000);
      if (Math.abs(delta) > 0.0001) {
        applyBrush(hit.x, hit.z, delta);
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

<!-- Overlay toggle button -->
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
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          target={[0, 15, 0]}
          enabled={!isSculpting}
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

  <!-- Mode toggle button -->
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

  <!-- Sculpt mode hint -->
  {#if isSculpting}
    <div class="sculpt-hint">
      Drag <strong>up</strong> to raise &nbsp;·&nbsp; Drag <strong>down</strong> to lower
    </div>
  {/if}
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

  .mode-toggle {
    position: absolute;
    top: 12px;
    right: 12px;
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

  .sculpt-hint {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    background: rgba(15, 23, 42, 0.8);
    color: #94a3b8;
    border: 1px solid #334155;
    border-radius: 20px;
    font-size: 11px;
    backdrop-filter: blur(6px);
    pointer-events: none;
    z-index: 10;
    white-space: nowrap;
  }

  .sculpt-hint strong {
    color: #e2e8f0;
  }
</style>
