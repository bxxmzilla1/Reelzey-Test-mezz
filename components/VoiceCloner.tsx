import React, { useState, useCallback, useEffect } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import FileUpload from './FileUpload';

interface VoiceClonerProps {
  onOpenSettings?: () => void;
}

const VoiceCloner: React.FC<VoiceClonerProps> = ({ onOpenSettings }) => {
  const [voiceName, setVoiceName] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [createdVoiceId, setCreatedVoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('elevenlabsApiKey');
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    };
    checkApiKey();
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  const getApiKey = (): string => {
    const apiKey = localStorage.getItem('elevenlabsApiKey');
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ElevenLabs API key not found. Please set it in Settings.');
    }
    return apiKey.trim();
  };

  const extractErrorMessage = (err: any, defaultMsg: string): string => {
    if (!err) return defaultMsg;
    if (typeof err === 'string') return err;
    if (err.message) {
      if (typeof err.message === 'string') return err.message;
      return String(err.message);
    }
    return String(err);
  };

  const handleAudioSelect = useCallback((file: File) => {
    setError(null);
    setAudioFiles(prev => [...prev, file]);
  }, []);

  const handleCreateVoice = async () => {
    if (!voiceName.trim()) {
      setError("Please enter a voice name.");
      return;
    }

    if (audioFiles.length === 0) {
      setError("Please upload at least one audio file.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setCreatedVoiceId(null);

    try {
      const apiKey = getApiKey();
      
      // Initialize ElevenLabs client with API key
      const elevenlabs = new ElevenLabsClient({
        apiKey: apiKey,
      });

      // Create voice clone using the SDK
      // File objects work directly in browser environment
      const voice = await elevenlabs.voices.ivc.create({
        name: voiceName.trim(),
        files: audioFiles,
      });

      const voiceId = voice.voiceId || (voice as any).voice_id || (voice as any).id;
      
      if (!voiceId) {
        throw new Error('Voice created but no voice ID returned from API.');
      }

      setCreatedVoiceId(voiceId);
      setSuccessMessage(`Voice clone created successfully! Voice ID: ${voiceId}`);
      
      // Save to Voice Actors list
      const voiceActor = {
        name: voiceName.trim(),
        voiceId: voiceId,
        createdAt: new Date().toISOString()
      };
      
      // Get existing voice actors from localStorage
      const existingActors = JSON.parse(localStorage.getItem('voiceActors') || '[]');
      
      // Check if voice ID already exists to avoid duplicates
      const exists = existingActors.some((actor: any) => actor.voiceId === voiceId);
      if (!exists) {
        existingActors.push(voiceActor);
        localStorage.setItem('voiceActors', JSON.stringify(existingActors));
        // Dispatch custom event to notify VoiceActors component
        window.dispatchEvent(new CustomEvent('voiceActorAdded', { detail: voiceActor }));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to create voice clone. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVoiceName('');
    setAudioFiles([]);
    setCreatedVoiceId(null);
    setLoading(false);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <i className="fas fa-redo"></i> Reset
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8 glass rounded-3xl min-h-[50vh]">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold">Creating voice clone...</p>
            <p className="text-gray-400 text-center">This may take a few moments. Please wait.</p>
          </div>
        ) : (
          <>
            {/* Create Voice Form */}
            <section className="glass p-6 rounded-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <i className="fas fa-microphone text-purple-400"></i>
                Create Voice Clone
              </h2>

              <div className="flex flex-col gap-6">
                {/* Voice Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Voice Name *</label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="My Voice Clone"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500"
                    disabled={loading || !!createdVoiceId}
                  />
                </div>

                {/* Audio Files Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Audio Files *</label>
                  <p className="text-xs text-gray-400 mb-3">Upload audio sample files. The more files you add, the better the clone will be.</p>
                  <FileUpload
                    label=""
                    accept="audio/*,video/*"
                    icon="fas fa-music"
                    onFileSelect={handleAudioSelect}
                    preview={null}
                    type="video"
                    showPasteButton={false}
                  />
                  {audioFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Uploaded Files ({audioFiles.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {audioFiles.map((file, index) => (
                          <div key={index} className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 flex items-center gap-2">
                            <i className="fas fa-file-audio"></i>
                            <span>{file.name}</span>
                            {!createdVoiceId && (
                              <button
                                onClick={() => setAudioFiles(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-400 hover:text-red-300"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Create Button */}
                {!createdVoiceId && (
                  <button
                    onClick={handleCreateVoice}
                    disabled={loading || !voiceName.trim() || audioFiles.length === 0}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus"></i>
                        Create Voice Clone
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Success Message with Voice ID */}
            {createdVoiceId && (
              <section className="glass p-6 rounded-3xl">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-400"></i>
                  Voice Clone Created Successfully!
                </h2>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Voice ID:</p>
                  <p className="text-green-400 font-mono font-semibold break-all text-lg mb-4">{createdVoiceId}</p>
                  <p className="text-xs text-gray-400">You can now use this voice ID with the ElevenLabs Text-to-Speech API.</p>
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <i className="fas fa-plus"></i> Create Another Voice
                  </button>
                </div>
              </section>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex gap-3 items-start">
                <i className="fas fa-exclamation-triangle mt-1"></i>
                <p>{error}</p>
              </div>
            )}

            {/* Success Message (non-voice ID) */}
            {successMessage && !createdVoiceId && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex gap-3 items-start">
                <i className="fas fa-check-circle mt-1"></i>
                <p>{successMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceCloner;
