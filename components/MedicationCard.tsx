import React, { useState } from 'react';
import { Medication, Reminder } from '../types';
import { PillIcon, ClockIcon, CheckCircleIcon, BellIcon, BellIconSolid, TrashIcon, PlusCircleIcon } from './icons';

interface MedicationCardProps {
  medication: Medication;
  onToggleTaken: (id: string) => void;
  onSetReminder: (id: string, reminder: Reminder | null) => void;
  notificationPermission: NotificationPermission;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatReminderText = (reminder: Reminder | null): string => {
    if (!reminder || !reminder.times || reminder.times.length === 0) return 'No reminder set';

    const timeString = reminder.times.sort().join(', ');
    
    if (reminder.frequency === 'daily') {
        return `Daily at ${timeString}`;
    }

    if (reminder.frequency === 'specific_days' && reminder.days && reminder.days.length > 0) {
        const sortedDays = [...reminder.days].sort();
        if (sortedDays.length === 7) return `Daily at ${timeString}`;
        if (sortedDays.length === 0) return 'No reminder set';
        const dayStr = sortedDays.map(d => DAY_NAMES[d]).join(', ');
        return `On ${dayStr} at ${timeString}`;
    }

    return 'No reminder set';
};


const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onToggleTaken,
  onSetReminder,
  notificationPermission,
  isSelected,
  onSelect
}) => {
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  
  const [reminderFormState, setReminderFormState] = useState<Reminder>(
    medication.reminder || { times: ['09:00'], frequency: 'daily', days: [] }
  );

  const handleEditClick = () => {
    setReminderFormState(medication.reminder || { times: ['09:00'], frequency: 'daily', days: [] });
    setIsEditingReminder(true);
  };

  const handleSaveReminder = () => {
    const finalTimes = reminderFormState.times.filter(t => t.trim() !== '');
    if (finalTimes.length === 0 || (reminderFormState.frequency === 'specific_days' && (!reminderFormState.days || reminderFormState.days.length === 0))) {
        onSetReminder(medication.id, null);
    } else {
        onSetReminder(medication.id, { ...reminderFormState, times: finalTimes });
    }
    setIsEditingReminder(false);
  };
  
  const handleCancelReminder = () => {
    setIsEditingReminder(false);
  };
  
  const handleClearReminder = () => {
    onSetReminder(medication.id, null);
    setIsEditingReminder(false);
  };
  
  const toggleDay = (dayIndex: number) => {
    setReminderFormState(prevState => {
        const currentDays = prevState.days || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex];
        return { ...prevState, days: newDays };
    });
  };

  const handleTimeChange = (index: number, value: string) => {
    setReminderFormState(s => {
        const newTimes = [...s.times];
        newTimes[index] = value;
        return { ...s, times: newTimes };
    });
  };

  const handleAddTime = () => {
      setReminderFormState(s => ({ ...s, times: [...s.times, ''] }));
  };

  const handleRemoveTime = (index: number) => {
      if (reminderFormState.times.length > 1) {
          setReminderFormState(s => ({ ...s, times: s.times.filter((_, i) => i !== index) }));
      }
  };

  const reminderButtonDisabled = notificationPermission !== 'granted';

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 relative
        ${medication.taken ? 'opacity-60 bg-green-50 dark:bg-green-900/20' : ''}
        border-l-8 ${medication.taken ? 'border-green-400' : 'border-blue-500'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="absolute top-4 left-4">
        <input 
          type="checkbox"
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={isSelected}
          onChange={() => onSelect(medication.id)}
          aria-label={`Select medication ${medication.name}`}
        />
      </div>
      <div className="p-5 pl-12">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${medication.taken ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                <PillIcon className={`w-6 h-6 ${medication.taken ? 'text-green-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold text-gray-900 dark:text-white ${medication.taken ? 'line-through' : ''}`}>
                  {medication.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{medication.dosage} - {medication.quantity}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggleTaken(medication.id)}
            aria-label={medication.taken ? 'Mark as not taken' : 'Mark as taken'}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${medication.taken 
                ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-blue-500'}
            `}
          >
            <CheckCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">{medication.instructions}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isEditingReminder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Times</label>
                        <div className="space-y-2">
                          {reminderFormState.times.map((time, index) => (
                              <div key={index} className="flex items-center gap-2">
                                  <input 
                                      type="time" 
                                      value={time}
                                      onChange={(e) => handleTimeChange(index, e.target.value)}
                                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTime(index)}
                                    disabled={reminderFormState.times.length <= 1}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                    aria-label="Remove time"
                                  >
                                      <TrashIcon className="w-5 h-5"/>
                                  </button>
                              </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddTime}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <PlusCircleIcon className="w-5 h-5"/>
                            Add time
                          </button>
                        </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                      <select
                        value={reminderFormState.frequency}
                        onChange={(e) => setReminderFormState(s => ({...s, frequency: e.target.value as 'daily' | 'specific_days'}))}
                        className="mt-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="specific_days">Specific Days</option>
                      </select>
                    </div>
                  </div>

                  {reminderFormState.frequency === 'specific_days' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On these days</label>
                      <div className="flex justify-between items-center space-x-1">
                        {WEEK_DAYS.map((day, index) => (
                           <button 
                              key={index}
                              type="button"
                              onClick={() => toggleDay(index)}
                              className={`
                                w-8 h-8 rounded-full text-xs font-bold transition-colors
                                ${(reminderFormState.days || []).includes(index)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }
                              `}
                           >
                            {day}
                           </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                      <button onClick={handleSaveReminder} className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600">Save</button>
                      <button onClick={handleCancelReminder} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-sm hover:bg-gray-300">Cancel</button>
                  </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {medication.reminder 
                          ? <BellIconSolid className="w-5 h-5 text-blue-500" />
                          : <BellIcon className="w-5 h-5 text-gray-400" />
                        }
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                           {formatReminderText(medication.reminder)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {medication.reminder && (
                          <button onClick={handleClearReminder} disabled={reminderButtonDisabled} className="px-3 py-1 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:hover:bg-transparent">Clear</button>
                        )}
                        <button onClick={handleEditClick} disabled={reminderButtonDisabled} className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {medication.reminder ? 'Change' : 'Set Reminder'}
                        </button>
                    </div>
                </div>
            )}
            {reminderButtonDisabled && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Enable notifications in the app header to set reminders.</p>}
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
