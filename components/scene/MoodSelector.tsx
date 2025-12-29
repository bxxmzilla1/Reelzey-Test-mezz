import React from 'react';
import { Mood } from '../../types-scene';

interface MoodSelectorProps {
  moods: Mood[];
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ moods, selectedMood, onSelectMood }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">2. Choose a Mood</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => onSelectMood(mood)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
              ${selectedMood === mood
                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;

