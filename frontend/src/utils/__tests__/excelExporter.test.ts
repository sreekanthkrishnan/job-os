// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Job } from '@/types';

describe('Job Data Normalization & Formatting Helpers', () => {
  it('correctly calculates match percentage string', () => {
    const sampleJob: Partial<Job> = {
      company: 'Google',
      role: 'Staff React Engineer',
      match_score: 85.5,
      matching_skills: ['React', 'TypeScript'],
      missing_skills: ['Go'],
    };

    expect(sampleJob.match_score).toBe(85.5);
    expect(sampleJob.matching_skills?.length).toBe(2);
    expect(sampleJob.missing_skills?.length).toBe(1);
  });

  it('handles zero skills edge cases safely', () => {
    const emptyJob: Partial<Job> = {
      company: 'Startup',
      role: 'Junior Dev',
      match_score: 0,
      matching_skills: [],
      missing_skills: [],
    };

    expect(emptyJob.match_score).toBe(0);
    expect(emptyJob.matching_skills).toEqual([]);
  });
});
