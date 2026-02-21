import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Save, Settings as SettingsIcon, Calendar as CalendarIcon, RefreshCw, PlusCircle, Info, LogOut, CheckCircle2 } from 'lucide-react';

const daysOfWeek = [
  { id: 0, label: '일' },
  { id: 1, label: '월' },
  { id: 2, label: '화' },
  { id: 3, label: '수' },
  { id: 4, label: '목' },
  { id: 5, label: '금' },
  { id: 6, label: '토' },
];

interface SettingsProps {
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Settings({ isAdmin, onLogin, onLogout }: SettingsProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. 운영 기본값 설정 State
  const [defaultCapacity, setDefaultCapacity] = useState(180);
  const [defaultMealCount, setDefaultMealCount] = useState(45);
  const [operatingDays, setOperatingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // 2. 특정 날짜 개별 설정 State
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCapacity, setTargetCapacity] = useState(220);
  const [targetMealCount, setTargetMealCount] = useState(45);

  // 3. 기간/요일 일괄 설정 State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchDays, setBatchDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [batchCapacity, setBatchCapacity] = useState(220);
  const [batchMealCount, setBatchMealCount] = useState(45);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  async function fetchSettings() {
    try {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const cap = data.find(s => s.key === 'default_capacity')?.value;
        const meal = data.find(s => s.key === 'default_meal_count')?.value;
        const days = data.find(s => s.key === 'operating_days')?.value;
        
        if (cap) setDefaultCapacity(parseInt(cap));
        if (meal) setDefaultMealCount(parseInt(meal));
        if (days) setOperatingDays(days.split(',').map(Number));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1416') {
      onLogin();
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  // 기본값 저장
  const saveDefaults = async () => {
    const dayLabels = operatingDays.map(id => daysOfWeek.find(d => d.id === id)?.label).join(', ');
    const confirmMessage = `[운영 기본값 변경 경고]\n\n` +
      `선택하신 요일(${dayLabels || '없음'})에 대해 아래 설정이 기본값으로 적용됩니다:\n` +
      `- 상시 수용 급식 정원: ${defaultCapacity}명\n` +
      `- 일일 기본 식수인원: ${defaultMealCount}명\n\n` +
      `이 설정은 개별 설정이 없는 모든 해당 요일의 데이터에 즉시 반영됩니다.\n` +
      `정말로 적용하시겠습니까?`;

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('settings').upsert([
        { key: 'default_capacity', value: defaultCapacity.toString() },
        { key: 'default_meal_count', value: defaultMealCount.toString() },
        { key: 'operating_days', value: operatingDays.join(',') }
      ]);
      
      if (error) throw error;
      alert('운영 기본값이 성공적으로 저장 및 적용되었습니다.');
    } catch (error: any) {
      console.error('Save Defaults Error:', error);
      alert('저장 실패: ' + (error.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 개별 날짜 적용
  const saveIndividualDate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('daily_configs').upsert({
        date: targetDate,
        capacity: targetCapacity,
        meal_count: targetMealCount
      });
      
      if (error) throw error;
      alert(`${targetDate} 설정이 적용되었습니다.`);
    } catch (error: any) {
      console.error('Save Individual Date Error:', error);
      alert('적용 실패: ' + (error.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 일괄 업데이트
  const saveBatchUpdate = async () => {
    if (!window.confirm('선택한 기간 및 요일에 대해 설정을 일괄 업데이트하시겠습니까?')) return;
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const configs = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (batchDays.includes(d.getDay())) {
          configs.push({
            date: d.toISOString().split('T')[0],
            capacity: batchCapacity,
            meal_count: batchMealCount
          });
        }
      }

      if (configs.length === 0) {
        alert('해당하는 날짜가 없습니다.');
        return;
      }

      const { error } = await supabase.from('daily_configs').upsert(configs);
      if (error) throw error;
      
      alert(`${configs.length}개의 일자가 성공적으로 업데이트되었습니다.`);
    } catch (error: any) {
      alert('일괄 업데이트 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number, state: number[], setState: React.Dispatch<React.SetStateAction<number[]>>) => {
    if (state.includes(dayId)) {
      setState(state.filter(d => d !== dayId));
    } else {
      setState([...state, dayId].sort());
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Master Panel</h2>
            <p className="text-sm text-slate-500">시스템 설정을 위해 인증이 필요합니다.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-center text-2xl tracking-widest"
            />
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all">
              인증하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-slate-900">Master Panel</h1>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">인증됨</span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={16} />
          로그아웃
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. 운영 기본값 설정 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <Save className="text-primary" size={24} />
            <h2 className="text-xl font-black text-slate-800">운영 기본값 설정</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">상시 수용 급식 정원</label>
              <input 
                type="number" 
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(parseInt(e.target.value))}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xl font-black text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">일일 기본 식수인원</label>
              <input 
                type="number" 
                value={defaultMealCount}
                onChange={(e) => setDefaultMealCount(parseInt(e.target.value))}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xl font-black text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">정기 운영 요일</label>
              <div className="flex justify-between gap-1">
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id, operatingDays, setOperatingDays)}
                    className={`size-10 rounded-lg text-xs font-bold transition-all ${
                      operatingDays.includes(day.id) 
                        ? 'bg-indigo-900 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={saveDefaults}
            disabled={loading}
            className="w-full mt-8 bg-indigo-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
          >
            <CheckCircle2 size={20} />
            기본값 저장
          </button>
        </div>

        {/* 2. 특정 날짜 개별 설정 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <CalendarIcon className="text-primary" size={24} />
            <h2 className="text-xl font-black text-slate-800">특정 날짜 개별 설정</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">변경 대상 날짜</label>
              <input 
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">변경 급식 정원</label>
                <input 
                  type="number" 
                  value={targetCapacity}
                  onChange={(e) => setTargetCapacity(parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-black text-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">변경 기본 식수인원</label>
                <input 
                  type="number" 
                  value={targetMealCount}
                  onChange={(e) => setTargetMealCount(parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-black text-primary"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={saveIndividualDate}
            disabled={loading}
            className="w-full mt-8 bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-700/20"
          >
            <PlusCircle size={20} />
            일자별 적용
          </button>
        </div>

        {/* 3. 기간/요일 일괄 설정 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <RefreshCw className="text-primary" size={24} />
            <h2 className="text-xl font-black text-slate-800">기간/요일 일괄 설정</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">시작일</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">종료일</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">대상 요일 선택</label>
              <div className="flex justify-between gap-1">
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id, batchDays, setBatchDays)}
                    className={`size-10 rounded-lg text-xs font-bold transition-all ${
                      batchDays.includes(day.id) 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">일괄 급식 정원</label>
                <input 
                  type="number" 
                  value={batchCapacity}
                  onChange={(e) => setBatchCapacity(parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-black text-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">일괄 기본 식수인원</label>
                <input 
                  type="number" 
                  value={batchMealCount}
                  onChange={(e) => setBatchMealCount(parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-black text-primary"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={saveBatchUpdate}
            disabled={loading}
            className="w-full mt-8 bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
          >
            <RefreshCw size={20} />
            일괄 업데이트
          </button>
        </div>
      </div>

      {/* 운영 제어 안내 */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
        <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
          <Info size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-slate-800 mb-1">운영 제어 안내</h4>
          <p className="text-xs text-slate-500 leading-relaxed">현황 모니터링의 날짜 목록을 클릭하면 해당 일자의 휴무 여부를 즉시 전환할 수 있습니다. <br/>일괄 업데이트 시 기존에 설정된 개별 날짜 설정이 덮어씌워질 수 있으니 주의하시기 바랍니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">마스터 모드 활성중</span>
        </div>
      </div>
    </div>
  );
}

