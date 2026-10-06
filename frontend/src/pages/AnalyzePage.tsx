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
          setImagePreview(URL.createObjectURL(blob));
        } else {
          setImageFile(null);
          setImagePreview(null);
        }
      } catch (err) {
        console.warn('Failed to load example image:', err);
        setImageFile(null);
        setImagePreview(null);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

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
      if (!res || !res.aspect || !res.severity) {
        throw new Error('Malformed API response received.');
      }

      setPrediction(res);

      // Create and persist record in localStorage
      const newRecord: AnalysisRecord = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: cleanText,
        imagePresent: Boolean(imageFile),
        mode: res.mode || res.prediction_mode,
        aspectLabel: res.aspect.label,
        aspectConfidence: res.aspect.confidence,
        severityLabel: res.severity.label,
        severityConfidence: res.severity.confidence,
        aspectProbabilities: res.aspect.probabilities || {},
        severityProbabilities: res.severity.probabilities || {},
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
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>COMFUSE AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
          Multimodal Customer <br className="hidden sm:inline" />
          Complaint Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
          Analyze customer complaints using text and visual evidence. Jointly predicts complaint Aspect and Severity with calibrated deep learning.
        </p>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Workspace (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-[#0c0d16] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            
            {/* Customer Complaint Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="complaint-text" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Customer Complaint
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
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
                className="w-full bg-[#080910] border border-white/[0.07] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-400 resize-none transition-colors outline-none font-sans"
              />
            </div>

            {/* Image Evidence Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Image Evidence
                  </label>
                  <span className="text-[11px] text-zinc-400 font-normal">Optional</span>
                </div>
                {imageFile && (
                  <span className="text-[11px] text-cyan-400 font-medium">
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
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/[0.08] hover:border-white/[0.15] bg-[#080910]/70 hover:bg-[#080910]'
                  }`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-2 text-cyan-400">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-zinc-200">
                    Upload complaint image
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Drag & drop or browse • PNG, JPG, JPEG (Max 10 MB)
                  </p>
                </div>
              ) : (
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#080910] p-2">
                  <div className="relative group max-h-48 flex items-center justify-center overflow-hidden rounded-lg bg-black/60">
                    <img
                      src={imagePreview}
                      alt="Complaint evidence preview"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Remove image"
                      className="absolute top-2 right-2 bg-black/80 hover:bg-rose-900/90 text-zinc-300 hover:text-white p-1.5 rounded-lg border border-white/[0.1] transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 px-2 pb-1 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate max-w-[220px]">
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
              <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Actions: Add Evidence + Analyze CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {!imagePreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Add Evidence</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!text.trim() || isLoading}
                className={`w-full flex-1 py-3 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  !text.trim() || isLoading
                    ? 'bg-zinc-800/60 text-zinc-400 cursor-not-allowed border border-white/[0.05]'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20 active:scale-[0.99] border border-cyan-400/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
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
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                Try a test sample from dataset
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {examples.slice(0, 4).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExample(ex)}
                    className="text-left p-2.5 rounded-xl bg-[#0c0d16]/70 hover:bg-[#0c0d16] border border-white/[0.06] hover:border-indigo-500/40 text-xs transition-all flex flex-col justify-between gap-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-zinc-200 group-hover:text-cyan-300 truncate max-w-[170px]">
                        {ex.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400">
                        {ex.image_filename ? 'Img' : 'Txt'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {ex.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Results Workspace (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          
          {!prediction && !isLoading && (
            <div className="h-full min-h-[420px] bg-[#0c0d16]/60 border border-dashed border-white/[0.08] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-indigo-500/10">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">Ready to analyze</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Enter complaint text on the left and optionally attach visual evidence to run multimodal neural classification.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[420px] bg-[#0c0d16] border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin"></div>
                <Layers className="h-6 w-6 text-indigo-400 absolute" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Neural Inference in Progress</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  DistilBERT is extracting linguistic tokens while ResNet-18 processes visual representations...
                </p>
              </div>
            </div>
          )}

          {prediction && !isLoading && (
            <div className="bg-[#0c0d16] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
              
              {/* Top Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Analysis Complete
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isMultimodal
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                      : 'bg-zinc-800/60 text-zinc-300 border-white/[0.08]'
                  }`}
                >
                  {isMultimodal ? <Eye className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  <span>{isMultimodal ? 'Multimodal' : 'Text-Only'}</span>
                </span>
              </div>

              {/* Major Prediction Cards: Aspect & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* ASPECT */}
                <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Aspect
                  </div>
                  <div className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    <span>{prediction.aspect.label}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono pt-1">
                    Confidence: <strong className="text-cyan-300">{(prediction.aspect.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                {/* SEVERITY */}
                <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Severity
                  </div>
                  <div className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span>{prediction.severity.label}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono pt-1">
                    Confidence: <strong className="text-amber-300">{(prediction.severity.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

              </div>

              {/* Aspect Probability Bars */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Aspect Probability</span>
                  <span className="text-[10px] text-zinc-400 font-mono">6 classes</span>
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-[#080910] border border-white/[0.05]">
                  {ASPECT_ORDER.map((cls) => {
                    const prob = prediction.aspect.probabilities?.[cls] ?? 0;
                    const pct = (prob * 100).toFixed(1);
                    const isTop = cls === prediction.aspect.label;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={isTop ? 'text-white font-bold' : 'text-zinc-400'}>
                            {cls}
                          </span>
                          <span className={`font-mono ${isTop ? 'text-cyan-300 font-bold' : 'text-zinc-400'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop
                                ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                                : 'bg-zinc-700/40'
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
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Severity Probability</span>
                  <span className="text-[10px] text-zinc-400 font-mono">4 classes</span>
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-[#080910] border border-white/[0.05]">
                  {SEVERITY_ORDER.map((cls) => {
                    const prob = prediction.severity.probabilities?.[cls] ?? 0;
                    const pct = (prob * 100).toFixed(1);
                    const isTop = cls === prediction.severity.label;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={isTop ? 'text-white font-bold' : 'text-zinc-400'}>
                            {cls}
                          </span>
                          <span className={`font-mono ${isTop ? 'text-amber-300 font-bold' : 'text-zinc-400'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop
                                ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                                : 'bg-zinc-700/40'
                            }`}
                            style={{ width: `${Math.max(Number(pct), 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Pipeline Flow (Actual Architecture) */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Model Pipeline Architecture
                </span>
                <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.05] text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-zinc-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      TEXT: DistilBERT (256-d)
                    </span>
                    <span className="text-zinc-400">+</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      IMAGE: ResNet-18 (256-d)
                    </span>
                  </div>

                  <div className="flex justify-center text-zinc-400">
                    <ArrowDown className="h-3 w-3" />
                  </div>

                  <div className="text-center font-mono py-1 rounded bg-white/[0.03] text-zinc-200">
                    FEATURE FUSION [512-d Fused MLP]
                  </div>

                  <div className="flex justify-center text-zinc-400">
                    <ArrowDown className="h-3 w-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                    <span className="p-1 rounded bg-indigo-950/40 text-indigo-200 border border-indigo-800/40">
                      ASPECT (6)
                    </span>
                    <span className="p-1 rounded bg-amber-950/40 text-amber-200 border border-amber-800/40">
                      SEVERITY (4)
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
