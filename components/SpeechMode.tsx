import React, { useState, useEffect } from 'react';

interface SpeechModeProps {
  onOpenSettings?: () => void;
}

const SpeechMode: React.FC<SpeechModeProps> = ({ onOpenSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [model, setModel] = useState('veo3_fast');
  const [watermark, setWatermark] = useState('');
  const [callBackUrl, setCallBackUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seeds, setSeeds] = useState<number | null>(null);
  const [enableFallback, setEnableFallback] = useState(false);
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [generationType, setGenerationType] = useState('REFERENCE_2_VIDEO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

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

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index: number) => {
    if (imageUrls.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    const validImageUrls = imageUrls.filter(url => url.trim() !== '');
    if (validImageUrls.length === 0) {
      setError("Please provide at least one image URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = getApiKey();

      const requestBody: any = {
        prompt: prompt.trim(),
        imageUrls: validImageUrls,
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
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to generate video. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setImageUrls(['']);
    setModel('veo3_fast');
    setWatermark('');
    setCallBackUrl('');
    setAspectRatio('16:9');
    setSeeds(null);
    setEnableFallback(false);
    setEnableTranslation(true);
    setGenerationType('REFERENCE_2_VIDEO');
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

                {/* Image URLs */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Image URLs *</label>
                  <div className="flex flex-col gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                          placeholder="http://example.com/image1.jpg"
                          className="flex-1 px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                          disabled={loading}
                        />
                        {imageUrls.length > 1 && (
                          <button
                            onClick={() => removeImageUrl(index)}
                            className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all"
                            disabled={loading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addImageUrl}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 self-start"
                      disabled={loading}
                    >
                      <i className="fas fa-plus"></i> Add Image URL
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Provide at least one image URL for reference.</p>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  >
                    <option value="veo3_fast">veo3_fast</option>
                  </select>
                </div>

                {/* Generation Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Generation Type</label>
                  <select
                    value={generationType}
                    onChange={(e) => setGenerationType(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  >
                    <option value="REFERENCE_2_VIDEO">REFERENCE_2_VIDEO</option>
                  </select>
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
                    <option value="1:1">1:1</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>

                {/* Watermark */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Watermark (Optional)</label>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="MyBrand"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                </div>

                {/* Callback URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Callback URL (Optional)</label>
                  <input
                    type="text"
                    value={callBackUrl}
                    onChange={(e) => setCallBackUrl(e.target.value)}
                    placeholder="http://your-callback-url.com/complete"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                </div>

                {/* Seeds */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Seeds (Optional)</label>
                  <input
                    type="number"
                    value={seeds || ''}
                    onChange={(e) => setSeeds(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="12345"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                </div>

                {/* Enable Fallback */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableFallback"
                    checked={enableFallback}
                    onChange={(e) => setEnableFallback(e.target.checked)}
                    className="w-5 h-5 rounded bg-black/40 border-gray-800 text-purple-600 focus:ring-purple-500"
                    disabled={loading}
                  />
                  <label htmlFor="enableFallback" className="text-sm font-semibold text-gray-300 cursor-pointer">
                    Enable Fallback
                  </label>
                </div>

                {/* Enable Translation */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableTranslation"
                    checked={enableTranslation}
                    onChange={(e) => setEnableTranslation(e.target.checked)}
                    className="w-5 h-5 rounded bg-black/40 border-gray-800 text-purple-600 focus:ring-purple-500"
                    disabled={loading}
                  />
                  <label htmlFor="enableTranslation" className="text-sm font-semibold text-gray-300 cursor-pointer">
                    Enable Translation
                  </label>
                </div>

                {/* Generate Button */}
                {!result && (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim() || imageUrls.filter(url => url.trim() !== '').length === 0}
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
                      disabled={loading || !prompt.trim() || imageUrls.filter(url => url.trim() !== '').length === 0}
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
