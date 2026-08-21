import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SkillGapHeatmapProps {
  topMissingSkills: Array<{ skill_name: string; count: number }>;
}

export const SkillGapHeatmapWidget: React.FC<SkillGapHeatmapProps> = ({ topMissingSkills }) => {
  const navigate = useNavigate();

  if (!topMissingSkills || topMissingSkills.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Flame className="w-4 h-4 text-rose-400" />
          <h3 className="font-semibold text-sm text-slate-100">Skill Gap Heatmap</h3>
        </div>
        <p className="text-xs text-slate-400 py-4 text-center">
          Zero missing skills detected! All saved job requirements match your profile.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          <h3 className="font-semibold text-sm text-slate-100">Skill Gap Heatmap</h3>
        </div>
        <span className="text-xs text-slate-300 font-mono font-medium">Most In-Demand Skills</span>
      </div>

      <p className="text-xs text-slate-300 font-medium">
        Skills below are missing from your profile but frequently requested across your active job postings:
      </p>

      <div className="flex flex-wrap gap-2">
        {topMissingSkills.map((sk) => (
          <Badge key={sk.skill_name} variant="rose" size="md" className="normal-case">
            <span>{sk.skill_name}</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-900/80 text-rose-200 text-[11px] font-bold border border-rose-700/50">
              {sk.count} Jobs
            </span>
          </Badge>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/courses')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Find Courses to Learn Skills
        </Button>
      </div>
    </Card>
  );
};
