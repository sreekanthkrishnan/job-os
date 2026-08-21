import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resumesApi } from '@/services/resumesApi';
import { Job, OutreachMessage } from '@/types';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';

interface ColdEmailModalProps {
  job: Job | null;
  resumeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ColdEmailModal: React.FC<ColdEmailModalProps> = ({
  job,
  resumeId,
  isOpen,
  onClose,
}) => {
  const [tone, setTone] = useState<'professional' | 'concise' | 'confident' | 'friendly' | 'technical'>('professional');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Hiring Manager');
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && job) {
      handleGenerate();
    }
  }, [isOpen, job]);

  const handleGenerate = async (modifier: 'shorter' | 'direct' | 'technical' | '' = '') => {
    if (!job) return;
    setIsLoading(true);
    setError(null);
    try {
      const data: OutreachMessage = await resumesApi.generateOutreach(job.id, {
        resume_id: resumeId,
        channel: 'email',
        tone,
        recipient_name: recipientName.trim(),
        recipient_role: recipientRole.trim(),
        modifier
      });

      setSubjectLines(data.subject_lines || []);
      setSelectedSubject(data.selected_subject || (data.subject_lines && data.subject_lines[0]) || '');
      setEmailBody(data.body || '');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate cold email outreach.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${selectedSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cold Email Generator — ${job.role} @ ${job.company}`} maxWidth="2xl">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="professional">Professional</option>
              <option value="concise">Concise</option>
              <option value="confident">Confident</option>
              <option value="friendly">Friendly</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <Input
            label="Recipient Name"
            placeholder="e.g. Sarah Jenkins"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />

          <Input
            label="Recipient Role"
            placeholder="e.g. Engineering Lead"
            value={recipientRole}
            onChange={(e) => setRecipientRole(e.target.value)}
          />
        </div>

        {/* Action Controls & Modifiers */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Quick Adjust:</span>
            <Button size="sm" variant="outline" onClick={() => handleGenerate('shorter')} disabled={isLoading}>
              Make Shorter
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleGenerate('direct')} disabled={isLoading}>
              Make Direct
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleGenerate('technical')} disabled={isLoading}>
              Make Technical
            </Button>
          </div>

          <Button size="sm" onClick={() => handleGenerate()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Regenerate
          </Button>
        </div>

        {/* Subject Lines Options */}
        {subjectLines.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Subject Lines</span>
            <div className="space-y-1 pt-1">
              {subjectLines.map((sub, idx) => (
                <label key={idx} className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/60">
                  <input
                    type="radio"
                    name="subject"
                    checked={selectedSubject === sub}
                    onChange={() => setSelectedSubject(sub)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{sub}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Email Body Preview & Editor */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Body</span>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={10}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            * Generated using Gemini AI based on target job description and your resume skills.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleCopy} className="bg-indigo-600 hover:bg-indigo-500">
              {isCopied ? <Check className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
              {isCopied ? 'Copied to Clipboard!' : 'Copy Email'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
