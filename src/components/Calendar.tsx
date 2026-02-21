import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

const typeColors = {
  planning: 'bg-planning/10 border-planning text-planning',
  creative: 'bg-creative/10 border-creative text-creative',
  information: 'bg-information/10 border-information text-information',
  general: 'bg-general/10 border-general text-general',
};

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({ day: prevMonthLastDay - i + 1, currentMonth: false });
    }
    
    // Current month days
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      days.push({ day: i, currentMonth: true });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (loading) return <div className="p-8 text-center">일정을 불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">{monthName}</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold uppercase tracking-tight">오늘</button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="calendar-grid border-b border-slate-200 bg-slate-50">
          {daysOfWeek.map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid bg-slate-200 gap-[1px]">
          {days.map((item, idx) => {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`;
            const dayEvents = item.currentMonth ? events.filter(e => e.date === dateStr) : [];
            const isToday = item.currentMonth && 
                            item.day === new Date().getDate() && 
                            currentDate.getMonth() === new Date().getMonth() && 
                            currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={idx} 
                className={`calendar-cell p-2 flex flex-col gap-1 transition-colors ${
                  !item.currentMonth ? 'bg-slate-50/50 opacity-40' : 
                  isToday ? 'bg-primary/5 ring-1 ring-primary/20 ring-inset' : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-primary font-black' : 'text-slate-700'}`}>
                  {item.day}
                </span>
                
                <div className="space-y-1">
                  {dayEvents.map((event, eIdx) => (
                    <div 
                      key={eIdx}
                      className={`px-2 py-1 rounded text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] border-l-2 ${typeColors[event.type as keyof typeof typeColors]}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
