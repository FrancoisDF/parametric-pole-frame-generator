<script lang="ts">
  import { useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import { poleHeight } from '$lib/heightFunctions';
  import { poleCount } from '$lib/schema';
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
    const {
      spacing,
      poleDiameter,
      poleShape,
      minHeight,
      maxHeight,
      baseHeight,
      heightFunction,
      waveFrequency
    } = params;

    disposeCurrent();

    const n = poleCount(params);
    const count = n * n;
    const radius = poleDiameter / 2;

    // Unit-height cylinder (height=1 centered at origin); we scale Y per instance
    activeGeo =
      poleShape === 'tapered'
        ? new THREE.CylinderGeometry(radius * 0.3, radius, 1, 8, 1)
        : new THREE.CylinderGeometry(radius, radius, 1, 8, 1);

    activeMesh = new THREE.InstancedMesh(activeGeo, material, count);
    activeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    activeMesh.castShadow = true;
    activeMesh.receiveShadow = true;

    let idx = 0;

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const h = poleHeight(i, j, n, heightFunction, waveFrequency, minHeight, maxHeight);

        const x = (i - (n - 1) / 2) * spacing;
        const z = (j - (n - 1) / 2) * spacing;
        const y = baseHeight + h / 2; // centre of the scaled cylinder

        dummy.position.set(x, y, z);
        dummy.scale.set(1, h, 1); // scale Y to actual height
        dummy.updateMatrix();
        activeMesh.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }

    activeMesh.instanceMatrix.needsUpdate = true;
    scene.add(activeMesh);
  }

  // Rebuild whenever any param changes
  $effect(() => {
    // Access every tracked param to establish reactive dependencies
    const _ = [
      params.gridSize, // physical size → affects poleCount
      params.spacing,
      params.poleDiameter,
      params.poleShape,
      params.minHeight,
      params.maxHeight,
      params.baseHeight,
      params.heightFunction,
      params.waveFrequency
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
