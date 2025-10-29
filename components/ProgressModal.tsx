import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Medication, HistoryEntry } from '../types';
import { ChartBarIcon } from './icons';

interface ProgressModalProps {
    medications: Medication[];
    history: HistoryEntry[];
    onClose: () => void;
}

type DayStatus = 'full' | 'partial' | 'none' | 'unscheduled';

const isSameDay = (d1: Date, d2: Date): boolean =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const isMedScheduledOnDate = (med: Medication, date: Date): boolean => {
    if (!med.reminder) return false;
    if (med.reminder.frequency === 'daily') return true;
    if (med.reminder.frequency === 'specific_days' && med.reminder.days?.includes(date.getDay())) {
        return true;
    }
    return false;
};

const calculateDayStatus = (date: Date, medications: Medication[], history: HistoryEntry[]): DayStatus => {
    const scheduledMeds = medications.filter(med => isMedScheduledOnDate(med, date));

    if (scheduledMeds.length === 0) {
        return 'unscheduled';
    }

    const takenMedIds = new Set(
        history
            .filter(h => isSameDay(new Date(h.takenAt), date))
            .map(h => h.medicationId)
    );

    const takenCount = scheduledMeds.filter(med => takenMedIds.has(med.id)).length;

    if (takenCount === 0) return 'none';
    if (takenCount === scheduledMeds.length) return 'full';
    return 'partial';
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ProgressModal: React.FC<ProgressModalProps> = ({ medications, history, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const overallCompliance = useMemo(() => {
        let totalScheduled = 0;
        let totalTaken = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const scheduledMeds = medications.filter(med => isMedScheduledOnDate(med, date));
            totalScheduled += scheduledMeds.length;

            if (scheduledMeds.length > 0) {
                const takenMedIds = new Set(
                    history
                        .filter(h => isSameDay(new Date(h.takenAt), date))
                        .map(h => h.medicationId)
                );
                const takenCount = scheduledMeds.filter(med => takenMedIds.has(med.id)).length;
                totalTaken += takenCount;
            }
        }

        return totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;
    }, [medications, history]);

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = [];
        // Add blank cells for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ key: `blank-${i}`, type: 'blank' });
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            grid.push({
                key: date.toISOString(),
                type: 'day',
                date,
                day,
                status: calculateDayStatus(date, medications, history),
                isToday: isSameDay(date, new Date()),
            });
        }
        return grid;
    }, [viewDate, medications, history]);

    const changeMonth = (offset: number) => {
        setViewDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const getStatusColorClasses = (status: DayStatus) => {
        switch (status) {
            case 'full': return 'bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200';
            case 'partial': return 'bg-yellow-200 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-200';
            case 'none': return 'bg-red-200 dark:bg-red-800/60 text-red-800 dark:text-red-200';
            default: return 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400';
        }
    };
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-modal-title"
      >
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
                  <h2 id="progress-modal-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-blue-500" />
                    Adherence Report
                  </h2>
                  <button
                      onClick={onClose}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label="Close progress modal"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </header>

              <main className="p-6 overflow-y-auto flex-grow">
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/40 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Last 30 Days Compliance</p>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-300">{overallCompliance}%</p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&lt;</button>
                  <h3 className="text-lg font-semibold">
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {WEEKDAY_NAMES.map(day => <div key={day}>{day}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map(cell => (
                        <div key={cell.key} className="h-12 w-full">
                            {cell.type === 'day' && (
                                <div
                                    className={`
                                        w-full h-full flex items-center justify-center rounded-lg text-sm font-semibold
                                        ${getStatusColorClasses(cell.status)}
                                        ${cell.isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
                                    `}
                                >
                                    {cell.day}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-200 dark:bg-green-800/60"></span> Full Compliance</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-200 dark:bg-yellow-800/60"></span> Partial Compliance</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-800/60"></span> No Compliance</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-700/50"></span> Not Scheduled</div>
                </div>
              </main>
          </div>
      </div>
  );
};

export default ProgressModal;