import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Merge,
  CheckCircle2,
  ShieldAlert,
  Binary,
  Sparkles,
  Zap,
  Split,
  Sliders,
  Code2,
  TrendingUp,
  Workflow,
  Check,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

interface StageNode {
  id: string;
  stageNumber: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  inputShape: string;
  outputShape: string;
  description: string;
  details: string[];
  codeSnippet: string;
  formula?: string;
  badge?: string;
}

const STAGES: StageNode[] = [
  {
    id: 'stage-1-text',
    stageNumber: '01A',
    title: 'Text Tokenization & Transformer Encoder',
    subtitle: 'Contextual WordPiece Tokenizer & DistilBERT Backbone',
    tag: 'LINGUISTIC PIPELINE',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
    inputShape: 'Raw text string (up to 128 tokens)',
    outputShape: 'Tensor [B, 768] (Pooled [CLS] token)',
    description:
      'Customer grievance text is cleaned, normalized, and converted into subword tokens using the WordPiece algorithm. Sequences are padded or truncated to a max length of 128 tokens. DistilBERT processes the sequence through 6 transformer layers with 12 multi-head attention blocks.',
    details: [
      'Model: distilbert-base-uncased (66M parameters)',
      'Captures bidirectional contextual grievance semantics and customer tone',
      'Pooled [CLS] token embedding extracted at index 0 for sequence-level representation',
      'Generates a dense 768-dimensional contextual vector per sample'
    ],
    codeSnippet: `# Text Forward Pass
text_tokens = tokenizer(
    texts, padding=True, truncation=True, max_length=128, return_tensors='pt'
)
bert_out = distilbert(**text_tokens)
# Extract [CLS] token embedding at position 0
text_features = bert_out.last_hidden_state[:, 0, :]  # Shape: [B, 768]`
  },
  {
    id: 'stage-1-image',
    stageNumber: '01B',
    title: 'Computer Vision Convolutional Backbone',
    subtitle: 'ImageNet-Pretrained ResNet-18 with Zero-Vector Fallback',
    tag: 'VISUAL PIPELINE',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: ImageIcon,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
    inputShape: 'Image file or Tensor [B, 3, 224, 224]',
    outputShape: 'Tensor [B, 512] (Conv feature vector)',
    description:
      'Customer evidence screenshots, product defect photos, or error screens are resized, center-cropped to 224×224 pixels, and normalized with ImageNet mean and standard deviation. A 18-layer residual network extracts deep spatial defect representations.',
    details: [
      'Model: ResNet-18 convolutional backbone (11M parameters)',
      'Residual skip connections preserve gradient flow and high-frequency edge details',
      'Adaptive Average Pooling flattens 2D feature maps to a 512-d vector',
      'Missing image fallback: Generates a zero-tensor [B, 3, 224, 224], enabling seamless text-only inference without runtime crashes'
    ],
    codeSnippet: `# Vision Forward Pass
if image is not None:
    img_tensor = transform(image)  # [3, 224, 224]
else:
    img_tensor = torch.zeros(3, 224, 224)  # Zero-vector imputation fallback

# Pass through ResNet-18 without final classification FC
resnet_features = resnet18_backbone(img_tensor)  # Shape: [B, 512]`
  },
  {
    id: 'stage-2-projection',
    stageNumber: '02',
    title: 'Symmetrical Bottleneck Projections',
    subtitle: 'Latent Space Equalization & Regularization',
    tag: 'DIMENSION BALANCING',
    tagColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Sliders,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200',
    inputShape: 'Text: [B, 768] | Vision: [B, 512]',
    outputShape: 'Text Proj: [B, 256] | Vision Proj: [B, 256]',
    description:
      'Because text features (768-d) outnumber vision features (512-d) by 50%, unprojected concatenation causes text modality bias. ComFuse projects both modalities through independent linear projections into an identical 256-dimensional latent space.',
    details: [
      'Text Projection: Linear(768 → 256) → LayerNorm → ReLU → Dropout(0.20)',
      'Vision Projection: Linear(512 → 256) → LayerNorm → ReLU → Dropout(0.20)',
      'LayerNorm stabilizes gradient magnitudes across disparate pre-trained weight distributions',
      'Dropout prevents modality co-adaptation and forces generalizable cross-modal features'
    ],
    codeSnippet: `# Symmetrical Bottleneck Projection
text_proj = self.text_projector(text_features)    # [B, 768] -> [B, 256]
image_proj = self.image_projector(vision_features) # [B, 512] -> [B, 256]

# Linear -> LayerNorm -> ReLU -> Dropout(0.20)
z_text = self.text_proj_norm(text_proj)
z_image = self.image_proj_norm(image_proj)`,
    formula: 'z_t = \\text{LayerNorm}(\\text{ReLU}(\\mathbf{W}_t \\mathbf{x}_t + \\mathbf{b}_t)), \\quad z_v = \\text{LayerNorm}(\\text{ReLU}(\\mathbf{W}_v \\mathbf{x}_v + \\mathbf{b}_v))'
  },
  {
    id: 'stage-3-fusion',
    stageNumber: '03',
    title: 'Late Multimodal Concatenation & Fusion MLP',
    subtitle: 'Cross-Modal Synergy & Joint Latent Embedding',
    tag: 'MULTIMODAL FUSION CORE',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Merge,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
    inputShape: 'Concatenated Tensor [B, 512] (256 text + 256 vision)',
    outputShape: 'Joint Latent Vector [B, 256]',
    description:
      'The projected text and visual representations are concatenated along the feature dimension into a 512-d unified vector. A Multilayer Perceptron (MLP) compresses and fuses the modalities into a joint representation vector that encodes cross-modal interactions.',
    details: [
      'Late fusion architecture preserves unimodal semantic richness prior to synthesis',
      'Concatenation: torch.cat([z_text, z_image], dim=1) yields [B, 512]',
      'Fusion Layer: Linear(512 → 256) with LayerNorm, non-linear activation (ReLU), and Dropout(0.25)',
      'Enables the model to correlate specific words (e.g., "shattered") with visual evidence (e.g., fractured glass)'
    ],
    codeSnippet: `# Late Multimodal Fusion
fused_raw = torch.cat([z_text, z_image], dim=1)  # Shape: [B, 512]
joint_rep = self.fusion_mlp(fused_raw)          # Shape: [B, 256]

# Linear(512, 256) -> LayerNorm -> ReLU -> Dropout(0.25)
fused_embedding = self.fusion_dropout(F.relu(self.fusion_norm(self.fusion_linear(fused_raw))))`,
    formula: '\\mathbf{z}_{\\text{fused}} = \\text{Dropout}\\big(\\text{ReLU}(\\text{LayerNorm}(\\mathbf{W}_f [\\mathbf{z}_t \\, \\| \\, \\mathbf{z}_v] + \\mathbf{b}_f))\\big)'
  },
  {
    id: 'stage-4-heads',
    stageNumber: '04',
    title: 'Dual Multitask Classification Heads',
    subtitle: 'Simultaneous Aspect & Severity Prediction',
    tag: 'MULTITASK HEADS',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Split,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200',
    inputShape: 'Joint Latent Vector [B, 256]',
    outputShape: 'Aspect Logits [B, 6] & Severity Logits [B, 4]',
    description:
      'Rather than running two separate models, ComFuse branches the fused 256-d latent embedding into two task-specialized linear classification heads. Both heads share the underlying multimodal representations, improving generalization and reducing inference latency.',
    details: [
      'Aspect Head: Linear(256 → 6) predicts among Software, Hardware, Quality, Service, Price, Packaging',
      'Severity Head: Linear(256 → 4) predicts among No Explicit Reproach, Disapproval, Accusation, Blame',
      'Independent Softmax functions convert raw logits into well-calibrated confidence probabilities',
      'End-to-end CPU inference executes in under 150 milliseconds'
    ],
    codeSnippet: `# Multitask Prediction Heads
aspect_logits = self.aspect_classifier(joint_rep)    # [B, 6]
severity_logits = self.severity_classifier(joint_rep) # [B, 4]

# Softmax calibrated probabilities
aspect_probs = F.softmax(aspect_logits, dim=-1)
severity_probs = F.softmax(severity_logits, dim=-1)`
  },
  {
    id: 'stage-5-loss',
    stageNumber: '05',
    title: 'Rebalanced Multitask Optimization Engine',
    subtitle: 'Joint Sample Weighting & Label Smoothing',
    tag: 'TRAINING & REGULARIZATION',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: TrendingUp,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200',
    inputShape: 'Ground Truth Labels [y_aspect, y_severity]',
    outputShape: 'Scalar Loss L_total',
    description:
      'In real customer datasets like Comp4.0, Software comprises 75.7% of complaints while Packaging comprises only 1.0%. Without rebalancing, standard Cross-Entropy collapses into predicting only majority classes. ComFuse employs smoothed class weights and multitask loss balancing.',
    details: [
      'Joint Sample Weight: w_i = sqrt(w_aspect) * sqrt(w_severity) prevents gradient starvation on rare classes',
      'Multitask Loss: L_total = L_aspect + 1.2 * L_severity (calibrates task gradient magnitudes)',
      'Label Smoothing (alpha = 0.05) prevents over-confidence and sharp decision boundaries',
      'Empirical Validation: Exp 5 achieved a +157% Macro-F1 improvement (0.1433 → 0.3683) on held-out test data'
    ],
    codeSnippet: `# Balanced Multitask Loss Engine
loss_aspect = F.cross_entropy(
    aspect_logits, target_aspect, weight=smoothed_aspect_weights, label_smoothing=0.05
)
loss_severity = F.cross_entropy(
    severity_logits, target_severity, weight=smoothed_severity_weights, label_smoothing=0.05
)

# Multitask loss combination with severity priority coefficient
total_loss = loss_aspect + 1.2 * loss_severity`,
    formula: '\\mathcal{L}_{\\text{total}} = \\mathcal{L}_{\\text{aspect}}(\\mathbf{y}_a, \\hat{\\mathbf{y}}_a; \\mathbf{w}_a) + 1.2 \\cdot \\mathcal{L}_{\\text{severity}}(\\mathbf{y}_s, \\hat{\\mathbf{y}}_s; \\mathbf{w}_s)'
  }
];

