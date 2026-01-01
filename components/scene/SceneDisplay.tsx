import React from 'react';
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
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-200 mb-4">Generated Scene</h2>
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

