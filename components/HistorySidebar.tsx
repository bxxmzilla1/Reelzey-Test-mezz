import React, { useState, useEffect, useCallback } from 'react';
import { Prediction } from '../types';

interface HistorySidebarProps {
  onSelectVideo: (url: string) => void;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ onSelectVideo, onClose }) => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredVideoUrl, setHoveredVideoUrl] = useState<string | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchHistory = useCallback(async () => {
        const WAVESPEED_API_KEY = localStorage.getItem('wavespeedApiKey');
        if (!WAVESPEED_API_KEY) {
            setError("Wavespeed API key not set in Settings.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('https://api.wavespeed.ai/api/v3/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ page: 1, page_size: 100 }),
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch history with status ${response.status}`);
            }
            const result = await response.json();
            const videoPredictions = result.data.items.filter((p: Prediction) => 
                p.model && (p.model.includes('kling-video') || p.model.includes('motion-control'))
            );
            setPredictions(videoPredictions);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching history.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    const StatusIndicator = ({ status }: { status: string }) => {
        let colorClasses = '';
        switch (status) {
            case 'completed':
                colorClasses = 'bg-green-500/20 text-green-400 border-green-500/30';
                break;
            case 'processing':
                colorClasses = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                break;
            case 'failed':
                colorClasses = 'bg-red-500/20 text-red-400 border-red-500/30';
                break;
            default:
                colorClasses = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
        return <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${colorClasses} capitalize`}>{status}</span>;
    };

    const groupPredictionsByDate = (predictions: Prediction[]) => {
        const grouped: { [key: string]: Prediction[] } = {};
        
        predictions.forEach(pred => {
            const date = new Date(pred.created_at);
            const dateKey = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(pred);
        });

        // Sort dates in descending order (newest first)
        return Object.keys(grouped)
            .sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateB.getTime() - dateA.getTime();
            })
            .map(dateKey => ({
                date: dateKey,
                predictions: grouped[dateKey].sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
            }));
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const toggleSelection = (predictionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering video selection
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(predictionId)) {
                newSet.delete(predictionId);
            } else {
                newSet.add(predictionId);
            }
            return newSet;
        });
    };

    const handleDownloadSelected = async () => {
        const selectedPredictions = predictions.filter(p => 
            selectedIds.has(p.id) && 
            p.status === 'completed' && 
            p.outputs && 
            p.outputs.length > 0
        );

        if (selectedPredictions.length === 0) {
            return;
        }

        // Download each video
        for (let i = 0; i < selectedPredictions.length; i++) {
            const pred = selectedPredictions[i];
            const videoUrl = pred.outputs[0];
            const date = new Date(pred.created_at);
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
            const filename = `video_${dateStr}_${timeStr}_${pred.id.slice(0, 8)}.mp4`;

            try {
                const response = await fetch(videoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Small delay between downloads to prevent browser blocking
                if (i < selectedPredictions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (err) {
                console.error(`Failed to download video ${pred.id}:`, err);
            }
        }

        // Clear selection after download
        setSelectedIds(new Set());
    };

    const selectedCount = selectedIds.size;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-gray-900/50 backdrop-blur-lg animate-in slide-in-from-right-full duration-300 z-[60]" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col h-full glass border-l border-purple-500/20">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold">Generation History</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={fetchHistory} 
                            disabled={isLoading}
                            className={`text-gray-500 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'animate-spin' : ''}`}
                            title="Refresh History"
                        >
                            <i className={`fas fa-sync-alt text-lg ${isLoading ? 'animate-spin' : ''}`}></i>
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Download Button - Shows when items are selected */}
                {selectedCount > 0 && (
                    <div className="px-4 py-3 border-b border-gray-800 bg-purple-500/10">
                        <button
                            onClick={handleDownloadSelected}
                            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 neon-glow"
                        >
                            <i className="fas fa-download"></i>
                            Download {selectedCount} {selectedCount === 1 ? 'Video' : 'Videos'}
                        </button>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto p-4">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                           <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg">{error}</p>}
                    {!isLoading && !error && predictions.length === 0 && (
                        <p className="text-gray-500 text-center mt-8">No recent video generations found.</p>
                    )}
                    {!isLoading && !error && predictions.length > 0 && (
                        <div className="space-y-6">
                            {groupPredictionsByDate(predictions).map(({ date, predictions: datePredictions }) => (
                                <div key={date} className="space-y-3">
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="flex-grow border-t border-purple-500/30"></div>
                                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider px-3">
                                            {date}
                                        </span>
                                        <div className="flex-grow border-t border-purple-500/30"></div>
                                    </div>
                                    
                                    {/* Videos for this date */}
                                    <ul className="space-y-3">
                                        {datePredictions.map(pred => (
                                            <li
                                                key={pred.id}
                                                onClick={() => pred.status === 'completed' && pred.outputs.length > 0 && onSelectVideo(pred.outputs[0])}
                                                onMouseEnter={(e) => {
                                                    if (pred.status === 'completed' && pred.outputs.length > 0) {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const popupWidth = 400;
                                                        const popupHeight = 300;
                                                        const spacing = 20;
                                                        
                                                        // Calculate position to the left of sidebar
                                                        let x = rect.left - popupWidth - spacing;
                                                        let y = rect.top;
                                                        
                                                        // Ensure popup stays within viewport
                                                        if (x < 20) {
                                                            x = 20; // Minimum left margin
                                                        }
                                                        if (y + popupHeight > window.innerHeight - 20) {
                                                            y = window.innerHeight - popupHeight - 20; // Adjust if too low
                                                        }
                                                        if (y < 20) {
                                                            y = 20; // Minimum top margin
                                                        }
                                                        
                                                        setHoveredVideoUrl(pred.outputs[0]);
                                                        setHoverPosition({ x, y });
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredVideoUrl(null);
                                                    setHoverPosition(null);
                                                }}
                                                className={`glass p-3 rounded-xl transition-all relative ${
                                                    pred.status === 'completed' 
                                                        ? `cursor-pointer hover:border-purple-500 ${selectedIds.has(pred.id) ? 'border-purple-500 bg-purple-500/10' : ''}` 
                                                        : 'cursor-default'
                                                }`}
                                            >
                                                {/* Checkbox for selection */}
                                                {pred.status === 'completed' && pred.outputs.length > 0 && (
                                                    <div 
                                                        className="absolute top-2 left-2 z-10"
                                                        onClick={(e) => toggleSelection(pred.id, e)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                            selectedIds.has(pred.id)
                                                                ? 'bg-purple-600 border-purple-600'
                                                                : 'bg-gray-800/80 border-gray-600 hover:border-purple-500'
                                                        }`}>
                                                            {selectedIds.has(pred.id) && (
                                                                <i className="fas fa-check text-white text-xs"></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center text-gray-600">
                                                        {pred.status === 'completed' && pred.outputs.length > 0 ? (
                                                             <video src={pred.outputs[0]} className="w-full h-full object-cover rounded-lg" muted playsInline />
                                                        ) : (
                                                            <i className="fas fa-film text-2xl"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-semibold text-gray-300">Video Generation</p>
                                                            <StatusIndicator status={pred.status} />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(pred.created_at).toLocaleTimeString('en-US', { 
                                                                hour: '2-digit', 
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-600">
                    <p>Showing videos from the last 7 days.</p>
                </div>
                </div>
            </div>
            
            {/* Video Preview Popup */}
            {hoveredVideoUrl && hoverPosition && (
                <div 
                    className="fixed z-[70] pointer-events-none animate-in fade-in duration-200"
                    style={{
                        left: `${hoverPosition.x}px`,
                        top: `${hoverPosition.y}px`,
                        width: '400px'
                    }}
                >
                    <div className="glass rounded-xl p-4 border border-purple-500/30 shadow-lg neon-glow">
                        <video 
                            src={hoveredVideoUrl} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="w-full rounded-lg max-h-[300px] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorySidebar;