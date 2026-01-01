import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check clipboardData.items first (works for browser-copied images)
    const items = e.clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemType = item.type.toLowerCase();
        // Accept all image types, especially PNG and JPEG
        if (itemType.indexOf('image') !== -1 || 
            itemType === 'image/png' || 
            itemType === 'image/jpeg' || 
            itemType === 'image/jpg' ||
            itemType.startsWith('image/png') ||
            itemType.startsWith('image/jpeg') ||
            itemType.startsWith('image/jpg')) {
          const file = item.getAsFile();
          if (file) {
            // Ensure proper MIME type for PNG and JPEG
            if (itemType.includes('png')) {
              const blob = new Blob([file], { type: 'image/png' });
              const pngFile = new File([blob], 'pasted-image.png', { type: 'image/png' });
              onImageUpload(pngFile);
            } else if (itemType.includes('jpeg') || itemType.includes('jpg')) {
              const blob = new Blob([file], { type: 'image/jpeg' });
              const jpegFile = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });
              onImageUpload(jpegFile);
            } else {
              onImageUpload(file);
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
          fileType === 'image/png' || 
          fileType === 'image/jpeg' || 
          fileType === 'image/jpg') {
        // Ensure proper MIME type for PNG and JPEG
        if (fileType.includes('png')) {
          const blob = new Blob([file], { type: 'image/png' });
          const pngFile = new File([blob], 'pasted-image.png', { type: 'image/png' });
          onImageUpload(pngFile);
        } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
          const blob = new Blob([file], { type: 'image/jpeg' });
          const jpegFile = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });
          onImageUpload(jpegFile);
        } else {
          onImageUpload(file);
        }
      }
    }
  };


  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Your Photo</label>
      <div
        ref={containerRef}
        onPaste={handlePaste}
        className="relative"
        tabIndex={0}
      >
        <div
          onClick={handleClick}
          className="mt-1 flex justify-center items-center h-48 w-full rounded-lg border-2 border-dashed border-gray-600 hover:border-purple-400 transition-colors duration-300 cursor-pointer bg-gray-700/50"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
          ) : (
            <div className="space-y-1 text-center">
              <UploadIcon />
              <div className="flex text-sm text-gray-400">
                <p className="pl-1">Click to upload an image</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;

