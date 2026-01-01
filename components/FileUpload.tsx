
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
        const itemType = item.type.toLowerCase();
        // Accept all image types (especially PNG and JPEG) and video types
        if (itemType.indexOf('image') !== -1 || 
            itemType.indexOf('video') !== -1 ||
            itemType === 'image/png' || 
            itemType === 'image/jpeg' || 
            itemType === 'image/jpg' ||
            itemType.startsWith('image/png') ||
            itemType.startsWith('image/jpeg') ||
            itemType.startsWith('image/jpg')) {
          const file = item.getAsFile();
          if (file) {
            // Ensure proper MIME type for PNG and JPEG images
            if (itemType.includes('png')) {
              const blob = new Blob([file], { type: 'image/png' });
              const pngFile = new File([blob], 'pasted-image.png', { type: 'image/png' });
              onFileSelect(pngFile);
            } else if (itemType.includes('jpeg') || itemType.includes('jpg')) {
              const blob = new Blob([file], { type: 'image/jpeg' });
              const jpegFile = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });
              onFileSelect(jpegFile);
            } else {
              onFileSelect(file);
            }
            return;
          }
        }
      }
    }
    
    // Fallback: check clipboardData.files
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      const fileType = file.type.toLowerCase();
      if (fileType.startsWith('image/') || 
          fileType.startsWith('video/') ||
          fileType === 'image/png' || 
          fileType === 'image/jpeg' || 
          fileType === 'image/jpg') {
        // Ensure proper MIME type for PNG and JPEG images
        if (fileType.includes('png')) {
          const blob = new Blob([file], { type: 'image/png' });
          const pngFile = new File([blob], 'pasted-image.png', { type: 'image/png' });
          onFileSelect(pngFile);
        } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
          const blob = new Blob([file], { type: 'image/jpeg' });
          const jpegFile = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });
          onFileSelect(jpegFile);
        } else {
          onFileSelect(file);
        }
      }
    }
  };

  const actionButtonClasses = "bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors border border-gray-700 flex items-center gap-2";

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
      {preview && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {onView && <button onClick={onView} className={actionButtonClasses}><i className="fas fa-expand"></i> View</button>}
          {onDownload && <button onClick={onDownload} className={actionButtonClasses}><i className="fas fa-download"></i> Download</button>}
          {children}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
