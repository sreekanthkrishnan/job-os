import React, { useState } from 'react';
import { Skill } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Award } from 'lucide-react';
import { skillsApi } from './skillsApi';

interface SkillCardProps {
  skill: Skill;
  onUpdate: () => void;
}

const CATEGORY_COLORS: Record<string, 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate'> = {
  frontend: 'indigo',
  backend: 'purple',
  database: 'cyan',
  devops: 'emerald',
  cloud: 'amber',
  testing: 'rose',
  ai_ml: 'purple',
  soft_skills: 'slate',
  tools: 'indigo',
  other: 'slate',
};

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProficiencyChange = async (newProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert') => {
    try {
      setIsUpdating(true);
      await skillsApi.updateSkill(skill.id, { proficiency: newProficiency });
      onUpdate();
    } catch {
      // Handle error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${skill.name}" from your skills profile?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await skillsApi.deleteSkill(skill.id);
      onUpdate();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <Card hoverEffect className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{skill.name}</h3>
            <span className="text-[11px] text-slate-500 capitalize">{skill.category.replace('_', ' ')}</span>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
          title="Delete Skill"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        {/* Category Pill */}
        <Badge variant={CATEGORY_COLORS[skill.category] || 'slate'} size="sm">
          {skill.category.replace('_', ' ')}
        </Badge>

        {/* Proficiency Selector Pill */}
        <select
          value={skill.proficiency}
          disabled={isUpdating}
          onChange={(e) => handleProficiencyChange(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>
    </Card>
  );
};
