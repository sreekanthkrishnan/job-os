import React from 'react';
import { Job } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InterviewTimeline } from '@/features/interviews/InterviewTimeline';
import { Building2, MapPin, Calendar, ExternalLink, CheckCircle2, XCircle, DollarSign, Award } from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!job) return null;

  const matchScore = typeof job.match_score === 'string' ? parseFloat(job.match_score) : job.match_score;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${job.role} @ ${job.company}`} maxWidth="2xl">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-100">{job.company}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Applied: {job.applied_date}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="indigo" size="md">
              {job.status.replace('_', ' ')}
            </Badge>
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="View Job Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Match Score Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Skills Match Score</span>
            </div>
            <span className="text-xl font-bold text-indigo-400">{matchScore}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
            />
          </div>
        </div>

        {/* Skills Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matching Skills */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Matching Skills ({job.matching_skills?.length || 0})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {job.matching_skills && job.matching_skills.length > 0 ? (
                job.matching_skills.map((skill) => (
                  <Badge key={skill} variant="emerald" size="sm" className="normal-case">
                    ✓ {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No skills currently matching profile</span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-4 h-4" />
              <span>Missing Skills ({job.missing_skills?.length || 0})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {job.missing_skills && job.missing_skills.length > 0 ? (
                job.missing_skills.map((skill) => (
                  <Badge key={skill} variant="rose" size="sm" className="normal-case">
                    ✕ {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-emerald-400 font-medium">100% skill match! Zero missing skills.</span>
              )}
            </div>
          </div>
        </div>

        {/* Interview Timeline Module */}
        <div className="pt-2 border-t border-slate-800">
          <InterviewTimeline jobId={job.id} />
        </div>

        {/* Job Description Text */}
        {job.raw_description && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Job Description Notes</h4>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
              {job.raw_description}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              onClose();
              onEdit(job);
            }}
          >
            Edit Application
          </Button>
        </div>
      </div>
    </Modal>
  );
};
