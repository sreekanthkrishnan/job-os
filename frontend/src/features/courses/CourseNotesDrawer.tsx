import React, { useState, useEffect, useCallback } from 'react';
import { Course, CourseNote } from '@/types';
import { coursesApi } from './coursesApi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileText, Plus, Search, Edit3, Trash2, BookOpen } from 'lucide-react';

interface CourseNotesDrawerProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseNotesDrawer: React.FC<CourseNotesDrawerProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Note form state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!course) return;
    try {
      setIsLoading(true);
      const data = await coursesApi.getCourseNotes(course.id);
      setNotes(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [course]);

  useEffect(() => {
    if (isOpen && course) {
      fetchNotes();
      setIsEditingNote(false);
      setNoteTitle('');
      setNoteContent('');
    }
  }, [isOpen, course, fetchNotes]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !noteTitle.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingNoteId) {
        await coursesApi.updateCourseNote(editingNoteId, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
      } else {
        await coursesApi.createCourseNote(course.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
      }
      setIsEditingNote(false);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      fetchNotes();
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this course note?')) return;
    try {
      await coursesApi.deleteCourseNote(noteId);
      fetchNotes();
    } catch {
      // Handle error
    }
  };

  if (!course) return null;

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notes: ${course.name}`} maxWidth="xl">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {!isEditingNote && (
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setEditingNoteId(null);
                setNoteTitle('');
                setNoteContent('');
                setIsEditingNote(true);
              }}
            >
              New Note
            </Button>
          )}
        </div>

        {/* Note Form Editor */}
        {isEditingNote ? (
          <form onSubmit={handleSaveNote} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 animate-in fade-in">
            <Input
              label="Note Title *"
              placeholder="e.g. AWS EC2 Security Groups / React Fiber Architecture"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Note Content (Markdown supported)</label>
              <textarea
                rows={6}
                placeholder="Write course key takeaways, code snippets, formulas..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingNote(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm" isLoading={isSubmitting}>
                Save Note
              </Button>
            </div>
          </form>
        ) : null}

        {/* Notes List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No notes written for this course</p>
            <p className="text-[11px] text-slate-500">Add course notes to track key takeaways and learning summaries.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} hoverEffect className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-sm text-slate-100">{note.title}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setNoteTitle(note.title);
                        setNoteContent(note.content);
                        setIsEditingNote(true);
                      }}
                      className="p-1 text-slate-400 hover:text-purple-400 rounded hover:bg-slate-800"
                      title="Edit Note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {note.content}
                </div>

                <div className="text-[10px] text-slate-500 text-right">
                  Updated: {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
