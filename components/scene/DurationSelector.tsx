import React from 'react';
import { Duration } from '../../types-scene';

interface DurationSelectorProps {
  selectedDuration: Duration;
  onSelectDuration: (duration: Duration) => void;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ selectedDuration, onSelectDuration }) => {
  const durations: Duration[] = [5, 10];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">5. Select Video Duration</label>
      <div className="flex space-x-2">
        {durations.map((duration) => (
          <button
            key={duration}
            onClick={() => onSelectDuration(duration)}
            className={`w-full px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
              ${selectedDuration === duration
                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            {duration} seconds
          </button>
        ))}
      </div>
    </div>
  );
};

export default DurationSelector;

