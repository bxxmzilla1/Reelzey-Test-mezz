import React, { useState, useEffect } from 'react';

interface VoiceActor {
  name: string;
  voiceId: string;
  createdAt?: string;
}

const VoiceActors: React.FC = () => {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);

  useEffect(() => {
    // Load voice actors from localStorage
    const loadVoiceActors = () => {
      try {
        const stored = localStorage.getItem('voiceActors');
        if (stored) {
          const actors = JSON.parse(stored);
          setVoiceActors(Array.isArray(actors) ? actors : []);
        }
      } catch (error) {
        console.error('Error loading voice actors:', error);
        setVoiceActors([]);
      }
    };

    loadVoiceActors();
    
    // Listen for custom event (when voice is created in Voice Cloner)
    const handleVoiceActorAdded = () => {
      loadVoiceActors();
    };
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voiceActors') {
        loadVoiceActors();
      }
    };
    
    window.addEventListener('voiceActorAdded', handleVoiceActorAdded);
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (fallback)
    const interval = setInterval(loadVoiceActors, 1000);
    
    return () => {
      window.removeEventListener('voiceActorAdded', handleVoiceActorAdded);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = (voiceId: string) => {
    const updated = voiceActors.filter(actor => actor.voiceId !== voiceId);
    setVoiceActors(updated);
    localStorage.setItem('voiceActors', JSON.stringify(updated));
  };

  return (
    <div className="px-4 md:px-8 pb-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Voice Actors List */}
        <section className="glass p-6 rounded-3xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <i className="fas fa-users text-purple-400"></i>
            Saved Voice Actors
          </h2>

          {voiceActors.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-users text-6xl text-gray-600 mb-4"></i>
              <p className="text-gray-400 text-lg">No voice actors saved yet.</p>
              <p className="text-gray-500 text-sm mt-2">Create a voice clone in the Voice Cloner section to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voiceActors.map((actor, index) => (
                <div
                  key={actor.voiceId}
                  className="p-4 bg-black/40 border border-gray-800 rounded-xl hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-microphone text-purple-400"></i>
                        <h3 className="text-lg font-semibold text-white">{actor.name}</h3>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Voice ID:</p>
                        <p className="text-green-400 font-mono text-sm break-all">{actor.voiceId}</p>
                      </div>
                      {actor.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(actor.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(actor.voiceId)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                      title="Delete voice actor"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VoiceActors;
