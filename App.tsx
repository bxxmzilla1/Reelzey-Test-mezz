
import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import PromptDisplay from './components/PromptDisplay';
import RemovePeopleModal from './components/RemovePeopleModal';
import ImageDisplay from './components/ImageDisplay';
import FullScreenModal from './components/FullScreenModal';
import FrameSelectorModal from './components/FrameSelectorModal';
import { analyzeMedia, removePeopleFromImage, describeClothing } from './services/geminiService';
import { AnalysisResult, FileData } from './types';

const App: React.FC = () => {
  const [workflowStep, setWorkflowStep] = useState(1); // 1: Source, 2: BG, 3: Ref, 4: Clothing, 5: Camera, 6: Generate, 7: Result
  const [sourceImageData, setSourceImageData] = useState<FileData | null>(null);
  const [referenceImageData, setReferenceImageData] = useState<FileData | null>(null);
  const [backgroundImageData, setBackgroundImageData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageForEditing, setImageForEditing] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [videoForFrameSelection, setVideoForFrameSelection] = useState<File | null>(null);
  const [clothingDescription, setClothingDescription] = useState('');
  const [cameraView, setCameraView] = useState<string | null>(null);
  const [clothingImageData, setClothingImageData] = useState<FileData | null>(null);
  const [isDescribingClothing, setIsDescribingClothing] = useState(false);

  const resetWorkflow = () => {
    setWorkflowStep(1);
    setSourceImageData(null);
    setReferenceImageData(null);
    setBackgroundImageData(null);
    setResult(null);
    setClothingDescription('');
    setCameraView(null);
    setClothingImageData(null);
    setError(null);
  };

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

  const handleImageFileSelect = useCallback(async (file: File) => {
    resetWorkflow();
    const base64 = await convertToBase64(file);
    setSourceImageData({ file, preview: URL.createObjectURL(file), base64 });
    setWorkflowStep(2);
  }, []);

  const handleSourceFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoForFrameSelection(file);
    } else if (file.type.startsWith('image/')) {
      handleImageFileSelect(file);
    } else {
      setError('Unsupported file type. Please select an image or a video.');
    }
  };

  const handleFrameSelected = useCallback(async (frameFile: File) => {
    await handleImageFileSelect(frameFile);
    setVideoForFrameSelection(null);
  }, [handleImageFileSelect]);

  const handleReferenceImageSelect = useCallback(async (file: File) => {
    const base64 = await convertToBase64(file);
    setReferenceImageData({ file, preview: URL.createObjectURL(file), base64 });
    setWorkflowStep(4);
  }, []);

  const handleClothingImageSelect = useCallback(async (file: File) => {
    const base64 = await convertToBase64(file);
    setClothingImageData({ file, preview: URL.createObjectURL(file), base64 });
  }, []);

  const handleGenerateClothingDescription = async () => {
    if (!clothingImageData) return;
    setIsDescribingClothing(true);
    setError(null);
    try {
      const description = await describeClothing(clothingImageData.base64, clothingImageData.file.type);
      setClothingDescription(description);
    } catch (err) {
      console.error(err);
      setError("Failed to generate clothing description from the image.");
    } finally {
      setIsDescribingClothing(false);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImageData || !backgroundImageData || !referenceImageData) return;
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeMedia(
        sourceImageData.base64,
        sourceImageData.file.type,
        backgroundImageData.base64,
        backgroundImageData.file.type,
        referenceImageData.base64,
        referenceImageData.file.type,
        clothingDescription || null,
        cameraView
      );
      setResult(analysis);
      setWorkflowStep(7);
    } catch (err: any) {
      setError("Failed to analyze media. Please ensure the files are valid and within size limits.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!sourceImageData) return;
    setImageForEditing(sourceImageData.base64);
    setIsModalOpen(true);
  };

  const handleUseSourceAsBackground = () => {
    if (!sourceImageData) return;
    setBackgroundImageData(sourceImageData);
    setWorkflowStep(3);
  };

  const handleRemovePeople = async () => {
    if (!imageForEditing || !sourceImageData) return;
    setIsEditingImage(true);
    try {
      const newImageBase64 = await removePeopleFromImage(imageForEditing, sourceImageData.file.type);
      setImageForEditing(newImageBase64);
    } catch (e: any) {
      console.error("Failed to remove people:", e);
      setError(`Could not process the image: ${e.message}`);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleConfirmAndUseAsBackground = () => {
    if (!imageForEditing || !sourceImageData) return;
    const newFile = base64ToFile(imageForEditing, `bg_${sourceImageData.file.name}`, sourceImageData.file.type);
    setBackgroundImageData({ file: newFile, preview: URL.createObjectURL(newFile), base64: imageForEditing });
    setWorkflowStep(3);
    setImageForEditing(null);
    setIsModalOpen(false);
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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      const image = await createImageBitmap(blob);
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!pngBlob) throw new Error('Failed to create PNG blob from canvas');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      return true;
    } catch (error) {
      console.error('Failed to copy image:', error);
      setError("Could not copy image to clipboard. Your browser might not support this feature.");
      return false;
    }
  };

  const StepHeading = ({ number, title }: { number: number; title: string }) => (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold neon-glow">{number}</div>
      <h2 className="text-2xl font-semibold tracking-wide">{title}</h2>
    </div>
  );

  const CameraViewButton = ({ view, icon }: { view: string, icon: string }) => (
    <button
      key={view}
      onClick={() => { setCameraView(view); setWorkflowStep(6); }}
      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex flex-col items-center justify-center gap-3 bg-gray-800 hover:bg-purple-600 text-white shadow-lg shadow-purple-900/20 active:scale-95 neon-glow-hover"
    >
      <i className={`fas ${icon} text-2xl`}></i>
      <span>{view}</span>
    </button>
  );

  return (
    <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
      <FullScreenModal src={fullScreenImage} onClose={() => setFullScreenImage(null)} />
      <RemovePeopleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageSrc={imageForEditing && sourceImageData ? `data:${sourceImageData.file.type};base64,${imageForEditing}` : ''} onApply={handleRemovePeople} onConfirmAndSetBackground={handleConfirmAndUseAsBackground} isProcessing={isEditingImage} />
      <FrameSelectorModal isOpen={!!videoForFrameSelection} videoFile={videoForFrameSelection} onClose={() => setVideoForFrameSelection(null)} onFrameSelect={handleFrameSelected} />
      
      <main className="flex flex-col gap-12">
        {/* Step 1: Source Media */}
        <section className={`transition-opacity duration-500 ${workflowStep > 1 ? 'opacity-50' : 'opacity-100'}`}>
          <StepHeading number={1} title="Upload Source Media" />
          <div className="glass p-6 rounded-3xl">
            <FileUpload label="" accept="image/*,video/*" icon="fas fa-image" onFileSelect={handleSourceFileSelect} preview={sourceImageData?.preview || null} type="image" />
          </div>
        </section>

        {/* Step 2: Create Background */}
        {workflowStep >= 2 && sourceImageData && (
          <section className={`animate-in fade-in slide-in-from-bottom-5 duration-700 ${workflowStep > 2 ? 'opacity-50' : 'opacity-100'}`}>
            <StepHeading number={2} title="Prepare the Background" />
            <div className="glass p-6 rounded-3xl flex flex-col items-center gap-4">
              <p className="text-gray-400 text-center">You can either remove people from the source image to create a clean background, or use the source image as is.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <button onClick={handleOpenModal} className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 neon-glow neon-glow-hover">
                  <i className="fas fa-user-slash"></i> Edit Background
                </button>
                <button onClick={handleUseSourceAsBackground} className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                  <i className="fas fa-image"></i> Use as is
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Reference Person */}
        {workflowStep >= 3 && backgroundImageData && (
          <section className={`animate-in fade-in slide-in-from-bottom-5 duration-700 ${workflowStep > 3 ? 'opacity-50' : 'opacity-100'}`}>
            <StepHeading number={3} title="Upload Reference Person" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ImageDisplay title="Prepared Background" icon="fas fa-check-circle" imageSrc={backgroundImageData.preview} onView={() => setFullScreenImage(backgroundImageData.preview)} onDownload={() => handleDownload(backgroundImageData.preview, backgroundImageData.file.name)} onCopy={() => handleCopy(backgroundImageData.preview)} />
              <div className="glass p-6 rounded-3xl">
                <FileUpload label="" accept="image/*" icon="fas fa-user-circle" onFileSelect={handleReferenceImageSelect} preview={referenceImageData?.preview || null} type="image" />
              </div>
            </div>
          </section>
        )}
        
        {/* Step 4: Clothing */}
        {workflowStep >= 4 && referenceImageData && (
            <section className={`animate-in fade-in slide-in-from-bottom-5 duration-700 ${workflowStep > 4 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={4} title="Describe Clothing (Optional)" />
                <div className="glass p-6 rounded-3xl flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                            <FileUpload 
                                label="" 
                                accept="image/*" 
                                icon="fas fa-tshirt" 
                                onFileSelect={handleClothingImageSelect} 
                                preview={clothingImageData?.preview || null} 
                                type="image" 
                            />
                            <button 
                                onClick={handleGenerateClothingDescription} 
                                disabled={!clothingImageData || isDescribingClothing}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                {isDescribingClothing ? (
                                    <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Describing...</>
                                ) : (
                                    <><i className="fas fa-wand-magic-sparkles"></i> Generate Description</>
                                )}
                            </button>
                        </div>
                        <textarea
                            className="w-full h-full min-h-[200px] md:min-h-0 bg-black/40 rounded-xl p-4 border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500"
                            rows={8}
                            placeholder="Upload an image and click 'Generate Description', or manually describe the clothing... e.g., a red formal dress with gold accents, a casual black t-shirt and blue jeans..."
                            value={clothingDescription}
                            onChange={(e) => setClothingDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mt-2 w-full self-end md:justify-end">
                        <button onClick={() => { setClothingDescription(''); setWorkflowStep(5); }} className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                            Skip <i className="fas fa-arrow-right"></i>
                        </button>
                         <button onClick={() => setWorkflowStep(5)} className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 neon-glow neon-glow-hover">
                            <i className="fas fa-check"></i> Confirm
                        </button>
                    </div>
                </div>
            </section>
        )}

        {/* Step 5: Camera View */}
        {workflowStep >= 5 && (
            <section className={`animate-in fade-in slide-in-from-bottom-5 duration-700 ${workflowStep > 5 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={5} title="Select Camera View (Optional)" />
                <div className="glass p-6 rounded-3xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <CameraViewButton view="Selfie" icon="fa-mobile-alt" />
                        <CameraViewButton view="Half body" icon="fa-user" />
                        <CameraViewButton view="Full body" icon="fa-person" />
                        <CameraViewButton view="Side View" icon="fa-video" />
                    </div>
                    <div className="flex justify-center mt-6">
                        <button 
                            onClick={() => { setCameraView(null); setWorkflowStep(6); }} 
                            className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            Skip <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </section>
        )}


        {/* Step 6: Generate */}
        {workflowStep >= 6 && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col items-center">
            <StepHeading number={6} title="Generate Prompt" />
            <button onClick={handleGenerate} disabled={loading} className="w-full md:w-1/2 lg:w-1/3 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0">
              {loading ? ( <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</> ) : ( <><i className="fas fa-wand-magic-sparkles"></i>Generate Stage Prompt</> )}
            </button>
          </section>
        )}

        {/* Step 7: Results */}
        {workflowStep === 7 && result && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <StepHeading number={7} title="Copy Your Assets" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {backgroundImageData && <ImageDisplay title="Background Image" icon="fas fa-image" imageSrc={backgroundImageData.preview} onView={() => setFullScreenImage(backgroundImageData.preview)} onDownload={() => handleDownload(backgroundImageData.preview, backgroundImageData.file.name)} onCopy={() => handleCopy(backgroundImageData.preview)} />}
              {referenceImageData && <ImageDisplay title="Reference Person" icon="fas fa-user-circle" imageSrc={referenceImageData.preview} onView={() => setFullScreenImage(referenceImageData.preview)} onDownload={() => handleDownload(referenceImageData.preview, referenceImageData.file.name)} onCopy={() => handleCopy(referenceImageData.preview)} />}
            </div>
            <div className="mt-8">
              <PromptDisplay title="Stage Prompt" icon="fas fa-couch" content={result.stagePrompt} />
            </div>
            <div className="text-center mt-12">
              <button onClick={resetWorkflow} className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                <i className="fas fa-redo"></i> Start a New Project
              </button>
            </div>
          </section>
        )}

        {error && <div className="mt-8 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-start"><i className="fas fa-exclamation-triangle mt-1"></i><p>{error}</p></div>}
      </main>
    </div>
  );
};

export default App;