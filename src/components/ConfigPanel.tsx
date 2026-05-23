import type { CropOrientation } from '../types';
import type { DitherAlgorithm } from '../utils/dither';

interface ConfigPanelProps {
  directory: string;
  orientation: CropOrientation;
  dither: DitherAlgorithm;
  onDirectoryChange: (dir: string) => void;
  onOrientationChange: (orientation: CropOrientation) => void;
  onDitherChange: (dither: DitherAlgorithm) => void;
  onLoad: () => void;
  loading: boolean;
}

const DITHER_OPTIONS: readonly DitherAlgorithm[] = [
  'none',
  'floyd-steinberg',
  'atkinson',
  'bayer4x4',
  'bayer8x8',
];

const DITHER_LABELS: Record<DitherAlgorithm, string> = {
  none: 'None',
  'floyd-steinberg': 'Floyd-Steinberg',
  atkinson: 'Atkinson',
  bayer4x4: 'Bayer 4×4',
  bayer8x8: 'Bayer 8×8',
};

export default function ConfigPanel({
  directory,
  orientation,
  dither,
  onDirectoryChange,
  onOrientationChange,
  onDitherChange,
  onLoad,
  loading,
}: ConfigPanelProps) {
  return (
    <div className="config-panel">
      <div className="config-row">
        <label htmlFor="dir-input">Directory:</label>
        <input
          id="dir-input"
          type="text"
          value={directory}
          onChange={(e) => onDirectoryChange(e.target.value)}
          placeholder="C:\Users\..."
          onKeyDown={(e) => e.key === 'Enter' && onLoad()}
        />
        <button onClick={onLoad} disabled={loading || !directory.trim()}>
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>
      <div className="config-row">
        <label>Orientation:</label>
        <div className="orientation-toggle">
          <button
            className={orientation === 'portrait' ? 'active' : ''}
            onClick={() => onOrientationChange('portrait')}
          >
            Portrait (3:5)
          </button>
          <button
            className={orientation === 'landscape' ? 'active' : ''}
            onClick={() => onOrientationChange('landscape')}
          >
            Landscape (5:3)
          </button>
        </div>
      </div>
      <div className="config-row">
        <label>Dithering:</label>
        <select
          className="dither-select"
          value={dither}
          onChange={(e) => onDitherChange(e.target.value as DitherAlgorithm)}
        >
          {DITHER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {DITHER_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
