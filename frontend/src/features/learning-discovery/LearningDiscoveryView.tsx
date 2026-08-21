import React, { useState, useEffect } from 'react';
import { LearningResource, RoadmapTopic } from '@/types';
import { roadmapsApi } from '@/features/roadmaps/roadmapsApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search, ExternalLink, Plus, Sparkles, Filter, Check, BookOpen, CheckCircle2
} from 'lucide-react';

interface LearningDiscoveryViewProps {
  topic?: RoadmapTopic | null;
  onResourceAdded?: (resource: LearningResource) => void;
}

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free Only' },
  { id: 'paid', label: 'Paid' },
  { id: 'documentation', label: 'Official Documentation' },
  { id: 'video', label: 'Video' },
  { id: 'course', label: 'Course' },
  { id: 'tutorial', label: 'Tutorial' },
  { id: 'project', label: 'Project' },
  { id: 'book', label: 'Book' },
];

export const LearningDiscoveryView: React.FC<LearningDiscoveryViewProps> = ({
  topic,
  onResourceAdded
}) => {
  const [searchQuery, setSearchQuery] = useState(topic?.title || 'Django REST Framework');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());

  const handleSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    try {
      setIsLoading(true);
      if (topic) {
        const res = await roadmapsApi.discoverTopicResources(topic.id, {
          topic_title: queryToSearch,
          topic_description: topic.description,
          target_skills: topic.target_skills,
          user_level: topic.difficulty
        });
        setResources(res.resources);
      } else {
        const res = await roadmapsApi.discoverResources({
          topic_title: queryToSearch
        });
        setResources(res.resources);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, []);

  const filteredResources = resources.filter((res) => {
    if (selectedFilter === 'free') return res.is_free;
    if (selectedFilter === 'paid') return !res.is_free;
    if (selectedFilter === 'all') return true;
    return res.resource_type === selectedFilter;
  });

  const handleAddResource = async (resItem: LearningResource) => {
    if (!topic) {
      window.open(resItem.url, '_blank');
      return;
    }
    try {
      setAddingId(resItem.url);
      const saved = await roadmapsApi.addResourceToTopic(topic.id, {
        title: resItem.title,
        url: resItem.url,
        provider: resItem.provider,
        resource_type: resItem.resource_type,
        difficulty: resItem.difficulty,
        duration: resItem.duration,
        is_free: resItem.is_free,
        why_recommended: resItem.why_recommended,
        add_to_my_courses: true
      });
      setAddedUrls((prev) => new Set(prev).add(resItem.url));
      if (onResourceAdded) onResourceAdded(saved);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 border border-indigo-500/20 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Course Discovery & Verified Resource Search</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
          {topic ? `Find Verified Resources for "${topic.title}"` : 'Discover Learning Resources'}
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Gemini queries real-time technical search layers to find verified course tutorials, official documentation, and video courses—ranking them specifically for your skill level.
        </p>

        {/* Global Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }}
          className="flex gap-2 pt-2 max-w-2xl"
        >
          <div className="flex-1">
            <Input
              placeholder="Search e.g. Best resources to learn Docker for Django deployment, Next.js 14..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button type="submit" variant="gradient" isLoading={isLoading}>
            Search
          </Button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === filter.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <Card className="text-center py-12 px-4 space-y-3 border-dashed border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No resources found matching filter</h3>
          <p className="text-xs text-slate-400">Try adjusting your search query or choosing another filter category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res, index) => {
            const isAdded = addedUrls.has(res.url);
            return (
              <Card
                key={index}
                hoverEffect
                className="p-5 flex flex-col justify-between border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Provider & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" size="sm" className="font-bold">
                        {res.provider || 'Web Resource'}
                      </Badge>
                      <Badge variant={res.is_free ? 'emerald' : 'purple'} size="sm">
                        {res.is_free ? 'FREE' : 'PAID'}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate-400 capitalize">
                        {res.resource_type}
                      </span>
                    </div>

                    {res.relevance_score && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" /> {res.relevance_score}% relevance
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-100 hover:text-indigo-400 transition-colors leading-snug">
                    {res.title}
                  </h3>

                  {/* Why recommended explanation */}
                  {res.why_recommended && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <span className="font-semibold text-indigo-400 block text-[11px] uppercase tracking-wider">
                        Why Recommended:
                      </span>
                      <p className="leading-relaxed">{res.why_recommended}</p>
                    </div>
                  )}

                  {/* Skill Match Bullet checks */}
                  {res.matches && res.matches.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">Matches:</span>
                      {res.matches.map((m, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-emerald-400" /> {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                  >
                    <span>Open Course</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {topic && (
                    <Button
                      variant={isAdded ? 'outline' : 'gradient'}
                      size="sm"
                      disabled={isAdded}
                      isLoading={addingId === res.url}
                      onClick={() => handleAddResource(res)}
                      leftIcon={isAdded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                    >
                      {isAdded ? 'Added to Topic' : 'Add to Roadmap'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
