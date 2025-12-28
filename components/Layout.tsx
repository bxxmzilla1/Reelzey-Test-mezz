
import React, { useState, useEffect, useCallback } from 'react';
import Tabs from './Sidebar';
import App from '../App';
import VideoCreator from './VideoCreator';
import SettingsModal from './SettingsModal';
import ScriptCreator from './ScriptCreator';
import HistorySidebar from './HistorySidebar';

const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState('stageCreator');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [selectedHistoryVideoUrl, setSelectedHistoryVideoUrl] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    const wavespeedApiKey = localStorage.getItem('wavespeedApiKey');
    if (!wavespeedApiKey) {
      setBalance(null);
      setBalanceError(null);
      return;
    }

    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      const response = await fetch('https://api.wavespeed.ai/api/v3/balance', {
        headers: {
          'Authorization': `Bearer ${wavespeedApiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      } else {
        throw new Error("Invalid balance data received from API.");
      }

    } catch (err: any) {
      setBalance(null);
      setBalanceError(err.message || "Failed to fetch balance.");
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleSelectHistoryVideo = (url: string) => {
    setSelectedHistoryVideoUrl(url);
    setActiveView('videoCreator');
    setIsHistoryVisible(false);
  };

  return (
    <div className="min-h-screen">
      <header className="w-full px-2 sm:px-6 lg:px-8 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between h-16">
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('stageCreator'); }} className="flex items-center">
            <span className="self-center text-xl font-semibold whitespace-nowrap gradient-text">ANDREIX</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 rounded-full text-gray-400 bg-gray-800/50 flex items-center text-sm h-9 px-3">
              <i className="fas fa-wallet mr-2 text-fuchsia-400"></i>
              {isBalanceLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : balanceError ? (
                <span className="text-red-400" title={balanceError}>Error</span>
              ) : balance !== null ? (
                <span className="font-semibold text-white">${balance.toFixed(2)}</span>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
            <button onClick={() => setIsHistoryVisible(true)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="View History">
              <i className="fas fa-history text-lg sm:text-xl"></i>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Settings">
              <i className="fas fa-cog text-lg sm:text-xl"></i>
            </button>
          </div>
        </div>
      </header>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={fetchBalance} />
      {isHistoryVisible && (
        <HistorySidebar
          onSelectVideo={handleSelectHistoryVideo}
          onClose={() => setIsHistoryVisible(false)}
        />
      )}

      <Tabs 
        activeView={activeView} 
        onViewChange={setActiveView} 
      />

      <main>
        <div style={{ display: activeView === 'stageCreator' ? 'block' : 'none' }}>
          <App />
        </div>
        <div style={{ display: activeView === 'scriptCreator' ? 'block' : 'none' }}>
          <ScriptCreator />
        </div>
        <div style={{ display: activeView === 'videoCreator' ? 'block' : 'none' }}>
          <VideoCreator 
            selectedHistoryVideoUrl={selectedHistoryVideoUrl}
            clearSelectedHistoryVideoUrl={() => setSelectedHistoryVideoUrl(null)}
          />
        </div>
      </main>
    </div>
  );
};

export default Layout;