import React, { useState } from 'react';
import { Resume } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, CheckCircle2, Download, Sparkles } from 'lucide-react';

interface ResumeDetailModalProps {
  resume: Resume | null;
  isOpen: boolean;
  onClose: () => void;
  onReanalyze: (resumeId: string) => void;
}

export const ResumeDetailModal: React.FC<ResumeDetailModalProps> = ({
  resume,
  isOpen,
  onClose,
  onReanalyze,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'skills' | 'raw'>('profile');

  if (!resume) return null;

  const profile = resume.parsed_data || {};
  const skills = profile.skills || resume.resume_skills?.map(s => s.name) || [];
  const categories = profile.skill_categories || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resume.name} maxWidth="2xl">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Metadata Banner */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-base">{profile.candidate_name || resume.name}</span>
              <Badge variant="indigo" size="sm">v{resume.version}</Badge>
              {resume.is_active ? (
                <Badge variant="emerald" size="sm">Active</Badge>
              ) : (
                <Badge variant="slate" size="sm">Archived</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Target Role: <span className="text-slate-200 font-medium">{resume.target_role || 'General Software Engineering'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {resume.file_url && (
              <a
                href={resume.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Original
              </a>
            )}
            <Button size="sm" variant="outline" onClick={() => onReanalyze(resume.id)}>
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Re-Analyze with AI
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'experience'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Experience & History ({profile.experience?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'skills'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Skills Breakdown ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Extracted Raw Text
          </button>
        </div>

        {/* Tab 1: Profile Summary */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Seniority</span>
                <p className="text-sm font-bold text-slate-200">{profile.seniority_level || 'Mid-Senior'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Experience</span>
                <p className="text-sm font-bold text-indigo-400">{profile.years_of_experience || 0} Years</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Role</span>
                <p className="text-sm font-bold text-slate-200 truncate">{profile.current_role || resume.target_role || 'Software Engineer'}</p>
              </div>
            </div>

            {profile.professional_summary && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.professional_summary}</p>
              </div>
            )}

            {/* Quantifiable Achievements */}
            {profile.quantifiable_achievements && profile.quantifiable_achievements.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quantifiable Achievements</span>
                </div>
                <ul className="space-y-1.5 pt-1">
                  {profile.quantifiable_achievements.map((ach, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Experience */}
        {activeTab === 'experience' && (
          <div className="space-y-3">
            {profile.experience && profile.experience.length > 0 ? (
              profile.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{exp.role || 'Software Role'}</h4>
                      <p className="text-xs text-indigo-400 font-medium">{exp.company || 'Company'}</p>
                    </div>
                    {exp.duration && (
                      <Badge variant="slate" size="sm">
                        <Calendar className="w-3 h-3 mr-1" /> {exp.duration}
                      </Badge>
                    )}
                  </div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="space-y-1 pt-1 text-xs text-slate-300">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="text-slate-500">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center">No explicit work experience entries extracted.</p>
            )}
          </div>
        )}

        {/* Tab 3: Skills Breakdown */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            {Object.keys(categories).length > 0 ? (
              Object.entries(categories).map(([catName, catSkills]) => {
                if (!Array.isArray(catSkills) || catSkills.length === 0) return null;
                return (
                  <div key={catName} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{catName}</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {catSkills.map((sk) => (
                        <Badge key={sk} variant="indigo" size="sm" className="normal-case">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk) => (
                  <Badge key={sk} variant="indigo" size="sm" className="normal-case">
                    {sk}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Raw Text */}
        {activeTab === 'raw' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {resume.raw_text || 'No raw text extracted.'}
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
