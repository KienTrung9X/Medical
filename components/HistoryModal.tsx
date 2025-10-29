import React, { useEffect, useRef } from 'react';
import { HistoryEntry } from '../types';
import { PillIcon, ClockIcon, TrashIcon } from './icons';

interface HistoryModalProps {
    history: HistoryEntry[];
    onClose: () => void;
    onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const sortedHistory = [...history].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

    // FIX: Using the generic form `reduce<Type>(...)` for better type inference.
    const groupedHistory = sortedHistory.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
        const date = new Date(entry.takenAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {});

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
                    <h2 id="history-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                        Medication History
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close history modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto flex-grow">
                    {Object.keys(groupedHistory).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(groupedHistory).map(([date, entries]) => (
                                <section key={date} aria-labelledby={`history-date-${date}`}>
                                    <h3 id={`history-date-${date}`} className="text-lg font-semibold text-gray-800 dark:text-gray-200 pb-2 mb-3 border-b-2 border-blue-500 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-2">
                                        {date}
                                    </h3>
                                    <ul className="space-y-3">
                                        {entries.map(entry => (
                                            <li key={entry.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                                  <PillIcon className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.medicationName}</p>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span>{new Date(entry.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <PillIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No History Yet</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                When you mark a medication as taken, it will appear here.
                            </p>
                        </div>
                    )}
                </main>
                
                {history.length > 0 && (
                  <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-xl">
                      <button
                          onClick={onClearHistory}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                      >
                          <TrashIcon className="w-5 h-5" />
                          <span>Clear All History</span>
                      </button>
                  </footer>
                )}
            </div>
        </div>
    );
};

export default HistoryModal;