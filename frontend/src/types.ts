export interface ProbabilityDistribution {
  [label: string]: number;
}

export interface PredictionHeadResult {
  label: string;
  confidence: number;
  probabilities: ProbabilityDistribution;
}

export interface PredictionResponse {
  success: boolean;
  prediction_mode: 'multimodal' | 'text-only';
  aspect: PredictionHeadResult;
  severity: PredictionHeadResult;
  metadata?: {
    text_length: number;
    has_image: boolean;
    explanation?: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'loading' | 'offline';
  model: string;
  device: string;
}

export interface ExampleComplaint {
  id: string;
  title: string;
  text: string;
  image_filename: string | null;
  aspect: string;
  severity: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  textSnippet: string;
  mode: 'multimodal' | 'text-only';
  aspect: string;
  aspectConfidence: number;
  severity: string;
  severityConfidence: number;
  hasImage: boolean;
}
