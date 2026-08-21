import React, { useState, useEffect } from 'react';
import { careerApi, TargetRole } from '@/services/careerApi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  UserCheck, Target, Briefcase, DollarSign, Clock,
  Plus, X, Star, Save, CheckCircle2
} from 'lucide-react';

export const CareerProfileView: React.FC = () => {
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form Fields
  const [currentRole, setCurrentRole] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtcMin, setExpectedCtcMin] = useState('');
  const [expectedCtcMax, setExpectedCtcMax] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [careerGoal, setCareerGoal] = useState('');

  // Preferred Locations & Work Modes tag input
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [workModes, setWorkModes] = useState<string[]>(['remote', 'hybrid']);

  // Target Role input
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [pData, rData] = await Promise.all([
          careerApi.getProfile(),
          careerApi.getTargetRoles(),
        ]);
        setTargetRoles(rData);

        if (pData) {
          setCurrentRole(pData.current_role || '');
          setYearsOfExperience(pData.years_of_experience || 0);
          setCurrentCtc(pData.current_ctc || '');
          setExpectedCtcMin(pData.expected_ctc_min || '');
          setExpectedCtcMax(pData.expected_ctc_max || '');
          setNoticePeriod(pData.notice_period || '');
          setCareerGoal(pData.career_goal || '');
          setLocations(pData.preferred_locations || []);
          setWorkModes(pData.preferred_work_modes || ['remote', 'hybrid']);
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const handleToggleWorkMode = (mode: string) => {
    if (workModes.includes(mode)) {
      setWorkModes(workModes.filter(m => m !== mode));
    } else {
      setWorkModes([...workModes, mode]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await careerApi.updateProfile({
        current_role: currentRole.trim() || undefined,
        years_of_experience: yearsOfExperience,
        current_ctc: currentCtc.trim() || undefined,
        expected_ctc_min: expectedCtcMin.trim() || undefined,
        expected_ctc_max: expectedCtcMax.trim() || undefined,
        notice_period: noticePeriod.trim() || undefined,
        career_goal: careerGoal.trim() || undefined,
        preferred_locations: locations,
        preferred_work_modes: workModes,
      });
      setMessage('Career Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTargetRole = async () => {
    if (!targetRoleInput.trim()) return;
    setIsAddingRole(true);
    try {
      const isFirst = targetRoles.length === 0;
      await careerApi.createTargetRole({
        name: targetRoleInput.trim(),
        priority: targetRoles.length + 1,
        is_primary: isFirst,
      });
      setTargetRoleInput('');
      const updated = await careerApi.getTargetRoles();
      setTargetRoles(updated);
    } catch {
      // Handle error
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleSetPrimaryRole = async (id: string) => {
    try {
      await careerApi.updateTargetRole(id, { is_primary: true });
      const updated = await careerApi.getTargetRoles();
      setTargetRoles(updated);
    } catch {
      // Handle error
    }
  };

  const handleDeleteTargetRole = async (id: string) => {
    try {
      await careerApi.deleteTargetRole(id);
      const updated = await careerApi.getTargetRoles();
      setTargetRoles(updated);
    } catch {
      // Handle error
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge variant="indigo" pulse>Phase B — Career Operating System Active</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Career Profile & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Target Roles</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Configure your target roles, CTC goals, notice period, and work preferences. JobOS uses your profile to evaluate opportunities and calculate personalized Match & Opportunity Scores.
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden md:block">
          <UserCheck className="w-64 h-64 text-indigo-400" />
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Target Roles Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-sm text-slate-200">Target Roles Architecture</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{targetRoles.length} Defined Roles</span>
        </div>

        {/* Add Target Role input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add target role (e.g. Senior React Developer, Frontend Engineer, Lead Architect)..."
            value={targetRoleInput}
            onChange={(e) => setTargetRoleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTargetRole();
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
          <Button
            type="button"
            variant="gradient"
            size="sm"
            isLoading={isAddingRole}
            onClick={handleAddTargetRole}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Role
          </Button>
        </div>

        {/* Target Roles List */}
        {targetRoles.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            No target roles defined yet. Add your primary target job title above!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {targetRoles.map((tr) => (
              <div
                key={tr.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  tr.is_primary
                    ? 'bg-purple-950/30 border-purple-500/40 shadow-md shadow-purple-900/20'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">{tr.name}</span>
                    {tr.is_primary && (
                      <Badge variant="purple" size="sm" className="text-[10px]">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Priority #{tr.priority}</p>
                </div>

                <div className="flex items-center gap-1">
                  {!tr.is_primary && (
                    <button
                      onClick={() => handleSetPrimaryRole(tr.id)}
                      className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                      title="Set as Primary Target Role"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTargetRole(tr.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                    title="Remove Target Role"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Career Profile Form */}
      <form onSubmit={handleSaveProfile}>
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-slate-200">Career Metadata & Expectations</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Job Role / Title"
              placeholder="e.g. Senior Software Engineer"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              leftIcon={<Briefcase className="w-4 h-4" />}
            />

            <Input
              label="Years of Experience"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 5.0"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Current CTC / Salary"
              placeholder="e.g. 14 LPA / $120k"
              value={currentCtc}
              onChange={(e) => setCurrentCtc(e.target.value)}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />

            <Input
              label="Expected CTC (Min)"
              placeholder="e.g. 18 LPA / $140k"
              value={expectedCtcMin}
              onChange={(e) => setExpectedCtcMin(e.target.value)}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />

            <Input
              label="Expected CTC (Max)"
              placeholder="e.g. 22 LPA / $170k"
              value={expectedCtcMax}
              onChange={(e) => setExpectedCtcMax(e.target.value)}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Notice Period"
              placeholder="e.g. 30 Days / Immediate"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />}
            />

            {/* Preferred Work Modes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Preferred Work Modes</label>
              <div className="flex gap-2 pt-1">
                {['remote', 'hybrid', 'onsite'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleToggleWorkMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      workModes.includes(mode)
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">Preferred Locations</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add preferred location (e.g. Remote, Bangalore, San Francisco)..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLocation}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            {locations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {locations.map((loc) => (
                  <Badge key={loc} variant="indigo" size="sm" className="normal-case">
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => setLocations(locations.filter(l => l !== loc))}
                      className="ml-1 text-indigo-400 hover:text-indigo-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Career Goal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Career Goal & Vision</label>
            <textarea
              rows={4}
              placeholder="State your strategic 1-3 year career goal (e.g. Lead frontend architecture at a high-growth tech company, scale cloud microservices)..."
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-800">
            <Button
              type="submit"
              variant="gradient"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Career Profile
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
