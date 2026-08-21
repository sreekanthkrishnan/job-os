import React, { useState, useEffect, useCallback } from 'react';
import { Job } from '@/types';
import { jobsApi, GetJobsQueryParams } from './jobsApi';
import { AddEditJobModal } from './AddEditJobModal';
import { JobDetailModal } from './JobDetailModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { exportJobsToExcelBrowser } from '@/services/excelExporter';
import {
  Plus, Search, Download, Briefcase, Building2,
  Calendar, ChevronLeft, ChevronRight, Eye, Edit3, Trash2
} from 'lucide-react';

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Jobs' },
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'technical', label: 'Technical' },
  { id: 'offer', label: 'Offer' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export const JobsView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params: GetJobsQueryParams = {
        page,
        page_size: 20,
        search: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        work_mode: selectedWorkMode !== 'all' ? selectedWorkMode : undefined,
        ordering: '-applied_date',
      };
      const res = await jobsApi.getJobs(params);
      setJobs(res.data);
      setPagination(res.pagination);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedWorkMode]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handleExportExcel = async () => {
    try {
      const blob = await jobsApi.exportJobsExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'JobOS_Applications_Export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Fallback to client browser SheetJS export
      exportJobsToExcelBrowser(jobs);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await jobsApi.exportJobsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'JobOS_Applications_Export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Fallback
    }
  };

  const handleDeleteJob = async (id: string, company: string) => {
    if (!window.confirm(`Delete application for ${company}?`)) return;
    try {
      await jobsApi.deleteJob(id);
      fetchJobs(pagination.page);
    } catch {
      // Handle error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">Job Applications Engine</h1>
          <p className="text-xs text-slate-400">
            Track applications, parse job descriptions with AI, calculate skill gaps, and schedule interview rounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown / Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export .XLSX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="hidden md:inline-flex"
          >
            Export .CSV
          </Button>

          <Button
            variant="gradient"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingJob(null);
              setIsAddModalOpen(true);
            }}
          >
            Add New Application
          </Button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedStatus === st.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search & Work Mode Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Input
              placeholder="Search company, role, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={selectedWorkMode}
            onChange={(e) => setSelectedWorkMode(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="all">All Work Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
      </div>

      {/* Main Content: Desktop Table & Mobile Cards View */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-16 px-4 space-y-4 border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-slate-200">
              {searchQuery || selectedStatus !== 'all' ? 'No applications match filter' : 'No job applications recorded yet'}
            </h3>
            <p className="text-xs text-slate-400">
              Paste job description text to auto-populate job info, evaluate skill gaps, and schedule interview rounds.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingJob(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Job Application
          </Button>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Work Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {jobs.map((j) => {
                  const matchScore = typeof j.match_score === 'string' ? parseFloat(j.match_score) : j.match_score;

                  return (
                    <tr key={j.id} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>{j.company}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">{j.role}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={j.work_mode === 'remote' ? 'emerald' : j.work_mode === 'hybrid' ? 'cyan' : 'slate'} size="sm">
                          {j.work_mode || 'onsite'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={j.status === 'offer' ? 'emerald' : j.status === 'interview' ? 'purple' : 'indigo'} size="sm">
                          {j.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
                            />
                          </div>
                          <span className="font-bold text-indigo-400 text-xs">{matchScore}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{j.applied_date}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedJob(j);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingJob(j);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-400 rounded hover:bg-slate-800"
                            title="Edit Job"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(j.id, j.company)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {jobs.map((j) => {
              const matchScore = typeof j.match_score === 'string' ? parseFloat(j.match_score) : j.match_score;

              return (
                <Card key={j.id} hoverEffect className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{j.company}</h3>
                      <p className="text-xs text-slate-300 font-medium">{j.role}</p>
                    </div>
                    <Badge variant="indigo" size="sm">
                      {j.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {j.applied_date}
                    </span>
                    <span className="font-bold text-indigo-400">Match Score: {matchScore}%</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(j);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingJob(j);
                        setIsAddModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Applications)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchJobs(pagination.page - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchJobs(pagination.page + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Job Modal */}
      <AddEditJobModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingJob(null);
        }}
        onSuccess={() => fetchJobs(pagination.page)}
        jobToEdit={editingJob}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(job) => {
          setIsDetailModalOpen(false);
          setEditingJob(job);
          setIsAddModalOpen(true);
        }}
      />
    </div>
  );
};
