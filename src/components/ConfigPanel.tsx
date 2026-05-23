import type { CropOrientation } from '../types';

interface ConfigPanelProps {
  directory: string;
  orientation: CropOrientation;
  onDirectoryChange: (dir: string) => void;
  onOrientationChange: (orientation: CropOrientation) => void;
  onLoad: () => void;
  loading: boolean;
}

export default function ConfigPanel({
  directory,
  orientation,
  onDirectoryChange,
  onOrientationChange,
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
            Portrait (4:5)
          </button>
          <button
            className={orientation === 'landscape' ? 'active' : ''}
            onClick={() => onOrientationChange('landscape')}
          >
            Landscape (5:4)
          </button>
        </div>
      </div>
    </div>
  );
}
