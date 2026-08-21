import React, { useEffect, useState } from 'react';
import { Job, ResumeJobAnalysis } from '@/types';
import { resumesApi } from '@/services/resumesApi';
import { ResumeOptimizerModal } from './ResumeOptimizerModal';
import { ColdEmailModal } from '../outreach/ColdEmailModal';
import { LinkedInMessageModal } from '../outreach/LinkedInMessageModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Trophy, Sparkles, CheckCircle2, XCircle, FileText, Mail, MessageSquare, Loader2, Check
} from 'lucide-react';

interface ResumeJobAnalysisTabProps {
  job: Job;
  onJobUpdated?: () => void;
}

export const ResumeJobAnalysisTab: React.FC<ResumeJobAnalysisTabProps> = ({
  job,
  onJobUpdated,
}) => {
  const [analyses, setAnalyses] = useState<ResumeJobAnalysis[]>([]);
  const [recommended, setRecommended] = useState<ResumeJobAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(job.applied_resume || null);

  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await resumesApi.getJobResumeAnalyses(job.id);
      setAnalyses(data);
      const topRec = data.find((a) => a.is_recommended) || data[0] || null;
      setRecommended(topRec);
    } catch (err) {
      console.error('Failed to fetch resume analyses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [job.id]);

  const handleAnalyzeResumes = async () => {
    setIsAnalyzing(true);
    try {
      const data = await resumesApi.analyzeJobResumes(job.id);
      setAnalyses(data);
      const topRec = data.find((a) => a.is_recommended) || data[0] || null;
      setRecommended(topRec);
    } catch (err) {
      console.error('Failed to analyze resumes for job:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectResume = async (resumeId: string) => {
    try {
      await resumesApi.selectJobResume(job.id, resumeId);
      setSelectedResumeId(resumeId);
      if (onJobUpdated) onJobUpdated();
    } catch (err) {
      console.error('Failed to select resume for job:', err);
    }
  };

  const currentAnalysis = analyses.find((a) => a.resume === selectedResumeId) || recommended || analyses[0];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Resume Intelligence Copilot</h3>
          </div>
          <p className="text-xs text-slate-400">
            Compare all active resumes against this job description to discover your best fit and probability of response.
          </p>
        </div>

        <Button onClick={handleAnalyzeResumes} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Comparing Resumes...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              {analyses.length > 0 ? 'Re-Analyze Resumes' : 'Analyze My Resumes'}
            </span>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading Resume Intelligence...</p>
        </div>
      ) : analyses.length === 0 ? (
        <Card className="text-center py-10 space-y-3">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-200">No Resume Analyses Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Analyze My Resumes" above to evaluate all your active resumes against this job description.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Recommended Resume Hero Card */}
          {recommended && (
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-950/80 via-slate-900 to-purple-950/50 border border-indigo-500/40 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">🏆 Recommended Resume</span>
                    <h4 className="text-base font-bold text-slate-100">{recommended.resume_name}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedResumeId === recommended.resume ? (
                    <Badge variant="emerald" size="md">
                      <Check className="w-3.5 h-3.5 mr-1" /> Selected for Application
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleSelectResume(recommended.resume)}>
                      Use This Resume
                    </Button>
                  )}
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Suitability</span>
                  <p className="text-xl font-extrabold text-indigo-400">{recommended.suitability_score}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ATS Compatibility</span>
                  <p className="text-xl font-extrabold text-emerald-400">{recommended.ats_score}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Skill Match</span>
                  <p className="text-xl font-extrabold text-purple-400">{recommended.skill_match_score}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Call Prob.</span>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-extrabold text-cyan-400">{recommended.ai_call_probability_estimate}%</p>
                    <Badge variant="indigo" size="sm">{recommended.ai_confidence}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume Comparison List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">All Resumes Ranked ({analyses.length})</h4>
            <div className="space-y-2">
              {analyses.map((an, idx) => {
                const isSelected = selectedResumeId === an.resume;
                return (
                  <div
                    key={an.id}
                    className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">{an.resume_name}</span>
                          <span className="text-xs text-slate-400">v{an.resume_version}</span>
                          {an.is_recommended && <Badge variant="amber" size="sm">🏆 Best Fit</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Call Probability Estimate: <span className="text-cyan-400 font-semibold">{an.ai_call_probability_estimate}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-bold text-indigo-400">{an.suitability_score}%</span>
                        <span className="text-[10px] text-slate-500 block">Suitability</span>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        onClick={() => handleSelectResume(an.resume)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Resume Deep Dive Breakdown */}
          {currentAnalysis && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detailed Assessment — {currentAnalysis.resume_name}
                </h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsOptimizerOpen(true)}>
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Optimize Resume
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEmailModalOpen(true)}>
                    <Mail className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Cold Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsLinkedInModalOpen(true)}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-cyan-400" /> LinkedIn
                  </Button>
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Candidate Strengths ({currentAnalysis.strengths?.length || 0})</span>
                  </div>
                  <ul className="space-y-1.5 pt-1 text-xs text-slate-300">
                    {currentAnalysis.strengths && currentAnalysis.strengths.length > 0 ? (
                      currentAnalysis.strengths.map((str, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No specific strengths highlighted.</li>
                    )}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <XCircle className="w-4 h-4" />
                    <span>Gaps & Weaknesses ({currentAnalysis.weaknesses?.length || 0})</span>
                  </div>
                  <ul className="space-y-1.5 pt-1 text-xs text-slate-300">
                    {currentAnalysis.weaknesses && currentAnalysis.weaknesses.length > 0 ? (
                      currentAnalysis.weaknesses.map((wk, wIdx) => (
                        <li key={wIdx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-400 italic">Zero major gaps identified!</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sub-modals */}
          <ResumeOptimizerModal
            job={job}
            resumeId={currentAnalysis?.resume}
            isOpen={isOptimizerOpen}
            onClose={() => setIsOptimizerOpen(false)}
          />

          <ColdEmailModal
            job={job}
            resumeId={currentAnalysis?.resume}
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
          />

          <LinkedInMessageModal
            job={job}
            resumeId={currentAnalysis?.resume}
            isOpen={isLinkedInModalOpen}
            onClose={() => setIsLinkedInModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
