
import React, { useState, useRef, useEffect } from 'react';

interface FrameSelectorModalProps {
  isOpen: boolean;
  videoFile: File | null;
  onClose: () => void;
  onFrameSelect: (file: File) => void;
}

const FrameSelectorModal: React.FC<FrameSelectorModalProps> = ({ isOpen, videoFile, onClose, onFrameSelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (videoFile && isOpen) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      return () => {
        URL.revokeObjectURL(url);
        setVideoSrc(null);
      };
    }
  }, [videoFile, isOpen]);

  if (!isOpen || !videoFile) return null;

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(e.target.value);
    }
  };

  const handleSelectFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const frameFile = new File([blob], 'selected-frame.png', { type: 'image/png' });
            onFrameSelect(frameFile);
          }
        }, 'image/png');
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="glass rounded-3xl p-6 md:p-8 w-11/12 md:w-3/4 lg:w-1/2 max-w-4xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Select a Frame</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="relative bg-black/40 rounded-xl p-2 border border-gray-800">
          <video
            ref={videoRef}
            src={videoSrc || ''}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
            controls={false}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="flex flex-col gap-3">
            <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700/50">
          <button
            onClick={handleSelectFrame}
            className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <i className="fas fa-check-circle"></i>
            Confirm Frame
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameSelectorModal;
