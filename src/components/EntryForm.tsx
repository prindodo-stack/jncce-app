import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Department } from '../types';
import { Save, Calendar as CalendarIcon, Utensils, Users, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface EntryFormProps {
  initialDate?: string | null;
  onSaved?: () => void;
}

export default function EntryForm({ initialDate, onSaved }: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified Form State
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<Department>('planning');
  const [mealCount, setMealCount] = useState<number | ''>('');
  const [isMealAvailable, setIsMealAvailable] = useState(true);
  const [visitCount, setVisitCount] = useState<number | ''>('');

  // Update date if initialDate changes
  React.useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus(null);
    try {
      const promises = [];

      // 1. Save Event if title exists
      if (eventTitle.trim()) {
        promises.push(
          supabase.from('events').insert([{ 
            title: eventTitle.trim(), 
            date, 
            type: eventType 
          }])
        );
      }

      // 2. Save Meal if count is entered
      if (mealCount !== '') {
        promises.push(
          supabase.from('meals').upsert({ 
            date: date, 
            count: Number(mealCount), 
            is_available: isMealAvailable 
          }, { onConflict: 'date' })
        );
      }

      // 3. Save Visit if count is entered
      if (visitCount !== '') {
        promises.push(
          supabase.from('visits').upsert({ 
            date: date, 
            count: Number(visitCount) 
          }, { onConflict: 'date' })
        );
      }

      if (promises.length === 0) {
        alert('입력된 정보가 없습니다.');
        setLoading(false);
        return;
      }

      const results = await Promise.all(promises);
      const errorMessages = results
        .filter(r => r.error)
        .map(r => `${r.error?.message} (${r.error?.details || '상세내용 없음'})`);

      if (errorMessages.length > 0) {
        console.error('Supabase Save Errors:', results.filter(r => r.error));
        throw new Error(errorMessages.join(' | '));
      }

      setUploadStatus({ type: 'success', message: '데이터가 성공적으로 저장되었습니다.' });
      setEventTitle('');
      setMealCount('');
      setVisitCount('');
      if (onSaved) onSaved();
    } catch (error: any) {
      console.error('Form Submit Error:', error);
      setUploadStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Expected columns: 날짜(YYYY-MM-DD), 행사명, 부서(planning, creative, information, general), 급식인원, 방문자수
        const eventsToInsert: any[] = [];
        const mealsToUpsert: any[] = [];
        const visitsToUpsert: any[] = [];

        data.forEach(row => {
          const rowDate = row['날짜'];
          if (!rowDate) return;

          if (row['행사명']) {
            eventsToInsert.push({
              date: rowDate,
              title: row['행사명'],
              type: row['부서'] || 'planning'
            });
          }

          if (row['급식인원'] !== undefined) {
            mealsToUpsert.push({
              date: rowDate,
              count: parseInt(row['급식인원']),
              is_available: true
            });
          }

          if (row['방문자수'] !== undefined) {
            visitsToUpsert.push({
              date: rowDate,
              count: parseInt(row['방문자수'])
            });
          }
        });

        const promises = [];
        if (eventsToInsert.length > 0) promises.push(supabase.from('events').insert(eventsToInsert));
        if (mealsToUpsert.length > 0) promises.push(supabase.from('meals').upsert(mealsToUpsert, { onConflict: 'date' }));
        if (visitsToUpsert.length > 0) promises.push(supabase.from('visits').upsert(visitsToUpsert, { onConflict: 'date' }));

        await Promise.all(promises);
        setUploadStatus({ type: 'success', message: `${data.length}개의 행 데이터를 성공적으로 처리했습니다.` });
      } catch (error: any) {
        setUploadStatus({ type: 'error', message: '엑셀 처리 중 오류: ' + error.message });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">통합 데이터 관리</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            엑셀 업로드
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {uploadStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{uploadStatus.message}</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">기준 날짜</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-lg font-bold"
              />
            </div>

            {/* Event Section */}
            <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CalendarIcon size={20} />
                <h3 className="font-bold">행사 정보</h3>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">행사 명칭</label>
                <input 
                  type="text" 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="행사명 입력 (선택)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">담당 부서</label>
                <select 
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as Department)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="planning">기획운영부</option>
                  <option value="creative">창의교육부</option>
                  <option value="information">교육정보부</option>
                  <option value="general">총무부</option>
                </select>
              </div>
            </div>

            {/* Visit & Meal Section */}
            <div className="space-y-6">
              {/* Visit Section - Now on top */}
              <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Users size={20} />
                  <h3 className="font-bold">방문자 현황</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">방문자 수</label>
                  <input 
                    type="number" 
                    value={visitCount}
                    onChange={(e) => setVisitCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="인원수"
                  />
                </div>
              </div>

              {/* Meal Section - Now on bottom */}
              <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Utensils size={20} />
                  <h3 className="font-bold">급식 현황</h3>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-1">급식 인원</label>
                    <input 
                      type="number" 
                      value={mealCount}
                      onChange={(e) => setMealCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="인원수"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-3">
                    <input 
                      type="checkbox" 
                      id="isAvail"
                      checked={isMealAvailable}
                      onChange={(e) => setIsMealAvailable(e.target.checked)}
                      className="size-5 rounded border-slate-300 text-primary"
                    />
                    <label htmlFor="isAvail" className="text-xs font-bold text-slate-600">가능</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
          >
            <Save size={24} />
            {loading ? '처리 중...' : '모든 정보 저장하기'}
          </button>
        </form>
      </div>

      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
          <AlertCircle size={16} />
          엑셀 업로드 가이드
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          첫 번째 시트에 다음 컬럼명이 포함되어야 합니다: <br/>
          <span className="font-bold text-slate-700">날짜(YYYY-MM-DD), 행사명, 부서(planning/creative/information/general), 급식인원, 방문자수</span>
        </p>
      </div>
    </div>
  );
}

