import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roadmapsApi, CreateRoadmapPayload } from './roadmapsApi';
import { LearningRoadmap } from '@/types';
import { Sparkles, Clock } from 'lucide-react';

interface CreateRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRoadmap: LearningRoadmap) => void;
  initialTopic?: string;
  initialTargetRole?: string;
}

const REASON_OPTIONS = [
  { value: 'Career / Job Switch', label: 'Career / Job Switch' },
  { value: 'Upskilling for Current Role', label: 'Upskilling for Current Role' },
  { value: 'Interview Preparation', label: 'Interview Preparation' },
  { value: 'Building a Project', label: 'Building a Project' },
  { value: 'Personal Interest', label: 'Personal Interest' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export const CreateRoadmapModal: React.FC<CreateRoadmapModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTopic = '',
  initialTargetRole = ''
}) => {
  const [goal, setGoal] = useState(initialTopic);
  const [reason, setReason] = useState('Career / Job Switch');
  const [currentLevel, setCurrentLevel] = useState('intermediate');
  const [targetLevel, setTargetLevel] = useState('advanced');
  const [weeklyHours, setWeeklyHours] = useState(7);
  const [targetRole, setTargetRole] = useState(initialTargetRole || '');
  const [targetDate, setTargetDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError('Please specify what you want to learn.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const payload: CreateRoadmapPayload = {
        goal: goal.trim(),
        reason,
        current_level: currentLevel,
        target_level: targetLevel,
        weekly_hours: Number(weeklyHours),
        target_role: targetRole,
        target_date: targetDate
      };
      const roadmap = await roadmapsApi.generateRoadmap(payload);
      onSuccess(roadmap);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Learning roadmap generation is temporarily unavailable. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isGenerating && onClose()}
      title="Create Learning Roadmap"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>AI Learning Architect — Google Gemini 3.6</span>
          </div>
          <p className="text-xs text-slate-300">
            Tell JobOS what you want to learn. Gemini will analyze your current skills and target role to create a personalized multi-phase learning path.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* What do you want to learn? (Required) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-200">
            What do you want to learn? <span className="text-rose-400">*</span>
          </label>
          <Input
            placeholder="e.g. Django for Backend Development, React Performance, System Design, AWS..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isGenerating}
            required
            autoFocus
          />
          <p className="text-[11px] text-slate-400">
            Minimum required input: Enter any skill, topic, or career technology.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Why learning */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">Why are you learning this?</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">Related Target Role</label>
            <Input
              placeholder="e.g. Full Stack Engineer, Senior Python Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Current Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">Current Level</label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">Target Level</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weekly Learning Time */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Weekly Learning Time</span>
              </label>
              <span className="text-indigo-400 font-bold">{weeklyHours} hours/week</span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              disabled={isGenerating}
              className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">Target Date (Optional)</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            isLoading={isGenerating}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            {isGenerating ? 'Generating AI Roadmap...' : 'Generate Roadmap'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
