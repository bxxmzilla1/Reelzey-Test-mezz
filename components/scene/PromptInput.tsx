import React from 'react';
import { SparklesIcon } from './icons';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onEnhance: () => void;
  isDisabled: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, onEnhance, isDisabled }) => {
  return (
    <div>
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
        4. Add a Prompt (Optional)
      </label>
      <div className="relative">
        <textarea
          id="prompt"
          rows={3}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isDisabled}
          placeholder="e.g., a shy smile, looking at the camera..."
          className="block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-200 pr-32 disabled:opacity-50"
        />
        <button
          onClick={onEnhance}
          disabled={isDisabled || !prompt}
          className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1.5 bg-gray-600 text-white font-semibold py-1.5 px-3 rounded-md text-xs hover:bg-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
        >
          <SparklesIcon />
          Enhance
        </button>
      </div>
    </div>
  );
};

export default PromptInput;

