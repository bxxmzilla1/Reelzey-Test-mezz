
import React, { useState, useCallback, useEffect } from 'react';
import { FileData } from '../types';
import FileUpload from './FileUpload';

interface MirrorModeProps {
  onOpenSettings?: () => void;
}

const MirrorMode: React.FC<MirrorModeProps> = ({ onOpenSettings }) => {
  const [imageData, setImageData] = useState<FileData | null>(null);
  const [videoData, setVideoData] = useState<FileData | null>(null);
  const [characterOrientation, setCharacterOrientation] = useState<'video' | 'image'>('video');
  const [keepOriginalSound, setKeepOriginalSound] = useState(true);
  const [requestId, setRequestId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Check for API key on mount and when it might change
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('wavespeedApiKey');
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    };
    
    checkApiKey();
    
    // Listen for storage changes (in case settings are updated in another tab/window)
    window.addEventListener('storage', checkApiKey);
    
    // Also check periodically in case settings modal updates localStorage in same window
    const interval = setInterval(checkApiKey, 1000);
    
    return () => {
      window.removeEventListener('storage', checkApiKey);
      clearInterval(interval);
    };
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = useCallback(async (file: File) => {
    setError(null);
    setGeneratedVideoUrl(null);
    const base64 = await convertToBase64(file);
    setImageData({ file, preview: URL.createObjectURL(file), base64 });
  }, []);

  const handleVideoSelect = useCallback(async (file: File) => {
    setError(null);
    setGeneratedVideoUrl(null);
    const base64 = await convertToBase64(file);
    setVideoData({ file, preview: URL.createObjectURL(file), base64 });
  }, []);

  const handleSubmitTask = async () => {
    if (!imageData && !videoData) {
      setError("Please provide an image or video.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage("Submitting task...");

    const WAVESPEED_API_KEY = localStorage.getItem('wavespeedApiKey');

    if (!WAVESPEED_API_KEY || WAVESPEED_API_KEY.trim() === '') {
      setError("Wavespeed API key is not configured. Please add it in the Settings menu.");
      setLoading(false);
      setHasApiKey(false);
      return;
    }
    
    setHasApiKey(true);

    try {
      const requestBody: any = {
        character_orientation: characterOrientation,
        image: imageData?.base64 || '',
        keep_original_sound: keepOriginalSound,
        video: videoData?.base64 || ''
      };

      const postResponse = await fetch('https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-std/motion-control', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WAVESPEED_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json().catch(() => ({ message: postResponse.statusText }));
        throw new Error(errorData.message || `API request failed with status ${postResponse.status}`);
      }

      const prediction = await postResponse.json();
      const newRequestId = prediction.id || prediction.requestId;

      if (!newRequestId) {
        throw new Error("No request ID returned from API.");
      }

      setRequestId(newRequestId);
      
      // Automatically poll for results
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 5000;

      while (attempts < maxAttempts) {
        attempts++;
        setLoadingMessage(`Generating video... Please wait. (Attempt ${attempts} of ${maxAttempts})`);

        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const getResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${newRequestId}/result`, {
          headers: {
            "Authorization": `Bearer ${WAVESPEED_API_KEY}`
          }
        });
        
        if (getResponse.status === 202) { continue; }
        
        if (!getResponse.ok) {
          const errorData = await getResponse.json().catch(() => ({ message: getResponse.statusText }));
          throw new Error(`Failed to fetch video result: ${errorData.message || getResponse.statusText}`);
        }

        const resultData = await getResponse.json();

        if (resultData.status === 'completed' && resultData.outputs && resultData.outputs.length > 0) {
          setGeneratedVideoUrl(resultData.outputs[0]);
          setLoading(false);
          setLoadingMessage('');
          return;
        } else if (resultData.status === 'failed') {
          throw new Error(`Video generation failed: ${resultData.error || 'Unknown error from API.'}`);
        }
      }
      throw new Error("Video generation timed out. Please try again later.");

    } catch (err: any) {
      setError(err.message || "Failed to submit task. Please try again.");
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setImageData(null);
    setVideoData(null);
    setCharacterOrientation('video');
    setKeepOriginalSound(true);
    setRequestId('');
    setLoading(false);
    setLoadingMessage('');
    setError(null);
    setSuccessMessage(null);
    setGeneratedVideoUrl(null);
  };

  return (
    <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 glass rounded-3xl min-h-[50vh]">
          <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold">Generating your video...</p>
          <p className="text-gray-400 text-center">{loadingMessage}<br/>This process can take several minutes. Please don't close this window.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {!generatedVideoUrl && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold gradient-text">Mirror Mode</h1>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  <i className="fas fa-redo"></i> Reset
                </button>
              </div>

              {/* Submit Task Section */}
              <section className="glass p-6 rounded-3xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <i className="fas fa-paper-plane text-purple-400"></i>
            Submit Task
          </h2>

          <div className="flex flex-col gap-6">
            {/* Character Orientation */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">Character Orientation</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setCharacterOrientation('video')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    characterOrientation === 'video'
                      ? 'bg-purple-600 text-white neon-glow'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <i className="fas fa-video mr-2"></i>Video
                </button>
                <button
                  onClick={() => setCharacterOrientation('image')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    characterOrientation === 'image'
                      ? 'bg-purple-600 text-white neon-glow'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <i className="fas fa-image mr-2"></i>Image
                </button>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">Image</label>
              <FileUpload
                label=""
                accept="image/*"
                icon="fas fa-image"
                onFileSelect={handleImageSelect}
                preview={imageData?.preview || null}
                type="image"
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">Video</label>
              <FileUpload
                label=""
                accept="video/*"
                icon="fas fa-video"
                onFileSelect={handleVideoSelect}
                preview={videoData?.preview || null}
                type="video"
              />
            </div>

            {/* Keep Original Sound */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="keepSound"
                checked={keepOriginalSound}
                onChange={(e) => setKeepOriginalSound(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="keepSound" className="text-gray-300 font-semibold cursor-pointer">
                Keep Original Sound
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitTask}
              disabled={loading || (!imageData && !videoData)}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
            >
              {loading && loadingMessage ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {loadingMessage}
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Submit Task
                </>
              )}
            </button>

          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex gap-3 items-start">
            <i className="fas fa-exclamation-triangle mt-1"></i>
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex gap-3 items-start">
            <i className="fas fa-check-circle mt-1"></i>
            <p>{successMessage}</p>
          </div>
        )}
            </>
          )}

          {generatedVideoUrl && (
            <section className="animate-in fade-in">
              <h2 className="text-2xl font-semibold tracking-wide mb-4 text-center">Your Video is Ready!</h2>
              <div className="glass p-6 rounded-3xl">
                <div className="flex justify-center bg-black/40 rounded-xl p-2 border border-gray-800">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    key={generatedVideoUrl} 
                    className="w-full max-w-full max-h-[70vh] rounded-lg object-contain" 
                  />
                </div>
                
                <div className="mt-6 flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center border-t border-gray-700/50 pt-6">
                  <a href={generatedVideoUrl} download={`mirror_mode_video.mp4`} className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500/50">
                    <i className="fas fa-download"></i> Download Video
                  </a>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button onClick={handleReset} className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                    <i className="fas fa-redo"></i> Create Another Video
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default MirrorMode;

