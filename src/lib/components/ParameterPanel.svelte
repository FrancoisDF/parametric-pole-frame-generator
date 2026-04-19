<script lang="ts">
  import { poleCount, plateSize, type Params } from '$lib/schema';
  import { numSectionsPerSide, sectionPhysicalSize } from '$lib/sectioning';
  import { generatePolePositions } from '$lib/poleLayout';
  import { theme } from '$lib/theme.svelte';

  let { params }: { params: Params } = $props();

  const n = $derived(poleCount(params));
  const actualPoleCount = $derived(generatePolePositions(params).length);

  // Guards: keep minHeight ≤ maxHeight
  function clampMin() {
    if (params.minHeight > params.maxHeight) params.maxHeight = params.minHeight;
  }
  function clampMax() {
    if (params.maxHeight < params.minHeight) params.minHeight = params.maxHeight;
  }

  // Split preview calculations
  const ns = $derived(numSectionsPerSide(params));
  const sectionSize = $derived(sectionPhysicalSize(params));
  const totalSections = $derived(ns * ns);
  const fullPlateSize = $derived(plateSize(params));
</script>

<div class="param-panel">
  <header class="panel-header">
    <div class="panel-header-top">
      <h1 class="panel-title">Pole Frame Generator</h1>
      <button
        class="theme-toggle-btn"
        onclick={() => theme.toggle()}
        title={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {#if theme.current === 'dark'}
          <!-- Sun icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
        {:else}
          <!-- Moon icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>
    </div>
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

      <div class="control-group">
        <label class="control-label" for="poleLayout">Pole Layout</label>
        <select id="poleLayout" class="param-select" bind:value={params.poleLayout}>
          <option value="grid">Grid (regular)</option>
          <option value="random">Random</option>
          <option value="circular">Circular</option>
          <option value="spiral">Spiral</option>
        </select>
      </div>

      {#if params.poleLayout === 'random'}
        <div class="control-group">
          <div class="control-label-row">
            <label class="control-label" for="layoutSeed">Random Seed</label>
            <span class="control-value">{params.layoutSeed}</span>
          </div>
          <input
            id="layoutSeed"
            type="range"
            min="0"
            max="9999"
            step="1"
            bind:value={params.layoutSeed}
          />
          <p class="control-hint">Change seed to get a different random arrangement.</p>
        </div>
      {/if}

      <p class="control-hint">
        {#if params.poleLayout === 'grid'}
          Total poles: {n} × {n} = {n * n}
        {:else}
          Poles: {actualPoleCount} (~{n * n} for grid equivalent)
        {/if}
      </p>
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
          min="0.1"
          max="1"
          step="0.1"
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

      <p class="control-hint">Plate size: {fullPlateSize.toFixed(1)} × {fullPlateSize.toFixed(1)} mm</p>
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
          <option value="ripple">Ripple (radial waves)</option>
          <option value="saddle">Saddle (hyperbolic)</option>
          <option value="checkerboard">Checkerboard</option>
          <option value="spiral">Spiral</option>
        </select>
      </div>

      {#if ['wave', 'ripple', 'checkerboard', 'spiral'].includes(params.heightFunction)}
        {@const freqLabel =
          params.heightFunction === 'wave' ? 'Wave Frequency' :
          params.heightFunction === 'ripple' ? 'Ring Frequency' :
          params.heightFunction === 'checkerboard' ? 'Cell Size' :
          'Spiral Turns'}
        <div class="control-group">
          <div class="control-label-row">
            <label class="control-label" for="waveFrequency">{freqLabel}</label>
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

    <!-- ── SCULPT ── -->
    {#if Object.keys(params.customHeights).length > 0}
      <section class="param-section">
        <h2 class="section-heading">Sculpt</h2>
        <div class="control-group" style="margin-bottom:0">
          <p class="control-hint" style="margin-bottom:6px">{Object.keys(params.customHeights).length} pole{Object.keys(params.customHeights).length === 1 ? '' : 's'} sculpted</p>
          <button class="clear-sculpt-btn" onclick={() => { params.customHeights = {}; }}>
            Clear Sculpt
          </button>
        </div>
      </section>
    {/if}

    <!-- ── PRINT SPLITTING ── -->
    <section class="param-section">
      <h2 class="section-heading">Print Splitting</h2>

      <div class="control-group">
        <label class="toggle-row">
          <input type="checkbox" class="toggle-checkbox" bind:checked={params.splitEnabled} />
          <span class="toggle-label">Split model for printing</span>
        </label>
        <p class="control-hint">
          Divides the model into printable sections with numbered labels for easy reassembly.
        </p>
      </div>

      {#if params.splitEnabled}
        <div class="control-group">
          <label class="control-label">Split Mode</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="splitMode"
                value="grid"
                bind:group={params.splitMode}
              />
              <span>Grid (manual sections)</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="splitMode"
                value="printer"
                bind:group={params.splitMode}
              />
              <span>Printer bed size</span>
            </label>
          </div>
        </div>

        {#if params.splitMode === 'grid'}
          <div class="control-group">
            <div class="control-label-row">
              <label class="control-label" for="splitGridCount">Sections Per Side</label>
              <span class="control-value">{params.splitGridCount}</span>
            </div>
            <input
              id="splitGridCount"
              type="range"
              min="1"
              max="10"
              step="1"
              bind:value={params.splitGridCount}
            />
            <p class="control-hint">
              Result: {ns} × {ns} = {totalSections} sections · ~{sectionSize.toFixed(0)} mm each
            </p>
          </div>
        {:else}
          <div class="control-group">
            <div class="control-label-row">
              <label class="control-label" for="printerSize">Printer Bed Size</label>
              <span class="control-value">{params.printerSize} mm</span>
            </div>
            <input
              id="printerSize"
              type="range"
              min="50"
              max="1000"
              step="10"
              bind:value={params.printerSize}
            />
            <p class="control-hint">
              Model is {fullPlateSize.toFixed(0)} mm → {ns} × {ns} = {totalSections} sections
            </p>
          </div>
        {/if}

        <div class="control-group">
          <div class="control-label-row">
            <label class="control-label" for="labelFontSize">Label Size</label>
            <span class="control-value">{params.labelFontSize} mm</span>
          </div>
          <input
            id="labelFontSize"
            type="range"
            min="3"
            max="40"
            step="1"
            bind:value={params.labelFontSize}
          />
          <p class="control-hint">
            Sections are labelled 1.1, 1.2, 2.1 … embossed on the base for reassembly.
          </p>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .param-panel {
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    color: var(--text-secondary);
  }

  .panel-header {
    padding: 20px 16px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .panel-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .theme-toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .theme-toggle-btn:hover {
    color: var(--text-label);
  }

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .panel-subtitle {
    font-size: 11px;
    color: var(--text-hint);
    margin: 0;
  }

  .param-sections {
    padding: 8px 0;
  }

  .param-section {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .param-section:last-child {
    border-bottom: none;
  }

  .section-heading {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
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
    color: var(--text-label);
    display: block;
    margin-bottom: 6px;
  }

  .control-label-row .control-label {
    margin-bottom: 0;
  }

  .control-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-accent);
    font-variant-numeric: tabular-nums;
  }

  .control-hint {
    font-size: 10px;
    color: var(--text-muted);
    margin: 4px 0 0;
  }

  .param-select {
    width: 100%;
    background: var(--bg-panel);
    color: var(--text-secondary);
    border: 1px solid var(--border-muted);
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

  /* Toggle */
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin-bottom: 6px;
  }

  .toggle-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #3b82f6;
    cursor: pointer;
    flex-shrink: 0;
  }

  .toggle-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  /* Radio group */
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 2px;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-label);
  }

  .radio-option input[type='radio'] {
    accent-color: #3b82f6;
    cursor: pointer;
  }

  .clear-sculpt-btn {
    width: 100%;
    padding: 7px 12px;
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .clear-sculpt-btn:hover {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.6);
  }

</style>
