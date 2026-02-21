import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Users, Utensils, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month';

interface DashboardProps {
  onNavigateToEntry: (date: string) => void;
}

export default function Dashboard({ onNavigateToEntry }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [visitData, setVisitData] = useState<any[]>([]);
  const [mealData, setMealData] = useState<any[]>([]);
  const [dailyDetails, setDailyDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ visits: 0, meals: 0, defaultMeals: 45, defaultCapacity: 180 });

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  async function fetchData() {
    setLoading(true);
    try {
      let limit = 7;
      if (timeRange === 'week') limit = 28; // 4 weeks
      if (timeRange === 'month') limit = 31; // Show daily for the month

      const { data: visits } = await supabase
        .from('visits')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      const { data: settings } = await supabase
        .from('settings')
        .select('*');

      const defaultCap = settings?.find(s => s.key === 'default_capacity')?.value || '180';
      const defaultMeal = settings?.find(s => s.key === 'default_meal_count')?.value || '45';
      
      const capNum = parseInt(defaultCap);
      const mealNum = parseInt(defaultMeal);

      // Fetch daily overrides
      const { data: dailyConfigs } = await supabase
        .from('daily_configs')
        .select('*')
        .in('date', [
          ...Array.from({ length: limit }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
          })
        ]);

      // Process data for charts
      const processedVisits = aggregateData(visits || [], timeRange);
      const processedMeals = aggregateData(meals || [], timeRange);

      setVisitData(processedVisits);
      setMealData(processedMeals);
      
      // Detailed daily list for the selected period
      const details = [];
      const today = new Date();
      for (let i = 0; i < limit; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const config = dailyConfigs?.find(c => c.date === dateStr);
        const currentCap = config?.capacity || capNum;
        const currentBaseMeal = config?.meal_count || mealNum;

        const v = visits?.find(item => item.date === dateStr)?.count || 0;
        const eventMeals = meals?.find(item => item.date === dateStr)?.count || 0;
        
        // Remaining = Total Capacity - (Base Employees + Event Meals)
        const totalUsed = currentBaseMeal + eventMeals;
        const remaining = currentCap - totalUsed;

        details.push({
          date: dateStr,
          visits: v,
          meals: eventMeals,
          baseMeals: currentBaseMeal,
          totalMeals: totalUsed,
          remaining: remaining,
          isAvailable: remaining > 0
        });
      }
      setDailyDetails(details);

      const todayStr = today.toISOString().split('T')[0];
      const todayVisit = visits?.find(v => v.date === todayStr)?.count || 0;
      const todayEventMeal = meals?.find(m => m.date === todayStr)?.count || 0;
      
      const todayConfig = dailyConfigs?.find(c => c.date === todayStr);
      const todayCap = todayConfig?.capacity || capNum;
      const todayBaseMeal = todayConfig?.meal_count || mealNum;

      setSummary({
        visits: todayVisit,
        meals: todayEventMeal + todayBaseMeal,
        defaultMeals: todayBaseMeal,
        defaultCapacity: todayCap
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateData(data: any[], range: TimeRange) {
    if (range === 'day' || range === 'month') return [...data].reverse(); // In month view, user wants daily details, so chart stays daily but for longer period

    const groups: { [key: string]: number } = {};
    data.forEach(item => {
      const date = new Date(item.date);
      let key = '';
      if (range === 'week') {
        const day = date.getDay();
        const diff = date.getDate() - day;
        const startOfWeek = new Date(date.setDate(diff));
        key = startOfWeek.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 주';
      }
      groups[key] = (groups[key] || 0) + item.count;
    });

    return Object.entries(groups).map(([date, count]) => ({ date, count })).reverse();
  }

  if (loading) return <div className="p-8 text-center">데이터를 분석하는 중...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">현황 대시보드</h2>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {range === 'day' ? '일간' : range === 'week' ? '주간' : '월간'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500">오늘의 방문자</p>
            <Users className="text-primary" size={20} />
          </div>
          <p className="text-4xl font-black">{summary.visits}</p>
          <p className="text-xs text-emerald-600 font-bold mt-2">실시간 데이터</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500">오늘의 급식 인원</p>
            <Utensils className="text-primary" size={20} />
          </div>
          <p className="text-4xl font-black">{summary.meals}</p>
          <p className="text-xs text-slate-400 font-bold mt-2">일일 기본 식수인원: {summary.defaultMeals}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500">잔여 급식 가능 (오늘)</p>
            <TrendingUp className="text-primary" size={20} />
          </div>
          <p className={`text-4xl font-black ${summary.defaultCapacity - summary.meals > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {summary.defaultCapacity - summary.meals}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">수용 정원: {summary.defaultCapacity}</p>
        </div>
      </div>

      {/* Monthly/Period Detailed List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary" size={20} />
            <h3 className="text-lg font-bold">{timeRange === 'day' ? '최근 7일' : timeRange === 'week' ? '최근 4주' : '최근 31일'} 상세 현황</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">* 잔여 인원 클릭 시 바로 입력 화면으로 이동합니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">날짜</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">방문자</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">기본/행사 식수</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">잔여 가능 인원</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyDetails.map((detail) => {
                const dateObj = new Date(detail.date);
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                const dayIndex = dateObj.getDay();
                const dayName = dayNames[dayIndex];
                const dayColorClass = dayIndex === 0 ? 'text-red-500' : dayIndex === 6 ? 'text-blue-500' : 'text-slate-400';

                return (
                  <tr key={detail.date} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-700">
                      {detail.date}
                      <span className={`ml-1.5 font-bold ${dayColorClass}`}>({dayName})</span>
                    </td>
                  <td className="p-4 text-sm text-slate-600">{detail.visits}명</td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-medium">{detail.baseMeals}</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-primary font-bold">{detail.meals}</span>
                    <span className="text-[10px] text-slate-400 ml-1">(총 {detail.totalMeals}명)</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onNavigateToEntry(detail.date)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black transition-all hover:scale-105 active:scale-95 ${
                        detail.remaining > 0 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {detail.remaining > 0 ? `${detail.remaining}명 가능` : '마감'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onNavigateToEntry(detail.date)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      입력/수정
                    </button>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-primary" size={20} />
            <h3 className="text-lg font-bold">방문 추이</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1754cf" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1754cf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#1754cf" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Utensils className="text-primary" size={20} />
            <h3 className="text-lg font-bold">급식 추이</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#1754cf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
