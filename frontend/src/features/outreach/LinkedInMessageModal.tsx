import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resumesApi } from '@/services/resumesApi';
import { Job, OutreachMessage } from '@/types';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';

interface LinkedInMessageModalProps {
  job: Job | null;
  resumeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedInMessageModal: React.FC<LinkedInMessageModalProps> = ({
  job,
  resumeId,
  isOpen,
  onClose,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Recruiter');
  const [messageBody, setMessageBody] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      handleGenerate();
    }
  }, [isOpen, job]);

  const handleGenerate = async (modifier: 'shorter' | 'direct' | 'technical' | '' = '') => {
    if (!job) return;
    setIsLoading(true);
    try {
      const data: OutreachMessage = await resumesApi.generateOutreach(job.id, {
        resume_id: resumeId,
        channel: 'linkedin',
        tone: 'concise',
        recipient_name: recipientName.trim(),
        recipient_role: recipientRole.trim(),
        modifier
      });

      setMessageBody(data.body || '');
    } catch (err) {
      console.error('Failed to generate LinkedIn message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`LinkedIn Outreach — ${job.role} @ ${job.company}`} maxWidth="xl">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Recipient inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <Input
            label="Recipient Name"
            placeholder="e.g. Alex Rivera"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <Input
            label="Recipient Role"
            placeholder="e.g. Technical Recruiter"
            value={recipientRole}
            onChange={(e) => setRecipientRole(e.target.value)}
          />
        </div>

        {/* Quick Modifiers */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => handleGenerate('shorter')} disabled={isLoading}>
              Shorter (&lt;100 words)
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleGenerate('direct')} disabled={isLoading}>
              Direct
            </Button>
          </div>

          <Button size="sm" onClick={() => handleGenerate()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Regenerate
          </Button>
        </div>

        {/* Text Message */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">LinkedIn Direct Message</span>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={6}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">{messageBody.length} characters</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleCopy} className="bg-indigo-600 hover:bg-indigo-500">
              {isCopied ? <Check className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
              {isCopied ? 'Copied!' : 'Copy Message'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
