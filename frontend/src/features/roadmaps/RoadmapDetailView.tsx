import React, { useState, useEffect, useCallback } from 'react';
import { LearningRoadmap, RoadmapTopic, NextTopicRecommendation } from '@/types';
import { roadmapsApi } from './roadmapsApi';
import { RoadmapTopicCard } from './RoadmapTopicCard';
import { NextTopicCard } from './NextTopicCard';
import { LearningDiscoveryView } from '@/features/learning-discovery/LearningDiscoveryView';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Trash2, Layers } from 'lucide-react';

interface RoadmapDetailViewProps {
  roadmapId: string;
  onBack: () => void;
  onDeleteSuccess?: () => void;
}

export const RoadmapDetailView: React.FC<RoadmapDetailViewProps> = ({
  roadmapId,
  onBack,
  onDeleteSuccess
}) => {
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextRec, setNextRec] = useState<NextTopicRecommendation | null>(null);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [activeDiscoveryTopic, setActiveDiscoveryTopic] = useState<RoadmapTopic | null>(null);

  const fetchRoadmap = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await roadmapsApi.getRoadmap(roadmapId);
      setRoadmap(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleUpdateTopicProgress = async (topicId: string, progress: number, status?: string) => {
    try {
      await roadmapsApi.updateTopicProgress(topicId, progress, status);
      await fetchRoadmap();
    } catch {
      // Error handling
    }
  };

  const handleAdaptTopic = async (topicId: string, actionType: 'skip' | 'need_help') => {
    try {
      const res = await roadmapsApi.adaptTopic(topicId, actionType);
      if (actionType === 'need_help' && res.prerequisite_resources) {
        // Open discovery with topic
        const t = roadmap?.topics.find((x) => x.id === topicId);
        if (t) setActiveDiscoveryTopic(t);
      }
      await fetchRoadmap();
    } catch {
      // Error handling
    }
  };

  const handleFetchNextTopic = async () => {
    try {
      setIsRecLoading(true);
      const rec = await roadmapsApi.getNextTopic(roadmapId);
      setNextRec(rec);
    } finally {
      setIsRecLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this learning roadmap?')) {
      await roadmapsApi.deleteRoadmap(roadmapId);
      if (onDeleteSuccess) onDeleteSuccess();
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-lg font-bold text-slate-200">Roadmap not found</h3>
        <Button variant="outline" onClick={onBack}>
          Back to Roadmaps
        </Button>
      </div>
    );
  }

  const completedCount = roadmap.topics.filter(t => t.status === 'completed' || t.status === 'skipped' || t.progress >= 100).length;
  const totalTopics = roadmap.topics.length;
  const remainingHours = roadmap.topics
    .filter(t => t.status !== 'completed' && t.status !== 'skipped')
    .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Roadmaps
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}>
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo" size="sm" pulse>
              AI Personalized Path
            </Badge>
            {roadmap.target_role && (
              <Badge variant="purple" size="sm">
                Target Role: {roadmap.target_role}
              </Badge>
            )}
            <Badge variant={roadmap.status === 'completed' ? 'emerald' : 'cyan'} size="sm">
              {roadmap.status.toUpperCase()}
            </Badge>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{roadmap.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">{roadmap.description || roadmap.goal}</p>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
              <p className="text-lg font-black text-emerald-400">{roadmap.overall_progress}%</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Topics</span>
              <p className="text-lg font-black text-slate-100">{completedCount} / {totalTopics}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Remaining</span>
              <p className="text-lg font-black text-indigo-400">{remainingHours} hours</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Commitment</span>
              <p className="text-lg font-black text-amber-400">{roadmap.weekly_hours} hrs/wk</p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Overall Roadmap Completion</span>
              <span className="text-emerald-400">{roadmap.overall_progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${roadmap.overall_progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI "What should I learn next?" Card */}
      <NextTopicCard
        recommendation={nextRec}
        isLoading={isRecLoading}
        onRequestRecommendation={handleFetchNextTopic}
        onStartTopic={(tId) => {
          const targetElem = document.getElementById(`topic-${tId}`);
          if (targetElem) targetElem.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Roadmap Modules & Topics List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Roadmap Modules & Learning Phases</span>
        </h2>

        {roadmap.modules && roadmap.modules.length > 0 ? (
          roadmap.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-3">
              {/* Module Header Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 font-extrabold text-xs border border-indigo-500/30">
                    Phase {mod.order || mIdx + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-200">{mod.title}</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {mod.topics?.length || 0} topics
                </span>
              </div>

              {/* Topics in Module */}
              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-slate-800">
                {mod.topics && mod.topics.length > 0 ? (
                  mod.topics.map((top, tIdx) => (
                    <div key={top.id} id={`topic-${top.id}`}>
                      <RoadmapTopicCard
                        topic={top}
                        topicIndex={top.order || tIdx + 1}
                        onUpdateProgress={handleUpdateTopicProgress}
                        onDiscover={(t) => setActiveDiscoveryTopic(t)}
                        onAdapt={handleAdaptTopic}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-2">No topics in this module.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          /* Fallback if flat topics */
          <div className="space-y-3">
            {roadmap.topics.map((top, tIdx) => (
              <div key={top.id} id={`topic-${top.id}`}>
                <RoadmapTopicCard
                  topic={top}
                  topicIndex={tIdx + 1}
                  onUpdateProgress={handleUpdateTopicProgress}
                  onDiscover={(t) => setActiveDiscoveryTopic(t)}
                  onAdapt={handleAdaptTopic}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for AI Course Discovery */}
      <Modal
        isOpen={!!activeDiscoveryTopic}
        onClose={() => setActiveDiscoveryTopic(null)}
        title={activeDiscoveryTopic ? `AI Course Discovery — ${activeDiscoveryTopic.title}` : 'Discover Resources'}
        maxWidth="2xl"
      >
        {activeDiscoveryTopic && (
          <LearningDiscoveryView
            topic={activeDiscoveryTopic}
            onResourceAdded={() => fetchRoadmap()}
          />
        )}
      </Modal>
    </div>
  );
};
