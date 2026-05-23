interface ResultPreviewProps {
  dataUrl: string;
  bmpUrl: string | null;
  imageName: string;
  onClose: () => void;
}

export default function ResultPreview({
  dataUrl,
  bmpUrl,
  imageName,
  onClose,
}: ResultPreviewProps) {
  const handleDownload = () => {
    if (!bmpUrl) return;
    const link = document.createElement('a');
    const nameWithoutExt = imageName.replace(/\.[^.]+$/, '');
    link.download = `${nameWithoutExt}_processed.bmp`;
    link.href = bmpUrl;
    link.click();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="result-overlay" onClick={handleClose}>
      <div className="result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="result-header">
          <h3>Processed: {imageName}</h3>
          <button className="result-close" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="result-body">
          <img src={dataUrl} alt="Processed result" />
          <div className="result-info">480 × 800 &mdash; BMP</div>
        </div>
        <div className="result-actions">
          <button className="btn-download" onClick={handleDownload}>
            Download
          </button>
          <button className="btn-next" onClick={handleClose}>
            Next Image &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
