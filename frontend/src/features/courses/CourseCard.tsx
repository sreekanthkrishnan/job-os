import React, { useState } from 'react';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GraduationCap, FileText, Edit3, Trash2, ExternalLink, Calendar, Check } from 'lucide-react';
import { coursesApi } from './coursesApi';

interface CourseCardProps {
  course: Course;
  onUpdate: () => void;
  onEdit: (course: Course) => void;
  onOpenNotes: (course: Course) => void;
}

const STATUS_BADGE_VARIANTS: Record<string, 'indigo' | 'amber' | 'emerald' | 'slate' | 'rose'> = {
  planned: 'slate',
  in_progress: 'indigo',
  completed: 'emerald',
  paused: 'amber',
  dropped: 'rose',
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onUpdate,
  onEdit,
  onOpenNotes,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuickProgressUpdate = async (newProgress: number) => {
    try {
      setIsUpdating(true);
      await coursesApi.updateCourse(course.id, {
        progress: newProgress,
        status: newProgress >= 100 ? 'completed' : course.status,
      });
      onUpdate();
    } catch {
      // Handle error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete course record for "${course.name}"?`)) return;
    try {
      await coursesApi.deleteCourse(course.id);
      onUpdate();
    } catch {
      // Handle error
    }
  };

  return (
    <Card hoverEffect className="space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 leading-snug">{course.name}</h3>
              {course.provider && (
                <span className="text-[11px] font-medium text-slate-400">{course.provider}</span>
              )}
            </div>
          </div>

          <Badge variant={STATUS_BADGE_VARIANTS[course.status] || 'slate'} size="sm">
            {course.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Progress Bar Display */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Course Progress</span>
            <span className="text-indigo-400 font-bold">{course.progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                course.progress >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
            />
          </div>

          {/* Quick Increment Controls */}
          {course.progress < 100 && (
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                disabled={isUpdating}
                onClick={() => handleQuickProgressUpdate(Math.min(100, course.progress + 25))}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
              >
                +25%
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleQuickProgressUpdate(100)}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-colors"
              >
                Mark 100% Complete
              </button>
            </div>
          )}
        </div>

        {/* Skills Covered Pills */}
        {course.skills && course.skills.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Skills Covered</span>
              {course.progress >= 100 && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto-Added to Profile
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {course.skills.map((sk) => (
                <Badge
                  key={sk}
                  variant={course.progress >= 100 ? 'emerald' : 'purple'}
                  size="sm"
                  className="normal-case text-[10px]"
                >
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {course.target_completion_date && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Target: {course.target_completion_date}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenNotes(course)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-400" />}
        >
          Notes {course.notes_count ? `(${course.notes_count})` : ''}
        </Button>

        <div className="flex items-center gap-1">
          {course.course_url && (
            <a
              href={course.course_url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
              title="Open Course URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 text-slate-400 hover:text-purple-400 rounded hover:bg-slate-800"
            title="Edit Course"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
