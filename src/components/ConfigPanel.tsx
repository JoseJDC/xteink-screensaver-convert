import { memo, useState, useEffect } from 'react';
import type { OrientationMode } from '../types';
import type { DitherAlgorithm } from '../utils/dither';

interface Preset {
  name: string;
  orientation: OrientationMode;
  dither: DitherAlgorithm;
  contrast: number;
}

const PRESETS_KEY = 'xteink-image-transformer-presets';

interface ConfigPanelProps {
  orientation: OrientationMode;
  dither: DitherAlgorithm;
  contrast: number;
  onFilesSelected: (files: FileList) => void;
  onOrientationChange: (orientation: OrientationMode) => void;
  onDitherChange: (dither: DitherAlgorithm) => void;
  onContrastChange: (contrast: number) => void;
}

const DITHER_OPTIONS: { value: DitherAlgorithm; label: string }[] = [
  { value: 'none', label: 'None (Threshold)' },
  { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'bayer4x4', label: 'Bayer 4×4' },
  { value: 'bayer8x8', label: 'Bayer 8×8' },
];

export default memo(function ConfigPanel({
  orientation, dither, contrast,
  onFilesSelected, onOrientationChange, onDitherChange, onContrastChange,
}: ConfigPanelProps) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    setPresets(prev => [...prev.filter(p => p.name !== name), { name, orientation, dither, contrast }]);
    setPresetName('');
    setShowPresetInput(false);
  };

  const handleLoadPreset = (preset: Preset) => {
    onOrientationChange(preset.orientation);
    onDitherChange(preset.dither);
    onContrastChange(preset.contrast);
  };

  const handleDeletePreset = (name: string) => {
    setPresets(prev => prev.filter(p => p.name !== name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onFilesSelected(files);
    e.target.value = '';
  };

  return (
    <div className="config-panel">
      <div className="config-row">
        <label className="config-label-file" htmlFor="file-input">Images:</label>
        <div className="config-file-wrap" title="Select images (JPG/PNG/WebP/BMP/GIF)">
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
            onChange={handleFileChange}
            className="config-file-input"
          />
          <span className="config-file-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 10V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Choose files
          </span>
        </div>
      </div>

      <div className="config-row">
        <label>Orient:</label>
        <div className="config-btn-group">
          <button className={orientation === 'portrait' ? 'active' : ''} onClick={() => onOrientationChange('portrait')} title="Portrait 3:5 aspect ratio">
            Portrait (3:5)
          </button>
          <button className={orientation === 'landscape' ? 'active' : ''} onClick={() => onOrientationChange('landscape')} title="Landscape 5:3 aspect ratio">
            Landscape (5:3)
          </button>
        </div>
      </div>

      <div className="config-row">
        <label htmlFor="dither-select">Dither:</label>
        <select
          id="dither-select"
          value={dither}
          onChange={(e) => onDitherChange(e.target.value as DitherAlgorithm)}
          title="Dithering algorithm for black-and-white conversion"
        >
          {DITHER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="config-row">
        <label>Contrast:</label>
        <input
          type="range" min="0" max="8" step="1"
          value={contrast}
          onChange={(e) => onContrastChange(parseInt(e.target.value))}
          title="Increase contrast to darken blacks and brighten whites"
        />
        <span className="contrast-value">{contrast}</span>
      </div>

      <div className="config-divider" />

      <div className="config-row">
        <label>Presets:</label>
        <div className="config-presets">
          {presets.length === 0 && !showPresetInput && (
            <button className="config-preset-add" onClick={() => setShowPresetInput(true)} aria-label="Add new preset">
              + Save preset
            </button>
          )}
          {presets.map(p => (
            <div key={p.name} className="config-preset-item">
              <button className="config-preset-btn" onClick={() => handleLoadPreset(p)} title={`Load: ${p.name}`}>
                {p.name}
              </button>
              <button className="config-preset-del" onClick={() => handleDeletePreset(p.name)} aria-label={`Delete preset "${p.name}"`}>✕</button>
            </div>
          ))}
          {presets.length > 0 && !showPresetInput && (
            <button className="config-preset-add" onClick={() => setShowPresetInput(true)} aria-label="Add new preset">+</button>
          )}
          {showPresetInput && (
            <div className="config-preset-input-row">
              <input
                className="config-preset-input"
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSavePreset(); if (e.key === 'Escape') setShowPresetInput(false); }}
                placeholder="Preset name\u2026"
                autoFocus
              />
              <button className="btn btn-xs" onClick={handleSavePreset} disabled={!presetName.trim()}>Save</button>
              <button className="btn btn-xs" onClick={() => setShowPresetInput(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
