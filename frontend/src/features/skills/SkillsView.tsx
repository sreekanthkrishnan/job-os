import React, { useState, useEffect, useCallback } from 'react';
import { Skill } from '@/types';
import { skillsApi, SkillStats } from './skillsApi';
import { SkillCard } from './SkillCard';
import { AddSkillModal } from './AddSkillModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Search, Award, Sparkles, Filter, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Skills' },
  { id: 'frontend', name: 'Frontend' },
  { id: 'backend', name: 'Backend' },
  { id: 'database', name: 'Database' },
  { id: 'devops', name: 'DevOps' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'testing', name: 'Testing' },
  { id: 'ai_ml', name: 'AI / ML' },
  { id: 'tools', name: 'Tools' },
  { id: 'other', name: 'Other' },
];

export const SkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSkillsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [skillsData, statsData] = await Promise.all([
        skillsApi.getSkills({ category: selectedCategory, search: searchQuery }),
        skillsApi.getStats(),
      ]);
      setSkills(skillsData);
      setStats(statsData);
    } catch {
      // Handle fetch error
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchSkillsData();
  }, [fetchSkillsData]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">Skills Catalog & Profile</h1>
          <p className="text-xs text-slate-400">
            Manage your skill profile. Extracted job requirements will automatically match against your canonical skills.
          </p>
        </div>

        <Button
          variant="gradient"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Skill to Profile
        </Button>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hoverEffect className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Profile Skills</p>
              <p className="text-xl font-bold text-slate-100">{stats.total}</p>
            </div>
          </Card>

          <Card hoverEffect className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Category</p>
              <p className="text-xl font-bold text-slate-100 capitalize">
                {stats.by_category[0]?.category.replace('_', ' ') || 'N/A'}
              </p>
            </div>
          </Card>

          <Card hoverEffect className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Expert / Advanced</p>
              <p className="text-xl font-bold text-slate-100">
                {(stats.by_proficiency.find(p => p.proficiency === 'expert')?.count || 0) +
                 (stats.by_proficiency.find(p => p.proficiency === 'advanced')?.count || 0)}
              </p>
            </div>
          </Card>

          <Card hoverEffect className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categories Covered</p>
              <p className="text-xl font-bold text-slate-100">{stats.by_category.length}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <Card className="text-center py-16 px-4 space-y-4 border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-slate-200">
              {searchQuery || selectedCategory !== 'all' ? 'No skills match filter' : 'No skills in profile yet'}
            </h3>
            <p className="text-xs text-slate-400">
              Add technical skills to enable job description skill-gap matching and course automation.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Skill to Profile
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkillsData} />
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      <AddSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSkillsData}
      />
    </div>
  );
};
