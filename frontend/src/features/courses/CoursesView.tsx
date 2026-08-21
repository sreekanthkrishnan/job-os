import React, { useState, useEffect, useCallback } from 'react';
import { Course, RoadmapDashboardStats } from '@/types';
import { coursesApi } from './coursesApi';
import { roadmapsApi } from '@/features/roadmaps/roadmapsApi';
import { CourseCard } from './CourseCard';
import { AddEditCourseModal } from './AddEditCourseModal';
import { CourseNotesDrawer } from './CourseNotesDrawer';
import { RoadmapsView } from '@/features/roadmaps/RoadmapsView';
import { LearningDiscoveryView } from '@/features/learning-discovery/LearningDiscoveryView';
import { CreateRoadmapModal } from '@/features/roadmaps/CreateRoadmapModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Plus, Search, GraduationCap, Sparkles, CheckCircle2, BookOpen, Compass
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Courses' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
];

export const CoursesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my_courses' | 'roadmaps' | 'discover' | 'completed'>('roadmaps');
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboardStats, setDashboardStats] = useState<RoadmapDashboardStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isCreateRoadmapModalOpen, setIsCreateRoadmapModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [notesCourse, setNotesCourse] = useState<Course | null>(null);

  const fetchCoursesAndStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cData, sData] = await Promise.all([
        coursesApi.getCourses({
          status: selectedStatus,
          search: searchQuery,
        }),
        roadmapsApi.getDashboardStats().catch(() => null)
      ]);
      setCourses(cData);
      setDashboardStats(sData);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    fetchCoursesAndStats();
  }, [fetchCoursesAndStats]);

  const completedCoursesCount = courses.filter(c => c.status === 'completed' || c.progress >= 100).length;
  const inProgressCoursesCount = courses.filter(c => c.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <span>Courses & AI Learning Roadmaps</span>
            <Badge variant="indigo" size="sm" pulse>AI Engine Active</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Skill Gap → Learning Roadmap → Topics → AI Course Discovery → Learning → Skill Improvement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCourse(null);
              setIsAddCourseModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Course
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setIsCreateRoadmapModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            + Create Learning Roadmap
          </Button>
        </div>
      </div>

      {/* Top Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">My Courses</p>
            <p className="text-xl font-bold text-slate-100">{dashboardStats?.total_courses ?? courses.length}</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Learning Roadmaps</p>
            <p className="text-xl font-bold text-slate-100">{dashboardStats?.active_roadmaps_count ?? 0} active</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Skills in Progress</p>
            <p className="text-xl font-bold text-slate-100">{dashboardStats?.skills_in_progress ?? inProgressCoursesCount}</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-slate-100">{completedCoursesCount}</p>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('roadmaps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'roadmaps'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-300" />
          <span>Learning Roadmaps</span>
          {dashboardStats && dashboardStats.active_roadmaps_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              {dashboardStats.active_roadmaps_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'my_courses'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-400" />
          <span>My Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'discover'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Discover</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Completed</span>
        </button>
      </div>

      {/* Tab Content 1: Learning Roadmaps */}
      {activeTab === 'roadmaps' && (
        <RoadmapsView />
      )}

      {/* Tab Content 2: My Courses */}
      {activeTab === 'my_courses' && (
        <div className="space-y-6">
          {/* Filter & Search Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

            <div className="w-full md:w-72">
              <Input
                placeholder="Search courses, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

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
                  setIsAddCourseModalOpen(true);
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
                  onUpdate={fetchCoursesAndStats}
                  onEdit={(c) => {
                    setEditingCourse(c);
                    setIsAddCourseModalOpen(true);
                  }}
                  onOpenNotes={(c) => setNotesCourse(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Discover */}
      {activeTab === 'discover' && (
        <LearningDiscoveryView />
      )}

      {/* Tab Content 4: Completed */}
      {activeTab === 'completed' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Completed Courses</span>
            </h3>

            {courses.filter(c => c.status === 'completed' || c.progress >= 100).length === 0 ? (
              <Card className="py-8 px-4 text-center text-xs text-slate-400 border-dashed border-slate-800">
                No completed courses yet. Keep learning!
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.filter(c => c.status === 'completed' || c.progress >= 100).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onUpdate={fetchCoursesAndStats}
                    onEdit={(c) => {
                      setEditingCourse(c);
                      setIsAddCourseModalOpen(true);
                    }}
                    onOpenNotes={(c) => setNotesCourse(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <AddEditCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => {
          setIsAddCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={fetchCoursesAndStats}
        courseToEdit={editingCourse}
      />

      {/* Create Learning Roadmap Modal */}
      <CreateRoadmapModal
        isOpen={isCreateRoadmapModalOpen}
        onClose={() => setIsCreateRoadmapModalOpen(false)}
        onSuccess={() => {
          setActiveTab('roadmaps');
          fetchCoursesAndStats();
        }}
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
