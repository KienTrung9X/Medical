import React from 'react';
import { CheckCircleIcon, TrashIcon } from './icons';

interface BulkActionBarProps {
    count: number;
    onMarkTaken: () => void;
    onDelete: () => void;
    onDeselectAll: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, onMarkTaken, onDelete, onDeselectAll }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-full px-3 py-1">
                            {count} selected
                        </span>
                        <button 
                            onClick={onDeselectAll}
                            className="ml-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Deselect all
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onMarkTaken}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Mark as Taken</span>
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkActionBar;