'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { TableSkeleton, ListSkeleton } from '../../../components/ui/Skeleton';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';

export default function PerformancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const customConfirm = useConfirm();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [teamReviews, setTeamReviews] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'team-reviews'>('my-reviews');

  const [myReviewsSearch, setMyReviewsSearch] = useState('');
  const [myReviewsPage, setMyReviewsPage] = useState(1);
  const [teamReviewsSearch, setTeamReviewsSearch] = useState('');
  const [teamReviewsPage, setTeamReviewsPage] = useState(1);

  // New states for evaluation creation & releases
  const [employees, setEmployees] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createReviewForm, setCreateReviewForm] = useState({
    subjectId: '',
    period: '2026-Q1',
    periodType: 'QUARTERLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    comments: ''
  });

  // HR Feedback Form states
  const [hrCollaboration, setHrCollaboration] = useState(3);
  const [hrCommunication, setHrCommunication] = useState(3);
  const [hrDiscipline, setHrDiscipline] = useState(3);
  const [hrInitiative, setHrInitiative] = useState(3);
  const [hrConduct, setHrConduct] = useState(3);
  const [hrFeedbackNote, setHrFeedbackNote] = useState('');
  const [hrPublish, setHrPublish] = useState(false);
  const [hrSubmitLoading, setHrSubmitLoading] = useState(false);

  // Checkbox multi-select states for bulk release
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const showManagementFeatures = isAdmin || isHR || isManager;

  async function loadData() {
    try {
      setLoading(true);
      const myReviewsRes = await api.performance.listReviews(false);
      setReviews(myReviewsRes.data || []);

      if (showManagementFeatures) {
        const teamReviewsRes = await api.performance.listReviews(true);
        setTeamReviews(teamReviewsRes.data || []);
        
        try {
          const empRes = await api.employees.list();
          setEmployees(empRes.data || []);
        } catch (e) {
          console.error("Failed to load employees", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [showManagementFeatures]);

  useEffect(() => {
    if (selectedReview) {
      setHrCollaboration(selectedReview.hrCollaboration ?? 3);
      setHrCommunication(selectedReview.hrCommunication ?? 3);
      setHrDiscipline(selectedReview.hrDiscipline ?? 3);
      setHrInitiative(selectedReview.hrInitiative ?? 3);
      setHrConduct(selectedReview.hrConduct ?? 3);
      setHrFeedbackNote(selectedReview.hrFeedbackNote ?? '');
      setHrPublish(selectedReview.isPublished ?? false);
    }
  }, [selectedReview]);

  async function handlePublishReview(id: string) {
    const ok = await customConfirm({
      title: 'Release Performance Review',
      message: 'Are you sure you want to release/publish this performance review? Once released, it will be visible to the employee.',
      variant: 'info',
      confirmLabel: 'Publish',
    });
    if (!ok) return;
    try {
      await api.performance.publish(id);
      toast.success('Performance review released successfully');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to release performance review');
    }
  }

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault();
    if (!createReviewForm.subjectId) {
      toast.error('Please select an employee');
      return;
    }
    if (!createReviewForm.period.trim()) {
      toast.error('Please specify the evaluation cycle period');
      return;
    }
    try {
      setCreateLoading(true);
      await api.performance.createReview({
        subjectId: createReviewForm.subjectId,
        period: createReviewForm.period,
        periodType: createReviewForm.periodType,
        comments: createReviewForm.comments || undefined
      });
      toast.success('Performance review draft compiled successfully');
      setIsCreateModalOpen(false);
      setCreateReviewForm({ subjectId: '', period: '2026-Q1', periodType: 'QUARTERLY', comments: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create evaluation draft');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleHrFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReview) return;
    try {
      setHrSubmitLoading(true);
      await api.performance.submitHrFeedback(selectedReview.id, {
        hrCollaboration,
        hrCommunication,
        hrDiscipline,
        hrInitiative,
        hrConduct,
        hrFeedbackNote: hrFeedbackNote || undefined,
        publish: hrPublish
      });
      toast.success(hrPublish ? 'Review published successfully' : 'HR feedback logged successfully');
      setSelectedReview(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save HR feedback');
    } finally {
      setHrSubmitLoading(false);
    }
  }

  async function handleBulkPublish() {
    if (selectedReviewIds.length === 0) return;
    const ok = await customConfirm({
      title: 'Release Selected Reviews',
      message: `Are you sure you want to release/publish the ${selectedReviewIds.length} selected reviews? They will become visible to employees immediately.`,
      variant: 'info',
      confirmLabel: 'Publish Selected',
    });
    if (!ok) return;
    try {
      await api.performance.bulkPublish(selectedReviewIds);
      toast.success('Selected performance reviews released successfully');
      setSelectedReviewIds([]);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to release reviews');
    }
  }

  async function handlePublishAll() {
    const drafts = teamReviews.filter(r => !r.isPublished);
    if (drafts.length === 0) {
      toast.error('No draft reviews found to release');
      return;
    }
    const ok = await customConfirm({
      title: 'Release All Draft Reviews',
      message: `Are you sure you want to release/publish ALL ${drafts.length} draft reviews? They will become visible to employees immediately.`,
      variant: 'warning',
      confirmLabel: 'Publish All',
    });
    if (!ok) return;
    try {
      const draftIds = drafts.map(r => r.id);
      await api.performance.bulkPublish(draftIds);
      toast.success(`All ${drafts.length} performance reviews released successfully`);
      setSelectedReviewIds([]);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to release all reviews');
    }
  }

  const filteredMyReviews = reviews.filter(rev => 
    rev.period.toLowerCase().includes(myReviewsSearch.toLowerCase()) ||
    (rev.reviewer ? `${rev.reviewer.firstName} ${rev.reviewer.lastName}` : '').toLowerCase().includes(myReviewsSearch.toLowerCase()) ||
    (rev.scoreBand || '').toLowerCase().includes(myReviewsSearch.toLowerCase())
  );
  const itemsPerPage = 8;
  const paginatedMyReviews = filteredMyReviews.slice((myReviewsPage - 1) * itemsPerPage, myReviewsPage * itemsPerPage);
  const totalPagesMyReviews = Math.ceil(filteredMyReviews.length / itemsPerPage);

  const filteredTeamReviews = teamReviews.filter(rev => 
    (rev.subject ? `${rev.subject.firstName} ${rev.subject.lastName}` : '').toLowerCase().includes(teamReviewsSearch.toLowerCase()) ||
    rev.period.toLowerCase().includes(teamReviewsSearch.toLowerCase()) ||
    (rev.scoreBand || '').toLowerCase().includes(teamReviewsSearch.toLowerCase())
  );
  const paginatedTeamReviews = filteredTeamReviews.slice((teamReviewsPage - 1) * itemsPerPage, teamReviewsPage * itemsPerPage);
  const totalPagesTeamReviews = Math.ceil(filteredTeamReviews.length / itemsPerPage);

  const validReviews = reviews.filter(r => r.finalScore !== null && r.finalScore !== undefined);
  const averageScore = validReviews.length > 0 
    ? (validReviews.reduce((sum, r) => sum + r.finalScore, 0) / validReviews.length).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Performance Management</h1>
          <p className="text-body-sm text-outline">Track professional objectives, review cycles, and performance feedback</p>
        </div>
        {showManagementFeatures && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary text-label-md font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Evaluation Draft
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
          <div className="md:col-span-1 space-y-6">
            <ListSkeleton count={2} />
            <ListSkeleton count={3} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {showManagementFeatures && (
              <div className="flex border-b border-outline-variant">
                <button
                  onClick={() => setActiveTab('my-reviews')}
                  className={`px-4 py-2.5 font-semibold text-body-md transition-colors border-b-2 -mb-[2px] ${
                    activeTab === 'my-reviews' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  My Reviews
                </button>
                <button
                  onClick={() => setActiveTab('team-reviews')}
                  className={`px-4 py-2.5 font-semibold text-body-md transition-colors border-b-2 -mb-[2px] ${
                    activeTab === 'team-reviews' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Team Evaluations & Drafts
                </button>
              </div>
            )}

            {activeTab === 'my-reviews' ? (
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">My Review History</h2>
                  <div className="relative w-48">
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={myReviewsSearch}
                      onChange={(e) => {
                        setMyReviewsSearch(e.target.value);
                        setMyReviewsPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                  </div>
                </div>

                <>
                  {/* Mobile View - Cards List */}
                  <div className="block md:hidden space-y-4">
                    {paginatedMyReviews.length === 0 ? (
                      <div className="py-8 text-center text-outline">
                        No approved performance reviews found.
                      </div>
                    ) : (
                      paginatedMyReviews.map((rev) => (
                        <div key={rev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-label-sm font-bold text-slate-900">{rev.period}</h4>
                              <p className="text-[10px] text-outline mt-0.5">
                                Evaluated on {new Date(rev.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              Approved
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                            <span>Score: <span className="text-primary font-bold">{rev.finalScore !== null && rev.finalScore !== undefined ? `${rev.finalScore.toFixed(2)} / 5.0 (${rev.scoreBand})` : 'Pending'}</span></span>
                            <button
                              onClick={() => setSelectedReview(rev)}
                              className="px-2 py-1 bg-primary hover:bg-blue-755 text-on-primary font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">visibility</span>
                              View Scorecard
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View - Standard Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low/50">
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Review Cycle</th>
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Evaluator</th>
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Score / Band</th>
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-body-sm">
                        {paginatedMyReviews.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-outline">
                              No approved performance reviews found.
                            </td>
                          </tr>
                        ) : (
                          paginatedMyReviews.map((rev) => (
                            <tr key={rev.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3 font-semibold text-on-surface">
                                <div>
                                  <p>{rev.period}</p>
                                  <p className="text-[10px] text-outline mt-0.5">
                                    Evaluated on {new Date(rev.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-on-surface-variant">
                                {rev.reviewer ? `${rev.reviewer.firstName} ${rev.reviewer.lastName}` : 'System'}
                              </td>
                              <td className="px-4 py-3 font-medium text-primary">
                                {rev.finalScore !== null && rev.finalScore !== undefined ? (
                                  <span>{rev.finalScore.toFixed(2)} / 5.0 <span className="text-on-surface-variant font-bold text-xs ml-1">({rev.scoreBand})</span></span>
                                ) : (
                                  'Pending Evaluation'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                  Approved & Published
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <ThreeDotMenu
                                  actions={[
                                    {
                                      label: 'View Details',
                                      icon: 'visibility',
                                      onClick: () => setSelectedReview(rev)
                                    }
                                  ]}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>

                {totalPagesMyReviews > 1 && (
                  <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(myReviewsPage - 1) * itemsPerPage + 1} to {Math.min(myReviewsPage * itemsPerPage, filteredMyReviews.length)} of {filteredMyReviews.length} reviews
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={myReviewsPage === 1}
                        onClick={() => setMyReviewsPage(myReviewsPage - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={myReviewsPage === totalPagesMyReviews}
                        onClick={() => setMyReviewsPage(myReviewsPage + 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Team Reviews Tab (Managers / HR / Admin only)
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Team Reviews Dashboard</h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Bulk operations controls */}
                    {showManagementFeatures && teamReviews.some(r => !r.isPublished) && (
                      <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold select-none">
                        <span className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Release options:</span>
                        <button
                          disabled={selectedReviewIds.length === 0}
                          onClick={handleBulkPublish}
                          className="px-2.5 py-1 bg-primary hover:bg-blue-750 text-white text-[10px] font-bold rounded cursor-pointer disabled:opacity-40 transition-colors"
                        >
                          Release Selected ({selectedReviewIds.length})
                        </button>
                        <button
                          onClick={handlePublishAll}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-55 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition-colors"
                        >
                          Release All Drafts
                        </button>
                      </div>
                    )}
                    <div className="relative w-48">
                      <input
                        type="text"
                        placeholder="Search team reviews..."
                        value={teamReviewsSearch}
                        onChange={(e) => {
                          setTeamReviewsSearch(e.target.value);
                          setTeamReviewsPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {/* Mobile View - Cards List */}
                  <div className="block md:hidden space-y-4 p-4">
                    {paginatedTeamReviews.length === 0 ? (
                      <div className="py-8 text-center text-outline">
                        No team reviews found.
                      </div>
                    ) : (
                      paginatedTeamReviews.map((rev) => (
                        <div key={rev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {!rev.isPublished ? (
                                <input
                                  type="checkbox"
                                  checked={selectedReviewIds.includes(rev.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedReviewIds(prev => [...prev, rev.id]);
                                    } else {
                                      setSelectedReviewIds(prev => prev.filter(id => id !== rev.id));
                                    }
                                  }}
                                  className="cursor-pointer rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-green-605 select-none">check_circle</span>
                              )}
                              <div>
                                <h4 className="text-label-sm font-bold text-slate-900">{rev.subject ? `${rev.subject.firstName} ${rev.subject.lastName}` : 'Unknown'}</h4>
                                <p className="text-[10px] text-outline mt-0.5">{rev.period}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              rev.isPublished 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {rev.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                            <span>Score: <span className="text-primary font-bold">{rev.finalScore !== null && rev.finalScore !== undefined ? `${rev.finalScore.toFixed(2)} / 5.0 (${rev.scoreBand})` : 'Pending'}</span></span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setSelectedReview(rev)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                View
                              </button>
                              {!rev.isPublished && (
                                <button
                                  onClick={() => handlePublishReview(rev.id)}
                                  className="px-2 py-1 bg-primary hover:bg-blue-755 text-on-primary font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  Release
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View - Standard Table */}
                  <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="w-10 px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={teamReviews.length > 0 && teamReviews.filter(r => !r.isPublished).every(r => selectedReviewIds.includes(r.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const draftIds = teamReviews.filter(r => !r.isPublished).map(r => r.id);
                                setSelectedReviewIds(draftIds);
                              } else {
                                setSelectedReviewIds([]);
                              }
                            }}
                            className="cursor-pointer rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          />
                        </th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Cycle</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Score / Band</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-body-sm">
                      {paginatedTeamReviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-outline">
                            No team reviews found.
                          </td>
                        </tr>
                      ) : (
                        paginatedTeamReviews.map((rev) => (
                          <tr key={rev.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-4 py-3 text-center">
                              {!rev.isPublished ? (
                                <input
                                  type="checkbox"
                                  checked={selectedReviewIds.includes(rev.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedReviewIds(prev => [...prev, rev.id]);
                                    } else {
                                      setSelectedReviewIds(prev => prev.filter(id => id !== rev.id));
                                    }
                                  }}
                                  className="cursor-pointer rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-slate-300 select-none">check_circle</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-on-surface">
                              {rev.subject ? `${rev.subject.firstName} ${rev.subject.lastName}` : 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                              {rev.period}
                            </td>
                            <td className="px-4 py-3 font-medium text-primary">
                              {rev.finalScore !== null && rev.finalScore !== undefined ? (
                                <span>{rev.finalScore.toFixed(2)} / 5.0 <span className="text-on-surface-variant font-bold text-xs ml-1">({rev.scoreBand})</span></span>
                              ) : (
                                'Pending Evaluation'
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                rev.isPublished 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                                {rev.isPublished ? 'Published' : 'Draft / Unapproved'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ThreeDotMenu
                                actions={[
                                  {
                                    label: 'View Detailed Score',
                                    icon: 'visibility',
                                    onClick: () => setSelectedReview(rev)
                                  },
                                  ...(!rev.isPublished ? [{
                                    label: 'Release Review',
                                    icon: 'publish',
                                    onClick: () => handlePublishReview(rev.id)
                                  }] : [])
                                ]}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPagesTeamReviews > 1 && (
                  <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(teamReviewsPage - 1) * itemsPerPage + 1} to {Math.min(teamReviewsPage * itemsPerPage, filteredTeamReviews.length)} of {filteredTeamReviews.length} reviews
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={teamReviewsPage === 1}
                        onClick={() => setTeamReviewsPage(teamReviewsPage - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={teamReviewsPage === totalPagesTeamReviews}
                        onClick={() => setTeamReviewsPage(teamReviewsPage + 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Quick Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg text-center">
                  <p className="text-[10px] text-outline font-bold uppercase">Average Score</p>
                  <p className="text-headline-md font-bold text-on-surface mt-1">{averageScore}</p>
                </div>
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg text-center">
                  <p className="text-[10px] text-outline font-bold uppercase">Total Reviews</p>
                  <p className="text-headline-md font-bold text-on-surface mt-1">{reviews.length}</p>
                </div>
              </div>
            </div>

            {showManagementFeatures && teamReviews.length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Team Performance Feed</h2>
                <div className="space-y-4">
                  {teamReviews.slice(0, 5).map(rev => (
                    <div key={rev.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-label-md font-bold text-on-surface">
                          {rev.subject ? `${rev.subject.firstName} ${rev.subject.lastName}` : 'Employee'}
                        </p>
                        <span className="text-body-sm font-semibold font-mono text-primary">
                          {rev.finalScore !== null && rev.finalScore !== undefined ? `${rev.finalScore.toFixed(2)} / 5.0` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-outline">
                        <span>Period: {rev.period}</span>
                        <span className="font-semibold uppercase text-xs">{rev.scoreBand || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-in-up">
            <div className="flex justify-between items-start border-b border-outline-variant pb-4">
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface">Performance Review Details</h3>
                <p className="text-body-sm text-outline">
                  Period: {selectedReview.period} | Evaluated by {selectedReview.reviewer ? `${selectedReview.reviewer.firstName} ${selectedReview.reviewer.lastName}` : 'System'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReview(null)}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-primary-container border border-primary/20 rounded-xl text-center">
                <p className="text-[10px] text-on-primary-container font-bold uppercase">Composite Score</p>
                <p className="text-headline-lg font-extrabold text-primary mt-1">
                  {selectedReview.finalScore !== null && selectedReview.finalScore !== undefined ? selectedReview.finalScore.toFixed(2) : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-center">
                <p className="text-[10px] text-outline font-bold uppercase">Score Band</p>
                <p className="text-headline-lg font-extrabold text-on-surface mt-1">{selectedReview.scoreBand || 'N/A'}</p>
              </div>
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-center flex flex-col justify-center">
                <p className="text-[10px] text-outline font-bold uppercase">Status</p>
                <span className={`mt-2 mx-auto px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedReview.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedReview.isPublished ? 'Published' : 'Draft / Unapproved'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Evaluation Components</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Task Completion */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">Task Completion</span>
                    <span className="text-body-sm font-bold font-mono text-primary">
                      {selectedReview.completionRate !== null && selectedReview.completionRate !== undefined ? `${(selectedReview.completionRate * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${(selectedReview.completionRate || 0) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-outline">Weight: 25% of composite score</p>
                </div>

                {/* Deadline Adherence */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">Deadline Adherence</span>
                    <span className="text-body-sm font-bold font-mono text-primary">
                      {selectedReview.deadlinesMet !== null && selectedReview.deadlinesMet !== undefined ? `${(selectedReview.deadlinesMet * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${(selectedReview.deadlinesMet || 0) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-outline">Weight: 20% of composite score</p>
                </div>

                {/* Quality & Rework */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">Rework Count</span>
                    <span className="text-body-sm font-bold font-mono text-primary">
                      {selectedReview.reworkCount !== null && selectedReview.reworkCount !== undefined ? `${selectedReview.reworkCount} issues` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] text-outline">Total rework tasks assigned. Weight: 25%</p>
                </div>

                {/* Attendance */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm font-semibold text-on-surface">Attendance Rate</span>
                    <span className="text-body-sm font-bold font-mono text-primary">
                      {selectedReview.attendancePct !== null && selectedReview.attendancePct !== undefined ? `${(selectedReview.attendancePct * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${(selectedReview.attendancePct || 0) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-outline">Weight: 20% of composite score</p>
                </div>
              </div>

              {/* HR Qualitative Feedback */}
              {!selectedReview.isPublished && (isHR || isAdmin) ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">HR Qualitative Evaluation (Weight: 10%)</span>
                  </div>
                  <form onSubmit={handleHrFeedbackSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Collab', val: hrCollaboration, set: setHrCollaboration },
                        { label: 'Comm', val: hrCommunication, set: setHrCommunication },
                        { label: 'Discipline', val: hrDiscipline, set: setHrDiscipline },
                        { label: 'Initiative', val: hrInitiative, set: setHrInitiative },
                        { label: 'Conduct', val: hrConduct, set: setHrConduct },
                      ].map((dim) => (
                        <div key={dim.label} className="p-1 bg-white border border-slate-200 rounded text-center">
                          <label className="text-[8px] text-outline font-bold uppercase block mb-1">{dim.label}</label>
                          <select
                            value={dim.val}
                            onChange={(e) => dim.set(Number(e.target.value))}
                            className="bg-transparent text-body-sm font-bold w-full text-center border-0 p-0 text-on-surface focus:ring-0 focus:outline-none cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-outline uppercase font-bold block">HR Feedback Remarks / Notes</label>
                      <textarea
                        value={hrFeedbackNote}
                        onChange={(e) => setHrFeedbackNote(e.target.value)}
                        placeholder="Add qualitative HR remarks regarding conduct, communication, or growth areas..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-on-surface"
                      />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-4 pt-1.5 border-t border-slate-150">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hrPublish}
                          onChange={(e) => setHrPublish(e.target.checked)}
                          className="cursor-pointer rounded border-slate-350 text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-[11px] text-slate-700 font-bold">Release to employee immediately</span>
                      </label>
                      <button
                        type="submit"
                        disabled={hrSubmitLoading}
                        className="px-3 py-1.5 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {hrSubmitLoading ? 'Submitting...' : 'Save & Compute Score'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="text-body-sm font-semibold text-on-surface">HR Qualitative Evaluation (Weight: 10%)</span>
                    <span className="text-body-sm font-bold font-mono text-primary">
                      {(() => {
                        const vals = [
                          selectedReview.hrCollaboration,
                          selectedReview.hrCommunication,
                          selectedReview.hrDiscipline,
                          selectedReview.hrInitiative,
                          selectedReview.hrConduct
                        ].filter(v => v !== null && v !== undefined);
                        if (vals.length === 0) return 'N/A';
                        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                        return `${avg.toFixed(1)} / 5.0`;
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-surface-container-high rounded">
                      <p className="text-[8px] text-outline font-bold uppercase">Collab</p>
                      <p className="text-body-sm font-bold mt-0.5">{selectedReview.hrCollaboration ?? '-'}</p>
                    </div>
                    <div className="p-2 bg-surface-container-high rounded">
                      <p className="text-[8px] text-outline font-bold uppercase">Comm</p>
                      <p className="text-body-sm font-bold mt-0.5">{selectedReview.hrCommunication ?? '-'}</p>
                    </div>
                    <div className="p-2 bg-surface-container-high rounded">
                      <p className="text-[8px] text-outline font-bold uppercase">Discipline</p>
                      <p className="text-body-sm font-bold mt-0.5">{selectedReview.hrDiscipline ?? '-'}</p>
                    </div>
                    <div className="p-2 bg-surface-container-high rounded">
                      <p className="text-[8px] text-outline font-bold uppercase">Initiative</p>
                      <p className="text-body-sm font-bold mt-0.5">{selectedReview.hrInitiative ?? '-'}</p>
                    </div>
                    <div className="p-2 bg-surface-container-high rounded">
                      <p className="text-[8px] text-outline font-bold uppercase">Conduct</p>
                      <p className="text-body-sm font-bold mt-0.5">{selectedReview.hrConduct ?? '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Evaluator Notes */}
            <div className="space-y-2">
              <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Manager Evaluation Notes</h4>
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                <p className="text-body-sm text-on-surface-variant italic">
                  "{selectedReview.comments || 'No evaluation notes provided.'}"
                </p>
              </div>
            </div>

            {/* HR Feedback Remarks */}
            {selectedReview.hrFeedbackNote && (
              <div className="space-y-2">
                <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">HR General Remarks</h4>
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                  <p className="text-body-sm text-on-surface-variant italic">
                    "{selectedReview.hrFeedbackNote}"
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {showManagementFeatures && !selectedReview.isPublished && (
                <button
                  onClick={async () => {
                    await handlePublishReview(selectedReview.id);
                    setSelectedReview(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-label-md font-bold transition-all"
                >
                  Release Review
                </button>
              )}
              <button
                onClick={() => setSelectedReview(null)}
                className="bg-primary hover:bg-blue-700 text-on-primary px-5 py-2 rounded-lg text-label-md font-bold transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Evaluation Draft Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6 animate-slide-in-up">
            <div className="flex justify-between items-start border-b border-outline-variant pb-4">
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface">New Performance Evaluation</h3>
                <p className="text-body-sm text-outline">Compile automatic activity metrics for an employee</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors text-outline hover:text-on-surface animate-fade-in"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-outline uppercase font-bold block">Select Employee</label>
                <select
                  required
                  value={createReviewForm.subjectId}
                  onChange={(e) => setCreateReviewForm({ ...createReviewForm, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium cursor-pointer"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold block">Cycle Type</label>
                  <select
                    value={createReviewForm.periodType}
                    onChange={(e) => setCreateReviewForm({ ...createReviewForm, periodType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium cursor-pointer"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold block">Period / Cycle</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-Q1, 2026-06"
                    value={createReviewForm.period}
                    onChange={(e) => setCreateReviewForm({ ...createReviewForm, period: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-outline uppercase font-bold block">Evaluator Comments & Notes</label>
                <textarea
                  placeholder="Enter manager remarks, feedback, or justification for the review..."
                  value={createReviewForm.comments}
                  onChange={(e) => setCreateReviewForm({ ...createReviewForm, comments: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-label-md font-bold transition-all cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 bg-primary hover:bg-blue-750 text-on-primary rounded-xl text-label-md font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? 'Compiling...' : 'Calculate & Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