export const HowItWorksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'dimensions' | 'rebalancing'>('architecture');
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-1-text');
  const [simulatedImageAttached, setSimulatedImageAttached] = useState<boolean>(true);
  const [copiedStageId, setCopiedStageId] = useState<string | null>(null);

  const selectedStage = STAGES.find((s) => s.id === selectedStageId) || STAGES[0];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedStageId(id);
    setTimeout(() => setCopiedStageId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-100 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>NEURAL MULTIMODAL ARCHITECTURE • V2 PRODUCTION CHECKPOINT</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            How ComFuse Works
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl font-medium">
            ComFuse resolves customer grievance ambiguity by fusing linguistic transformer embeddings from 
            <strong className="text-purple-700 font-semibold"> DistilBERT </strong> 
            with spatial defect representations from 
            <strong className="text-emerald-700 font-semibold"> ResNet-18 </strong>. 
            Through symmetrical bottleneck projections and balanced multitask loss formulation, it concurrently classifies complaint aspect and urgency severity in real-time.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Backbone Models</span>
              <span className="text-xs font-bold text-zinc-900">DistilBERT + ResNet-18</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Fusion Method</span>
              <span className="text-xs font-bold text-purple-700">Late Bottleneck MLP (256-d)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Prediction Heads</span>
              <span className="text-xs font-bold text-zinc-900">Dual Multitask (6 Aspect, 4 Sev)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Inference Latency</span>
              <span className="text-xs font-bold text-emerald-600">~115ms (CPU Native)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-white text-purple-700 font-bold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>Interactive Architecture Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('dimensions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dimensions'
                ? 'bg-white text-purple-700 font-bold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Binary className="h-3.5 w-3.5" />
            <span>Tensor Shape Trace</span>
          </button>

          <button
            onClick={() => setActiveTab('rebalancing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rebalancing'
                ? 'bg-white text-purple-700 font-bold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Loss & Rebalancing Engine</span>
          </button>
        </div>

        {/* Dynamic Simulation Switch */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-purple-100 text-xs font-mono shadow-2xs">
          <span className="text-zinc-500 text-[11px] font-sans">Simulate Modality:</span>
          <button
            onClick={() => setSimulatedImageAttached(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              simulatedImageAttached
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Text + Image
          </button>
          <button
            onClick={() => setSimulatedImageAttached(false)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              !simulatedImageAttached
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Text-Only (Zero Imputation)
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE ARCHITECTURE FLOW */}
      {activeTab === 'architecture' && (
        <div className="space-y-8">
          
          {/* Main Visual Flow Diagram Canvas */}
          <div className="dribbble-card p-6 sm:p-8 bg-white border border-zinc-200/80 space-y-8 relative overflow-hidden">
            
            {/* Diagram Background Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 space-y-8">
              
              {/* STAGE 1: DUAL INPUT MODALITIES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider">
                  <span>Level 01 • Raw Multimodal Inputs</span>
                  <span className="text-purple-600 font-bold">Parallel Dual Encoders</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Text Input Node */}
                  <div
                    onClick={() => setSelectedStageId('stage-1-text')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                      selectedStageId === 'stage-1-text'
                        ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-400/30 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-purple-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-purple-700 block">STAGE 01A • TEXT</span>
                          <h3 className="text-sm font-bold text-zinc-900">DistilBERT Transformer</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                        [B, 768]
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                      WordPiece tokenizer produces 128 subword tokens. 6-layer transformer outputs pooled [CLS] semantic vector.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-purple-100/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>Input: text_tokens</span>
                      <span className="text-purple-700 font-bold">Pooled [CLS] → 768-d</span>
                    </div>
                  </div>

                  {/* Vision Input Node */}
                  <div
                    onClick={() => setSelectedStageId('stage-1-image')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                      selectedStageId === 'stage-1-image'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/30 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 block">STAGE 01B • VISION</span>
                          <h3 className="text-sm font-bold text-zinc-900">ResNet-18 Backbone</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        [B, 512]
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                      {simulatedImageAttached ? (
                        <span>Screenshots normalized to 224×224 RGB. Convolutions extract visual defect representations.</span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          Active Fallback: Zero-tensor [B, 3, 224, 224] injected. ResNet-18 executes without breaking forward graph.
                        </span>
                      )}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>Input: {simulatedImageAttached ? '3×224×224' : 'Zero Tensor'}</span>
                      <span className="text-emerald-700 font-bold">Conv Pool → 512-d</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* FLOW ARROW 1 -> 2 */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600">
                  <ArrowDown className="h-3.5 w-3.5 text-purple-600 animate-bounce" />
                  <span>Latent Projection Mapping (768-d & 512-d → 256-d)</span>
                </div>
              </div>

              {/* STAGE 2: BOTTLENECK PROJECTION */}
              <div
                onClick={() => setSelectedStageId('stage-2-projection')}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  selectedStageId === 'stage-2-projection'
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30 shadow-md'
                    : 'border-zinc-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">
                        STAGE 02 • SYMMETRICAL BOTTLENECK PROJECTION
                      </span>
                      <h3 className="text-base font-bold text-zinc-900">Equalizing Latent Modality Influence</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full self-start sm:self-auto">
                    Symmetrical 256-d Space
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-purple-700 font-bold">Text Projector</span>
                      <span className="text-zinc-500">Linear(768 → 256)</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Applies LayerNorm(256), ReLU non-linearity, and Dropout(0.20) to calibrate text embedding energy.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-700 font-bold">Vision Projector</span>
                      <span className="text-zinc-500">Linear(512 → 256)</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Applies LayerNorm(256), ReLU non-linearity, and Dropout(0.20) to match visual embedding scale.
                    </p>
                  </div>
                </div>
              </div>

              {/* FLOW ARROW 2 -> 3 */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600">
                  <ArrowDown className="h-3.5 w-3.5 text-purple-600 animate-bounce" />
                  <span>Late Feature Concatenation [256 || 256] → 512-d</span>
                </div>
              </div>

              {/* STAGE 3: MULTIMODAL FUSION CORE */}
              <div
                onClick={() => setSelectedStageId('stage-3-fusion')}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  selectedStageId === 'stage-3-fusion'
                    ? 'border-purple-600 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40 ring-2 ring-purple-400/40 shadow-md'
                    : 'border-zinc-200 bg-white hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                      <Merge className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">
                        STAGE 03 • MULTIMODAL FUSION CORE
                      </span>
                      <h3 className="text-base font-bold text-zinc-900">Cross-Modal Synthesis & Bottleneck MLP</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full self-start sm:self-auto">
                    Fused Embedding [B, 256]
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-white border border-purple-100/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 font-bold">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>torch.cat([z_text, z_image], dim=1) → Linear(512 → 256) → ReLU → Dropout(0.25)</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    The model fuses text semantics and visual evidence into a single compact latent vector, allowing cross-modal signals (e.g., matching the phrase <em>"broken seal"</em> with a photo of a torn carton) to reinforce each other.
                  </p>
                </div>
              </div>

              {/* FLOW ARROW 3 -> 4 */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600">
                  <ArrowDown className="h-3.5 w-3.5 text-blue-600 animate-bounce" />
                  <span>Multitask Shared Latent Representation [B, 256]</span>
                </div>
              </div>

              {/* STAGE 4: DUAL MULTITASK HEADS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider">
                  <span>Level 04 • Task Classification Outputs</span>
                  <span className="text-blue-600 font-bold">Dual Multitask Softmax</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Aspect Head */}
                  <div
                    onClick={() => setSelectedStageId('stage-4-heads')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedStageId === 'stage-4-heads'
                        ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-400/30 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-purple-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-purple-700 block">HEAD 01 • ASPECT</span>
                          <h3 className="text-sm font-bold text-zinc-900">Linear(256 → 6)</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                        6 Classes
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-2.5">
                      Categorizes grievance domain into 6 operational targets:
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-purple-100/60 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Software</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Hardware</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Quality</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Service</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Price</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">Packaging</span>
                    </div>
                  </div>

                  {/* Severity Head */}
                  <div
                    onClick={() => setSelectedStageId('stage-4-heads')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedStageId === 'stage-4-heads'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-amber-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-700 block">HEAD 02 • SEVERITY</span>
                          <h3 className="text-sm font-bold text-zinc-900">Linear(256 → 4)</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                        4 Levels
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-2.5">
                      Evaluates grievance urgency and customer emotional state:
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-amber-100/60 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">No Explicit Reproach</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">Disapproval</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">Accusation</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold">Blame</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Interactive Layer Inspector Drawer */}
          <div className="dribbble-card p-6 sm:p-7 bg-white border border-purple-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${selectedStage.iconBg} ${selectedStage.iconColor} border`}>
                  <selectedStage.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${selectedStage.tagColor}`}>
                      STAGE {selectedStage.stageNumber} • {selectedStage.tag}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-zinc-900 mt-0.5">
                    {selectedStage.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                <span className="px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200">
                  Input: {selectedStage.inputShape}
                </span>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
                <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                  Output: {selectedStage.outputShape}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              {selectedStage.description}
            </p>

            {/* Architectural Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedStage.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100 text-xs text-zinc-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {/* PyTorch Source Code Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                <div className="flex items-center gap-2 font-bold text-zinc-700">
                  <Code2 className="h-4 w-4 text-purple-600" />
                  <span>PyTorch Model Implementation Snippet</span>
                </div>
                <button
                  onClick={() => handleCopyCode(selectedStage.id, selectedStage.codeSnippet)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-[11px] font-bold transition-all cursor-pointer"
                >
                  {copiedStageId === selectedStage.id ? 'Copied ✓' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800 shadow-inner">
                <code>{selectedStage.codeSnippet}</code>
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: TENSOR SHAPE TRACE MATRIX */}
      {activeTab === 'dimensions' && (
        <div className="space-y-6">
          <div className="dribbble-card p-6 sm:p-7 bg-white border border-zinc-200/80 space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
                Step-by-Step Dimensional Evolution
              </span>
              <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
                Tensor Shape Transformation Matrix
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Tracing batch tensor dimensions through every computational layer during a forward pass with batch size <code className="font-mono text-purple-700 font-bold">B</code>.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-600 font-mono text-[11px] uppercase">
                    <th className="py-3 px-4 font-bold">Pipeline Stage</th>
                    <th className="py-3 px-4 font-bold">Operator / Layer</th>
                    <th className="py-3 px-4 font-bold">Input Shape</th>
                    <th className="py-3 px-4 font-bold">Output Shape</th>
                    <th className="py-3 px-4 font-bold">Output Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-700">01. Text Tokenizer</td>
                    <td className="py-3 px-4 text-zinc-600">WordPiece Tokenizer</td>
                    <td className="py-3 px-4">String [B]</td>
                    <td className="py-3 px-4 font-bold text-zinc-900">[B, 128]</td>
                    <td className="py-3 px-4 text-zinc-500">int64 tensor</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-700">02. DistilBERT Backbone</td>
                    <td className="py-3 px-4 text-zinc-600">Transformer Self-Attention</td>
                    <td className="py-3 px-4">[B, 128]</td>
                    <td className="py-3 px-4 font-bold text-zinc-900">[B, 768]</td>
                    <td className="py-3 px-4 text-purple-700 font-semibold">[CLS] Embedding</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-700">03. ResNet-18 Backbone</td>
                    <td className="py-3 px-4 text-zinc-600">Conv2D Residual Blocks</td>
                    <td className="py-3 px-4">[B, 3, 224, 224]</td>
                    <td className="py-3 px-4 font-bold text-zinc-900">[B, 512]</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">AvgPool Vector</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-700">04. Text Projector</td>
                    <td className="py-3 px-4 text-zinc-600">Linear + LayerNorm + ReLU</td>
                    <td className="py-3 px-4">[B, 768]</td>
                    <td className="py-3 px-4 font-bold text-indigo-800">[B, 256]</td>
                    <td className="py-3 px-4 text-zinc-500">Latent Text</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-700">05. Vision Projector</td>
                    <td className="py-3 px-4 text-zinc-600">Linear + LayerNorm + ReLU</td>
                    <td className="py-3 px-4">[B, 512]</td>
                    <td className="py-3 px-4 font-bold text-indigo-800">[B, 256]</td>
                    <td className="py-3 px-4 text-zinc-500">Latent Vision</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-700">06. Feature Concat</td>
                    <td className="py-3 px-4 text-zinc-600">torch.cat([z_t, z_v], dim=1)</td>
                    <td className="py-3 px-4">2 × [B, 256]</td>
                    <td className="py-3 px-4 font-bold text-purple-900">[B, 512]</td>
                    <td className="py-3 px-4 text-zinc-500">Concatenated</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-700">07. Fusion MLP</td>
                    <td className="py-3 px-4 text-zinc-600">Linear(512, 256) + Dropout(0.25)</td>
                    <td className="py-3 px-4">[B, 512]</td>
                    <td className="py-3 px-4 font-bold text-purple-900">[B, 256]</td>
                    <td className="py-3 px-4 text-purple-700 font-semibold">Joint Latent</td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">08. Aspect Classifier</td>
                    <td className="py-3 px-4 text-zinc-600">Linear(256, 6) + Softmax</td>
                    <td className="py-3 px-4">[B, 256]</td>
                    <td className="py-3 px-4 font-bold text-blue-800">[B, 6]</td>
                    <td className="py-3 px-4 text-zinc-500">6 Aspect Probs</td>
                  </tr>
                  <tr className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-amber-700">09. Severity Classifier</td>
                    <td className="py-3 px-4 text-zinc-600">Linear(256, 4) + Softmax</td>
                    <td className="py-3 px-4">[B, 256]</td>
                    <td className="py-3 px-4 font-bold text-amber-800">[B, 4]</td>
                    <td className="py-3 px-4 text-zinc-500">4 Severity Probs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LOSS & REBALANCING ENGINE */}
      {activeTab === 'rebalancing' && (
        <div className="space-y-6">
          
          {/* Empirical Improvement Callout */}
          <div className="dribbble-card p-6 sm:p-7 bg-gradient-to-r from-purple-50 via-white to-emerald-50 border border-purple-100 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                SCIENTIFIC BENCHMARK CONFIRMED
              </span>
              <span className="text-xs font-mono text-zinc-500 font-semibold">Held-Out Test Set (138 cases)</span>
            </div>

            <h2 className="text-xl font-extrabold text-zinc-900">
              Why Class Balancing Transformed ComFuse Accuracy
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              In real-world customer complaint data (Comp4.0), the Software aspect constitutes 75.7% of all cases, while Packaging accounts for only 1.0%. Without rebalancing, standard CrossEntropyLoss causes the optimizer to predict Software for nearly every grievance, resulting in near-zero recall for minority classes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Baseline Aspect Macro-F1</span>
                <div className="text-2xl font-extrabold text-zinc-400">0.1433</div>
                <p className="text-[11px] text-zinc-500">Extreme majority-class bias; minority categories completely ignored</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold">Retrained Aspect Macro-F1</span>
                <div className="text-2xl font-extrabold text-emerald-600">0.3683</div>
                <p className="text-[11px] text-emerald-800 font-medium">+157% relative improvement on isolated test data</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono text-purple-600 uppercase font-bold">Balanced Accuracy</span>
                <div className="text-2xl font-extrabold text-purple-700">38.09%</div>
                <p className="text-[11px] text-purple-800 font-medium">+128% over random uniform baseline (16.67%)</p>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Workflow className="h-4 w-4" />
                <span>Multitask Loss Weighting Formula</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Dual loss terms are balanced using a severity emphasis multiplier ($\lambda = 1.2$) to ensure the network allocates sufficient capacity to urgent grievance identification:
              </p>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 font-mono text-xs text-purple-900 leading-relaxed font-bold">
                {"L_total = L_aspect + 1.2 * L_severity"}
              </div>
            </div>

            <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Sliders className="h-4 w-4" />
                <span>Joint Sample Balancing Formula</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Each sample weight is computed as the geometric mean of its class frequencies, smoothed with a square-root power to avoid exploding gradients:
              </p>
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 font-mono text-xs text-indigo-900 leading-relaxed font-bold">
                {"w_i = sqrt(w_aspect(y_i)) * sqrt(w_severity(y_i))"}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Production Footnote */}
      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
          <span>Active Checkpoint: <code className="font-mono text-purple-800 font-bold">models/best_multimodal_model.pt</code> (312.4 MB) loaded on CPU runtime</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">Zero GPU Required for Inference</span>
      </div>

    </div>
  );
};
