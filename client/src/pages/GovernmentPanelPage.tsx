import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Lock,
  CheckSquare,
  AlertTriangle,
  Info,
  Radio,
  ChevronDown,
} from 'lucide-react';
import type { CitizenRequest, CivicComplaint, Status, Priority, Ward, Category, GovDepartmentRank, GovCategoryStatus } from '../types/index.js';
import { Header } from '../components/gov/Header.js';
import { OverviewCards } from '../components/gov/OverviewCards.js';
import { GovAnalytics } from '../components/gov/GovAnalytics.js';
import { DeptRanking } from '../components/gov/DeptRanking.js';
import { WardAnalyticsChart } from '../components/gov/WardAnalyticsChart.js';
import { RequestList } from '../components/gov/RequestList.js';
import { RequestDetailsModal } from '../components/gov/RequestDetailsModal.js';
import { ImageLightboxModal } from '../components/gov/ImageLightboxModal.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../utils/api.js';
import { downloadCivicIntelligencePdf } from '../utils/exportCivicPdf.js';
import { exportCivicCsv, type CsvKind } from '../utils/exportCivicCsv.js';
import { motion, AnimatePresence } from 'motion/react';
import { sectionStagger } from '../lib/civicMotion.js';
import { IntelligenceBriefing } from '../components/gov/IntelligenceBriefing.js';
import { GovIntelligenceHero } from '../components/gov/GovIntelligenceHero.js';
import { GOV_REFRESH_STAGES } from '../constants/pipeline.js';
import { useMagneticHover } from '../hooks/useMagneticHover.js';

interface GovernmentPanelPageProps {
  onBackToFeed?: () => void;
}

function mapStatus(s: string): Status {
  if (s === 'in_progress') return 'in_progress';
  if (s === 'resolved') return 'completed';
  if (s === 'rejected' || s === 'flagged') return 'rejected';
  return 'pending';
}

function mapPriority(c: CivicComplaint): Priority {
  const u = c.ai?.urgency || c.ai?.severity;
  if (u === 'critical' || u === 'high') return 'high';
  if (u === 'low') return 'low';
  return 'medium';
}

function toRequest(c: CivicComplaint): CitizenRequest {
  return {
    id: c.id,
    trackingCode: c.tracking_code,
    citizenName: 'Anonymous citizen',
    citizenPhone: '—',
    location: c.location_text,
    ward: (c.ward as Ward) || 'Ward 1 - Central Zone',
    category: (c.category as Category) || 'Other Civic Issues',
    description: c.body,
    imageUrl: c.image_url || '',
    priority: mapPriority(c),
    status: mapStatus(c.status),
    timestamp: c.created_at,
    assignedOfficer: c.ai?.department || undefined,
    supportCount: c.support_count,
    clusterId: c.cluster_id || c.cluster?.id || null,
    clusterTitle: c.cluster?.title || null,
    sourceStatus: c.status,
    timeline: (c.events || []).map((e) => ({
      id: e.id,
      timestamp: e.created_at,
      status: mapStatus(e.status),
      actor: e.actor,
      note: e.note,
    })),
  };
}

