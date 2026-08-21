import React, { useState, useEffect } from 'react';
import { Interview } from '@/types';
import { interviewsApi, CreateInterviewPayload } from './interviewsApi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Calendar, User } from 'lucide-react';

interface AddEditInterviewModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interviewToEdit?: Interview | null;
}

const ROUND_TYPES = [
  { value: 'hr_screening', label: 'HR Screening' },
  { value: 'technical', label: 'Technical Round' },
  { value: 'coding', label: 'Coding Challenge' },
  { value: 'system_design', label: 'System Design' },
  { value: 'managerial', label: 'Managerial Round' },
  { value: 'hr', label: 'HR Round' },
  { value: 'final', label: 'Final Round' },
  { value: 'other', label: 'Other' },
];

const RESULT_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AddEditInterviewModal: React.FC<AddEditInterviewModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onSuccess,
  interviewToEdit,
}) => {
  const [roundType, setRoundType] = useState<any>('technical');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [result, setResult] = useState<any>('scheduled');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (interviewToEdit) {
      setRoundType(interviewToEdit.round_type);
      const dt = new Date(interviewToEdit.scheduled_at);
      const isoLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(isoLocal);
      setInterviewer(interviewToEdit.interviewer || '');
      setResult(interviewToEdit.result || 'scheduled');
      setFeedback(interviewToEdit.feedback || '');
      setNotes(interviewToEdit.notes || '');
    } else {
      setRoundType('technical');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(isoLocal);
      setInterviewer('');
      setResult('scheduled');
      setFeedback('');
      setNotes('');
    }
  }, [interviewToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      setError('Please specify a scheduled date and time.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateInterviewPayload = {
      round_type: roundType,
      scheduled_at: new Date(scheduledAt).toISOString(),
      interviewer: interviewer.trim() || undefined,
      result,
      feedback: feedback.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (interviewToEdit) {
        await interviewsApi.updateInterview(interviewToEdit.id, payload);
      } else {
        await interviewsApi.scheduleInterview(jobId, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save interview round.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={interviewToEdit ? 'Edit Interview Round' : 'Schedule Interview Round'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Round Type *</label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
            >
              {ROUND_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Result / Outcome</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
            >
              {RESULT_OPTIONS.map((res) => (
                <option key={res.value} value={res.value}>
                  {res.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Scheduled Date & Time *"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            label="Interviewer Name / Panel"
            placeholder="e.g. Sarah Chen (Engineering Manager)"
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Preparation & Notes</label>
          <textarea
            rows={3}
            placeholder="System design topics, coding questions to prepare, recruiter notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Post-Interview Feedback</label>
          <textarea
            rows={3}
            placeholder="Feedback received, questions asked during interview, performance reflection..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {interviewToEdit ? 'Save Round Changes' : 'Schedule Interview Round'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
