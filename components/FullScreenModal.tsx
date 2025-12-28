
import React from 'react';

interface FullScreenModalProps {
  src: string | null;
  onClose: () => void;
}

const FullScreenModal: React.FC<FullScreenModalProps> = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors text-3xl z-10" aria-label="Close full screen view">
        <i className="fas fa-times"></i>
      </button>
      <img src={src} alt="Full screen view" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

export default FullScreenModal;
