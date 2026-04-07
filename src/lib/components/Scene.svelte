<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import BaseMesh from './BaseMesh.svelte';
  import PoleMesh from './PoleMesh.svelte';
  import type { Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  // Compute initial camera distance from the starting grid footprint.
  // We use an untracked snapshot so OrbitControls can freely orbit
  // without the camera jumping back when params change.
  const initialDistance = Math.max(
    80,
    params.gridSize * 1.6 + params.maxHeight
  );
</script>

<div class="scene-wrapper">
  <Canvas renderMode="always">
    <!-- Camera -->
    <T.PerspectiveCamera
      makeDefault
      fov={45}
      near={0.1}
      far={100000}
      position={[initialDistance * 0.8, initialDistance * 0.7, initialDistance]}
    >
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        target={[0, 15, 0]}
      />
    </T.PerspectiveCamera>

    <!-- Lighting -->
    <T.AmbientLight intensity={0.6} />
    <T.DirectionalLight position={[50, 120, 80]} intensity={1.8} castShadow />
    <T.DirectionalLight position={[-60, 40, -60]} intensity={0.4} color="#a5c8ff" />

    <!-- Ground grid helper (subtle visual reference) -->
    <T.GridHelper
      args={[2000, 100, '#1e293b', '#1e293b']}
      position={[0, -0.5, 0]}
    />

    <!-- Scene objects -->
    <BaseMesh {params} />
    <PoleMesh {params} />
  </Canvas>
</div>

<style>
  .scene-wrapper {
    width: 100%;
    height: 100%;
    background: #0d1117;
  }
</style>
