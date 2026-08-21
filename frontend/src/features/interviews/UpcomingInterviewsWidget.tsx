import React, { useState, useEffect } from 'react';
import { Interview } from '@/types';
import { interviewsApi } from './interviewsApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROUND_TYPE_LABELS: Record<string, string> = {
  hr_screening: 'HR Screening',
  technical: 'Technical Round',
  coding: 'Coding Challenge',
  system_design: 'System Design',
  managerial: 'Managerial Round',
  hr: 'HR Round',
  final: 'Final Round',
  other: 'Other Round',
};

export const UpcomingInterviewsWidget: React.FC = () => {
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        setIsLoading(true);
        const data = await interviewsApi.getUpcomingInterviews();
        setUpcoming(data);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  if (isLoading || upcoming.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-200">Upcoming Interviews</h3>
          </div>
          <Badge variant="slate" size="sm">0 Scheduled</Badge>
        </div>
        <p className="text-xs text-slate-500 py-2 text-center">No upcoming interviews scheduled for this week.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Upcoming Interviews</h3>
        </div>
        <Badge variant="indigo" pulse size="sm">{upcoming.length} Scheduled</Badge>
      </div>

      <div className="space-y-3">
        {upcoming.map((iv) => {
          const dt = new Date(iv.scheduled_at);
          const dateStr = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={iv.id}
              onClick={() => navigate('/jobs')}
              className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-100">{iv.job_company || 'Company'}</span>
                  <Badge variant="purple" size="sm" className="text-[10px]">
                    {ROUND_TYPE_LABELS[iv.round_type] || iv.round_type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 font-medium">{iv.job_role || 'Role'}</p>
                <div className="flex items-center gap-2 text-[11px] text-indigo-400">
                  <Clock className="w-3 h-3" />
                  <span>{dateStr} at {timeStr}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
