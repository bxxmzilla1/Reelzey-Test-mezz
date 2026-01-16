
import React, { useState } from 'react';

interface FileUploadProps {
  label: string;
  accept: string;
  icon: string;
  onFileSelect: (file: File) => void;
  preview: string | null;
  type: 'image' | 'video';
  children?: React.ReactNode;
  onView?: () => void;
  onDownload?: () => void;
  onCopy?: () => Promise<boolean>;
  showPasteButton?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, icon, onFileSelect, preview, type, children, onView, onDownload, onCopy, showPasteButton = true }) => {
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check clipboardData.items first (works for browser-copied images)
    const items = e.clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1 || item.type.indexOf('video') !== -1) {
          const file = item.getAsFile();
          if (file) {
            onFileSelect(file);
            return;
          }
        }
      }
    }
    
    // Fallback: check clipboardData.files
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onFileSelect(file);
      }
    }
  };

  const handleCopyClick = async () => {
    if (!onCopy) return;
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const actionButtonClasses = "bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors border border-gray-700 flex items-center gap-2";

  const handlePasteClick = async () => {
    // Focus the container so it can receive paste events
    const container = document.activeElement?.closest('[tabindex]') as HTMLElement;
    if (container) {
      container.focus();
    }
    
    // Try Clipboard API first
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/') || type.startsWith('video/')) {
            const blob = await clipboardItem.getType(type);
            const fileExtension = type.split('/')[1].split(';')[0];
            const fileName = `pasted-media.${fileExtension}`;
            const file = new File([blob], fileName, { type });
            onFileSelect(file);
            return;
          }
        }
      }
    } catch (error) {
      // Clipboard API failed, user will need to press Ctrl+V after clicking
      // The onPaste handler will catch it
      console.log('Clipboard API not available, please press Ctrl+V after clicking Paste');
    }
  };

  return (
    <div className="flex flex-col gap-3" onPaste={handlePaste} tabIndex={0}>
      {label && <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</label>}
      <div className="relative group">
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className={`rounded-2xl border-2 border-dashed border-gray-700 group-hover:border-purple-500 transition-colors flex flex-col items-center justify-center bg-gray-900/50 overflow-hidden ${
            !preview ? 'h-48' : 'h-64'
          }`}
        >
          {preview ? (
            type === 'image' ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={preview} className="w-full h-full object-contain" />
            )
          ) : (
            <>
              <i className={`${icon} text-4xl text-gray-500 mb-3 group-hover:text-purple-400 transition-colors`}></i>
              <p className="text-lg text-gray-500 group-hover:text-gray-300">Click, drag, or paste media</p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        {showPasteButton && (
        <button
          onClick={handlePasteClick}
          className={actionButtonClasses}
        >
          <i className="fas fa-paste"></i> Paste
        </button>
        )}
        {preview && (
          <>
            {onView && <button onClick={onView} className={actionButtonClasses}><i className="fas fa-expand"></i> View</button>}
            {onDownload && <button onClick={onDownload} className={actionButtonClasses}><i className="fas fa-download"></i> Download</button>}
            {onCopy && <button onClick={handleCopyClick} className={actionButtonClasses}>{copied ? <><i className="fas fa-check text-green-400"></i> Copied</> : <><i className="fas fa-copy"></i> Copy</>}</button>}
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
