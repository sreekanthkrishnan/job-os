import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resumesApi } from '@/services/resumesApi';
import { Resume } from '@/types';
import { Upload, FileText, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resume: Resume) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [description, setDescription] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFile(null);
    setName('');
    setTargetRole('');
    setVersion(1);
    setDescription('');
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidType) {
      setError('Invalid file format. Please upload a PDF or DOCX file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum 10MB limit.');
      return;
    }

    setFile(selectedFile);
    if (!name) {
      // Auto-populate name without extension
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setName(baseName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or DOCX resume file.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a resume title.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const newResume = await resumesApi.uploadResume({
        file,
        name: name.trim(),
        target_role: targetRole.trim() || undefined,
        description: description.trim() || undefined,
        version: version || 1,
      });

      onSuccess(newResume);
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Resume to Vault" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-indigo-600/15 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & Drop your resume here, or <span className="text-indigo-400">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF and DOCX (up to 10MB)</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-100 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Resume Details Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Resume Title *"
            placeholder="e.g., Senior React Developer Resume"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Target Role"
            placeholder="e.g., Senior Frontend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Version"
            type="number"
            min={1}
            value={version}
            onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
          />
          <Input
            label="Description / Focus Notes"
            placeholder="e.g., Tailored for React/TypeScript roles"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* AI Notice */}
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            Google Gemini will automatically parse skills, employment history, and projects from your document to convert it into a structured AI profile.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading || !file}>
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing with Gemini...
              </span>
            ) : (
              'Upload & Analyze'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
