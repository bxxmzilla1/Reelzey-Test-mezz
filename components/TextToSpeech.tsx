import React, { useState, useEffect } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

interface TextToSpeechProps {
  onOpenSettings?: () => void;
}

interface VoiceActor {
  name: string;
  voiceId: string;
  createdAt?: string;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ onOpenSettings }) => {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [modelId, setModelId] = useState('eleven_multilingual_v2');
  const [outputFormat, setOutputFormat] = useState('mp3_44100_128');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('elevenlabsApiKey');
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    };
    checkApiKey();
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load voice actors from localStorage
  useEffect(() => {
    const loadVoiceActors = () => {
      try {
        const stored = localStorage.getItem('voiceActors');
        if (stored) {
          const actors = JSON.parse(stored);
          setVoiceActors(Array.isArray(actors) ? actors : []);
        } else {
          setVoiceActors([]);
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

  const handleConvert = async () => {
    if (!text.trim()) {
      setError("Please enter text to convert.");
      return;
    }

    if (!voiceId.trim()) {
      setError("Please select a voice from the dropdown.");
      return;
    }

    // Validate voice ID format (should be a valid UUID-like string)
    if (voiceId.length < 10 || voiceId.includes('(') || voiceId.includes(')')) {
      setError("Invalid voice ID selected. Please select a valid voice from the dropdown.");
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const apiKey = getApiKey();
      
      // Initialize ElevenLabs client with API key
      const elevenlabs = new ElevenLabsClient({
        apiKey: apiKey,
      });

      // Convert text to speech
      const audio = await elevenlabs.textToSpeech.convert(voiceId.trim(), {
        text: text.trim(),
        modelId: modelId,
        outputFormat: outputFormat as any,
      });

      // Convert the audio stream to a blob URL for playback
      const reader = audio.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
        }
      }

      // Create blob from chunks
      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to convert text to speech. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setVoiceId('');
    setModelId('eleven_multilingual_v2');
    setOutputFormat('mp3_44100_128');
    setLoading(false);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
            <p className="text-xl font-semibold">Converting text to speech...</p>
            <p className="text-gray-400 text-center">This may take a few moments. Please wait.</p>
          </div>
        ) : (
          <>
            {/* Text To Speech Form */}
            <section className="glass p-6 rounded-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <i className="fas fa-volume-up text-purple-400"></i>
                Convert Text to Speech
              </h2>

              <div className="flex flex-col gap-6">
                {/* Text Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Text *</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="The first move is what sets everything in motion."
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500 min-h-[120px]"
                    disabled={loading}
                  />
                </div>

                {/* Voice ID Dropdown */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Voice ID *</label>
                  {voiceActors.length > 0 ? (
                    <select
                      value={voiceId}
                      onChange={(e) => setVoiceId(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                      disabled={loading}
                    >
                      <option value="">Select a voice actor</option>
                      {voiceActors.map((actor) => (
                        <option key={actor.voiceId} value={actor.voiceId}>
                          {actor.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 text-gray-400">
                      No voice actors found. Create a voice clone first in the Voice Cloner section.
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Select a voice actor from your saved voice actors.</p>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Model</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  >
                    <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
                    <option value="eleven_turbo_v2_5">eleven_turbo_v2_5</option>
                    <option value="eleven_monolingual_v1">eleven_monolingual_v1</option>
                    <option value="eleven_v3">eleven_v3</option>
                  </select>
                </div>

                {/* Output Format Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Output Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  >
                    <option value="mp3_44100_128">MP3 44.1kHz 128kbps</option>
                    <option value="mp3_44100_192">MP3 44.1kHz 192kbps</option>
                    <option value="pcm_16000">PCM 16kHz</option>
                    <option value="pcm_22050">PCM 22.05kHz</option>
                    <option value="pcm_24000">PCM 24kHz</option>
                    <option value="pcm_44100">PCM 44.1kHz</option>
                    <option value="ulaw_8000">μ-law 8kHz</option>
                  </select>
                </div>

                {/* Convert Button */}
                {!audioUrl && (
                  <button
                    onClick={handleConvert}
                    disabled={loading || !text.trim() || !voiceId.trim()}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Converting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play"></i>
                        Convert to Speech
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Audio Player */}
            {audioUrl && (
              <section className="glass p-6 rounded-3xl">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                  <i className="fas fa-headphones text-green-400"></i>
                  Audio Generated Successfully!
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-black/40 rounded-xl">
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <a
                      href={audioUrl}
                      download={`text-to-speech-${Date.now()}.mp3`}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <i className="fas fa-download"></i> Download Audio
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <i className="fas fa-redo"></i> Convert Another
                    </button>
                  </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default TextToSpeech;
