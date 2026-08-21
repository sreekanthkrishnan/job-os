import React, { useState, useEffect, useCallback } from 'react';
import { Course } from '@/types';
import { coursesApi } from './coursesApi';
import { CourseCard } from './CourseCard';
import { AddEditCourseModal } from './AddEditCourseModal';
import { CourseNotesDrawer } from './CourseNotesDrawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Search, GraduationCap, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Courses' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
];

export const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [notesCourse, setNotesCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getCourses({
        status: selectedStatus,
        search: searchQuery,
      });
      setCourses(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const completedCount = courses.filter(c => c.status === 'completed' || c.progress >= 100).length;
  const inProgressCount = courses.filter(c => c.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">Courses & Learning Notes</h1>
          <p className="text-xs text-slate-400">
            Track online learning progress. Completing a course automatically promotes course skills to your profile and updates job match scores.
          </p>
        </div>

        <Button
          variant="gradient"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingCourse(null);
            setIsAddModalOpen(true);
          }}
        >
          Add Course
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Courses</p>
            <p className="text-xl font-bold text-slate-100">{courses.length}</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-slate-100">{inProgressCount}</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-slate-100">{completedCount}</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Skill Automation</p>
            <p className="text-xl font-bold text-slate-100">Active 🔥</p>
          </div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
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

        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search courses, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="text-center py-16 px-4 space-y-4 border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-slate-200">
              {searchQuery || selectedStatus !== 'all' ? 'No courses match filter' : 'No learning courses tracked yet'}
            </h3>
            <p className="text-xs text-slate-400">
              Track online courses, write markdown notes, and watch your missing skills automatically convert into matched skills!
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingCourse(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Your First Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onUpdate={fetchCourses}
              onEdit={(c) => {
                setEditingCourse(c);
                setIsAddModalOpen(true);
              }}
              onOpenNotes={(c) => setNotesCourse(c)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <AddEditCourseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={fetchCourses}
        courseToEdit={editingCourse}
      />

      {/* Course Notes Drawer */}
      <CourseNotesDrawer
        course={notesCourse}
        isOpen={!!notesCourse}
        onClose={() => setNotesCourse(null)}
      />
    </div>
  );
};
