<script lang="ts">
  import { T } from '@threlte/core';
  import { plateSize, type Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  const pw = $derived(plateSize(params));
</script>

<!--
  Base plate — a flat box centered at the XZ origin.
  Its bottom face sits at Y=0, top face at Y=baseHeight.
-->
<T.Mesh position={[0, params.baseHeight / 2, 0]} receiveShadow>
  <T.BoxGeometry args={[pw, params.baseHeight, pw]} />
  <T.MeshStandardMaterial color="#64748b" roughness={0.85} metalness={0.05} />
</T.Mesh>
