import * as XLSX from 'xlsx';
import { Job } from '@/types';

export function exportJobsToExcelBrowser(jobs: Job[], filename = 'JobOS_Applications_Export.xlsx') {
  const rows = jobs.map((job, idx) => {
    const requiredSkills = job.job_skills?.map(s => s.skill_name) || job.required_skills || [];
    const missingSkills = job.missing_skills || [];
    const matchingSkills = job.matching_skills || [];

    return {
      No: idx + 1,
      Company: job.company,
      Role: job.role,
      'Job Link': job.job_url || '',
      'Applied Date': job.applied_date,
      Status: job.status.replace('_', ' '),
      'Match Score': `${job.match_score}%`,
      'Required Skills': requiredSkills.join(', '),
      'Missing Skills': missingSkills.join(', '),
      'My Skills': matchingSkills.join(', '),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },   // No
    { wch: 22 },  // Company
    { wch: 25 },  // Role
    { wch: 35 },  // Job Link
    { wch: 14 },  // Applied Date
    { wch: 14 },  // Status
    { wch: 14 },  // Match Score
    { wch: 35 },  // Required Skills
    { wch: 30 },  // Missing Skills
    { wch: 30 },  // My Skills
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Applications');

  XLSX.writeFile(workbook, filename);
}
