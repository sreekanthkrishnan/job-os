import React, { useEffect, useState } from 'react';
import { Resume } from '@/types';
import { resumesApi } from '@/services/resumesApi';
import { ResumeUploadModal } from './ResumeUploadModal';
import { ResumeDetailModal } from './ResumeDetailModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  FileText, Upload, Search, Trash2, Eye,
  CheckCircle2, Archive, ArrowUpRight
} from 'lucide-react';

export const ResumesView: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const data = await resumesApi.getResumes();
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadSuccess = (newResume: Resume) => {
    if (newResume) {
      setResumes((prev) => [newResume, ...(Array.isArray(prev) ? prev : [])]);
    }
  };

  const handleToggleArchive = async (resume: Resume) => {
    if (!resume) return;
    try {
      const updated = await resumesApi.updateResume(resume.id, {
        is_active: !resume.is_active,
      });
      setResumes((prev) => (Array.isArray(prev) ? prev.map((r) => (r && r.id === updated.id ? updated : r)) : []));
    } catch (err) {
      console.error('Failed to update resume status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumesApi.deleteResume(id);
      setResumes((prev) => (Array.isArray(prev) ? prev.filter((r) => r && r.id !== id) : []));
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleReanalyze = async (id: string) => {
    try {
      const updated = await resumesApi.analyzeResume(id);
      setResumes((prev) => (Array.isArray(prev) ? prev.map((r) => (r && r.id === updated.id ? updated : r)) : []));
      if (selectedResume?.id === id) {
        setSelectedResume(updated);
      }
    } catch (err) {
      console.error('Failed to re-analyze resume:', err);
    }
  };

  const safeResumes = Array.isArray(resumes) ? resumes.filter((r): r is Resume => Boolean(r && typeof r === 'object')) : [];

  const filteredResumes = safeResumes.filter((r) => {
    const nameStr = r.name || '';
    const roleStr = r.target_role || '';
    const matchesSearch =
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? Boolean(r.is_active)
        : !r.is_active;
    return matchesSearch && matchesFilter;
  });

  const activeCount = safeResumes.filter((r) => r.is_active).length;
  const archivedCount = safeResumes.filter((r) => !r.is_active).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Resume Vault & Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Upload multiple target resumes. Google Gemini converts them into structured JSON profiles to compare and optimize for any job.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="shrink-0 shadow-lg shadow-indigo-500/20">
          <Upload className="w-4 h-4 mr-2" /> Upload Resume
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search resumes or target roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === 'active' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'archived' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('archived')}
          >
            Archived ({archivedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All ({safeResumes.length})
          </Button>
        </div>
      </div>

      {/* Resumes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 glass-panel rounded-xl animate-pulse p-5 space-y-3">
              <div className="h-5 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800/60 rounded w-1/2" />
              <div className="h-10 bg-slate-800/40 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResumes.map((resume) => {
            const profile = resume.parsed_data || {};
            const topSkills = (profile.skills || resume.resume_skills?.map((s) => s.name) || []).slice(0, 5);

            return (
              <Card
                key={resume.id}
                className="hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <h3 className="font-bold text-slate-100 text-sm truncate">{resume.name}</h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 truncate">
                        Target Role: <span className="text-slate-200">{resume.target_role || 'General Software Role'}</span>
                      </p>
                    </div>
                    <Badge variant={resume.is_active ? 'indigo' : 'slate'} size="sm">
                      v{resume.version}
                    </Badge>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="emerald" size="sm" className="text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> AI Parsed
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      {(resume.file_size / (1024 * 1024)).toFixed(2)} MB • {resume.file_type.toUpperCase()}
                    </span>
                  </div>

                  {/* Skills Preview */}
                  {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {topSkills.map((sk) => (
                        <Badge key={sk} variant="slate" size="sm" className="text-[10px] normal-case">
                          {sk}
                        </Badge>
                      ))}
                      {(profile.skills?.length || 0) > 5 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{profile.skills!.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedResume(resume);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Preview Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(resume)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title={resume.is_active ? 'Archive Resume' : 'Activate Resume'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {resume.file_url && (
                    <a
                      href={resume.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Download <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Resumes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your PDF or DOCX resume to start comparing and optimizing for target job opportunities.
          </p>
          <Button onClick={() => setIsUploadOpen(true)} className="mt-2">
            <Upload className="w-4 h-4 mr-2" /> Upload First Resume
          </Button>
        </Card>
      )}

      {/* Modals */}
      <ResumeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <ResumeDetailModal
        resume={selectedResume}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onReanalyze={handleReanalyze}
      />
    </div>
  );
};
