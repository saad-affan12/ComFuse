import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { ComplaintInput } from './components/ComplaintInput';
import { PredictionResult } from './components/PredictionResult';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { ExampleCards } from './components/ExampleCards';
import { SessionHistory } from './components/SessionHistory';
import { AboutTab } from './components/AboutTab';
import type {
  HealthResponse,
  PredictionResponse,
  ExampleComplaint,
  HistoryItem,
} from './types';
import {
  fetchHealth,
  fetchExamples,
  sendPrediction,
  getImageUrl,
  API_BASE_URL,
} from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'architecture' | 'about'>('analyze');
  const [health, setHealth] = useState<HealthResponse>({
    status: 'loading',
    model: 'ComFuse',
    device: 'cpu',
  });

  const [text, setText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [examples, setExamples] = useState<ExampleComplaint[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 1. Periodic Health Check & Initial Load
  const checkHealth = useCallback(async () => {
    const res = await fetchHealth();
    setHealth(res);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // 2. Fetch Examples on Mount
  useEffect(() => {
    const loadExamples = async () => {
      const data = await fetchExamples();
      setExamples(data);
    };
    loadExamples();
  }, []);

  // 3. Select an Example
  const handleSelectExample = async (example: ExampleComplaint) => {
    setText(example.text);
    setErrorMessage(null);

    if (example.image_filename) {
      try {
        const fullUrl = getImageUrl(example.image_filename);
        const res = await fetch(fullUrl);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], example.image_filename, { type: blob.type || 'image/jpeg' });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(blob));
        } else {
          setImageFile(null);
          setImagePreview(null);
        }
      } catch (err) {
        console.warn('Failed to load example image blob:', err);
        setImageFile(null);
        setImagePreview(null);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // 4. Handle Analysis Submission
  const handleAnalyze = async () => {
    const cleanText = text.trim();
    if (!cleanText) {
      setErrorMessage('Please enter a complaint before analyzing.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await sendPrediction(cleanText, imageFile);
      setPrediction(res);

      // Prepend to in-memory session history (max 5)
      const newItem: HistoryItem = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        textSnippet: cleanText.length > 70 ? `${cleanText.substring(0, 70)}...` : cleanText,
        mode: res.prediction_mode,
        aspect: res.aspect.label,
        aspectConfidence: res.aspect.confidence,
        severity: res.severity.label,
        severityConfidence: res.severity.confidence,
        hasImage: Boolean(imageFile),
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 4)]);
    } catch (err: any) {
      console.error('Prediction API Error:', err);
      if (err.response) {
        const detail = err.response.data?.detail;
        if (typeof detail === 'string') {
          setErrorMessage(detail);
        } else {
          setErrorMessage('Failed to analyze complaint. Please check your input and try again.');
        }
      } else if (err.request) {
        setErrorMessage(
          'Unable to connect to ComFuse API. Make sure the backend is running on ' +
            API_BASE_URL
        );
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Navbar */}
      <Navbar
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'analyze' && (
          <div>
            <HeroHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              
              {/* TWO-COLUMN ANALYSIS WORKSPACE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Input Form (6 cols on lg) */}
                <div className="lg:col-span-6 space-y-6">
                  <ComplaintInput
                    text={text}
                    setText={setText}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                  />

                  {/* Try an Example */}
                  <ExampleCards
                    examples={examples}
                    onSelectExample={handleSelectExample}
                    isLoading={isLoading}
                  />
                </div>

                {/* Right Column: Prediction Results (6 cols on lg) */}
                <div className="lg:col-span-6 space-y-6">
                  <PredictionResult
                    prediction={prediction}
                    isLoading={isLoading}
                  />

                  {/* Expandable Architecture Diagram */}
                  <ArchitectureDiagram />
                </div>

              </div>

              {/* In-Memory Session History */}
              <div className="pt-4">
                <SessionHistory history={history} />
              </div>

            </div>
          </div>
        )}

        {activeTab === 'architecture' && <AboutTab tab="architecture" />}
        {activeTab === 'about' && <AboutTab tab="about" />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">COMFUSE</span>
            <span>•</span>
            <span>Multimodal Customer Complaint Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Frozen Checkpoint: <code className="text-slate-300 font-mono">best_multimodal_model.pt</code></span>
            <span>•</span>
            <span>FastAPI + React TypeScript</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
