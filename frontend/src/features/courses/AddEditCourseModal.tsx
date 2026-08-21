import React, { useState, useEffect } from 'react';
import { Course } from '@/types';
import { coursesApi, CreateCoursePayload } from './coursesApi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, Link as LinkIcon, Calendar, Plus, X, Sparkles } from 'lucide-react';

interface AddEditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseToEdit?: Course | null;
}

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed (Auto-Add Skills)' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' },
];

export const AddEditCourseModal: React.FC<AddEditCourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'planned' | 'in_progress' | 'completed' | 'paused' | 'dropped'>('in_progress');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseToEdit) {
      setName(courseToEdit.name);
      setDescription(courseToEdit.description || '');
      setProvider(courseToEdit.provider || '');
      setCourseUrl(courseToEdit.course_url || '');
      setTargetCompletionDate(courseToEdit.target_completion_date || '');
      setProgress(courseToEdit.progress);
      setStatus(courseToEdit.status);
      setSkills(courseToEdit.skills || []);
    } else {
      setName('');
      setDescription('');
      setProvider('');
      setCourseUrl('');
      setTargetCompletionDate('');
      setProgress(0);
      setStatus('in_progress');
      setSkills([]);
    }
  }, [courseToEdit, isOpen]);

  const handleAddSkillTag = (rawInput?: string) => {
    const textToProcess = rawInput !== undefined ? rawInput : skillInput;
    if (!textToProcess.trim()) return;

    const cleanedText = textToProcess.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
    const newItems = cleanedText.split(/,|\n/).map(item => item.trim()).filter(item => item.length > 0);

    setSkills(prev => {
      const updated = [...prev];
      newItems.forEach(item => {
        if (!updated.includes(item)) updated.push(item);
      });
      return updated;
    });

    setSkillInput('');
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      handleAddSkillTag(value);
    } else {
      setSkillInput(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Course name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateCoursePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      provider: provider.trim() || undefined,
      course_url: courseUrl.trim() || undefined,
      target_completion_date: targetCompletionDate || undefined,
      progress,
      status: progress >= 100 ? 'completed' : status,
      skills,
    };

    try {
      if (courseToEdit) {
        await coursesApi.updateCourse(courseToEdit.id, payload);
      } else {
        await coursesApi.createCourse(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={courseToEdit ? 'Edit Course Record' : 'Add New Learning Course'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Course Name *"
          placeholder="e.g. AWS Solutions Architect / React Performance Mastery"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<GraduationCap className="w-4 h-4" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Provider / Platform"
            placeholder="e.g. Udemy, Coursera, Pluralsight, YouTube"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          <Input
            label="Target Completion Date"
            type="date"
            value={targetCompletionDate}
            onChange={(e) => setTargetCompletionDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        <Input
          label="Course Link / URL"
          type="url"
          placeholder="https://udemy.com/course/aws-certified"
          value={courseUrl}
          onChange={(e) => setCourseUrl(e.target.value)}
          leftIcon={<LinkIcon className="w-4 h-4" />}
        />

        {/* Progress Slider */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Course Completion Progress</span>
            <span className="text-indigo-400 font-bold">{progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setProgress(val);
              if (val >= 100) setStatus('completed');
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          {progress >= 100 && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Complete: Skills below will automatically be added to your profile!</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Skills Covered */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Skills Covered in Course (Auto-added upon 100% completion)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste comma-separated skills (e.g. AWS, EC2, S3, IAM) or single skill..."
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
              <Plus className="w-4 h-4" /> Add Skills
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((s) => (
                <Badge key={s} variant="purple" size="sm" className="normal-case">
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter(sk => sk !== s))}
                    className="ml-1 text-purple-400 hover:text-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {courseToEdit ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
