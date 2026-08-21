import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Lock, 
  CheckSquare, 
  AlertTriangle, 
  Info,
  Radio
} from 'lucide-react';
import type { CitizenRequest } from './types';
import { INITIAL_REQUESTS } from './data/mockRequests';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { WardAnalyticsChart } from './components/WardAnalyticsChart';
import { RequestList } from './components/RequestList';
import { NewRequestModal } from './components/NewRequestModal';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { retroAudio } from './utils/retroAudio';

const STORAGE_KEY = 'civicpulse_retro_requests_v2';

export const App: React.FC = () => {
  const [requests, setRequests] = useState<CitizenRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cached requests:', e);
    }
    return INITIAL_REQUESTS;
  });

  // Filters & Modal States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [inspectRequest, setInspectRequest] = useState<CitizenRequest | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save requests:', e);
    }
  }, [requests]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // ACCEPT REQUEST HANDLER
  const handleAccept = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const updated: CitizenRequest = {
            ...req,
            status: 'in_progress',
            assignedOfficer: req.assignedOfficer || 'Command Officer (Sector 04)',
            timeline: [
              ...req.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'in_progress',
                actor: 'Municipal Command Center',
                note: 'Quest accepted. Field crew dispatched to designated sector coordinates.',
              },
            ],
          };
          return updated;
        }
        return req;
      })
    );
    showToast(`QUEST ACCEPTED // DISPATCHED TO FIELD UNIT`, 'success');
  };

  // REJECT REQUEST HANDLER
  const handleReject = (id: string, reason?: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const rejectionNote = reason?.trim() || 'Out of jurisdiction / non-compliant.';
          const updated: CitizenRequest = {
            ...req,
            status: 'rejected',
            rejectionReason: rejectionNote,
            timeline: [
              ...req.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'rejected',
                actor: 'Grievance Review Board',
                note: `Quest rejected: ${rejectionNote}`,
              },
            ],
          };
          return updated;
        }
        return req;
      })
    );
    showToast(`QUEST REJECTED // ARCHIVED TO GAME OVER QUEUE`, 'danger');
  };

  // RESOLVE REQUEST HANDLER
  const handleResolve = (id: string, notes?: string) => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ff88', '#ffe600', '#00f0ff', '#ff007f'],
      });
    } catch (e) {}

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const resNote = notes?.trim() || 'Task completed and verified by division inspector.';
          const updated: CitizenRequest = {
            ...req,
            status: 'completed',
            resolutionNotes: resNote,
            timeline: [
              ...req.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'completed',
                actor: 'Field Inspector Squadron',
                note: `STAGE CLEAR: ${resNote}`,
              },
            ],
          };
          return updated;
        }
        return req;
      })
    );
    showToast(`STAGE CLEARED // CITIZEN TASK SUCCESSFULLY RESOLVED!`, 'success');
  };

  // CREATE NEW REQUEST HANDLER
  const handleCreateRequest = (newRequest: CitizenRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
    showToast(
      `NEW QUEST #${newRequest.trackingCode} LOGGED (${newRequest.priority.toUpperCase()} RANK)`,
      'success'
    );
  };

  // RESET TO INITIAL SAMPLE DATA
  const handleResetData = () => {
    if (window.confirm('RESET ALL CIVIC QUESTS TO 8-BIT DEFAULT SAMPLE DATASET?')) {
      setRequests(INITIAL_REQUESTS);
      localStorage.removeItem(STORAGE_KEY);
      showToast('DATABASE RESET TO INITIAL 8-BIT SAMPLE MATRIX.', 'info');
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    retroAudio.playClick();
    const headers = [
      'Tracking Code',
      'Citizen Name',
      'Phone',
      'Location',
      'Ward',
      'Category',
      'Priority',
      'Status',
      'Date Submitted',
    ];
    const rows = requests.map((r) => [
      `"${r.trackingCode}"`,
      `"${r.citizenName}"`,
      `"${r.citizenPhone}"`,
      `"${r.location.replace(/"/g, '""')}"`,
      `"${r.ward}"`,
      `"${r.category}"`,
      `"${r.priority.toUpperCase()}"`,
      `"${r.status.toUpperCase()}"`,
      `"${new Date(r.timestamp).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicPulse_8Bit_Grievance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('EXPORTED GRIEVANCE LOG TO CSV.', 'success');
  };

  const highPriorityPendingCount = requests.filter(
    (r) => r.status === 'pending' && r.priority === 'high'
  ).length;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative font-retro">
      
      {/* 1. STUNNING ANIMATED RETRO PIXEL BACKGROUND */}
      <div className="pixel-bg-scene">
        <div className="pixel-stars" />
        <div className="pixel-grid-floor" />
      </div>

      {/* 2. CRT SCANLINE EFFECT OVERLAY */}
      {crtEnabled && <div className="crt-overlay" />}

      {/* 3. RETRO TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-150">
          <div
            className={`flex items-center gap-3 px-4 py-3 border-4 border-black shadow-[6px_6px_0_#000] font-pixel text-xs ${
              toast.type === 'success'
                ? 'bg-[#00ff88] text-black'
                : toast.type === 'danger'
                ? 'bg-[#ff3355] text-white'
                : 'bg-[#ffe600] text-black'
            }`}
          >
            {toast.type === 'success' && <CheckSquare className="w-5 h-5 shrink-0" />}
            {toast.type === 'danger' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="font-black tracking-wide">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 font-pixel text-[10px] bg-black text-white px-1.5 py-0.5 border border-white hover:bg-slate-800"
            >
              [X]
            </button>
          </div>
        </div>
      )}

      {/* 4. OFFICIAL RETRO HEADER */}
      <Header
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onResetData={handleResetData}
        highPriorityPendingCount={highPriorityPendingCount}
      />

      {/* 5. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-8 z-10">
        
        {/* Quick Toolbar Bar */}
        <div className="pixel-panel p-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#08041a]">
          <div className="flex items-center gap-2 font-pixel text-[9px] text-[#00ff88]">
            <Radio className="w-4 h-4 text-[#ff007f] animate-pulse" />
            <span>MUNICIPAL COMMAND TERMINAL // SECTOR CONTROL ROOM ONLINE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              className="px-2.5 py-1 bg-[#120c2e] hover:bg-[#2b0945] text-[#ffe600] border-2 border-black shadow-[2px_2px_0_#000] font-pixel text-[8px] transition"
            >
              CRT SCANLINES: {crtEnabled ? '[ON]' : '[OFF]'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-[#ffe600] text-black border-2 border-black shadow-[2px_2px_0_#000] font-pixel text-[8px] font-bold hover:bg-[#fffa65] transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV DOSSIER</span>
            </button>
          </div>
        </div>

        {/* 6. DASHBOARD OVERVIEW SECTION (Arcade Scoreboard HUD) */}
        <OverviewCards
          requests={requests}
          onFilterByStatus={(st) => setStatusFilter(st)}
          activeStatusFilter={statusFilter}
        />

        {/* 7. ANALYTICS SECTION (8-Bit Grouped Bar Chart) */}
        <WardAnalyticsChart
          requests={requests}
          selectedWard={selectedWard}
          onSelectWard={(ward) => setSelectedWard(ward)}
        />

        {/* 8. REQUEST MANAGEMENT SECTION (Quest Board & Priority Queue) */}
        <RequestList
          requests={requests}
          onAccept={handleAccept}
          onReject={(id) => handleReject(id)}
          onResolve={(id) => handleResolve(id)}
          onViewDetails={(req) => setInspectRequest(req)}
          onImageClick={(url, title) => setLightbox({ url, title })}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedWard={selectedWard}
          onWardChange={setSelectedWard}
        />

      </main>

      {/* 9. RETRO 8-BIT FOOTER */}
      <footer className="bg-[#050212] text-slate-400 font-retro text-lg border-t-4 border-black mt-12 py-6 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-[#1f0a42]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#ffe600] border-2 border-black flex items-center justify-center font-pixel text-black font-black text-xs">
                ★
              </div>
              <div>
                <p className="font-pixel text-[10px] text-white">CIVICPULSE 8-BIT // MUNICIPAL DISPATCH SYSTEM</p>
                <p className="text-[#ff9900] text-base">Department of Urban Administration & Public Redressal</p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-pixel text-[9px] text-[#00f0ff]">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#00ff88]" /> 256-BIT RETRO CIPHER
              </span>
              <span>HELPLINE: 1800-8BIT-GOV</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-base">
            <p>© 2026 MUNICIPAL CORP & CIVIC RESPONSE SQUAD. INSERT COIN TO CONTINUE.</p>
            <p className="font-pixel text-[8px] text-[#ffe600]">
              PRESS START 2P // 8-BIT EDITION v2.0
            </p>
          </div>
        </div>
      </footer>

      {/* 10. MODALS */}
      {/* New Request Intake Dialog */}
      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Case Details Inspector Modal */}
      <RequestDetailsModal
        request={inspectRequest}
        isOpen={!!inspectRequest}
        onClose={() => setInspectRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onResolve={handleResolve}
        onImageClick={(url, title) => setLightbox({ url, title })}
      />

      {/* High-Resolution Problem Photo Lightbox */}
      <ImageLightboxModal
        isOpen={!!lightbox}
        imageUrl={lightbox?.url || ''}
        title={lightbox?.title || ''}
        onClose={() => setLightbox(null)}
      />

    </div>
  );
};

export default App;
