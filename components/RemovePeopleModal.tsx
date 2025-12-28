
import React from 'react';

interface RemovePeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onApply: () => Promise<void>;
  onConfirmAndSetBackground: () => void;
  isProcessing: boolean;
}

const RemovePeopleModal: React.FC<RemovePeopleModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onApply,
  onConfirmAndSetBackground,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className="glass rounded-3xl p-6 md:p-8 w-11/12 md:w-3/4 lg:w-1/2 max-w-4xl flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Edit Image: Remove People</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="relative bg-black/40 rounded-xl p-2 border border-gray-800 h-96">
            <img src={imageSrc} alt="Image for editing" className="w-full h-full object-contain rounded-lg" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white">Removing people...</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-end border-t border-gray-700/50 pt-6 mt-2">
            <button
              onClick={onApply}
              disabled={isProcessing}
              className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500"
            >
              <i className="fas fa-redo"></i>
              {isProcessing ? 'Processing...' : 'Remove / Re-apply'}
            </button>
            <button
              onClick={onConfirmAndSetBackground}
              disabled={isProcessing}
              className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white neon-glow neon-glow-hover disabled:opacity-50"
            >
              <i className="fas fa-image"></i>
              Use as Background
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemovePeopleModal;
