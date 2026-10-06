import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { RecordDetailModal } from './components/RecordDetailModal';
import { AnalyzePage } from './pages/AnalyzePage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import type {
  NavPage,
  HealthResponse,
  ExampleComplaint,
  AnalysisRecord,
} from './types';
import { fetchHealth, fetchExamples } from './api';
import { getHistory, deleteRecord, clearHistory } from './storage';

export function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('analyze');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const [health, setHealth] = useState<HealthResponse>({
    status: 'loading',
    service: 'comfuse-api',
    model: 'ComFuse',
    device: 'cpu',
  });

  const [examples, setExamples] = useState<ExampleComplaint[]>([]);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  // 1. Initial LocalStorage load
  useEffect(() => {
    const loaded = getHistory();
    setHistory(loaded);
  }, []);

  // 2. Health check on application mount (non-aggressive, single check)
  const checkHealth = useCallback(async () => {
    const res = await fetchHealth();
    setHealth(res);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // 3. Load example cases from backend API on mount
  useEffect(() => {
    const loadExamples = async () => {
      const data = await fetchExamples();
      setExamples(data);
    };
    loadExamples();
  }, []);

  // 4. Handle newly saved analysis record
  const handleAnalysisSaved = (newRecord: AnalysisRecord) => {
    setHistory((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)].slice(0, 100));
  };

  // 5. Handle single record deletion
  const handleDeleteRecord = (id: string) => {
    const updated = deleteRecord(id);
    setHistory(updated);
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  };

  // 6. Handle clearing all history
  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-zinc-100 flex overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        health={health}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by 64 (256px) on lg) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative">
        
        {/* Subtle Ambient Radial Glow inspired by reference image */}
        <div className="absolute top-0 left-0 right-0 h-96 pointer-events-none ambient-glow" />
        <div className="absolute top-0 left-1/4 right-1/4 h-64 pointer-events-none ambient-glow-cyan" />

        {/* Top Bar */}
        <TopBar
          currentPage={currentPage}
          health={health}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10 max-w-7xl w-full mx-auto">
          {currentPage === 'analyze' && (
            <AnalyzePage
              examples={examples}
              onAnalysisSaved={handleAnalysisSaved}
            />
          )}

          {currentPage === 'dashboard' && (
            <DashboardPage
              history={history}
              onSelectRecord={setSelectedRecord}
              onNavigateToAnalyze={() => setCurrentPage('analyze')}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              history={history}
              onSelectRecord={setSelectedRecord}
              onDeleteRecord={handleDeleteRecord}
              onClearHistory={handleClearHistory}
              onNavigateToAnalyze={() => setCurrentPage('analyze')}
            />
          )}

          {currentPage === 'how-it-works' && <HowItWorksPage />}

          {currentPage === 'about' && <AboutPage />}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-white/[0.05] bg-[#07070b]/60 py-4 px-6 text-[11px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">COMFUSE</span>
            <span>•</span>
            <span>Multimodal Customer Complaint Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-mono">
            <span>DistilBERT + ResNet-18</span>
            <span>•</span>
            <span>FastAPI + React TypeScript</span>
          </div>
        </footer>

      </div>

      {/* Detail Inspection Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

    </div>
  );
}

export default App;
