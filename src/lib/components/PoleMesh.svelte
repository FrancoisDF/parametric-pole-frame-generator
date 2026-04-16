<script lang="ts">
  import { useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import { poleHeightFromWorld } from '$lib/heightFunctions';
  import { generatePolePositions } from '$lib/poleLayout';
  import type { Params } from '$lib/schema';
  import { onDestroy } from 'svelte';

  let { params }: { params: Params } = $props();

  const { scene } = useThrelte();

  // Reusable dummy for matrix composition
  const dummy = new THREE.Object3D();

  // Shared material — survives geometry rebuilds
  const material = new THREE.MeshStandardMaterial({
    color: '#3b82f6',
    roughness: 0.5,
    metalness: 0.1
  });

  let activeMesh: THREE.InstancedMesh | null = null;
  let activeGeo: THREE.BufferGeometry | null = null;

  function disposeCurrent() {
    if (activeMesh) {
      scene.remove(activeMesh);
      activeMesh = null;
    }
    if (activeGeo) {
      activeGeo.dispose();
      activeGeo = null;
    }
  }

  function buildInstances() {
    const { poleDiameter, minHeight, maxHeight, baseHeight, heightFunction, waveFrequency, gridSize } =
      params;

    disposeCurrent();

    const positions = generatePolePositions(params);
    const count = positions.length;
    const radius = poleDiameter / 2;
    const half = gridSize / 2;

    // Unit-height cylinder (height=1 centred at origin); we scale Y per instance
    activeGeo = new THREE.CylinderGeometry(radius, radius, 1, 8, 1);

    activeMesh = new THREE.InstancedMesh(activeGeo, material, count);
    activeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    activeMesh.castShadow = true;
    activeMesh.receiveShadow = true;

    for (let idx = 0; idx < positions.length; idx++) {
      const { x, z } = positions[idx];
      const h = poleHeightFromWorld(x, z, half, heightFunction, waveFrequency, minHeight, maxHeight);
      const y = baseHeight + h / 2; // centre of the scaled cylinder

      dummy.position.set(x, y, z);
      dummy.scale.set(1, h, 1); // scale Y to actual height
      dummy.updateMatrix();
      activeMesh.setMatrixAt(idx, dummy.matrix);
    }

    activeMesh.instanceMatrix.needsUpdate = true;
    scene.add(activeMesh);
  }

  // Rebuild whenever any param changes
  $effect(() => {
    // Access every tracked param to establish reactive dependencies
    const _ = [
      params.gridSize,
      params.spacing,
      params.poleDiameter,
      params.minHeight,
      params.maxHeight,
      params.baseHeight,
      params.heightFunction,
      params.waveFrequency,
      params.poleLayout,
      params.layoutSeed
    ];
    void _;

    buildInstances();

    return () => {
      disposeCurrent();
    };
  });

  onDestroy(() => {
    disposeCurrent();
    material.dispose();
  });
</script>
