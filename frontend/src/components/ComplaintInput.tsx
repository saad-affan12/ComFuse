import React, { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Upload, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ComplaintInputProps {
  text: string;
  setText: (val: string) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const ComplaintInput: React.FC<ComplaintInputProps> = ({
  text,
  setText,
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  onAnalyze,
  isLoading,
  errorMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Check MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Please upload a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    // Check size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Image exceeds the 10 MB maximum upload limit.');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isTextEmpty = text.trim().length === 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl shadow-slate-950/40">
      
      {/* Textarea Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="complaint-text" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>Customer Complaint</span>
            <span className="text-rose-400 text-xs font-normal">*required</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">
            {text.length} chars
          </span>
        </div>
        
        <textarea
          id="complaint-text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the customer's complaint (e.g. 'The latest update causes the app to freeze continuously when attempting to stream...')"
          disabled={isLoading}
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 resize-none transition-colors outline-none font-sans"
        />
      </div>

      {/* Image Evidence Upload Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>Image Evidence</span>
            <span className="text-slate-400 text-xs font-normal">(optional screenshot/photo)</span>
          </label>
          {imageFile && (
            <span className="text-xs text-indigo-400 font-medium">
              Multimodal mode active
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="complaint-image"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />

        {!imagePreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2.5 text-indigo-400">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Upload complaint image
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Drag & drop or browse
            </p>
            <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
              PNG / JPG / JPEG
            </div>
          </div>
        ) : (
          <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-2">
            <div className="relative group max-h-56 flex items-center justify-center overflow-hidden rounded-lg bg-black/40">
              <img
                src={imagePreview}
                alt="Complaint evidence preview"
                className="max-h-56 w-auto object-contain rounded"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                title="Remove image"
                className="absolute top-2 right-2 bg-slate-900/90 hover:bg-rose-900/90 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 transition-colors shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 px-2 pb-1 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[220px]">
                {imageFile ? imageFile.name : 'Sample Screenshot'}
              </span>
              {imageFile && (
                <span>{(imageFile.size / 1024).toFixed(0)} KB</span>
              )}
            </div>
          </div>
        )}

        {/* Local File Error Alert */}
        {fileError && (
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="rounded-xl bg-rose-950/30 border border-rose-900/50 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Analyze Complaint Primary Button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isTextEmpty || isLoading}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
          isTextEmpty || isLoading
            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 hover:shadow-indigo-500/35 border border-indigo-400/30 active:scale-[0.99]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
            <span>Analyzing text and visual evidence...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-indigo-200" />
            <span>Analyze Complaint</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Powered by frozen PyTorch DistilBERT + ResNet-18 feature fusion.
      </p>

    </div>
  );
};
