import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { resumesApi } from '@/services/resumesApi';
import { Job, ResumeOptimization } from '@/types';
import { Sparkles, AlertCircle, TrendingUp, Key, FileText, Loader2 } from 'lucide-react';

interface ResumeOptimizerModalProps {
  job: Job | null;
  resumeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeOptimizerModal: React.FC<ResumeOptimizerModalProps> = ({
  job,
  resumeId,
  isOpen,
  onClose,
}) => {
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && job) {
      fetchOptimization();
    }
  }, [isOpen, job, resumeId]);

  const fetchOptimization = async () => {
    if (!job) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await resumesApi.optimizeResumeForJob(job.id, resumeId);
      setOptimization(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate resume optimization recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) return null;

  const currentScore = optimization ? parseFloat(String(optimization.current_score)) : 0;
  const potentialScore = optimization ? parseFloat(String(optimization.potential_score)) : 0;
  const improvement = optimization ? parseFloat(String(optimization.potential_improvement)) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Resume Optimization for ${job.role} @ ${job.company}`} maxWidth="2xl">
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Analyzing job description & generating truthful optimization advice...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : optimization ? (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Score Improvement Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Suitability</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-100">{currentScore}%</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-4 h-4" /> +{improvement}% Potential
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Potential Target</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{potentialScore}%</p>
            </div>
          </div>

          {/* Missing Keywords */}
          {optimization.missing_keywords && optimization.missing_keywords.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Key className="w-4 h-4" />
                <span>Missing Key Skills & Terms ({optimization.missing_keywords.length})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Consider adding these if you have actual hands-on experience:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {optimization.missing_keywords.map((kw) => (
                  <Badge key={kw} variant="amber" size="sm" className="normal-case">
                    ⚠ {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Weak Sections */}
          {optimization.weak_sections && optimization.weak_sections.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Sections to Enhance</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {optimization.weak_sections.map((sec) => (
                  <Badge key={sec} variant="slate" size="sm" className="normal-case">
                    {sec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Improvement Suggestions */}
          {optimization.suggested_improvements && optimization.suggested_improvements.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Truthful Actionable Improvements</span>
              </div>
              <ul className="space-y-2">
                {optimization.suggested_improvements.map((imp, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-500 italic">
            * JobOS AI strictly adheres to truthful resume optimization principles. Never invent companies, dates, or skills you have not used.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
