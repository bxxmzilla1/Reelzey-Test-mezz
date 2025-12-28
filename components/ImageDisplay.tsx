import React, { useState } from 'react';

interface ImageDisplayProps {
  title: string;
  icon: string;
  imageSrc: string;
  onView?: () => void;
  onDownload?: () => void;
  onCopy?: () => Promise<boolean>;
  children?: React.ReactNode;
  // FIX: Added optional isPano prop to fix type error in StageBuilder.tsx.
  isPano?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, icon, imageSrc, onView, onDownload, onCopy, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    if (!onCopy) return;
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const actionButtonClasses = "bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors border border-gray-700 flex items-center gap-2";

  return (
    <div className="glass rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
          <i className={icon}></i>
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="bg-black/40 rounded-xl p-2 border border-gray-800 h-64">
        <img src={imageSrc} alt={title} className="w-full rounded-lg h-full object-contain" />
      </div>
       <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {onView && <button onClick={onView} className={actionButtonClasses}><i className="fas fa-expand"></i> View</button>}
          {onDownload && <button onClick={onDownload} className={actionButtonClasses}><i className="fas fa-download"></i> Download</button>}
          {onCopy && <button onClick={handleCopyClick} className={actionButtonClasses}>{copied ? <><i className="fas fa-check text-green-400"></i> Copied</> : <><i className="fas fa-copy"></i> Copy</>}</button>}
          {children}
        </div>
    </div>
  );
};

export default ImageDisplay;