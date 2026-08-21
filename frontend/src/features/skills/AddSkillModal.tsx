import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { skillsApi, NormalizePreviewResult } from './skillsApi';
import { Award, Sparkles, Check } from 'lucide-react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'testing', label: 'Testing' },
  { value: 'ai_ml', label: 'AI / ML' },
  { value: 'soft_skills', label: 'Soft Skills' },
  { value: 'tools', label: 'Tools' },
  { value: 'other', label: 'Other' },
];

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'Learning basics' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Working proficiency' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep technical expertise' },
  { value: 'expert', label: 'Expert', desc: 'Mastery / Architect level' },
];

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('other');
  const [proficiency, setProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [preview, setPreview] = useState<NormalizePreviewResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview normalization on skill name typing
  useEffect(() => {
    if (!skillName || !skillName.trim()) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await skillsApi.previewNormalize(skillName);
        setPreview(res);
        if (res.inferred_category && res.inferred_category !== 'other') {
          setCategory(res.inferred_category);
        }
      } catch {
        // Ignore preview errors
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [skillName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError('Please enter a skill name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await skillsApi.createSkill({
        name: skillName.trim(),
        category,
        proficiency,
        source: 'manual',
      });
      setSkillName('');
      setCategory('other');
      setProficiency('intermediate');
      setPreview(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Skill to Profile" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Skill Name"
          placeholder="e.g. ReactJS, Postgres, TypeScript, Docker"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          leftIcon={<Award className="w-4 h-4" />}
          error={error || undefined}
        />

        {/* Live Normalization Feedback Card */}
        {preview && preview.canonical && (
          <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-400">Normalizes to: </span>
                <span className="font-bold text-slate-100">{preview.canonical}</span>
              </div>
            </div>
            {preview.inferred_category !== 'other' && (
              <Badge variant="indigo" size="sm">
                Auto-Category: {preview.inferred_category}
              </Badge>
            )}
          </div>
        )}

        {/* Category Picker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                  category === cat.value
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proficiency Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Proficiency Level</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROFICIENCY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProficiency(p.value as any)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  proficiency === p.value
                    ? 'bg-purple-950/30 border-purple-500/50 text-slate-100'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">{p.label}</span>
                  {proficiency === p.value && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            Save Skill to Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
