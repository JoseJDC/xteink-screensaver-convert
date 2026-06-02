import { memo, useRef } from 'react';

interface ConfigPanelProps {
  onFilesSelected: (files: FileList) => void;
}

export default memo(function ConfigPanel({
  onFilesSelected,
}: ConfigPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            ref={fileInputRef}
            id="file-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
            onChange={handleFileChange}
            className="config-file-input"
          />
          <span
            className="config-file-btn"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 10V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Choose files
          </span>
        </div>
      </div>
    </div>
  );
});
