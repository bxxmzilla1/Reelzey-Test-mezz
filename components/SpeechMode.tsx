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
  const [uploadingStartFrame, setUploadingStartFrame] = useState(false);
  const [uploadingLastFrame, setUploadingLastFrame] = useState(false);

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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload image to Kie.ai API
  const uploadImage = async (base64Data: string, fileName: string): Promise<string> => {
    const apiKey = getApiKey();
    
    const response = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data: base64Data,
        uploadPath: 'images/base64',
        fileName: fileName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle various possible response structures
    if (data.url) {
      return data.url;
    }
    if (data.data?.url) {
      return data.data.url;
    }
    if (data.resultUrl) {
      return data.resultUrl;
    }
    if (data.data?.resultUrl) {
      return data.data.resultUrl;
    }
    if (data.fileUrl) {
      return data.fileUrl;
    }
    if (data.data?.fileUrl) {
      return data.data.fileUrl;
    }
    // If response has a message with URL, try to extract it
    if (data.msg && typeof data.msg === 'string' && data.msg.startsWith('http')) {
      return data.msg;
    }
    throw new Error('No URL returned from upload API. Response: ' + JSON.stringify(data));
  };

  const handleStartFrameUpload = async (file: File) => {
    setUploadingStartFrame(true);
    setError(null);
    
    try {
      // Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Upload to API
      const uploadedUrl = await uploadImage(base64Data, file.name);
      
      // Set the URL in the input
      setStartFrameUrl(uploadedUrl);
      handleStartFrameUrlChange(uploadedUrl);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to upload start frame image. Please try again."));
    } finally {
      setUploadingStartFrame(false);
    }
  };

  const handleLastFrameUpload = async (file: File) => {
    setUploadingLastFrame(true);
    setError(null);
    
    try {
      // Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Upload to API
      const uploadedUrl = await uploadImage(base64Data, file.name);
      
      // Set the URL in the input
      setLastFrameUrl(uploadedUrl);
      handleLastFrameUrlChange(uploadedUrl);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to upload last frame image. Please try again."));
    } finally {
      setUploadingLastFrame(false);
    }
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
    setUploadingStartFrame(false);
    setUploadingLastFrame(false);
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
                  
                  {/* Upload Button */}
                  <div className="mb-3">
                    <label className="relative inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleStartFrameUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        disabled={loading || uploadingStartFrame}
                      />
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        uploadingStartFrame || loading
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}>
                        {uploadingStartFrame ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload"></i>
                            Upload Image
                          </>
                        )}
                      </span>
                    </label>
                    <span className="text-xs text-gray-400 ml-3">or enter URL below</span>
                  </div>
                  
                  <input
                    type="text"
                    value={startFrameUrl}
                    onChange={(e) => handleStartFrameUrlChange(e.target.value)}
                    placeholder="http://example.com/start-frame.jpg"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading || uploadingStartFrame}
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
                  
                  {/* Upload Button */}
                  <div className="mb-3">
                    <label className="relative inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLastFrameUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        disabled={loading || uploadingLastFrame}
                      />
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        uploadingLastFrame || loading
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}>
                        {uploadingLastFrame ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload"></i>
                            Upload Image
                          </>
                        )}
                      </span>
                    </label>
                    <span className="text-xs text-gray-400 ml-3">or enter URL below</span>
                  </div>
                  
                  <input
                    type="text"
                    value={lastFrameUrl}
                    onChange={(e) => handleLastFrameUrlChange(e.target.value)}
                    placeholder="http://example.com/last-frame.jpg"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading || uploadingLastFrame}
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-300">Callback URL (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setShowCallbackDocs(!showCallbackDocs)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <i className={`fas fa-chevron-${showCallbackDocs ? 'up' : 'down'} text-xs`}></i>
                      {showCallbackDocs ? 'Hide' : 'Show'} Callback Documentation
                    </button>
                  </div>
                  <input
                    type="text"
                    value={callBackUrl}
                    onChange={(e) => setCallBackUrl(e.target.value)}
                    placeholder="http://your-callback-url.com/complete"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-400 mt-2">The system will POST task completion results to this URL when video generation is completed.</p>
                  
                  {/* Callback Documentation */}
                  {showCallbackDocs && (
                    <div className="mt-4 p-4 bg-black/60 rounded-xl border border-gray-700 max-h-[600px] overflow-y-auto">
                      <div className="space-y-4 text-sm text-gray-300">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <i className="fas fa-info-circle text-blue-400"></i>
                            Veo3.1 Video Generation Callbacks
                          </h3>
                          <p className="text-gray-400 mb-3">When you submit a video generation task, you can set a callback address through the <code className="px-1.5 py-0.5 bg-gray-800 rounded text-purple-300">callBackUrl</code> parameter. After the task is completed, the system will automatically push the results to your specified address.</p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-blue-300 text-xs"><i className="fas fa-lightbulb mr-2"></i>The callback mechanism avoids the need for you to poll the API for task status, as the system will actively push task completion results to your server.</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Callback Timing</h4>
                          <p className="text-gray-400 mb-2">The system will send callback notifications when:</p>
                          <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                            <li>Video generation task completed successfully</li>
                            <li>Video generation task failed</li>
                            <li>Error occurred during task processing</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Callback Method</h4>
                          <ul className="text-gray-400 space-y-1">
                            <li><strong>HTTP Method:</strong> POST</li>
                            <li><strong>Content Type:</strong> application/json</li>
                            <li><strong>Timeout Setting:</strong> 15 seconds</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Callback Request Format</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-green-400 mb-1">Success Callback:</p>
                              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`{
  "code": 200,
  "msg": "Veo3.1 video generated successfully.",
  "data": {
    "taskId": "veo_task_abcdef123456",
    "info": {
      "resultUrls": ["http://example.com/video1.mp4"],
      "originUrls": ["http://example.com/original_video1.mp4"],
      "resolution": "1080p"
    },
    "fallbackFlag": false
  }
}`}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs text-red-400 mb-1">Failure Callback:</p>
                              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`{
  "code": 400,
  "msg": "Your prompt was flagged...",
  "data": {
    "taskId": "veo_task_abcdef123456",
    "fallbackFlag": false
  }
}`}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Status Code Description</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="text-left p-2 text-gray-300">Code</th>
                                  <th className="text-left p-2 text-gray-300">Description</th>
                                </tr>
                              </thead>
                              <tbody className="text-gray-400">
                                <tr className="border-b border-gray-800">
                                  <td className="p-2"><code className="text-green-400">200</code></td>
                                  <td className="p-2">Success - Video generation task successful</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="p-2"><code className="text-red-400">400</code></td>
                                  <td className="p-2">Client error - Prompt violates content policies</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="p-2"><code className="text-yellow-400">422</code></td>
                                  <td className="p-2">Fallback failed - Consider enabling fallback</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="p-2"><code className="text-red-400">500</code></td>
                                  <td className="p-2">Internal error - Please try again later</td>
                                </tr>
                                <tr>
                                  <td className="p-2"><code className="text-red-400">501</code></td>
                                  <td className="p-2">Failed - Video generation task failed</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Fallback Functionality</h4>
                          <p className="text-gray-400 mb-2">When <code className="px-1.5 py-0.5 bg-gray-800 rounded text-purple-300">enableFallback</code> is enabled and specific errors occur, the system will automatically switch to a backup model.</p>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                            <p className="text-yellow-300 text-xs"><i className="fas fa-exclamation-triangle mr-2"></i>Fallback only works with 16:9 aspect ratio and specific error types. Fallback videos are 1080p and cannot be accessed via Get 1080P Video endpoint.</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Best Practices</h4>
                          <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                            <li>Use HTTPS for callback URL to ensure security</li>
                            <li>Verify request source legitimacy</li>
                            <li>Return 200 status code quickly (within 15 seconds)</li>
                            <li>Process complex logic asynchronously</li>
                            <li>Download video URLs promptly (they have validity period)</li>
                            <li>Ensure prompts are in English</li>
                          </ul>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-red-300 text-xs font-semibold mb-2"><i className="fas fa-exclamation-circle mr-2"></i>Important Reminders:</p>
                          <ul className="text-red-300/80 text-xs space-y-1 list-disc list-inside">
                            <li>Callback URL must be publicly accessible</li>
                            <li>Server must respond within 15 seconds</li>
                            <li>After 3 consecutive retry failures, callbacks stop</li>
                            <li>Only English prompts are supported</li>
                            <li>originUrls only has value when aspect_ratio is not 16:9</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
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
