import React from 'react';
import { CameraView } from '../../types-scene';

interface CameraViewSelectorProps {
  views: CameraView[];
  selectedView: CameraView | null;
  onSelectView: (view: CameraView) => void;
}

const CameraViewSelector: React.FC<CameraViewSelectorProps> = ({ views, selectedView, onSelectView }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">3. Choose a Camera View</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => onSelectView(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
              ${selectedView === view
                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CameraViewSelector;

