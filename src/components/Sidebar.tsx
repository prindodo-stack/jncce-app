import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  PlusSquare, 
  Users, 
  Settings,
  School
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAdmin: boolean;
}

const navItems: { icon: any, label: string, view: ViewType }[] = [
  { icon: LayoutDashboard, label: '대시보드', view: 'dashboard' },
  { icon: CalendarIcon, label: '캘린더', view: 'calendar' },
  { icon: PlusSquare, label: '통합 데이터 입력', view: 'entry' },
];

const departments = [
  { id: 'planning', label: '기획운영부', color: 'bg-planning', checked: true },
  { id: 'creative', label: '창의교육부', color: 'bg-creative', checked: true },
  { id: 'information', label: '교육정보부', color: 'bg-information', checked: true },
  { id: 'general', label: '총무부', color: 'bg-general', checked: true },
];

export default function Sidebar({ currentView, onViewChange, isAdmin }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
            <School size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-tight">전라남도교육청창의융합교육청</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">통합 관리 시스템</p>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-100 rounded-lg">
            <div className="size-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">마스터 모드 활성</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === item.view 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-slate-600 hover:bg-slate-100 font-medium'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">부서</p>
        </div>

        <div className="space-y-1">
          {departments.map((dept) => (
            <label key={dept.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 rounded-lg">
              <input 
                type="checkbox" 
                defaultChecked={dept.checked}
                className={`rounded border-slate-300 text-${dept.id} focus:ring-${dept.id}`} 
              />
              <span className="text-sm font-medium text-slate-700">{dept.label}</span>
            </label>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'settings'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-600 hover:bg-slate-100 font-medium'
          }`}
        >
          <Settings size={18} />
          <span className="text-sm font-medium">설정</span>
        </button>
      </div>
    </aside>
  );
}
