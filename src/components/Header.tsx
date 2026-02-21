import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  Bell 
} from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">전라남도교육청 통합 관리 시스템</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="통합 검색..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">관리자</p>
            <p className="text-[10px] text-slate-500">최고 관리자</p>
          </div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFOIPt_h0ri4dHFlyg7-KAyt8DBddrJOBVv1DXH1Htf4_gZFBHtt0OdgecFEYAENfVS7Uwmjpaa-Bsrhzwf2HyIcpF-oNTkUaG6GqOfGzSdAbPkqb5fKxRRK3aaPDvTBqvY9SKh4EzIGCrGNJWIQwbZ0VZGcH3PXHN6YKFYJIGYBCQ3_YcoI8WEXxj8-ZcNqlKyfcpZwB8uVK6-rrXcehm0pMvh78KuWGqDSVl0Rbf0N8RGiywKAZh_tFN5v8RxkKSAABrpBSOvLPV" 
            alt="관리자" 
            className="size-9 rounded-full object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
