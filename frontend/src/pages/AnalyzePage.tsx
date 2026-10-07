import React, { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  Upload,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Eye,
  FileText,
  Layers,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import type { PredictionResponse, ExampleComplaint, AnalysisRecord } from '../types';
import { sendPrediction, getImageUrl } from '../api';
import { saveRecord } from '../storage';

interface AnalyzePageProps {
  examples: ExampleComplaint[];
  onAnalysisSaved: (record: AnalysisRecord) => void;
}

const ASPECT_ORDER = ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'];
const SEVERITY_ORDER = ['No Explicit Reproach', 'Disapproval', 'Accusation', 'Blame'];

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  examples,
  onAnalysisSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  const handleFile = (file: File | null) => {
    setErrorMessage(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or JPEG image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('The uploaded image exceeds the 10 MB maximum upload limit.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectExample = async (ex: ExampleComplaint) => {
    setText(ex.text);
    setErrorMessage(null);

    if (ex.image_filename) {
      try {
        const fullUrl = getImageUrl(ex.image_filename);
        const res = await fetch(fullUrl);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], ex.image_filename, { type: blob.type || 'image/jpeg' });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
        }
      } catch (err) {
        console.warn('Could not load example image:', err);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setErrorMessage('Please provide complaint text to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPrediction(null);

    try {
      const res = await sendPrediction(text.trim(), imageFile);
      setPrediction(res);

      const isMulti = res.mode === 'multimodal' || res.prediction_mode === 'multimodal';
      const newRecord: AnalysisRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        text: text.trim(),
        complaintText: text.trim(),
        imagePresent: isMulti,
        imageFileName: imageFile ? imageFile.name : undefined,
        imagePreviewUrl: imagePreview || undefined,
        aspectLabel: res.aspect.label,
        aspectConfidence: res.aspect.confidence,
        severityLabel: res.severity.label,
        severityConfidence: res.severity.confidence,
        aspectProbabilities: res.aspect.probabilities,
        severityProbabilities: res.severity.probabilities,
        mode: isMulti ? 'multimodal' : 'text-only',
        rawResponse: res,
      };

      saveRecord(newRecord);
      onAnalysisSaved(newRecord);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setErrorMessage('Request timed out. The model took longer than expected to respond.');
      } else if (err.response) {
        const detail = err.response.data?.detail;
        setErrorMessage(typeof detail === 'string' ? detail : `Server returned error (${err.response.status}).`);
      } else if (err.request) {
        setErrorMessage('Unable to reach ComFuse backend API. Ensure the backend is running.');
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isMultimodal = prediction?.mode === 'multimodal' || prediction?.prediction_mode === 'multimodal';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/60 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span>COMFUSE MULTIMODAL INTELLIGENCE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight">
          Customer Complaint <br className="hidden sm:inline" />
          Multimodal Triage & Classification
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto font-medium">
          Jointly analyze customer complaint text and visual screenshots to predict Aspect and Severity categories with high confidence.
        </p>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* LEFT COLUMN: Input Workspace */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="dribbble-card p-6 sm:p-7 space-y-6 bg-white">
            
            {/* Customer Complaint Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="complaint-text" className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Customer Complaint
                </label>
                <span className="text-[11px] font-mono font-medium text-purple-600">
                  {text.length} characters
                </span>
              </div>

              <textarea
                id="complaint-text"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe the customer's complaint (e.g. 'The latest update causes the app to crash continuously when attempting to stream...')"
                disabled={isLoading}
                className="w-full bg-purple-50/20 border border-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 resize-none transition outline-none font-sans"
              />
            </div>

            {/* Image Evidence Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Visual Evidence / Screenshot
                  </label>
                  <span className="text-[11px] text-zinc-400 font-normal">Optional</span>
                </div>
                {imageFile && (
                  <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    Multimodal Mode
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60'
                  }`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="h-10 w-10 rounded-2xl bg-white border border-purple-100 flex items-center justify-center mb-2.5 text-purple-600 shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-800">
                    Upload complaint screenshot
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                    Drag & drop or browse • PNG, JPG, JPEG (Max 10 MB)
                  </p>
                </div>
              ) : (
                <div className="border border-purple-100 rounded-2xl overflow-hidden bg-purple-50/20 p-2.5">
                  <div className="relative group max-h-48 flex items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
                    <img
                      src={imagePreview}
                      alt="Complaint evidence preview"
                      className="max-h-48 w-auto object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Remove image"
                      className="absolute top-2.5 right-2.5 bg-zinc-900/80 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-md transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 px-2 pb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate max-w-[220px] font-medium">
                      {imageFile ? imageFile.name : 'Sample Screenshot'}
                    </span>
                    {imageFile && (
                      <span className="font-mono">{(imageFile.size / 1024).toFixed(0)} KB</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Actions: Add Evidence + Analyze CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {!imagePreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-3 rounded-full border border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-xs font-bold text-zinc-700 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-purple-600" />
                  <span>Add Evidence</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!text.trim() || isLoading}
                className={`w-full flex-1 py-3.5 px-6 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  !text.trim() || isLoading
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#9333ea] to-[#7c3aed] text-white shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Analyzing text and visual evidence...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Complaint</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Quick Test Samples Chips */}
          {examples.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 px-1">
                Try a real test sample from benchmark
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {examples.slice(0, 4).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExample(ex)}
                    className="text-left p-3.5 rounded-2xl bg-white hover:bg-purple-50/70 border border-purple-100/80 hover:border-purple-300 text-xs transition-all shadow-sm flex flex-col justify-between gap-1.5 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-zinc-900 group-hover:text-purple-700 truncate max-w-[170px]">
                        {ex.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {ex.image_filename ? 'Img + Txt' : 'Text-Only'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">
                      {ex.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Results Workspace */}
        <div className="lg:col-span-5 space-y-6">
          
          {!prediction && !isLoading && (
            <div className="h-full min-h-[420px] dribbble-card bg-white border border-dashed border-purple-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-md">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Ready to Analyze</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Provide complaint text on the left and attach visual evidence to trigger multimodal neural classification.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[420px] dribbble-card bg-white p-8 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-3 border-purple-100 border-t-purple-600 animate-spin"></div>
                <Layers className="h-6 w-6 text-purple-600 absolute" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Neural Inference in Progress</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  DistilBERT is extracting linguistic tokens while ResNet-18 processes visual representations...
                </p>
              </div>
            </div>
          )}

          {prediction && !isLoading && (
            <div className="dribbble-card p-6 sm:p-7 bg-white space-y-6 animate-in fade-in duration-300">
              
              {/* Top Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-purple-50">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    Analysis Result
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isMultimodal
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {isMultimodal ? <Eye className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>{isMultimodal ? 'Multimodal' : 'Text-Only'}</span>
                </span>
              </div>

              {/* Major Prediction Cards: Aspect & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* ASPECT */}
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                    Predicted Aspect
                  </div>
                  <div className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span>{prediction.aspect.label}</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono pt-1">
                    Confidence: <strong className="text-purple-700">{(prediction.aspect.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                {/* SEVERITY */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                    Predicted Severity
                  </div>
                  <div className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-1.5">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    <span>{prediction.severity.label}</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono pt-1">
                    Confidence: <strong className="text-amber-700">{(prediction.severity.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

              </div>

              {/* Aspect Probability Bars */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                  <span>Aspect Probability Distribution</span>
                  <span className="text-[10px] text-zinc-400 font-mono">6 classes</span>
                </div>
                <div className="space-y-2 p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100/60">
                  {ASPECT_ORDER.map((cls) => {
                    const prob = prediction.aspect.probabilities?.[cls] ?? 0;
                    const pct = (prob * 100).toFixed(1);
                    const isTop = cls === prediction.aspect.label;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={isTop ? 'text-zinc-900 font-bold' : 'text-zinc-500'}>
                            {cls}
                          </span>
                          <span className={`font-mono ${isTop ? 'text-purple-700 font-bold' : 'text-zinc-400'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-purple-100/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop
                                ? 'bg-gradient-to-r from-purple-600 to-purple-400'
                                : 'bg-zinc-300'
                            }`}
                            style={{ width: `${Math.max(Number(pct), 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Severity Probability Bars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                  <span>Severity Probability Distribution</span>
                  <span className="text-[10px] text-zinc-400 font-mono">4 classes</span>
                </div>
                <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/30 border border-amber-100/60">
                  {SEVERITY_ORDER.map((cls) => {
                    const prob = prediction.severity.probabilities?.[cls] ?? 0;
                    const pct = (prob * 100).toFixed(1);
                    const isTop = cls === prediction.severity.label;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={isTop ? 'text-zinc-900 font-bold' : 'text-zinc-500'}>
                            {cls}
                          </span>
                          <span className={`font-mono ${isTop ? 'text-amber-700 font-bold' : 'text-zinc-400'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-amber-100/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop
                                ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                                : 'bg-zinc-300'
                            }`}
                            style={{ width: `${Math.max(Number(pct), 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Pipeline Flow */}
              <div className="pt-2 border-t border-purple-50 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Dual-Encoder Multimodal Pipeline
                </span>
                <div className="p-3 rounded-2xl bg-purple-50/30 border border-purple-100/60 text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-zinc-700 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      TEXT: DistilBERT (256-d)
                    </span>
                    <span className="text-zinc-400">+</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      IMAGE: ResNet-18 (256-d)
                    </span>
                  </div>

                  <div className="flex justify-center text-purple-400">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>

                  <div className="text-center font-mono font-bold py-1 rounded-xl bg-white border border-purple-100 text-purple-800 shadow-sm">
                    MULTIMODAL FUSION LAYER [512-d → 256-d Bottleneck]
                  </div>

                  <div className="flex justify-center text-purple-400">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-bold">
                    <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                      ASPECT HEAD (6)
                    </span>
                    <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                      SEVERITY HEAD (4)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
