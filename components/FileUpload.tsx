
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
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, icon, onFileSelect, preview, type, children, onView, onDownload, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onFileSelect(file);
        e.preventDefault();
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
    try {
      // Try to read clipboard items using Clipboard API
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/') || type.startsWith('video/')) {
            const blob = await clipboardItem.getType(type);
            const fileExtension = type.split('/')[1].split(';')[0]; // Handle MIME types like "video/mp4;codecs=..."
            const fileName = `pasted-media.${fileExtension}`;
            const file = new File([blob], fileName, { type });
            onFileSelect(file);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      // Fallback: try using a temporary input element to capture paste event
      const pasteInput = document.createElement('input');
      pasteInput.type = 'text';
      pasteInput.style.position = 'absolute';
      pasteInput.style.left = '-9999px';
      document.body.appendChild(pasteInput);
      pasteInput.focus();
      
      // Listen for paste event
      const pasteHandler = (e: ClipboardEvent) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1 || item.type.indexOf('video') !== -1) {
              const file = item.getAsFile();
              if (file) {
                onFileSelect(file);
              }
            }
          }
        }
        document.body.removeChild(pasteInput);
        document.removeEventListener('paste', pasteHandler);
      };
      
      document.addEventListener('paste', pasteHandler);
      
      // Cleanup if paste doesn't happen
      setTimeout(() => {
        if (document.body.contains(pasteInput)) {
          document.body.removeChild(pasteInput);
          document.removeEventListener('paste', pasteHandler);
        }
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-3" onPaste={handlePaste}>
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
        <button
          onClick={handlePasteClick}
          className={actionButtonClasses}
        >
          <i className="fas fa-paste"></i> Paste
        </button>
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
