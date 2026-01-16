
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './FileUpload';
import { FileData } from '../types';

interface VoiceClonerProps {
  onOpenSettings?: () => void;
}

interface Voice {
  voice_id: string;
  name: string;
  language: string;
  description: string;
}

interface Sample {
  sample_id: string;
  status?: string;
}

interface Speaker {
  speaker_id: string;
}

const VoiceCloner: React.FC<VoiceClonerProps> = ({ onOpenSettings }) => {
  const [step, setStep] = useState(1);
  const [voiceName, setVoiceName] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [createdVoice, setCreatedVoice] = useState<Voice | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>([]);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaRecording, setCaptchaRecording] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('elevenlabsApiKey');
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    };
    checkApiKey();
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  const getApiKey = (): string => {
    const apiKey = localStorage.getItem('elevenlabsApiKey');
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ElevenLabs API key not found. Please set it in Settings.');
    }
    return apiKey.trim();
  };

  const handleAudioSelect = useCallback((file: File) => {
    setError(null);
    setAudioFiles(prev => [...prev, file]);
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCreateVoice = async () => {
    if (!voiceName.trim()) {
      setError("Please enter a voice name.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Creating PVC voice...");

    try {
      const apiKey = getApiKey();
      const requestBody: any = {
        name: voiceName,
        language: voiceLanguage,
      };
      
      // Only include description if it's not empty
      if (voiceDescription && voiceDescription.trim() !== '') {
        requestBody.description = voiceDescription.trim();
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices/pvc', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message?.detail || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const voice = await response.json();
      setCreatedVoice(voice);
      setStep(2);
      setSuccessMessage("Voice created successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to create voice. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleUploadAudio = async () => {
    if (!createdVoice || audioFiles.length === 0) {
      setError("Please create a voice first and upload at least one audio file.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Uploading audio files...");

    try {
      const apiKey = getApiKey();
      const formData = new FormData();
      
      // Append each file directly - FormData handles File objects properly
      audioFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });

      const response = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/samples`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message?.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSamples(result.samples || []);
      setStep(3);
      setSuccessMessage("Audio files uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload audio files. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleSpeakerSeparation = async () => {
    if (!createdVoice || samples.length === 0) {
      setError("Please upload audio files first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Starting speaker separation...");

    try {
      const apiKey = getApiKey();
      
      // Start separation for all samples
      for (const sample of samples) {
        if (sample.sample_id) {
          await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/samples/${sample.sample_id}/speakers/separate`, {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
            },
          });
        }
      }

      // Poll for completion
      let allComplete = false;
      let attempts = 0;
      const maxAttempts = 60;

      while (!allComplete && attempts < maxAttempts) {
        attempts++;
        setLoadingMessage(`Checking separation status... (Attempt ${attempts} of ${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        allComplete = true;
        for (const sample of samples) {
          if (sample.sample_id) {
            const statusResponse = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/samples/${sample.sample_id}/speakers`, {
              headers: {
                'xi-api-key': apiKey,
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.status !== 'completed' && statusData.status !== 'failed') {
                allComplete = false;
              }
            } else {
              allComplete = false;
            }
          }
        }
      }

      if (allComplete) {
        setStep(4);
        setSuccessMessage("Speaker separation completed!");
      } else {
        throw new Error("Speaker separation timed out. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to separate speakers. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRetrieveSpeakers = async () => {
    if (!createdVoice || samples.length === 0) {
      setError("Please complete previous steps first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Retrieving speaker information...");

    try {
      const apiKey = getApiKey();
      const speakersList: { sampleId: string; speakers: Speaker[] }[] = [];

      for (const sample of samples) {
        if (sample.sample_id) {
          const response = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/samples/${sample.sample_id}/speakers`, {
            headers: {
              'xi-api-key': apiKey,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status === 'completed' && data.speakers) {
              const speakerArray = Array.isArray(data.speakers) ? data.speakers : Object.values(data.speakers);
              speakersList.push({ sampleId: sample.sample_id, speakers: speakerArray });
            }
          }
        }
      }

      // For now, auto-select first speaker from each sample
      const selectedIds: string[] = [];
      speakersList.forEach(({ speakers }) => {
        if (speakers.length > 0) {
          selectedIds.push(speakers[0].speaker_id);
        }
      });
      setSelectedSpeakerIds(selectedIds);
      setStep(5);
      setSuccessMessage("Speakers retrieved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to retrieve speakers. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleUpdateSamples = async () => {
    if (!createdVoice || samples.length === 0 || selectedSpeakerIds.length === 0) {
      setError("Please complete previous steps and select speakers.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Updating samples with speaker IDs...");

    try {
      const apiKey = getApiKey();
      
      for (const sample of samples) {
        if (sample.sample_id) {
          await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/samples/${sample.sample_id}`, {
            method: 'PATCH',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              selected_speaker_ids: selectedSpeakerIds,
            }),
          });
        }
      }

      setStep(6);
      setSuccessMessage("Samples updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update samples. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGetCaptcha = async () => {
    if (!createdVoice) {
      setError("Please create a voice first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Requesting CAPTCHA...");

    try {
      const apiKey = getApiKey();
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/verification/captcha`, {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message?.detail || errorData.message || `API request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setCaptchaImage(imageUrl);
      setStep(7);
      setSuccessMessage("CAPTCHA retrieved. Please read the text and record it.");
    } catch (err: any) {
      setError(err.message || "Failed to get CAPTCHA. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleVerifyCaptcha = async () => {
    if (!createdVoice || !captchaRecording) {
      setError("Please record the CAPTCHA text first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Verifying CAPTCHA...");

    try {
      const apiKey = getApiKey();
      const formData = new FormData();
      const blob = base64ToBlob(captchaRecording.base64, captchaRecording.file.type);
      formData.append('recording', blob, captchaRecording.file.name);

      const response = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/verification/captcha/verify`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message?.detail || errorData.message || `Verification failed with status ${response.status}`);
      }

      setStep(8);
      setSuccessMessage("CAPTCHA verified successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to verify CAPTCHA. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleTrainVoice = async () => {
    if (!createdVoice) {
      setError("Please complete previous steps first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage("Starting training...");

    try {
      const apiKey = getApiKey();
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/pvc/${createdVoice.voice_id}/train`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'eleven_multilingual_v2',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message?.detail || errorData.message || `Training failed with status ${response.status}`);
      }

      // Poll for training completion
      let trainingComplete = false;
      let attempts = 0;
      const maxAttempts = 120;

      while (!trainingComplete && attempts < maxAttempts) {
        attempts++;
        setLoadingMessage(`Training in progress... (Attempt ${attempts} of ${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 10000));

        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${createdVoice.voice_id}`, {
          headers: {
            'xi-api-key': apiKey,
          },
        });

        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json();
          const fineTuningState = voiceData.fine_tuning?.state?.eleven_multilingual_v2;
          
          if (fineTuningState === 'fine_tuned' || fineTuningState === 'failed') {
            trainingComplete = true;
            if (fineTuningState === 'fine_tuned') {
              setStep(9);
              setSuccessMessage("Voice training completed successfully!");
            } else {
              throw new Error("Voice training failed.");
            }
          }
        }
      }

      if (!trainingComplete) {
        throw new Error("Training timed out. Please check the status later.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to train voice. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setStep(1);
    setVoiceName('');
    setVoiceLanguage('en');
    setVoiceDescription('');
    setAudioFiles([]);
    setCreatedVoice(null);
    setSamples([]);
    setSelectedSpeakerIds([]);
    setCaptchaImage(null);
    setCaptchaRecording(null);
    setLoading(false);
    setLoadingMessage('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleRecordingSelect = useCallback(async (file: File) => {
    setError(null);
    const base64 = await convertToBase64(file);
    setCaptchaRecording({ file, preview: URL.createObjectURL(file), base64 });
  }, []);

  const StepHeading = ({ number, title }: { number: number; title: string }) => (
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
        step >= number ? 'bg-purple-600 neon-glow' : 'bg-gray-700'
      }`}>{number}</div>
      <h2 className="text-2xl font-semibold tracking-wide">{title}</h2>
    </div>
  );

  return (
    <div className="px-4 md:px-8 pb-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Voice Cloner</h1>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <i className="fas fa-redo"></i> Reset
          </button>
        </div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 flex gap-3 items-start">
            <i className="fas fa-exclamation-triangle mt-1"></i>
            <div className="flex-1">
              <p className="font-semibold mb-1">ElevenLabs API Key Required</p>
              <p className="text-sm text-yellow-300/80">
                Please configure your ElevenLabs API key in Settings to use Voice Cloner features.
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="ml-2 underline hover:text-yellow-200 transition-colors"
                  >
                    Open Settings
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8 glass rounded-3xl min-h-[50vh]">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold">Processing...</p>
            <p className="text-gray-400 text-center">{loadingMessage}</p>
          </div>
        ) : (
          <>
            {/* Step 1: Create PVC Voice */}
            <section className={`glass p-6 rounded-3xl ${step > 1 ? 'opacity-50' : 'opacity-100'}`}>
              <StepHeading number={1} title="Create PVC Voice" />
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Voice Name *</label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="My Professional Voice Clone"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500"
                    disabled={step > 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Language</label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300"
                    disabled={step > 1}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="pl">Polish</option>
                    <option value="tr">Turkish</option>
                    <option value="ru">Russian</option>
                    <option value="nl">Dutch</option>
                    <option value="cs">Czech</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="hu">Hungarian</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Description (Optional)</label>
                  <textarea
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="A professional voice clone of my voice"
                    className="w-full px-4 py-3 bg-black/40 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500 min-h-[100px]"
                    disabled={step > 1}
                  />
                </div>
                {step === 1 && (
                  <button
                    onClick={handleCreateVoice}
                    disabled={loading || !voiceName.trim()}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                  >
                    <i className="fas fa-plus"></i> Create Voice
                  </button>
                )}
                {createdVoice && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Voice ID:</p>
                    <p className="text-purple-400 font-mono font-semibold break-all">{createdVoice.voice_id}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Upload Audio Files */}
            {step >= 2 && createdVoice && (
              <section className={`glass p-6 rounded-3xl ${step > 2 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={2} title="Upload Audio Files" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">Upload audio sample files that will be used to train the PVC. The more files you add, the better the clone will be.</p>
                  <FileUpload
                    label=""
                    accept="audio/*,video/*"
                    icon="fas fa-music"
                    onFileSelect={handleAudioSelect}
                    preview={null}
                    type="video"
                    showPasteButton={false}
                  />
                  {audioFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Uploaded Files ({audioFiles.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {audioFiles.map((file, index) => (
                          <div key={index} className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 flex items-center gap-2">
                            <i className="fas fa-file-audio"></i>
                            <span>{file.name}</span>
                            {step === 2 && (
                              <button
                                onClick={() => setAudioFiles(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-400 hover:text-red-300"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <button
                      onClick={handleUploadAudio}
                      disabled={loading || audioFiles.length === 0}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-upload"></i> Upload Files
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Step 3: Speaker Separation */}
            {step >= 3 && samples.length > 0 && (
              <section className={`glass p-6 rounded-3xl ${step > 3 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={3} title="Begin Speaker Separation" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">This step will attempt to separate the audio files into individual speakers. This is required if you are uploading audio with multiple speakers.</p>
                  {step === 3 && (
                    <button
                      onClick={handleSpeakerSeparation}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-users"></i> Start Speaker Separation
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Step 4: Retrieve Speaker Audio */}
            {step >= 4 && (
              <section className={`glass p-6 rounded-3xl ${step > 4 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={4} title="Retrieve Speaker Audio" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">Once speaker separation is complete, you will have a list of speakers for each sample. The first speaker from each sample will be automatically selected.</p>
                  {step === 4 && (
                    <button
                      onClick={handleRetrieveSpeakers}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-download"></i> Retrieve Speakers
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Step 5: Update Samples */}
            {step >= 5 && selectedSpeakerIds.length > 0 && (
              <section className={`glass p-6 rounded-3xl ${step > 5 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={5} title="Update Samples with Speaker IDs" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">Update the samples to select which speaker you want to use for the PVC.</p>
                  {step === 5 && (
                    <button
                      onClick={handleUpdateSamples}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-check"></i> Update Samples
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Step 6: Verify PVC */}
            {step >= 6 && (
              <section className={`glass p-6 rounded-3xl ${step > 7 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={6} title="Verify the PVC" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">Before training can begin, a verification step is required to ensure you have permission to use the voice.</p>
                  
                  {!captchaImage && step === 6 && (
                    <button
                      onClick={handleGetCaptcha}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-shield-alt"></i> Request CAPTCHA
                    </button>
                  )}

                  {captchaImage && (
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-gray-800 rounded-xl">
                        <p className="text-sm font-semibold text-gray-300 mb-2">CAPTCHA Image:</p>
                        <img src={captchaImage} alt="CAPTCHA" className="max-w-full h-auto rounded-lg" />
                        <p className="text-xs text-gray-400 mt-2">Read the text in the image above and record yourself reading it.</p>
                      </div>
                      <FileUpload
                        label="Upload Recording"
                        accept="audio/*"
                        icon="fas fa-microphone"
                        onFileSelect={handleRecordingSelect}
                        preview={captchaRecording?.preview || null}
                        type="video"
                        showPasteButton={false}
                      />
                      {captchaRecording && step === 6 && (
                        <button
                          onClick={handleVerifyCaptcha}
                          disabled={loading}
                          className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                        >
                          <i className="fas fa-check-circle"></i> Verify CAPTCHA
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Step 7: Train the PVC */}
            {step >= 8 && (
              <section className={`glass p-6 rounded-3xl ${step > 8 ? 'opacity-50' : 'opacity-100'}`}>
                <StepHeading number={7} title="Train the PVC" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm">Begin the training process. This will take some time to complete based on the length and number of samples provided.</p>
                  {step === 8 && (
                    <button
                      onClick={handleTrainVoice}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 neon-glow neon-glow-hover active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:neon-glow-0"
                    >
                      <i className="fas fa-cog"></i> Start Training
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Step 8: Complete */}
            {step === 9 && (
              <section className="glass p-6 rounded-3xl">
                <StepHeading number={8} title="Voice Training Complete!" />
                <div className="flex flex-col gap-4">
                  <p className="text-gray-300">Your Professional Voice Clone has been successfully trained and is ready to use!</p>
                  {createdVoice && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">Voice ID:</p>
                      <p className="text-green-400 font-mono font-semibold break-all">{createdVoice.voice_id}</p>
                      <p className="text-xs text-gray-400 mt-2">You can now use this voice ID with the ElevenLabs Text-to-Speech API.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

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
      </div>
    </div>
  );
};

export default VoiceCloner;
