
import React, { useState, useCallback } from 'react';
import { FileData } from '../types';
import FileUpload from './FileUpload';
import PromptDisplay from './PromptDisplay';
import { analyzeActionsFromFrames } from '../services/geminiService';

const ScriptCreator: React.FC = () => {
  const [videoData, setVideoData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [actionPrompt, setActionPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleReset = () => {
    setVideoData(null);
    setIsLoading(false);
    setLoadingMessage('');
    setActionPrompt(null);
    setError(null);
  };

  const handleVideoSelect = useCallback(async (file: File) => {
    handleReset();
    if (!file.type.startsWith('video/')) {
        setError("Please upload a valid video file.");
        return;
    }
    const base64 = await convertToBase64(file);
    setVideoData({ file, preview: URL.createObjectURL(file), base64 });
  }, []);
  
  const extractFrames = async (videoFile: File): Promise<{ base64: string, mimeType: string }[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames: { base64: string, mimeType: string }[] = [];
        const maxFrames = 15;
        const mimeType = 'image/jpeg';

        if (!ctx) {
            return reject(new Error("Canvas context is not available."));
        }

        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const interval = duration / maxFrames;

            const captureFrame = async (time: number) => {
                return new Promise<void>((resolveFrame, rejectFrame) => {
                    const seekTimeout = setTimeout(() => {
                      rejectFrame(new Error('Video seek timed out.'));
                    }, 2000); // 2-second timeout for seek operation

                    video.onseeked = () => {
                        clearTimeout(seekTimeout);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL(mimeType, 0.8);
                        frames.push({
                            base64: dataUrl.split(',')[1],
                            mimeType: mimeType
                        });
                        resolveFrame();
                    };
                    video.currentTime = time;
                });
            };
            
            try {
                for (let i = 0; i < maxFrames; i++) {
                    await captureFrame(i * interval);
                }
                URL.revokeObjectURL(video.src);
                resolve(frames);
            } catch(e) {
                URL.revokeObjectURL(video.src);
                reject(e);
            }
        };

        video.onerror = (e) => {
            reject(new Error("Failed to load video file. It might be corrupt or in an unsupported format."));
        };
    });
  };

  const handleAnalyzeActions = async () => {
    if (!videoData) return;

    setIsLoading(true);
    setError(null);
    setActionPrompt(null);

    try {
        setLoadingMessage("Extracting frames from video...");
        const frames = await extractFrames(videoData.file);
        
        if (frames.length === 0) {
            throw new Error("Could not extract any frames from the video.");
        }

        setLoadingMessage("Analyzing actions with AI...");
        const prompt = await analyzeActionsFromFrames(frames);
        setActionPrompt(prompt);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const StepHeading = ({ number, title }: { number: number; title: string }) => (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold neon-glow">{number}</div>
      <h2 className="text-2xl font-semibold tracking-wide">{title}</h2>
    </div>
  );

  return (
    <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
        <main className="flex flex-col gap-8">
            {!videoData && (
                <section>
                    <StepHeading number={1} title="Upload Video" />
                    <div className="glass p-6 rounded-3xl">
                        <FileUpload
                            label="Upload a video to analyze actions"
                            accept="video/*"
                            icon="fas fa-video"
                            onFileSelect={handleVideoSelect}
                            preview={null}
                            type="video"
                        />
                    </div>
                </section>
            )}

            {videoData && (
                <>
                    <section className="animate-in fade-in duration-500">
                        <div className="glass p-6 rounded-3xl flex flex-col items-center gap-4">
                            <video src={videoData.preview} controls className="w-full max-h-[50vh] rounded-xl" />
                            <div className="flex flex-col md:flex-row gap-4 mt-4 w-full">
                                <button
                                    onClick={handleAnalyzeActions}
                                    disabled={isLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 neon-glow neon-glow-hover disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{loadingMessage || 'Analyzing...'}</>
                                    ) : (
                                        <><i className="fas fa-person-running"></i> Analyze Actions</>
                                    )}
                                </button>
                                <button 
                                    onClick={handleReset} 
                                    disabled={isLoading}
                                    className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <i className="fas fa-redo"></i> Start Over
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    {actionPrompt && (
                        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                             <StepHeading number={2} title="Action Prompt" />
                             <PromptDisplay title="Generated Action Sequence" icon="fas fa-scroll" content={actionPrompt} />
                        </section>
                    )}
                </>
            )}

            {error && <div className="mt-4 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-start"><i className="fas fa-exclamation-triangle mt-1"></i><p>{error}</p></div>}
        </main>
    </div>
  );
};

export default ScriptCreator;
