<script lang="ts">
  import { poleCount, type Params } from '$lib/schema';

  let { params }: { params: Params } = $props();

  const n = $derived(poleCount(params));

  // Guards: keep minHeight ≤ maxHeight
  function clampMin() {
    if (params.minHeight > params.maxHeight) params.maxHeight = params.minHeight;
  }
  function clampMax() {
    if (params.maxHeight < params.minHeight) params.minHeight = params.maxHeight;
  }
</script>

<div class="param-panel">
  <header class="panel-header">
    <h1 class="panel-title">Pole Frame Generator</h1>
    <p class="panel-subtitle">All units in millimetres</p>
  </header>

  <div class="param-sections">
    <!-- ── GRID ── -->
    <section class="param-section">
      <h2 class="section-heading">Grid</h2>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="gridSize">Grid Size</label>
          <span class="control-value">{params.gridSize} mm</span>
        </div>
        <input
          id="gridSize"
          type="range"
          min="10"
          max="2000"
          step="10"
          bind:value={params.gridSize}
        />
        <p class="control-hint">Total poles: {n} × {n} = {n * n}</p>
      </div>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="spacing">Pole Spacing</label>
          <span class="control-value">{params.spacing} mm</span>
        </div>
        <input
          id="spacing"
          type="range"
          min="1"
          max="200"
          step="0.5"
          bind:value={params.spacing}
        />
      </div>
    </section>

    <!-- ── POLES ── -->
    <section class="param-section">
      <h2 class="section-heading">Poles</h2>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="poleDiameter">Diameter</label>
          <span class="control-value">{params.poleDiameter} mm</span>
        </div>
        <input
          id="poleDiameter"
          type="range"
          min="0.5"
          max="20"
          step="0.5"
          bind:value={params.poleDiameter}
        />
      </div>

      <div class="control-group">
        <label class="control-label" for="poleShape">Shape</label>
        <select id="poleShape" class="param-select" bind:value={params.poleShape}>
          <option value="straight">Straight (cylinder)</option>
          <option value="tapered">Tapered (cone)</option>
        </select>
      </div>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="minHeight">Min Height</label>
          <span class="control-value">{params.minHeight} mm</span>
        </div>
        <input
          id="minHeight"
          type="range"
          min="0"
          max="200"
          step="1"
          bind:value={params.minHeight}
          oninput={clampMin}
        />
      </div>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="maxHeight">Max Height</label>
          <span class="control-value">{params.maxHeight} mm</span>
        </div>
        <input
          id="maxHeight"
          type="range"
          min="0"
          max="200"
          step="1"
          bind:value={params.maxHeight}
          oninput={clampMax}
        />
      </div>
    </section>

    <!-- ── BASE ── -->
    <section class="param-section">
      <h2 class="section-heading">Base Plate</h2>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="baseHeight">Thickness</label>
          <span class="control-value">{params.baseHeight} mm</span>
        </div>
        <input
          id="baseHeight"
          type="range"
          min="0.5"
          max="20"
          step="0.5"
          bind:value={params.baseHeight}
        />
      </div>

      <div class="control-group">
        <div class="control-label-row">
          <label class="control-label" for="baseMargin">Margin</label>
          <span class="control-value">{params.baseMargin} mm</span>
        </div>
        <input
          id="baseMargin"
          type="range"
          min="0"
          max="50"
          step="1"
          bind:value={params.baseMargin}
        />
      </div>
    </section>

    <!-- ── HEIGHT FUNCTION ── -->
    <section class="param-section">
      <h2 class="section-heading">Height Function</h2>

      <div class="control-group">
        <label class="control-label" for="heightFunction">Function</label>
        <select id="heightFunction" class="param-select" bind:value={params.heightFunction}>
          <option value="wave">Wave (sin × cos)</option>
          <option value="hill">Hill (Gaussian)</option>
          <option value="pyramid">Pyramid (diamond)</option>
          <option value="flat">Flat (uniform)</option>
        </select>
      </div>

      {#if params.heightFunction === 'wave'}
        <div class="control-group">
          <div class="control-label-row">
            <label class="control-label" for="waveFrequency">Wave Frequency</label>
            <span class="control-value">{params.waveFrequency.toFixed(1)}</span>
          </div>
          <input
            id="waveFrequency"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            bind:value={params.waveFrequency}
          />
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .param-panel {
    display: flex;
    flex-direction: column;
    background: #0f172a;
    color: #e2e8f0;
  }

  .panel-header {
    padding: 20px 16px 14px;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 2px;
    letter-spacing: -0.01em;
  }

  .panel-subtitle {
    font-size: 11px;
    color: #64748b;
    margin: 0;
  }

  .param-sections {
    padding: 8px 0;
  }

  .param-section {
    padding: 12px 16px;
    border-bottom: 1px solid #1e293b;
  }

  .param-section:last-child {
    border-bottom: none;
  }

  .section-heading {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
    margin: 0 0 12px;
  }

  .control-group {
    margin-bottom: 14px;
  }

  .control-group:last-child {
    margin-bottom: 0;
  }

  .control-label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .control-label {
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    display: block;
    margin-bottom: 6px;
  }

  .control-label-row .control-label {
    margin-bottom: 0;
  }

  .control-value {
    font-size: 12px;
    font-weight: 600;
    color: #60a5fa;
    font-variant-numeric: tabular-nums;
  }

  .control-hint {
    font-size: 10px;
    color: #475569;
    margin: 4px 0 0;
  }

  .param-select {
    width: 100%;
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }

  .param-select:focus {
    border-color: #3b82f6;
  }
</style>
