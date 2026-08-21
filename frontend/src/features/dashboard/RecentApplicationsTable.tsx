import React, { useState } from 'react';
import { Job } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobDetailModal } from '@/features/jobs/JobDetailModal';
import { jobsApi } from '@/features/jobs/jobsApi';
import { Briefcase, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentApplicationsTableProps {
  recentJobs: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
    applied_date: string;
    match_score: number;
  }>;
}

const STATUS_VARIANTS: Record<string, 'indigo' | 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate'> = {
  wishlist: 'slate',
  applied: 'indigo',
  screening: 'cyan',
  interview: 'purple',
  technical: 'purple',
  managerial: 'purple',
  hr: 'purple',
  offer: 'emerald',
  accepted: 'emerald',
  rejected: 'rose',
  withdrawn: 'slate',
  on_hold: 'amber',
};

export const RecentApplicationsTable: React.FC<RecentApplicationsTableProps> = ({ recentJobs }) => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = async (id: string) => {
    try {
      const fullJob = await jobsApi.getJobById(id);
      setSelectedJob(fullJob);
      setIsDetailOpen(true);
    } catch {
      // Handle error
    }
  };

  if (!recentJobs || recentJobs.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-100">Recent Applications</h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 py-4 text-center">No recent job applications recorded yet.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">Recent Job Applications</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/jobs')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All Applications
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Company</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Match Score</th>
              <th className="py-3 px-3">Applied Date</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {recentJobs.map((j) => (
              <tr key={j.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-100">{j.company}</td>
                <td className="py-3 px-3 text-slate-200 font-medium">{j.role}</td>
                <td className="py-3 px-3">
                  <Badge variant={STATUS_VARIANTS[j.status] || 'indigo'} size="sm">
                    {j.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${Math.min(100, Math.max(0, j.match_score))}%` }}
                      />
                    </div>
                    <span className="font-bold text-indigo-400 text-[11px]">{j.match_score}%</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-300 text-[11px] font-medium">{j.applied_date}</td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleOpenDetail(j.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={() => {
          setIsDetailOpen(false);
          navigate('/jobs');
        }}
      />
    </Card>
  );
};
