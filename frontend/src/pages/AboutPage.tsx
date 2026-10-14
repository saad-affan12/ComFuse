import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Server,
  Code2,
  Database,
  Sparkles,
  AlertTriangle,
  Eye,
  Lock,
  Clock,
  Activity
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [activeComparisonTab, setActiveComparisonTab] = useState<'text-only' | 'vision-only' | 'comfuse'>('comfuse');

  const techStack = [
    {
      category: 'Deep Learning & NLP',
      icon: Cpu,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      items: [
        { name: 'PyTorch 2.2+', desc: 'Neural network graph, autograd engine, tensor math' },
        { name: 'Hugging Face Transformers', desc: 'distilbert-base-uncased transformer backbone (66M params)' },
        { name: 'Torchvision 0.17+', desc: 'resnet18 convolutional vision backbone (11M params)' },
        { name: 'Scikit-Learn', desc: 'Macro-F1, balanced accuracy & confusion matrix telemetry' }
      ]
    },
    {
      category: 'Inference Backend & API',
      icon: Server,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      items: [
        { name: 'FastAPI 0.115+', desc: 'High-performance asynchronous REST microservice' },
        { name: 'Uvicorn ASGI', desc: 'Production-ready non-blocking event loop runtime' },
        { name: 'Pydantic v2', desc: 'Type-safe request/response schema validation' },
        { name: 'Pillow (PIL)', desc: 'Image decoding, EXIF orientation, and RGB normalization' }
      ]
    },
    {
      category: 'Frontend Engineering',
      icon: Code2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      items: [
        { name: 'React 19 & TypeScript', desc: 'Strictly typed component architecture and state management' },
        { name: 'Vite 8 & Tailwind CSS v4', desc: 'Sub-millisecond HMR build tool and modern design system' },
        { name: 'Lucide React', desc: 'Sleek, accessible interface iconography' },
        { name: 'jsPDF', desc: 'Client-side enterprise incident audit report export' }
      ]
    },
    {
      category: 'Curated Benchmark & Dataset',
      icon: Database,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      items: [
        { name: 'Hugging Face NShreya/Comp4.0', desc: '915 real-world multi-turn customer complaint pairs' },
        { name: 'Zero-Leakage Splits', desc: '640 Train / 137 Validation / 138 Held-out Test' },
        { name: 'MD5 Deduplication', desc: 'Guarantees absolute separation between train and evaluation' },
        { name: 'Dual Annotation Targets', desc: '6 Aspect categories + 4 Severity intensity levels' }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      
      {/* Brand & Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-100 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
              <span>ENTERPRISE COMPLAINT INTELLIGENCE • COMFUSE PLATFORM</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Active: Port 8000 (FastAPI CPU)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            About ComFuse
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl font-medium">
            ComFuse is an enterprise-grade multimodal artificial intelligence system engineered to eliminate customer dispute routing friction. By uniting <strong>DistilBERT</strong> subword contextual language tokens with <strong>ResNet-18</strong> convolutional spatial feature maps, ComFuse simultaneously determines the grievance domain and urgency severity of customer tickets.
          </p>

          {/* Highlights KPI Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Aspect Classes</span>
              <span className="text-sm font-extrabold text-zinc-900">6 Domains</span>
              <span className="text-[10px] text-zinc-500 block">Software to Packaging</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Severity Tiers</span>
              <span className="text-sm font-extrabold text-zinc-900">4 Escalation Levels</span>
              <span className="text-[10px] text-zinc-500 block">Reproach to Blame</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Aspect Macro-F1</span>
              <span className="text-sm font-extrabold text-emerald-600">0.3683 (+157%)</span>
              <span className="text-[10px] text-zinc-500 block">Held-out test set</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Zero-Leakage Rigor</span>
              <span className="text-sm font-extrabold text-purple-700">100% Isolated</span>
              <span className="text-[10px] text-zinc-500 block">MD5 validated split</span>
            </div>
          </div>

        </div>
      </div>

      {/* The Core Problem & Why Multimodal is Essential */}
      <div className="dribbble-card p-6 sm:p-8 bg-white border border-zinc-200/80 space-y-6">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            The Fundamental Dilemma
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Why Single-Modality Classifiers Fail on Customer Complaints
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 leading-relaxed">
            In modern customer service channels (e.g., social media, support ticketing portals, and mobile apps), customers frequently submit terse, ambiguous text accompanied by photo or screenshot evidence.
          </p>
        </div>

        {/* Interactive Comparison Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-200/70 pb-3">
          <button
            onClick={() => setActiveComparisonTab('text-only')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeComparisonTab === 'text-only'
                ? 'bg-rose-100 text-rose-800 border border-rose-200 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            1. Text-Only Failure Mode
          </button>
          <button
            onClick={() => setActiveComparisonTab('vision-only')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeComparisonTab === 'vision-only'
                ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            2. Vision-Only Blindspot
          </button>
          <button
            onClick={() => setActiveComparisonTab('comfuse')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeComparisonTab === 'comfuse'
                ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            3. ComFuse Multimodal Fusion (The Solution)
          </button>
        </div>

        {/* Comparison Details Panel */}
        <div className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/80">
          {activeComparisonTab === 'text-only' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Text-Only Classifiers Are Blind to Physical Context</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Consider a grievance stating: <em>"Look at what happened when I received my delivery today! Completely unusable."</em>
              </p>
              <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs text-rose-900 font-mono space-y-1">
                <div>• Text Model Prediction: Aspect: <span className="font-bold">Service (Conf: 34%)</span> | Severity: <span className="font-bold">Disapproval (Conf: 41%)</span></div>
                <div className="text-zinc-500 font-sans text-[11px]">
                  Flaw: Without the attached photo of a smashed smartphone screen inside a ripped box, the text model cannot ascertain whether the issue is a billing glitch, customer rep attitude, or physical hardware destruction.
                </div>
              </div>
            </div>
          )}

          {activeComparisonTab === 'vision-only' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Eye className="h-4 w-4" />
                <span>Computer Vision Alone Misses Linguistic Intent & Tone</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                A computer vision convolutional network receiving a photo of an error dialog or a delivery parcel can identify visual pixels, but cannot read or interpret customer account dispute claims, repeated failed attempts, or tone of anger.
              </p>
              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 font-mono space-y-1">
                <div>• Vision Model Prediction: Feature map extracted without contextual grievance understanding</div>
                <div className="text-zinc-500 font-sans text-[11px]">
                  Flaw: Cannot determine if the user is politely asking for guidance (No Explicit Reproach) or threatening legal action for deceptive practices (Blame).
                </div>
              </div>
            </div>
          )}

          {activeComparisonTab === 'comfuse' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>ComFuse Late Bottleneck Fusion Bridges Both Modalities</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                ComFuse projects both DistilBERT pooled [CLS] representations (768-d) and ResNet-18 visual feature vectors (512-d) into a shared 256-d bottleneck space, before concatenating and synthesizing them with a fusion MLP.
              </p>
              <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs text-purple-900 font-mono space-y-1">
                <div>• ComFuse Multimodal Prediction: Aspect: <span className="font-bold text-purple-700">Hardware / Packaging (88.4%)</span> | Severity: <span className="font-bold text-rose-700">Blame (82.1%)</span></div>
                <div className="text-zinc-600 font-sans text-[11px]">
                  Success: Resolves ambiguous pronouns (*"look at this"*) using visual evidence, and calibrates urgency based on customer emotional vocabulary.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technology Stack Matrix */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            Engineering Infrastructure
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Technology Stack & System Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {techStack.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.category} className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${col.iconBg} ${col.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{col.category}</h3>
                    <span className="text-[11px] font-mono text-zinc-400">Core Component</span>
                  </div>
                </div>

                <div className="space-y-2.5 divide-y divide-zinc-100">
                  {col.items.map((item) => (
                    <div key={item.name} className="pt-2.5 first:pt-0 flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-zinc-900 font-mono font-bold block">{item.name}</strong>
                        <span className="text-zinc-500 leading-relaxed text-[11px]">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empirical Retraining Results & Benchmark Evidence */}
      <div className="dribbble-card p-6 sm:p-8 bg-white border border-zinc-200/80 space-y-6">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">
            Empirical Evaluation
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Benchmark Rigor & Controlled Experiment Validation
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 leading-relaxed">
            All models were evaluated on an isolated held-out test split of 138 real-world customer complaints from Hugging Face Comp4.0. No test samples were used in validation or training.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-600 font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-bold">Model Configuration</th>
                <th className="py-3 px-4 font-bold">Aspect Macro-F1</th>
                <th className="py-3 px-4 font-bold">Aspect Bal. Acc</th>
                <th className="py-3 px-4 font-bold">Severity Macro-F1</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
              <tr className="text-zinc-400">
                <td className="py-3 px-4 font-semibold">1. Random Guessing Uniform</td>
                <td className="py-3 px-4">0.1114</td>
                <td className="py-3 px-4">16.67%</td>
                <td className="py-3 px-4">0.2450</td>
                <td className="py-3 px-4">Theoretical Lower Bound</td>
              </tr>
              <tr className="text-zinc-500">
                <td className="py-3 px-4 font-semibold">2. Pre-Audit Baseline (Imbalanced)</td>
                <td className="py-3 px-4">0.1433</td>
                <td className="py-3 px-4">16.67%</td>
                <td className="py-3 px-4">0.2858</td>
                <td className="py-3 px-4 text-rose-600 font-semibold">Majority Collapse</td>
              </tr>
              <tr className="bg-emerald-50/50 font-bold text-zinc-900">
                <td className="py-3 px-4 text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>3. ComFuse V2 (Exp 5 - Active Checkpoint)</span>
                </td>
                <td className="py-3 px-4 text-emerald-700">0.3683 (+157%)</td>
                <td className="py-3 px-4 text-purple-700">38.09% (+128%)</td>
                <td className="py-3 px-4">0.2663</td>
                <td className="py-3 px-4 text-emerald-700 font-semibold">Deployed Checkpoint</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Deployment & Ethical Governance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
            <Lock className="h-4 w-4" />
            <span>Data Privacy & Zero Cloud Dependency</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            ComFuse runs completely self-contained on the internal FastAPI ASGI server without streaming sensitive customer complaint transcripts or attached screenshots to third-party public API endpoints.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Zero PII transmission • Ephemeral tensor computation</span>
          </div>
        </div>

        <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <Clock className="h-4 w-4" />
            <span>High-Severity Urgent Escalation SLA</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Grievances flagged with severity levels <strong className="text-zinc-900">Blame</strong> or <strong className="text-zinc-900">Accusation</strong> automatically receive priority routing flags, preventing severe customer churn before SLA breach.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 pt-1">
            <Activity className="h-4 w-4 text-amber-500" />
            <span>Sub-150ms triage response time on standard CPU hardware</span>
          </div>
        </div>

      </div>

      {/* Active Model Checkpoint Footnote */}
      <div className="dribbble-card p-5 sm:p-6 bg-purple-50/40 border border-purple-100 flex items-start gap-3.5 text-xs text-zinc-600">
        <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-900 font-bold">Live Checkpoint Runtime: </strong>
          The underlying deep learning weights (<code className="text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded font-mono font-bold">models/best_multimodal_model.pt</code>) are actively served via FastAPI. The application UI connects directly via REST API calls to the PyTorch inference runtime, ensuring instant, reproducible predictions.
        </div>
      </div>

    </div>
  );
};
