import React from 'react';
import { NextTopicRecommendation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';

interface NextTopicCardProps {
  recommendation: NextTopicRecommendation | null;
  onStartTopic?: (topicId: string) => void;
  onRequestRecommendation?: () => void;
  isLoading?: boolean;
}

export const NextTopicCard: React.FC<NextTopicCardProps> = ({
  recommendation,
  onStartTopic,
  onRequestRecommendation,
  isLoading = false
}) => {
  if (!recommendation) {
    return (
      <Card className="p-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">AI Next Topic Recommendation</h4>
            <p className="text-xs text-slate-400">
              Not sure which topic to study next? Ask Gemini to analyze roadmap dependencies.
            </p>
          </div>
        </div>

        <Button
          variant="gradient"
          size="sm"
          isLoading={isLoading}
          onClick={onRequestRecommendation}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
        >
          What should I learn next?
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>🎯 RECOMMENDED NEXT TOPIC</span>
        </div>
        {recommendation.estimated_hours > 0 && (
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Estimated: {recommendation.estimated_hours} hours
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-100">{recommendation.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
          <span className="font-semibold text-indigo-400">Why: </span>
          {recommendation.why}
        </p>
      </div>

      <div className="flex justify-end pt-1">
        {recommendation.topic_id && onStartTopic ? (
          <Button
            variant="gradient"
            size="sm"
            onClick={() => onStartTopic(recommendation.topic_id!)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start Learning
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestRecommendation}
            leftIcon={<Sparkles className="w-3 h-3 text-amber-400" />}
          >
            Refresh Recommendation
          </Button>
        )}
      </div>
    </Card>
  );
};
