import React, { useRef, useState } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    if (!imagePreview) return;
    
    try {
      // Convert base64 to blob
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      // Copy blob to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      // Fallback: copy base64 string
      try {
        await navigator.clipboard.writeText(imagePreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy image as text:', err);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    await pasteImageFromClipboard();
  };

  const pasteImageFromClipboard = async () => {
    try {
      // Try to read clipboard items
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `pasted-image.${type.split('/')[1]}`, { type });
            onImageUpload(file);
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
      
      const pasteHandler = async (e: ClipboardEvent) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                onImageUpload(file);
              }
            }
          }
        }
        document.body.removeChild(pasteInput);
        document.removeEventListener('paste', pasteHandler);
      };
      
      document.addEventListener('paste', pasteHandler);
      
      setTimeout(() => {
        if (document.body.contains(pasteInput)) {
          document.body.removeChild(pasteInput);
          document.removeEventListener('paste', pasteHandler);
        }
      }, 1000);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Your Photo</label>
      <div
        ref={containerRef}
        onPaste={handlePaste}
        className="relative"
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
        <div className="flex gap-2 mt-2 justify-center">
          {imagePreview && (
            <button
              onClick={handleCopy}
              className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors border border-gray-700 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <i className="fas fa-check text-green-400"></i> Copied
                </>
              ) : (
                <>
                  <i className="fas fa-copy"></i> Copy
                </>
              )}
            </button>
          )}
          <button
            onClick={pasteImageFromClipboard}
            className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors border border-gray-700 flex items-center gap-2"
          >
            <i className="fas fa-paste"></i> Paste
          </button>
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

