import axios from 'axios';
import type { HealthResponse, PredictionResponse, ExampleComplaint } from './types';

// Strip any trailing slash from VITE_API_URL
// Defaults to '/api' in production (Vercel multi-service rewrite), or 'http://localhost:8000' in local dev
const rawBase = import.meta.env.VITE_API_URL;
export const API_BASE_URL = rawBase
  ? rawBase.replace(/\/+$/, '')
  : (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds for cold-start CPU inferences
});

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await client.get<HealthResponse>('/health');
    return res.data;
  } catch {
    return {
      status: 'offline',
      service: 'comfuse-api',
      model: 'ComFuse',
      device: 'unknown'
    };
  }
}

export async function fetchExamples(): Promise<ExampleComplaint[]> {
  try {
    const res = await client.get<{ examples: ExampleComplaint[] }>('/examples');
    return res.data.examples;
  } catch (err) {
    console.warn('Failed to load examples from backend:', err);
    return [];
  }
}

export async function sendPrediction(
  text: string,
  imageFile?: File | null
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('text', text);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const res = await client.post<PredictionResponse>('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

export function getImageUrl(filename: string): string {
  return `${API_BASE_URL}/assets/demo_images/${filename}`;
}
