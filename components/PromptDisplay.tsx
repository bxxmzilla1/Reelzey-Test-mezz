
import React, { useState } from 'react';

interface PromptDisplayProps {
  title: string;
  content: string;
  icon: string;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ title, content, icon }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 neon-glow">
            <i className={icon}></i>
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700"
        >
          {copied ? <><i className="fas fa-check text-green-400"></i> Copied</> : <><i className="fas fa-copy"></i> Copy</>}
        </button>
      </div>
      <div className="bg-black/40 rounded-xl p-4 border border-gray-800 min-h-[120px]">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default PromptDisplay;
