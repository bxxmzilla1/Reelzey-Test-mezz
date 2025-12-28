import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [wavespeedKey, setWavespeedKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('geminiApiKey') || '');
      setWavespeedKey(localStorage.getItem('wavespeedApiKey') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', geminiKey);
    localStorage.setItem('wavespeedApiKey', wavespeedKey);
    
    if (onSave) {
      onSave();
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="glass rounded-3xl p-6 md:p-8 w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">API Key Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
        </div>
        <div className="flex flex-col gap-6">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Wavespeed API Key</label>
                <input
                    type="password"
                    value={wavespeedKey}
                    onChange={(e) => setWavespeedKey(e.target.value)}
                    placeholder="Enter your Wavespeed API key"
                    className="w-full bg-black/40 rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-300"
                />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Gemini API Key</label>
                <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full bg-black/40 rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-300"
                />
                <p className="text-xs text-gray-500 mt-2">Note: For this tool, the Gemini API key is typically pre-configured. Changes here might not affect the Stage Creator functionality.</p>
            </div>
        </div>
        <div className="flex gap-4 justify-end border-t border-gray-700/50 pt-6 mt-2">
            <button onClick={onClose} className="px-6 py-2 rounded-xl font-semibold transition-all bg-gray-700 hover:bg-gray-600">
                Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white">
                {saved ? <><i className="fas fa-check"></i> Saved!</> : 'Save Keys'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;