import React, { useState, useCallback, useEffect } from 'react';
import { FileData } from '../types';
import FileUpload from './FileUpload';

interface VideoCreatorProps {
  selectedHistoryVideoUrl: string | null;
  clearSelectedHistoryVideoUrl: () => void;
}

const VideoCreator: React.FC<VideoCreatorProps> = ({ selectedHistoryVideoUrl, clearSelectedHistoryVideoUrl }) => {
    const [imageData, setImageData] = useState<FileData | null>(null);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState(5);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (selectedHistoryVideoUrl) {
            handleReset();
            setGeneratedVideoUrl(selectedHistoryVideoUrl);
            clearSelectedHistoryVideoUrl();
        }
    }, [selectedHistoryVideoUrl, clearSelectedHistoryVideoUrl]);

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleReset = () => {
        setImageData(null);
        setPrompt('');
        setDuration(5);
        setLoading(false);
        setLoadingMessage('');
        setError(null);
        setGeneratedVideoUrl(null);
    };

    const handleImageSelect = useCallback(async (file: File) => {
        setGeneratedVideoUrl(null);
        setError(null);
        const base64 = await convertToBase64(file);
        setImageData({ file, preview: URL.createObjectURL(file), base64 });
    }, []);

    const handleGenerateVideo = async () => {
        if (!imageData || !prompt) {
            setError("Please provide an image and a prompt.");
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage("Submitting your request...");

        const WAVESPEED_API_KEY = localStorage.getItem('wavespeedApiKey');

        if (!WAVESPEED_API_KEY) {
            setError("Wavespeed API key is not configured. Please add it in the Settings menu.");
            setLoading(false);
            return;
        }

        try {
            const postResponse = await fetch('https://api.wavespeed.ai/api/v3/kwaivgi/kling-video-o1-std/image-to-video', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${WAVESPEED_API_KEY}`
                },
                body: JSON.stringify({
                    duration: duration,
                    image: imageData.base64,
                    prompt: prompt
                })
            });

            if (!postResponse.ok) {
                const errorData = await postResponse.json().catch(() => ({ message: postResponse.statusText }));
                throw new Error(errorData.message || `API request failed with status ${postResponse.status}`);
            }

            const prediction = await postResponse.json();
            const requestId = prediction.id;

            if (!requestId) {
                throw new Error("API did not return a request ID.");
            }

            let attempts = 0;
            const maxAttempts = 60;
            const pollInterval = 5000;

            while (attempts < maxAttempts) {
                attempts++;
                setLoadingMessage(`Generating video... Please wait. (Attempt ${attempts} of ${maxAttempts})`);

                await new Promise(resolve => setTimeout(resolve, pollInterval));

                const getResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
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
                    return;
                } else if (resultData.status === 'failed') {
                    throw new Error(`Video generation failed: ${resultData.error || 'Unknown error from API.'}`);
                }
            }
            throw new Error("Video generation timed out. Please try again later.");

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred during video generation.");
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const isGenerateDisabled = !imageData || !prompt || loading;
    
    return (
        <div className="px-4 md:px-8 pb-8 max-w-7xl mx-auto">
            <main className="flex flex-col gap-8 max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 glass rounded-3xl min-h-[50vh]">
                        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-xl font-semibold">Generating your video...</p>
                        <p className="text-gray-400 text-center">{loadingMessage}<br/>This process can take several minutes. Please don't close this window.</p>
                    </div>
                ) : (
                    <>
                        {!generatedVideoUrl && (
                            <>
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    <div className="glass p-6 rounded-3xl">
                                        <FileUpload label="1. Upload an Image" accept="image/*" icon="fas fa-image" onFileSelect={handleImageSelect} preview={imageData?.preview || null} type="image" />
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div className="glass p-6 rounded-3xl">
                                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 block">2. Write a Prompt</label>
                                            <textarea
                                                className="w-full h-40 bg-black/40 rounded-xl p-4 border border-gray-800 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors text-gray-300 placeholder-gray-500"
                                                placeholder="e.g., A golden retriever running in a sunny field..."
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                            />
                                        </div>
                                        <div className="glass p-6 rounded-3xl">
                                             <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 block">3. Select Duration</label>
                                             <div className="flex items-center gap-4">
                                                <button onClick={() => setDuration(5)} className={`w-full py-3 rounded-lg font-semibold transition-colors ${duration === 5 ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                                    5 seconds
                                                </button>
                                                <button onClick={() => setDuration(10)} className={`w-full py-3 rounded-lg font-semibold transition-colors ${duration === 10 ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                                    10 seconds
                                                </button>
                                             </div>
                                        </div>
                                    </div>
                                </section>
                                <section className="flex flex-col items-center">
                                    <button onClick={handleGenerateVideo} disabled={isGenerateDisabled} className="w-full md:w-1/2 lg:w-1/3 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/30 active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                        <i className="fas fa-film"></i> Generate Video
                                    </button>
                                </section>
                                <section>
                                    <div className="glass rounded-3xl p-6 flex flex-col gap-4 items-center justify-center min-h-[300px] border-2 border-dashed border-gray-700">
                                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-2xl mb-4">
                                            <i className="fas fa-video"></i>
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-400">Generated Video Preview</h3>
                                        <p className="text-gray-500 text-center text-sm">The generated video will appear here after processing.</p>
                                    </div>
                                </section>
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
                                        <a href={generatedVideoUrl} download={`generated_video_${duration}s.mp4`} className="text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
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
                    </>
                )}

                {error && <div className="mt-4 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-start"><i className="fas fa-exclamation-triangle mt-1"></i><p>{error}</p></div>}
            </main>
        </div>
    );
};

export default VideoCreator;