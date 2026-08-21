import React, { useState, useEffect } from 'react';
import { Job, JobStatus } from '@/types';
import { jobsApi, CreateJobPayload, AnalyzeJobResponse } from './jobsApi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase, Building2, MapPin, DollarSign, Calendar, Link as LinkIcon,
  X, Plus, Sparkles, FileText, ArrowRight
} from 'lucide-react';

interface AddEditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobToEdit?: Job | null;
}

const STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'technical', label: 'Technical Round' },
  { value: 'managerial', label: 'Managerial Round' },
  { value: 'hr', label: 'HR Round' },
  { value: 'offer', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'on_hold', label: 'On Hold' },
];

export const AddEditJobModal: React.FC<AddEditJobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  jobToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_parser'>('manual');

  // Form Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract' | 'internship'>('full_time');
  const [salary, setSalary] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobStatus>('applied');
  const [jobUrl, setJobUrl] = useState('');
  const [rawDescription, setRawDescription] = useState('');
  
  // Skills Tag Input
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // AI Parser State
  const [jdPasteText, setJdPasteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeJobResponse | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobToEdit) {
      setActiveTab('manual');
      setCompany(jobToEdit.company);
      setRole(jobToEdit.role);
      setLocation(jobToEdit.location || '');
      setWorkMode(jobToEdit.work_mode || 'remote');
      setEmploymentType(jobToEdit.employment_type || 'full_time');
      setSalary(jobToEdit.salary || '');
      setAppliedDate(jobToEdit.applied_date);
      setStatus(jobToEdit.status);
      setJobUrl(jobToEdit.job_url || '');
      setRawDescription(jobToEdit.raw_description || '');
      const existingSkills = jobToEdit.job_skills?.map(js => js.skill_name) || jobToEdit.required_skills || [];
      setSkills(existingSkills);
    } else {
      setActiveTab('manual');
      setCompany('');
      setRole('');
      setLocation('');
      setWorkMode('remote');
      setEmploymentType('full_time');
      setSalary('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setStatus('applied');
      setJobUrl('');
      setRawDescription('');
      setSkills([]);
      setJdPasteText('');
      setAnalysisResult(null);
    }
  }, [jobToEdit, isOpen]);

  // Handle Comma-Separated & Bulk Skill Tag Addition
  const handleAddSkillTag = (rawInput?: string) => {
    const textToProcess = rawInput !== undefined ? rawInput : skillInput;
    if (!textToProcess.trim()) return;

    // Clean brackets if user pasted [ Skill1, Skill2 ]
    const cleanedText = textToProcess.replace(/^\[\s*/, '').replace(/\s*\]$/, '');

    // Split by comma ',' or newline '\n'
    const newItems = cleanedText
      .split(/,|\n/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    setSkills(prev => {
      const updated = [...prev];
      newItems.forEach(item => {
        if (!updated.includes(item)) {
          updated.push(item);
        }
      });
      return updated;
    });

    setSkillInput('');
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If the input contains a comma, process everything up to the last comma immediately
    if (value.includes(',')) {
      handleAddSkillTag(value);
    } else {
      setSkillInput(value);
    }
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // AI Description Analysis Handler
  const handleAnalyzeJD = async () => {
    if (!jdPasteText.trim()) {
      setError('Please paste a job description text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await jobsApi.analyzeJobDescription(jdPasteText.trim());
      setAnalysisResult(res);

      // Pre-fill form fields with AI extracted data
      if (res.company) setCompany(res.company);
      if (res.role) setRole(res.role);
      if (res.location) setLocation(res.location);
      if (res.work_mode) setWorkMode(res.work_mode);
      if (res.employment_type) setEmploymentType(res.employment_type);
      if (res.salary) setSalary(res.salary);
      if (res.required_skills && res.required_skills.length > 0) {
        setSkills(res.required_skills);
      }
      setRawDescription(jdPasteText.trim());

      // Auto-switch to Form Review Tab
      setActiveTab('manual');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze job description.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !appliedDate) {
      setError('Company, Role, and Applied Date are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateJobPayload = {
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || undefined,
      work_mode: workMode,
      employment_type: employmentType,
      salary: salary.trim() || undefined,
      applied_date: appliedDate,
      status,
      job_url: jobUrl.trim() || undefined,
      raw_description: rawDescription.trim() || undefined,
      skills,
    };

    try {
      if (jobToEdit) {
        await jobsApi.updateJob(jobToEdit.id, payload);
      } else {
        await jobsApi.createJob(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save job application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jobToEdit ? 'Edit Job Application' : 'Add New Job Application'}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Mode Switch Tabs (Only for new jobs) */}
        {!jobToEdit && (
          <div className="flex p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Manual Entry & Review</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai_parser')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ai_parser'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>Paste JD & AI Auto-Parse</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* AI Analysis Preview Banner */}
        {analysisResult && activeTab === 'manual' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">AI Extraction Complete — Review Fields Below</span>
              </div>
              <Badge variant="purple" size="sm">
                Match Score: {analysisResult.match_score}%
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-emerald-400">✓ Matching ({analysisResult.matching_skills.length}): {analysisResult.matching_skills.join(', ') || 'None'}</span>
              <span className="text-rose-400">✕ Missing ({analysisResult.missing_skills.length}): {analysisResult.missing_skills.join(', ') || 'None'}</span>
            </div>
          </div>
        )}

        {/* TAB 2: AI PARSER MODE */}
        {activeTab === 'ai_parser' && !jobToEdit ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Paste Complete Job Description Text
              </label>
              <textarea
                rows={10}
                placeholder="Paste the full job posting description here (requirements, responsibilities, salary, role details)..."
                value={jdPasteText}
                onChange={(e) => setJdPasteText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-4 focus:outline-none focus:border-purple-500 placeholder-slate-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                isLoading={isAnalyzing}
                onClick={handleAnalyzeJD}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Analyze Job Description with AI
              </Button>
            </div>
          </div>
        ) : (
          /* TAB 1: MANUAL FORM ENTRY & EDIT */
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                placeholder="e.g. Stripe, Airbnb, Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
                required
              />

              <Input
                label="Job Role / Title *"
                placeholder="e.g. Senior React Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Applied Date *"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Work Mode</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Location"
                placeholder="e.g. San Francisco, CA / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />

              <Input
                label="Salary Range"
                placeholder="e.g. $140,000 - $165,000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                leftIcon={<DollarSign className="w-4 h-4" />}
              />

              <Input
                label="Job Posting URL"
                type="url"
                placeholder="https://company.com/careers/job"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                leftIcon={<LinkIcon className="w-4 h-4" />}
              />
            </div>

            {/* Required Skills Tag Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Extracted / Required Skills ({skills.length})
                </label>
                <span className="text-[11px] text-slate-500">
                  Paste comma-separated string (e.g. Python, Docker, GCP)
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste comma-separated skills (e.g. Python, Go, Docker, Kubernetes, GCP) or type single skill..."
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkillTag();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => handleAddSkillTag()}>
                  <Plus className="w-4 h-4" /> Add Tags
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="indigo" size="sm" className="normal-case">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillTag(skill)}
                        className="ml-1 text-indigo-400 hover:text-indigo-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Raw Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Job Description Notes</label>
              <textarea
                rows={4}
                placeholder="Paste raw job description or interview notes..."
                value={rawDescription}
                onChange={(e) => setRawDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" isLoading={isSubmitting}>
                {jobToEdit ? 'Save Changes' : 'Save Job Record'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
