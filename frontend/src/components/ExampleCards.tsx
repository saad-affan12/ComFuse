import React from 'react';
import { Sparkles, Image as ImageIcon, FileText } from 'lucide-react';
import type { ExampleComplaint } from '../types';

interface ExampleCardsProps {
  examples: ExampleComplaint[];
  onSelectExample: (example: ExampleComplaint) => void;
  isLoading: boolean;
}

export const ExampleCards: React.FC<ExampleCardsProps> = ({
  examples,
  onSelectExample,
  isLoading,
}) => {
  if (examples.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Try an example from test dataset</span>
        </h3>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Click any card to load test case
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {examples.map((item) => {
          const hasImage = Boolean(item.image_filename);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectExample(item)}
              className="text-left bg-slate-900/60 hover:bg-slate-800/80 disabled:opacity-50 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-3 transition-all duration-150 flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                      hasImage
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {hasImage ? (
                      <>
                        <ImageIcon className="h-2.5 w-2.5" />
                        Image
                      </>
                    ) : (
                      <>
                        <FileText className="h-2.5 w-2.5" />
                        Text
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.text}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                <span>Ground: {item.aspect}</span>
                <span>•</span>
                <span>{item.severity}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
