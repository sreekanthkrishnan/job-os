import React, { useState } from 'react';
import { RoadmapTopic, TopicStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  CheckCircle2, Circle, Search, Clock, Target, FastForward,
  HelpCircle, ExternalLink, ChevronDown, ChevronUp, Check
} from 'lucide-react';

interface RoadmapTopicCardProps {
  topic: RoadmapTopic;
  topicIndex: number;
  onUpdateProgress: (topicId: string, progress: number, status?: string) => Promise<void>;
  onDiscover: (topic: RoadmapTopic) => void;
  onAdapt: (topicId: string, actionType: 'skip' | 'need_help') => Promise<void>;
}

export const RoadmapTopicCard: React.FC<RoadmapTopicCardProps> = ({
  topic,
  topicIndex,
  onUpdateProgress,
  onDiscover,
  onAdapt
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return <Badge variant="emerald" size="sm">Beginner</Badge>;
      case 'advanced':
        return <Badge variant="purple" size="sm">Advanced</Badge>;
      default:
        return <Badge variant="indigo" size="sm">Intermediate</Badge>;
    }
  };

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Circle className="w-3 h-3 fill-indigo-400 animate-pulse" /> In Progress
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <FastForward className="w-3 h-3" /> Already Familiar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
            <Circle className="w-3 h-3 text-slate-500" /> Not Started
          </span>
        );
    }
  };

  const handleToggleComplete = async () => {
    try {
      setIsLoading(true);
      const isComplete = topic.status === 'completed' || topic.progress >= 100;
      const nextStatus = isComplete ? 'not_started' : 'completed';
      const nextProgress = isComplete ? 0 : 100;
      await onUpdateProgress(topic.id, nextProgress, nextStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card hoverEffect className={`transition-all border ${
      topic.status === 'completed' ? 'border-emerald-500/30 bg-emerald-950/10' :
      topic.status === 'in_progress' ? 'border-indigo-500/40 bg-indigo-950/10' :
      'border-slate-800 bg-slate-900/60'
    }`}>
      {/* Topic Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            {topicIndex}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-slate-100 truncate">{topic.title}</h4>
              {getDifficultyBadge(topic.difficulty)}
              {getStatusBadge(topic.status)}
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{topic.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="gradient"
            size="sm"
            onClick={() => onDiscover(topic)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            Find Courses & Resources
          </Button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-1">
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              topic.status === 'completed' ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${topic.progress}%` }}
          />
        </div>
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Estimated: {topic.estimated_hours} hours
            </span>
            {topic.target_skills && topic.target_skills.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Target Skills:</span>
                {topic.target_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 font-semibold text-[11px]">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {topic.prerequisites && topic.prerequisites.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Prerequisites
              </span>
              <div className="flex flex-wrap gap-2">
                {topic.prerequisites.map((pre, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                    <Check className="w-3 h-3 text-emerald-400" /> {pre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {topic.learning_objectives && topic.learning_objectives.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Learning Objectives
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {topic.learning_objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enrolled Resources List if available */}
          {topic.resources && topic.resources.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Saved Resources ({topic.resources.length})
              </span>
              <div className="space-y-2">
                {topic.resources.map((res) => (
                  <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{res.title}</span>
                        {res.provider && <Badge variant="indigo" size="sm">{res.provider}</Badge>}
                      </div>
                      <a href={res.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                        <span>{res.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-colors self-start sm:self-center shrink-0"
                    >
                      Open Link
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <Button
                variant={topic.status === 'completed' ? 'outline' : 'primary'}
                size="sm"
                isLoading={isLoading}
                onClick={handleToggleComplete}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              >
                {topic.status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}
              </Button>

              {topic.status !== 'skipped' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdapt(topic.id, 'skip')}
                  leftIcon={<FastForward className="w-3.5 h-3.5 text-slate-400" />}
                >
                  Already Familiar
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdapt(topic.id, 'need_help')}
              leftIcon={<HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
            >
              Need Prerequisite Help
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
