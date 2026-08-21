import React, { useState, useEffect, useCallback } from 'react';
import { Interview } from '@/types';
import { interviewsApi } from './interviewsApi';
import { AddEditInterviewModal } from './AddEditInterviewModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Calendar, User, Plus, Edit3, Trash2 } from 'lucide-react';

interface InterviewTimelineProps {
  jobId: string;
}

const RESULT_VARIANTS: Record<string, 'emerald' | 'cyan' | 'indigo' | 'rose' | 'amber' | 'slate'> = {
  scheduled: 'cyan',
  completed: 'indigo',
  passed: 'emerald',
  failed: 'rose',
  rescheduled: 'amber',
  cancelled: 'slate',
};

const ROUND_TYPE_LABELS: Record<string, string> = {
  hr_screening: 'HR Screening',
  technical: 'Technical Round',
  coding: 'Coding Challenge',
  system_design: 'System Design',
  managerial: 'Managerial Round',
  hr: 'HR Round',
  final: 'Final Round',
  other: 'Other Round',
};

export const InterviewTimeline: React.FC<InterviewTimelineProps> = ({ jobId }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await interviewsApi.getJobInterviews(jobId);
      setInterviews(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this interview round?')) return;
    try {
      await interviewsApi.deleteInterview(id);
      fetchInterviews();
    } catch {
      // Handle error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Interview Rounds Timeline</h3>
          <p className="text-[11px] text-slate-400">Track interview progress, scheduling, and round feedback.</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            setEditingInterview(null);
            setIsModalOpen(true);
          }}
        >
          Schedule Round
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No interview rounds scheduled yet</p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Schedule HR screening, technical, coding, or managerial rounds to track your application timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {interviews.map((iv) => {
            const dt = new Date(iv.scheduled_at);
            const dateStr = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={iv.id} className="relative group">
                {/* Node Icon Indicator */}
                <div className={`absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-slate-950 ${
                  iv.result === 'passed' ? 'border-emerald-500 text-emerald-400' :
                  iv.result === 'failed' ? 'border-rose-500 text-rose-400' : 'border-indigo-500 text-indigo-400'
                }`} />

                {/* Timeline Card */}
                <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">
                          {ROUND_TYPE_LABELS[iv.round_type] || iv.round_type || 'Interview Round'}
                        </span>
                        <Badge variant={RESULT_VARIANTS[iv.result] || 'indigo'} size="sm">
                          {iv.result}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {dateStr} at {timeStr}
                        </span>
                        {iv.interviewer && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-400" /> {iv.interviewer}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingInterview(iv);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-purple-400 rounded hover:bg-slate-800"
                        title="Edit Round"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(iv.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                        title="Delete Round"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes & Feedback */}
                  {(iv.notes || iv.feedback) && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      {iv.notes && (
                        <div className="text-slate-400">
                          <strong className="text-slate-300">Prep / Notes:</strong> {iv.notes}
                        </div>
                      )}
                      {iv.feedback && (
                        <div className="text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                          <strong className="text-emerald-300">Feedback:</strong> {iv.feedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      <AddEditInterviewModal
        jobId={jobId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInterview(null);
        }}
        onSuccess={fetchInterviews}
        interviewToEdit={editingInterview}
      />
    </div>
  );
};
