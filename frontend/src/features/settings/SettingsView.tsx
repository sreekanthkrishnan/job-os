import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Shield, Cpu, Database } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Application Settings</h1>
        <p className="text-xs text-slate-400">Manage account credentials, AI integrations, and database preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-200">Account Profile</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-100 font-mono">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Name</span>
              <span className="text-slate-100">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Member Since</span>
              <span className="text-slate-100">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-slate-200">AI Integration</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Provider</span>
              <Badge variant="purple">Google Gemini AI</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Fallback Mode</span>
              <Badge variant="cyan">Deterministic NLP Regex</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Status</span>
              <Badge variant="emerald" pulse>Active & Pluggable</Badge>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Database & System</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">ORM Backend</span>
              <span className="text-slate-200 font-medium">Django 5.x ORM</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">API Documentation</span>
              <a href="/api/docs/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-mono">
                /api/docs/ (Swagger)
              </a>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200">Security & Authentication</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Authentication</span>
              <Badge variant="emerald">JWT Bearer Token</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">User Identification</span>
              <span className="text-slate-300 font-mono text-[10px]">{user?.id}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
