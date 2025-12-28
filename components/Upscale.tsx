
import React, { useState, useCallback } from 'react';
import { upscaleImage } from '../services/geminiService';
import { FileData } from '../types';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import FullScreenModal from './FullScreenModal';

const Upscale: React.FC = () => {
    const [originalImageData, setOriginalImageData] = useState<FileData | null>(null);
    const [upscaledImageData, setUpscaledImageData] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    };
    
    const handleReset = () => {
        setOriginalImageData(null);
        setUpscaledImageData(null);
        setError(null);
        setLoading(false);
    };

    const handleFileSelect = useCallback(async (file: File) => {
        handleReset();
        const base64 = await convertToBase64(file);
        setOriginalImageData({ file, preview: URL.createObjectURL(file), base64 });
    }, []);

    const handleUpscale = async () => {
        if (!originalImageData) return;
        setLoading(true);
        setError(null);
        setUpscaledImageData(null);
        try {
            const newImageBase64 = await upscaleImage(originalImageData.base64, originalImageData.file.type);
            const newFile = base64ToFile(newImageBase64, `upscaled_${originalImageData.file.name}`, originalImageData.file.type);
            setUpscaledImageData({
                file: newFile,
                preview: URL.createObjectURL(newFile),
                base64: newImageBase64
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to upscale the image. The model may not be suitable for this type of image.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopy = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            return true;
        } catch (error) {
            console.error('Failed to copy image:', error);
            setError("Could not copy image to clipboard. Your browser might not support this feature.");
            return false;
        }
    };

    return (
        <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
            <FullScreenModal src={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            
            <main className="flex flex-col gap-8">
                {!originalImageData && (
                    <section className="glass p-6 rounded-3xl">
                        <FileUpload
                            label="Upload an image to upscale"
                            accept="image/*"
                            icon="fas fa-image"
                            onFileSelect={handleFileSelect}
                            preview={null}
                            type="image"
                        />
                    </section>
                )}

                {originalImageData && (
                    <>
                        <section className="animate-in fade-in duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <ImageDisplay
                                    title="Original Image"
                                    icon="fas fa-image"
                                    imageSrc={originalImageData.preview}
                                    onView={() => setFullScreenImage(originalImageData.preview)}
                                >
                                    <button 
                                        onClick={handleUpscale} 
                                        disabled={loading}
                                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-fuchsia-500/50 flex items-center gap-2 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>
                                        ) : (
                                            <><i className="fas fa-search-plus"></i> Upscale Image</>
                                        )}
                                    </button>
                                </ImageDisplay>

                                {upscaledImageData ? (
                                    <div className="animate-in fade-in">
                                        <ImageDisplay
                                            title="Upscaled Image"
                                            icon="fas fa-check-circle"
                                            imageSrc={upscaledImageData.preview}
                                            onView={() => setFullScreenImage(upscaledImageData.preview)}
                                            onDownload={() => handleDownload(upscaledImageData.preview, upscaledImageData.file.name)}
                                            onCopy={() => handleCopy(upscaledImageData.preview)}
                                        />
                                    </div>
                                ) : (
                                    <div className="glass rounded-3xl p-6 flex flex-col gap-4 items-center justify-center h-full border-2 border-dashed border-gray-700">
                                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-2xl mb-4">
                                            <i className="fas fa-search-plus"></i>
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-400">Upscaled Image</h3>
                                        <p className="text-gray-500 text-center text-sm">The upscaled image will appear here after processing.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                        
                        <div className="text-center mt-4">
                           <button onClick={handleReset} className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                                <i className="fas fa-redo"></i> Start Over
                           </button>
                        </div>

                    </>
                )}

                {error && <div className="mt-4 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-start"><i className="fas fa-exclamation-triangle mt-1"></i><p>{error}</p></div>}
            </main>
        </div>
    );
};

export default Upscale;
