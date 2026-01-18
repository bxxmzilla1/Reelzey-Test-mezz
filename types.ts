
export interface AnalysisResult {
  stagePrompt: string;
}

export interface FileData {
  file: File;
  preview: string;
  base64: string;
}

export interface Prediction {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  outputs: string[];
  error: string | null;
  model: string;
}

export interface PredictionResponse {
  code: number;
  message: string;
  data: {
    page: number;
    items: Prediction[];
  };
}

export interface KiePrediction {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  outputs: string[];
  error: string | null;
  model: string;
  taskId?: string;
  prompt?: string;
  resolution?: string;
  fallbackFlag?: boolean;
}
