import type { CropOrientation } from '../types';
import type { DitherAlgorithm } from '../utils/dither';

interface ConfigPanelProps {
  orientation: CropOrientation;
  dither: DitherAlgorithm;
  onFilesSelected: (files: FileList) => void;
  onOrientationChange: (orientation: CropOrientation) => void;
  onDitherChange: (dither: DitherAlgorithm) => void;
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
  orientation,
  dither,
  onFilesSelected,
  onOrientationChange,
  onDitherChange,
}: ConfigPanelProps) {
  return (
    <div className="config-panel">
      <div className="config-row">
        <label htmlFor="file-input">Images:</label>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
          onChange={(e) => {
            if (e.target.files) onFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
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
