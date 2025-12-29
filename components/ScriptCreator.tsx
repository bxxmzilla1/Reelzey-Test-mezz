import React, { useState, useCallback } from 'react';
import { MOODS, CAMERA_VIEWS } from '../constants-scene';
import { Mood, Duration, CameraView } from '../types-scene';
import { enhancePrompt as enhancePromptApi, generateScene as generateSceneApi } from '../services/sceneGeminiService';
import ImageUploader from './scene/ImageUploader';
import MoodSelector from './scene/MoodSelector';
import CameraViewSelector from './scene/CameraViewSelector';
import PromptInput from './scene/PromptInput';
import DurationSelector from './scene/DurationSelector';
import SceneDisplay from './scene/SceneDisplay';
import { FilmIcon } from './scene/icons';

const ScriptCreator: React.FC = () => {
  const [image, setImage] = useState<{ file: File; base64: string } | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [cameraView, setCameraView] = useState<CameraView | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [duration, setDuration] = useState<Duration>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [generatedScene, setGeneratedScene] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage({ file, base64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt) {
      setError('Please enter a prompt to enhance.');
      return;
    }
    setIsLoading(true);
    setLoadingAction('Enhancing prompt...');
    setError(null);
    try {
      const enhanced = await enhancePromptApi(prompt);
      setPrompt(enhanced);
    } catch (e: any) {
      setError(e.message || 'Failed to enhance prompt. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  }, [prompt]);

  const handleGenerateScene = useCallback(async () => {
    if (!image || !mood || !cameraView) {
      setError('Please upload an image, select a mood, and choose a camera view.');
      return;
    }
    setIsLoading(true);
    setLoadingAction('Generating scene...');
    setError(null);
    setGeneratedScene('');

    try {
      const imagePart = {
        mimeType: image.file.type,
        data: image.base64.split(',')[1],
      };
      const scene = await generateSceneApi(imagePart, mood, cameraView, duration, prompt);
      setGeneratedScene(scene);
    } catch (e: any) {
      setError(e.message || 'Failed to generate scene. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  }, [image, mood, cameraView, duration, prompt]);

  return (
    <div className="px-4 md:px-8 pb-8 max-w-5xl mx-auto">
      <main className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-6 glass p-6 rounded-2xl">
          <ImageUploader onImageUpload={handleImageUpload} imagePreview={image?.base64 || null} />
          
          <MoodSelector moods={MOODS} selectedMood={mood} onSelectMood={setMood} />
          
          <CameraViewSelector views={CAMERA_VIEWS} selectedView={cameraView} onSelectView={setCameraView} />

          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onEnhance={handleEnhancePrompt}
            isDisabled={isLoading}
          />
          
          <DurationSelector selectedDuration={duration} onSelectDuration={setDuration} />

          <button
            onClick={handleGenerateScene}
            disabled={isLoading || !image || !mood || !cameraView}
            className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-glow neon-glow-hover"
          >
            {isLoading && loadingAction === 'Generating scene...' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingAction}
              </>
            ) : (
               <>
                <FilmIcon />
                Generate Scene
               </>
            )}
          </button>

          {error && <p className="text-red-400 text-center">{error}</p>}
        </div>

        <div className="glass p-6 rounded-2xl">
          <SceneDisplay
            scene={generatedScene}
            isLoading={isLoading && loadingAction === 'Generating scene...'}
          />
        </div>
      </main>
    </div>
  );
};

export default ScriptCreator;
