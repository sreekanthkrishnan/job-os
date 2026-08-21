import React, { useState, useEffect, useCallback } from 'react';
import { LearningRoadmap } from '@/types';
import { roadmapsApi } from './roadmapsApi';
import { CreateRoadmapModal } from './CreateRoadmapModal';
import { RoadmapDetailView } from './RoadmapDetailView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Plus, Search, Compass, ArrowRight, Award, Zap
} from 'lucide-react';

export const RoadmapsView: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingSkillGap, setIsGeneratingSkillGap] = useState(false);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await roadmapsApi.getRoadmaps({ search: searchQuery });
      setRoadmaps(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleGenerateSkillGapRoadmap = async () => {
    try {
      setIsGeneratingSkillGap(true);
      const newRm = await roadmapsApi.generateFromSkillGap();
      await fetchRoadmaps();
      setSelectedRoadmapId(newRm.id);
    } catch {
      // Error
    } finally {
      setIsGeneratingSkillGap(false);
    }
  };

  if (selectedRoadmapId) {
    return (
      <RoadmapDetailView
        roadmapId={selectedRoadmapId}
        onBack={() => {
          setSelectedRoadmapId(null);
          fetchRoadmaps();
        }}
        onDeleteSuccess={() => {
          setSelectedRoadmapId(null);
          fetchRoadmaps();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">Learning Roadmaps</h2>
          <p className="text-xs text-slate-400">
            Structured, AI-generated technical roadmaps tailored to your existing profile skills and career goals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            isLoading={isGeneratingSkillGap}
            onClick={handleGenerateSkillGapRoadmap}
            leftIcon={<Zap className="w-4 h-4 text-amber-400" />}
          >
            Create Roadmap From Skill Gap
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Create Learning Roadmap
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="w-full md:w-80">
        <Input
          placeholder="Search roadmaps, goals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Roadmaps Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : roadmaps.length === 0 ? (
        <Card className="text-center py-16 px-4 space-y-4 border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-slate-200">No active learning roadmaps</h3>
            <p className="text-xs text-slate-400">
              Create your first AI learning roadmap or generate one directly from your profile skill gaps!
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Create Learning Roadmap
            </Button>
            <Button variant="outline" onClick={handleGenerateSkillGapRoadmap} isLoading={isGeneratingSkillGap}>
              Generate From Skill Gap
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map((rm) => (
            <Card
              key={rm.id}
              hoverEffect
              className="p-5 flex flex-col justify-between border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 space-y-4 cursor-pointer"
              onClick={() => setSelectedRoadmapId(rm.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={rm.status === 'completed' ? 'emerald' : 'indigo'} size="sm">
                    {rm.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-semibold text-indigo-400">
                    {rm.weekly_hours} hrs/wk
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {rm.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{rm.description || rm.goal}</p>
                </div>

                {rm.target_role && (
                  <p className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Target: {rm.target_role}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Progress</span>
                    <span className="text-emerald-400">{rm.overall_progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${rm.overall_progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{rm.completed_topics_count || 0} / {rm.total_topics_count || 0} topics</span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1">
                    Open Roadmap <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Roadmap Modal */}
      <CreateRoadmapModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newRm) => {
          fetchRoadmaps();
          setSelectedRoadmapId(newRm.id);
        }}
      />
    </div>
  );
};
