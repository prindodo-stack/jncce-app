import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function StatsSidebar() {
  const [stats, setStats] = useState([
    { label: '총 이벤트 수', value: '0', trend: '0%', icon: CalendarIcon, color: 'text-primary' },
    { label: '누적 참가자 수', value: '0', trend: '0%', icon: Users, color: 'text-primary' },
    { label: '누적 급식 수', value: '0', trend: '0%', icon: Utensils, color: 'text-primary' },
  ]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total events
        const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
        
        // Fetch meal sum
        const { data: mealData } = await supabase.from('meals').select('count');
        const totalMeals = mealData?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

        // Fetch upcoming events (next 7 days)
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: upcomingData } = await supabase
          .from('events')
          .select('*')
          .gte('date', today)
          .lte('date', nextWeek)
          .order('date', { ascending: true })
          .limit(3);

        setStats([
          { label: '총 이벤트 수', value: (eventCount || 0).toString(), trend: '+0%', icon: CalendarIcon, color: 'text-primary' },
          { label: '누적 참가자 수', value: '0', trend: '+0%', icon: Users, color: 'text-primary' }, // Participants logic can be added if table exists
          { label: '누적 급식 수', value: totalMeals.toLocaleString(), trend: '+0%', icon: Utensils, color: 'text-primary' },
        ]);

        setUpcoming(upcomingData || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
  }, []);

  const deptNames = {
    planning: '기획운영부',
    creative: '창의교육부',
    information: '교육정보부',
    general: '총무부'
  };

  const deptColors = {
    planning: 'bg-planning',
    creative: 'bg-creative',
    information: 'bg-information',
    general: 'bg-general'
  };

  return (
    <aside className="w-80 border-l border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto hidden xl:flex">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">월간 통계</h3>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                <stat.icon className={`${stat.color}`} size={18} />
              </div>
              <p className="text-3xl font-black">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-emerald-600 font-bold">{stat.trend}</span>
                <span className="text-[10px] text-slate-400">지난달 대비</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-6 border-t border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">다음 주 예정 사항</h3>
        <div className="space-y-3">
          {upcoming.length > 0 ? upcoming.map((item) => (
            <div key={item.id} className="flex gap-3 group cursor-pointer">
              <div className={`w-1 ${deptColors[item.type as keyof typeof deptColors]} rounded-full transition-all group-hover:w-1.5`}></div>
              <div>
                <p className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-[10px] text-slate-500">{item.date} • {deptNames[item.type as keyof typeof deptNames]}</p>
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-400">예정된 일정이 없습니다.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
