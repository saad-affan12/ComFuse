import React from 'react';
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
  Layers
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Multimodal Ingestion',
      desc: 'Processes customer text transcripts alongside photographic defect evidence or screenshots.',
      tag: 'Text + Image Input'
    },
    {
      step: '02',
      title: 'Dual Feature Extraction',
      desc: 'DistilBERT extracts 768-d linguistic context; ResNet-18 extracts 512-d spatial convolutions.',
      tag: 'Parallel Backbones'
    },
    {
      step: '03',
      title: 'Symmetrical Bottleneck',
      desc: 'Equalizes both modalities into a shared 256-d space before synthesis with a fusion MLP.',
      tag: 'Late Bottleneck Fusion'
    },
    {
      step: '04',
      title: 'Multitask Triage & Routing',
      desc: 'Simultaneously predicts the grievance department (6 Aspects) and SLA urgency (4 Severity tiers).',
      tag: 'Sub-150ms Inference'
    }
  ];

  const techStack = [
    {
      category: 'Deep Learning Core',
      icon: Cpu,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      techs: ['PyTorch 2.2+', 'DistilBERT (66M params)', 'ResNet-18 (11M params)', 'Scikit-Learn']
    },
    {
      category: 'Inference Backend',
      icon: Server,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      techs: ['FastAPI Microservice', 'Uvicorn ASGI Runtime', 'Pydantic Schemas', 'Pillow (PIL)']
    },
    {
      category: 'Frontend Engineering',
      icon: Code2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      techs: ['React 19 & TypeScript', 'Vite 8 & Tailwind v4', 'Lucide React Icons', 'jsPDF Audit Export']
    },
    {
      category: 'Curated Benchmark',
      icon: Database,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      techs: ['HF NShreya/Comp4.0', '915 Curated Complaints', 'Zero Data Leakage Split', 'MD5 Deduplication']
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-100/90 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
              <span>ENTERPRISE COMPLAINT INTELLIGENCE</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Active: Port 8000 (CPU Engine)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            About ComFuse
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl font-medium">
            ComFuse is an automated multimodal customer intelligence platform designed to eliminate support ticket routing friction. By unifying linguistic contextual representations from <strong>DistilBERT</strong> with spatial visual feature maps from <strong>ResNet-18</strong>, ComFuse accurately classifies complaint domain and urgency in real-time.
          </p>

          {/* Metric Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Benchmark Dataset</span>
              <span className="text-sm font-extrabold text-zinc-900">915 Complaints</span>
              <span className="text-[10px] text-zinc-500 block">Comp4.0 Multi-Turn</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Aspect Macro-F1</span>
              <span className="text-sm font-extrabold text-emerald-600">0.3683 (+157%)</span>
              <span className="text-[10px] text-zinc-500 block">Held-out test set</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Dual Multitask</span>
              <span className="text-sm font-extrabold text-purple-700">6 Aspect • 4 Sev</span>
              <span className="text-[10px] text-zinc-500 block">Simultaneous Softmax</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Inference Latency</span>
              <span className="text-sm font-extrabold text-zinc-900">&lt; 150ms</span>
              <span className="text-[10px] text-zinc-500 block">Native CPU Execution</span>
            </div>
          </div>

        </div>
      </div>

      {/* Why Multimodal? The 3-Way Reality Comparison */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            The Core Value Proposition
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Why Single-Modality Classifiers Fail on Customer Complaints
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real customer disputes combine brief expressions (*"Look at this mess!"*) with attached photos or screenshots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1: Text-Only Flaw */}
          <div className="dribbble-card p-6 bg-white border border-rose-100 space-y-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 w-fit">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">1. Text-Only Blindspot</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Text classifiers cannot see physical parcel destruction, cracked screens, or software error dialogs. When customers write ambiguous text, pure NLP models hallucinate or guess majority classes.
            </p>
            <div className="pt-2 text-[11px] font-mono text-rose-700 font-semibold">
              Result: Low confidence & wrong department routing
            </div>
          </div>

          {/* Card 2: Vision-Only Flaw */}
          <div className="dribbble-card p-6 bg-white border border-amber-100 space-y-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 w-fit">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">2. Vision-Only Blindspot</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Computer vision backbones recognize pixels but cannot interpret customer account numbers, transaction claims, refund demands, or the emotional tone of voice necessary to assess dispute severity.
            </p>
            <div className="pt-2 text-[11px] font-mono text-amber-700 font-semibold">
              Result: Missing customer intent & urgency context
            </div>
          </div>

          {/* Card 3: ComFuse Multimodal Solution */}
          <div className="dribbble-card p-6 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 border border-purple-200/90 space-y-3 shadow-xs">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 w-fit">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">3. ComFuse Multimodal Synergy</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ComFuse fuses both modalities into a unified 256-d latent space. Visual evidence clarifies ambiguous words, while language semantics prioritize urgency and escalate severe claims immediately.
            </p>
            <div className="pt-2 text-[11px] font-mono text-purple-700 font-bold">
              Result: High-precision triage + priority SLA routing
            </div>
          </div>

        </div>
      </div>

      {/* System Pipeline 4-Step Cards */}
      <div className="dribbble-card p-6 sm:p-8 bg-white border border-zinc-200/80 space-y-6">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            End-to-End Workflow
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            System Ingestion & Triage Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step) => (
            <div key={step.step} className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/70 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-purple-600">STEP {step.step}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-600 font-semibold">
                  {step.tag}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900">{step.title}</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            Platform Technologies
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Engineering Ecosystem
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((stack) => {
            const Icon = stack.icon;
            return (
              <div key={stack.category} className="dribbble-card p-5 bg-white border border-zinc-200/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${stack.iconBg} ${stack.iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-900">{stack.category}</h3>
                </div>

                <div className="space-y-1.5 pt-1">
                  {stack.techs.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-[11px] font-mono text-zinc-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise Governance & SLA Escalation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
            <Lock className="h-4 w-4" />
            <span>Local Privacy & Zero Cloud Dependency</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            ComFuse runs completely self-contained on the local FastAPI ASGI runtime. Complaint transcripts and sensitive user screenshots are never transmitted to third-party cloud APIs.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Ephemeral tensor computation • No PII storage</span>
          </div>
        </div>

        <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <Clock className="h-4 w-4" />
            <span>Urgent Severity SLA Escalation</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Customer complaints classified as <strong className="text-zinc-900">Blame</strong> or <strong className="text-zinc-900">Accusation</strong> trigger automatic priority routing tags, allowing customer support teams to resolve critical escalations before SLA breach.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 pt-1">
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Sub-150ms real-time triage on CPU hardware</span>
          </div>
        </div>

      </div>

      {/* Live Checkpoint Telemetry Note */}
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
          <span>Active Checkpoint: <code className="font-mono text-purple-800 font-bold">models/best_multimodal_model.pt</code> (312.4 MB) served via FastAPI</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">FastAPI + React 19 Client</span>
      </div>

    </div>
  );
};
