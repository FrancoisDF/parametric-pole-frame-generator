<script lang="ts">
  import '../app.css';
  import { theme } from '$lib/theme.svelte';
  let { children } = $props();
  // Reference theme to ensure the $effect in the store initialises on mount
  void theme.current;
</script>

{@render children()}
