import React, { useState } from 'react';
import { FilmIcon } from './icons';

interface SceneDisplayProps {
  scene: string;
  isLoading: boolean;
}

const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-600 rounded w-5/6"></div>
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
    </div>
);


const SceneDisplay: React.FC<SceneDisplayProps> = ({ scene, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!scene) return;
    
    try {
      await navigator.clipboard.writeText(scene);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy scene:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-200">Generated Scene</h2>
        {scene && !isLoading && (
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
      </div>
      <div className="flex-grow bg-gray-900/50 p-4 rounded-lg min-h-[300px] lg:min-h-0 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : scene ? (
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{scene}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FilmIcon className="w-16 h-16 mb-4"/>
            <p className="font-semibold">Your generated scene will appear here.</p>
            <p className="text-sm">Complete the steps to create your scene.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneDisplay;