export const GovernmentPanelPage: React.FC<GovernmentPanelPageProps> = ({ onBackToFeed }) => {
  const { user, openAuthModal } = useAuth();
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [overview, setOverview] = useState<Record<string, any> | null>(null);
  const [daily, setDaily] = useState<Array<{ date: string; count: number }>>([]);
  const [departments, setDepartments] = useState<GovDepartmentRank[]>([]);
  const [categoryStatus, setCategoryStatus] = useState<GovCategoryStatus[]>([]);
  const [narrative, setNarrative] = useState<string>('');
  const [briefingModel, setBriefingModel] = useState<string>('');
  const [askQuestion, setAskQuestion] = useState<string>('');
  const [askAnswer, setAskAnswer] = useState<string>('');
  const [askMeta, setAskMeta] = useState<string>('');
  const [asking, setAsking] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [inspectRequest, setInspectRequest] = useState<CitizenRequest | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [csvMenuOpen, setCsvMenuOpen] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const jsonMagnetic = useMagneticHover(8);
  const pdfMagnetic = useMagneticHover(10);

  const showToast = (message: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const refresh = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    setProcessingStep(0);
    try {
      const bump = (n: number) => setProcessingStep((s) => Math.max(s, n));
      const [list, cl, ov, report, tr, dept] = await Promise.all([
        api.gov.complaints().then((r) => {
          bump(1);
          return r;
        }),
        api.gov.clusters().then((r) => {
          bump(2);
          return r;
        }),
        api.gov.overview().then((r) => {
          bump(3);
          return r;
        }),
        api.gov.briefing().then((r) => {
          bump(4);
          return r;
        }),
        api.gov.trends().then((r) => {
          bump(5);
          return r;
        }),
        api.gov.departments().then((r) => {
          bump(6);
          return r;
        }),
      ]);
      setRequests(list.complaints.map(toRequest));
      setClusters(cl.clusters || []);
      setOverview(ov);
      setDaily(tr.daily || []);
      setDepartments(dept.departments || []);
      setCategoryStatus(dept.category_status || []);
      setNarrative(report.narrative?.summary || '');
      setBriefingModel(
        report.narrative?.used_llm
          ? String(report.narrative.model || 'llm')
          : 'heuristic (no invented counts)'
      );
      setLastFetchedAt(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setProcessingStep(GOV_REFRESH_STAGES.length);
    } catch (err: any) {
      setLoadError(err.message || 'Government access required. Log in as gov_demo / password123.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'government') refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!csvMenuOpen) return;
    const close = () => setCsvMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [csvMenuOpen]);

  const patch = async (id: string, body: Record<string, unknown>, ok: string) => {
    try {
      await api.gov.patchComplaint(id, body);
      showToast(ok, 'success');
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'danger');
    }
  };

  const handleAccept = (id: string) =>
    patch(id, { status: 'in_progress', note: 'Assigned to field inspection.' }, 'Assigned for inspection.');
  const handleReject = (id: string, reason?: string) =>
    patch(id, { status: 'rejected', note: reason || 'Closed — out of jurisdiction or insufficient evidence.' }, 'Closed.');
  const handleResolve = (id: string, notes?: string) =>
    patch(id, { status: 'resolved', note: notes || 'Marked resolved by officer.' }, 'Marked resolved.');

  const handleAsk = async () => {
    const q = askQuestion.trim();
    if (q.length < 3) {
      showToast('Ask a specific question about reports or departments.', 'info');
      return;
    }
    setAsking(true);
    try {
      const res = await api.gov.ask(q);
      setAskAnswer(res.answer);
      const tools = (res.tools_used || []).filter(Boolean).join(', ') || 'none';
      setAskMeta(`${res.used_llm ? res.model : 'heuristic'} · tools: ${tools}`);
    } catch (err: any) {
      showToast(err.message || 'Ask failed', 'danger');
    } finally {
      setAsking(false);
    }
  };

  const handleExportCSV = (kind: CsvKind) => {
    exportCivicCsv(kind, { requests, clusters, departments, overview });
    setCsvMenuOpen(false);
    showToast(`Exported ${kind} from live store rows.`, 'info');
  };

  const handleExportReport = async () => {
    try {
      const report = await api.gov.briefing();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'civic_intelligence_report.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report JSON uses database totals only.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Report failed', 'danger');
    }
  };

  const handleExportPdf = async () => {
    try {
      const report = await api.gov.briefing();
      downloadCivicIntelligencePdf({
        overview: report.overview || overview,
        narrative: report.narrative?.summary || narrative || '',
        briefingModel: report.narrative?.used_llm
          ? String(report.narrative.model || 'llm')
          : briefingModel || 'heuristic',
        generatedAt: report.generated_at,
        clusters: clusters.length ? clusters : report.clusters || [],
        departments: departments.length ? departments : report.departments || [],
        requests,
      });
      showToast('PDF report downloaded from live database totals.', 'success');
    } catch (err: any) {
      showToast(err.message || 'PDF export failed', 'danger');
    }
  };

  const highPriorityPendingCount = requests.filter(
    (r) => r.status === 'pending' && r.priority === 'high'
  ).length;

  if (!user || user.role !== 'government') {
    return (
      <div className="pixel-box p-8 flex flex-col gap-4 max-w-lg">
        <p className="civic-label">Restricted</p>
        <h2 className="font-body text-xl font-semibold text-retro-navy">Civic intelligence</h2>
        <p className="font-pixel-body text-retro-muted">
          This panel is for government accounts. Citizen filings stay anonymous — you see issues, clusters, and departments, not identities.
        </p>
        <button
          type="button"
          className="pixel-btn bg-retro-navy text-white self-start cursor-pointer"
          onClick={() => openAuthModal('login')}
        >
          Log in
        </button>
        <p className="font-mono text-sm text-retro-muted">Demo: gov_demo / password123</p>
        {onBackToFeed && (
          <button type="button" className="font-body text-sm font-semibold text-retro-navy cursor-pointer self-start" onClick={onBackToFeed}>
            ← Back to reports
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section gov-section w-full min-w-0 overflow-x-clip font-body text-retro-text">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-16 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-sm sm:max-w-md"
          >
            <div
              className={`flex items-start gap-3 px-4 py-3 font-body text-sm rounded-[8px] shadow-elevated border backdrop-blur-[2px] ${
                toast.type === 'success'
                  ? 'bg-[#e6f4ec]/95 text-retro-success border-[#b7dcc6]'
                  : toast.type === 'danger'
                  ? 'bg-[#fde8e8]/95 text-retro-danger border-[#f0b4b0]'
                  : 'bg-[color-mix(in_srgb,var(--color-intel)_8%,var(--color-card))]/95 text-retro-navy border-[color-mix(in_srgb,var(--color-intel)_25%,var(--color-border))]'
              }`}
              role="status"
            >
              {toast.type === 'success' && <CheckSquare className="w-5 h-5 shrink-0 mt-0.5" />}
              {toast.type === 'danger' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5 text-[color:var(--color-intel)]" />}
              <span className="font-medium leading-snug min-w-0 break-words">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        onOpenNewModal={() => {
          if (onBackToFeed) onBackToFeed();
        }}
        onResetData={refresh}
        highPriorityPendingCount={highPriorityPendingCount}
        lastUpdated={lastFetchedAt}
      />

      {loadError && (
        <div className="pixel-box p-4 font-body text-retro-danger" role="alert">
          {loadError}
        </div>
      )}

      <GovIntelligenceHero
        loading={loading && !loadError}
        processingStep={processingStep}
        overview={overview}
        lastFetchedAt={lastFetchedAt}
        urgentCount={highPriorityPendingCount}
      />

      {!loading && !loadError && requests.length === 0 && (
        <div className="pixel-box p-6 text-center">
          <h3 className="font-body font-semibold mb-1">No live reports yet</h3>
          <p className="font-body text-sm text-retro-muted">
            Figures appear when citizens file issues. Totals are counted from the database, not invented.
          </p>
        </div>
      )}

      {!loading && !loadError && (
        <motion.div
          variants={sectionStagger.container}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-section"
        >
          <motion.div variants={sectionStagger.item}>
            <OverviewCards
              requests={requests}
              onFilterByStatus={(st) => setStatusFilter(st)}
              activeStatusFilter={statusFilter}
            />
          </motion.div>

          {(narrative || overview) && (
            <motion.div variants={sectionStagger.item}>
              <IntelligenceBriefing
                narrative={narrative}
                briefingModel={briefingModel}
                overview={overview}
                clusters={clusters}
                departments={departments}
                requests={requests}
                generatedAt={lastFetchedAt || undefined}
              />
            </motion.div>
          )}

          <motion.div variants={sectionStagger.item}>
            <DeptRanking departments={departments} />
          </motion.div>

          <motion.div variants={sectionStagger.item}>
            <GovAnalytics
              daily={daily}
              categories={overview?.categories || {}}
              categoryStatus={categoryStatus}
            />
          </motion.div>

          <motion.div variants={sectionStagger.item}>
            <WardAnalyticsChart
              requests={requests}
              selectedWard={selectedWard}
              onSelectWard={(ward) => setSelectedWard(ward)}
            />
          </motion.div>

          {clusters.length > 0 && (
            <motion.div variants={sectionStagger.item}>
              <section className="pixel-panel p-5 flex flex-col gap-3">
                <p className="civic-label">Clusters</p>
                <h2 className="font-body text-lg font-semibold text-retro-text">Repeated issues</h2>
                {clusters.slice(0, 6).map((cl) => (
                  <div key={cl.id} className="border border-retro-border p-3 rounded-[3px] bg-retro-subtle/40">
                    <div className="font-body font-semibold text-retro-text">{cl.title}</div>
                    <p className="font-body text-sm text-retro-muted mt-1">{cl.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2 font-body text-xs text-retro-muted">
                      <span>{cl.size} reports</span>
                      <span>{cl.support_total} support</span>
                      {cl.department && <span>{cl.department}</span>}
                      {cl.scores?.government_priority != null && (
                        <span>priority {cl.scores.government_priority}</span>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </motion.div>
          )}

          <motion.div variants={sectionStagger.item}>
            <div className="pixel-panel p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-retro-navy" />
                <div>
                  <p className="civic-label">Priority queue</p>
                  <p className="font-body text-sm text-retro-muted">Anonymous citizen filings</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCsvMenuOpen((open) => !open);
                    }}
                    className="civic-btn civic-focus px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1.5"
                    aria-haspopup="menu"
                    aria-expanded={csvMenuOpen}
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${csvMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {csvMenuOpen && (
                      <motion.div
                        role="menu"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="civic-dropdown absolute right-0 mt-1 z-20 min-w-[11rem] bg-retro-card border border-retro-navy rounded-[8px] shadow-elevated py-1 overflow-hidden"
                      >
                        {(
                          [
                            ['complaints', 'Complaints'],
                            ['clusters', 'Clusters'],
                            ['departments', 'Departments'],
                            ['summary', 'Summary'],
                          ] as Array<[CsvKind, string]>
                        ).map(([kind, label]) => (
                          <button
                            key={kind}
                            type="button"
                            role="menuitem"
                            onClick={() => handleExportCSV(kind)}
                            className="w-full text-left px-3 py-2 font-body text-xs text-retro-navy hover:bg-retro-subtle cursor-pointer transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  type="button"
                  ref={pdfMagnetic.ref}
                  onMouseMove={pdfMagnetic.onMouseMove}
                  onMouseLeave={pdfMagnetic.onMouseLeave}
                  onClick={() => {
                    setCsvMenuOpen(false);
                    void handleExportPdf();
                  }}
                  className={`civic-btn civic-focus px-3 py-1.5 text-xs ${pdfMagnetic.className}`}
                >
                  PDF report
                </button>
                <button
                  type="button"
                  ref={jsonMagnetic.ref}
                  onMouseMove={jsonMagnetic.onMouseMove}
                  onMouseLeave={jsonMagnetic.onMouseLeave}
                  onClick={() => {
                    setCsvMenuOpen(false);
                    void handleExportReport();
                  }}
                  className={`civic-btn civic-btn-primary px-3 py-1.5 text-xs ${jsonMagnetic.className}`}
                >
                  JSON report
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={sectionStagger.item}>
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
          </motion.div>

          <motion.div variants={sectionStagger.item}>
            <section className="pixel-panel p-5">
              <p className="civic-label mb-1">Ask the intelligence layer</p>
              <h2 className="font-body text-lg font-semibold text-retro-text mb-2">Questions over live reports</h2>
              <p className="font-body text-sm text-retro-muted mb-3">
                Answers must come from civic tools (overview, departments, clusters). Numbers are not invented.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="gov-ask" className="sr-only">Question</label>
                <input
                  id="gov-ask"
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleAsk();
                    }
                  }}
                  placeholder="Which department has the highest backlog?"
                  className="pixel-input flex-1 p-2 font-body text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleAsk()}
                  disabled={asking}
                  className="px-3 py-2 bg-retro-navy text-white border border-retro-navy font-body text-xs font-semibold cursor-pointer rounded-[3px] disabled:opacity-60"
                >
                  {asking ? 'Asking…' : 'Ask'}
                </button>
              </div>
              {askAnswer && (
                <div className="mt-3 p-3 bg-retro-subtle border border-retro-border rounded-[3px]">
                  <p className="font-body text-sm text-retro-text whitespace-pre-wrap leading-relaxed">{askAnswer}</p>
                  {askMeta && <p className="font-mono text-xs text-retro-muted mt-2">{askMeta}</p>}
                </div>
              )}
            </section>
          </motion.div>

          <motion.div variants={sectionStagger.item}>
            <div className="pixel-panel p-4 text-retro-muted font-body text-sm">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-retro-navy" />
                <p>
                  Public identity is not stored on this screen. Charts are counted from filed reports.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <RequestDetailsModal
        request={inspectRequest}
        isOpen={!!inspectRequest}
        onClose={() => setInspectRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onResolve={handleResolve}
        onImageClick={(url, title) => setLightbox({ url, title })}
      />
      <ImageLightboxModal
        isOpen={!!lightbox}
        imageUrl={lightbox?.url || ''}
        title={lightbox?.title || ''}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};

export default GovernmentPanelPage;
