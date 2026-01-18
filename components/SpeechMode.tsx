import React, { useState, useEffect } from 'react';

interface SpeechModeProps {
  onOpenSettings?: () => void;
}

const SpeechMode: React.FC<SpeechModeProps> = ({ onOpenSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [startFrameUrl, setStartFrameUrl] = useState('');
  const [startFramePreview, setStartFramePreview] = useState<string | null>(null);
  const [startFramePreviewError, setStartFramePreviewError] = useState(false);
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
  const [lastFramePreviewError, setLastFramePreviewError] = useState(false);
  const [model, setModel] = useState('veo3_fast');
  const [watermark, setWatermark] = useState('');
  const [callBackUrl, setCallBackUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seeds, setSeeds] = useState<number | null>(null);
  const [enableFallback, setEnableFallback] = useState(false);
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [generationType] = useState('FIRST_AND_LAST_FRAMES_2_VIDEO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showCallbackDocs, setShowCallbackDocs] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('kieApiKey');
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    };
    checkApiKey();
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  const getApiKey = (): string => {
    const apiKey = localStorage.getItem('kieApiKey');
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Kie.ai API key not found. Please set it in Settings.');
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
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error.message) {
        return String(err.error.message);
      }
    }
    return String(err);
  };

  const handleStartFrameUrlChange = (url: string) => {
    setError(null);
    setStartFrameUrl(url);
    
    // Validate and set preview
    if (url.trim()) {
      // Basic URL validation
      try {
        new URL(url.trim());
        setStartFramePreview(url.trim());
        setStartFramePreviewError(false);
      } catch {
        setStartFramePreview(null);
        setStartFramePreviewError(false);
      }
    } else {
      setStartFramePreview(null);
      setStartFramePreviewError(false);
    }
  };

  const handleLastFrameUrlChange = (url: string) => {
    setError(null);
    setLastFrameUrl(url);
    
    // Validate and set preview
    if (url.trim()) {
      // Basic URL validation
      try {
        new URL(url.trim());
        setLastFramePreview(url.trim());
        setLastFramePreviewError(false);
      } catch {
        setLastFramePreview(null);
        setLastFramePreviewError(false);
      }
    } else {
      setLastFramePreview(null);
      setLastFramePreviewError(false);
    }
  };

  const handleStartFrameImageError = () => {
    setStartFramePreviewError(true);
    setStartFramePreview(null);
  };

  const handleLastFrameImageError = () => {
    setLastFramePreviewError(true);
    setLastFramePreview(null);
  };



  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    if (!startFrameUrl.trim()) {
      setError("Please provide a start frame image URL.");
      return;
    }

    if (!lastFrameUrl.trim()) {
      setError("Please provide a last frame image URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = getApiKey();

      const startFrameDataUrl = startFrameUrl.trim();
      const lastFrameDataUrl = lastFrameUrl.trim();

      const requestBody: any = {
        prompt: prompt.trim(),
        imageUrls: [startFrameDataUrl, lastFrameDataUrl],
        model: model,
        watermark: watermark.trim() || undefined,
        callBackUrl: callBackUrl.trim() || undefined,
        aspect_ratio: aspectRatio,
        seeds: seeds || undefined,
        enableFallback: enableFallback,
        enableTranslation: enableTranslation,
        generationType: generationType,
      };

      // Remove undefined fields
      Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });

      const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      // Save to generation history
      if (data && data.data && data.data.taskId) {
        const kiePrediction = {
          id: data.data.taskId,
          status: 'processing' as const,
          created_at: new Date().toISOString(),
          outputs: [],
          error: null,
          model: model,
          taskId: data.data.taskId,
          prompt: prompt.trim(),
        };
        
        // Load existing Kie history
        const existingHistory = localStorage.getItem('kieHistory');
        const history: any[] = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Add new prediction
        history.unshift(kiePrediction);
        
        // Keep only last 100 items
        const trimmedHistory = history.slice(0, 100);
        
        // Save back to localStorage
        localStorage.setItem('kieHistory', JSON.stringify(trimmedHistory));
        
        // Dispatch event to notify HistorySidebar
        window.dispatchEvent(new CustomEvent('kieHistoryUpdated'));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to generate video. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setStartFrameUrl('');
    setStartFramePreview(null);
    setStartFramePreviewError(false);
    setLastFrameUrl('');
    setLastFramePreview(null);
    setLastFramePreviewError(false);
    setModel('veo3_fast');
    setWatermark('');
    setCallBackUrl('');
    setAspectRatio('16:9');
    setSeeds(null);
    setEnableFallback(false);
    setEnableTranslation(true);
    setLoading(false);
    setError(null);
    setResult(null);
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
            <p className="text-xl font-semibold">Generating video...</p>
            <p className="text-gray-400 text-center">This may take a few moments. Please wait.</p>
          </div>
        ) : (
          <>
            {/* Speech Mode Form */}
            <section className="glass p-6 rounded-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <i className="fas fa-video text-purple-400"></i>
                Generate Video
              </h2>

              <div className="flex flex-col gap-6">
                {/* Prompt */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Prompt *</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A dog playing in a park"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 min-h-[100px] resize-y"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-400 mt-2">Describe the video you want to generate.</p>
                </div>

                {/* Start Frame Image URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Start Frame Image URL *</label>
                  <input
                    type="text"
                    value={startFrameUrl}
                    onChange={(e) => handleStartFrameUrlChange(e.target.value)}
                    placeholder="http://example.com/start-frame.jpg"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                  {startFramePreview && !startFramePreviewError && (
                    <div className="mt-3 rounded-xl border border-gray-800 overflow-hidden bg-gray-900/50">
                      <img
                        src={startFramePreview}
                        alt="Start frame preview"
                        className="w-full h-auto max-h-64 object-contain"
                        onError={handleStartFrameImageError}
                      />
                    </div>
                  )}
                  {startFramePreviewError && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle"></i>
                      Failed to load image. Please check the URL.
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">The first frame of the video.</p>
                </div>

                {/* Last Frame Image URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Last Frame Image URL *</label>
                  <input
                    type="text"
                    value={lastFrameUrl}
                    onChange={(e) => handleLastFrameUrlChange(e.target.value)}
                    placeholder="http://example.com/last-frame.jpg"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                  {lastFramePreview && !lastFramePreviewError && (
                    <div className="mt-3 rounded-xl border border-gray-800 overflow-hidden bg-gray-900/50">
                      <img
                        src={lastFramePreview}
                        alt="Last frame preview"
                        className="w-full h-auto max-h-64 object-contain"
                        onError={handleLastFrameImageError}
                      />
                    </div>
                  )}
                  {lastFramePreviewError && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle"></i>
                      Failed to load image. Please check the URL.
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">The last frame of the video. The video will transition between the start and last frames.</p>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  >
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                  </select>
                </div>

                {/* Generate Button */}
                {!result && (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim() || !startFrameUrl.trim() || !lastFrameUrl.trim()}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play"></i>
                        Generate Video
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Result */}
            {result && (
              <section className="glass p-6 rounded-3xl">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-400"></i>
                  Generation Successful!
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-black/40 rounded-xl">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || !prompt.trim() || !startFrameUrl.trim() || !lastFrameUrl.trim()}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play"></i> Generate Again
                        </>
                      )}
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

export default SpeechMode;
