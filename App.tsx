
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Medication, AppState, ParsedMedication, Reminder, HistoryEntry } from './types';
import { extractMedicationInfoFromImage } from './services/geminiService';
import FileUpload from './components/FileUpload';
import MedicationCard from './components/MedicationCard';
import ManualAddForm from './components/ManualAddForm';
import BulkActionBar from './components/BulkActionBar';
import ProgressBar from './components/ProgressBar';
import HistoryModal from './components/HistoryModal';
import ReviewModal from './components/ReviewModal';
import ProgressModal from './components/ProgressModal';
import { PillIcon, BellIcon, PlusCircleIcon, HistoryIcon, ChartBarIcon } from './components/icons';

const calculateNextReminderDate = (reminder: Reminder, now: Date): Date | null => {
    if (!reminder.times || reminder.times.length === 0) {
        return null;
    }

    const potentialDates: Date[] = [];

    // Check for the next 7 days to cover all specific day possibilities and edge cases
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        const isDayValid = reminder.frequency === 'daily' || 
                           (reminder.frequency === 'specific_days' && reminder.days?.includes(dayOfWeek));

        if (isDayValid) {
            reminder.times.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const potentialReminderDate = new Date(checkDate);
                potentialReminderDate.setHours(hours, minutes, 0, 0);

                if (potentialReminderDate > now) {
                    potentialDates.push(potentialReminderDate);
                }
            });
        }
    }
    
    if (potentialDates.length === 0) {
        return null; // No upcoming reminders found
    }

    // Find the soonest date from all potential future dates
    return new Date(Math.min(...potentialDates.map(d => d.getTime())));
};


const App: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<AppState>(AppState.Idle);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([]);
  const [medsForReview, setMedsForReview] = useState<ParsedMedication[] | null>(null);
  const reminderTimeouts = useRef<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [userId, setUserId] = useState<string | null>(null);
  const isInitialDataLoaded = useRef(false);

  // 1. Get or create a unique user ID on component mount.
  useEffect(() => {
    let id = localStorage.getItem('medication-tracker-userId');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('medication-tracker-userId', id);
    }
    setUserId(id);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 2. Load data from the server once we have a userId.
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/load?userId=${userId}`);
        if (!response.ok) {
          let errorMsg = 'Failed to load data from server.';
          const responseText = await response.text();
          try {
            const errorBody = JSON.parse(responseText);
            // Use the specific error from the serverless function
            errorMsg = `Failed to load data: ${errorBody.error || response.statusText}`;
            if (errorBody.details) {
              console.error("Server error details:", errorBody.details);
            }
          } catch (e) {
            // The response body wasn't JSON. This is unexpected but we should handle it.
            console.error("Could not parse error response from server. Body:", responseText);
            errorMsg = 'Failed to load data. The server returned an unexpected response.';
          }
          throw new Error(errorMsg);
        }
        const result = await response.json();
        
        if (result.data) {
          const parsedData = JSON.parse(result.data);
          if (parsedData.medications) {
            setMedications(parsedData.medications);
          }
          if (parsedData.history) {
            const parsedHistory = parsedData.history.map((h: any) => ({ ...h, takenAt: new Date(h.takenAt) }));
            setHistory(parsedHistory);
          }
        }
        // Only mark data as loaded on success to prevent overwriting saved data on load failure.
        isInitialDataLoaded.current = true;
      } catch (err: any) {
        console.error("Failed to load state from API:", err);
        // Display the more specific error message to the user
        setError(err.message || 'Failed to load your saved data. Please try again later.');
        setStatus(AppState.Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // 3. Save state to the server whenever medications or history change.
  useEffect(() => {
    if (!isInitialDataLoaded.current || !userId) {
      return;
    }

    const handler = setTimeout(() => {
        const saveData = async () => {
          try {
            const dataToSave = { medications, history };
            const response = await fetch('/api/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                data: JSON.stringify(dataToSave)
              }),
            });

            if (!response.ok) {
              let errorMsg = 'Failed to save data to server.';
              const responseText = await response.text();
              try {
                  const errorBody = JSON.parse(responseText);
                  errorMsg = `Could not save your changes: ${errorBody.error || response.statusText}`;
                   if (errorBody.details) {
                      console.error("Server error details on save:", errorBody.details);
                  }
              } catch (e) {
                  console.error("Could not parse save error response. Body:", responseText);
                  errorMsg = 'Could not save your changes. The server returned an unexpected response.';
              }
              throw new Error(errorMsg);
            }
            
            if (error?.includes('Could not save your changes')) {
                setError(null);
            }
          } catch (err: any) {
            console.error("Failed to save state to API:", err);
            setError(err.message || 'Could not save your changes.');
          }
        };
        saveData();
    }, 500); // Debounce save requests

    return () => {
      clearTimeout(handler);
    };
  }, [medications, history, userId, error]);


  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }, []);
  
  // Effect to schedule and clear notifications
  useEffect(() => {
    const scheduleNotification = (med: Medication) => {
      // Always clear previous timeout for this med
      if (reminderTimeouts.current[med.id]) {
          clearTimeout(reminderTimeouts.current[med.id]);
          delete reminderTimeouts.current[med.id];
      }
      
      if (!med.reminder || notificationPermission !== 'granted') return;

      const now = new Date();
      const nextReminderDate = calculateNextReminderDate(med.reminder, now);

      if (nextReminderDate) {
          const delay = nextReminderDate.getTime() - now.getTime();
          
          if (delay > 0) {
              const timeoutId = window.setTimeout(() => {
                  new Notification('Medication Reminder', {
                      body: `Time to take your ${med.name} (${med.dosage}).`,
                      icon: 'https://www.gstatic.com/images/icons/material/system/2x/medical_services_googblue_24dp.png',
                  });
                  // Reschedule for the next occurrence
                  scheduleNotification(med); 
              }, delay);
              reminderTimeouts.current[med.id] = timeoutId;
          }
      }
    };
    
    medications.forEach(scheduleNotification);

    return () => {
        Object.values(reminderTimeouts.current).forEach(clearTimeout);
    };
  }, [medications, notificationPermission]);

  const handleFileUpload = useCallback(async (file: File) => {
    setStatus(AppState.Loading);
    setError(null);
    setIsAddingManually(false);
    setMedsForReview(null);
    try {
      const extractedData: ParsedMedication[] = await extractMedicationInfoFromImage(file);
      if (extractedData.length > 0) {
        setMedsForReview(extractedData);
        setStatus(AppState.Idle);
      } else {
        setError("No medication information was found in the file. Please try using a clearer image or add the medication manually.");
        setStatus(AppState.Error);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setStatus(AppState.Error);
    }
  }, []);

  const handleSaveReviewedMedications = useCallback((reviewedMeds: ParsedMedication[]) => {
    const newMedications: Medication[] = reviewedMeds.map((med, index) => ({
      ...med,
      id: `${Date.now()}-${index}`,
      taken: false,
      reminder: null,
    }));
    setMedications(prevMeds => [...prevMeds, ...newMedications]);
    setMedsForReview(null);
    setStatus(AppState.Success);
  }, []);

  const handleCancelReview = useCallback(() => {
    setMedsForReview(null);
    setStatus(AppState.Idle);
  }, []);

  const handleToggleTaken = useCallback((id: string) => {
    setMedications(prevMeds => {
      const medToUpdate = prevMeds.find(m => m.id === id);
      if (!medToUpdate) return prevMeds;

      if (!medToUpdate.taken) { // from not taken to taken
        const historyEntry: HistoryEntry = {
          id: `${Date.now()}-${medToUpdate.id}`,
          medicationId: medToUpdate.id,
          medicationName: medToUpdate.name,
          takenAt: new Date(),
        };
        setHistory(prevHistory => [...prevHistory, historyEntry]);
      } else { // from taken to not taken (undo)
        setHistory(prevHistory => {
          const entriesForMed = prevHistory.filter(h => h.medicationId === id);
          if (entriesForMed.length === 0) return prevHistory;
          const latestEntry = entriesForMed.reduce((a, b) => new Date(a.takenAt) > new Date(b.takenAt) ? a : b);
          return prevHistory.filter(h => h.id !== latestEntry.id);
        });
      }
      return prevMeds.map(med => med.id === id ? { ...med, taken: !med.taken } : med);
    });
  }, []);

  const handleSetReminder = useCallback((id: string, reminder: Reminder | null) => {
    setMedications(prevMeds =>
      prevMeds.map(med =>
        med.id === id ? { ...med, reminder: reminder } : med
      )
    );
  }, []);
  
  const handleAddManualMedication = useCallback((newMedData: ParsedMedication) => {
    const newMedication: Medication = {
      ...newMedData,
      id: `${Date.now()}-manual`,
      taken: false,
      reminder: null,
    };
    setMedications(prevMeds => [...prevMeds, newMedication]);
    setIsAddingManually(false);
    setStatus(AppState.Success);
  }, []);

  const handleSelectMedication = useCallback((id: string) => {
    setSelectedMedicationIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(medId => medId !== id)
        : [...prevSelected, id]
    );
  }, []);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMedicationIds(medications.map(m => m.id));
    } else {
      setSelectedMedicationIds([]);
    }
  }, [medications]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete ${selectedMedicationIds.length} medication(s)?`)) {
      setMedications(prevMeds => prevMeds.filter(med => !selectedMedicationIds.includes(med.id)));
      setHistory(prevHistory => prevHistory.filter(h => !selectedMedicationIds.includes(h.medicationId)));
      setSelectedMedicationIds([]);
    }
  }, [selectedMedicationIds]);

  const handleBulkMarkAsTaken = useCallback(() => {
    const now = new Date();
    setMedications(prevMeds => {
      const newHistoryEntries: HistoryEntry[] = [];
      const updatedMeds = prevMeds.map(med => {
        if (selectedMedicationIds.includes(med.id)) {
          if (!med.taken) { // Only add to history if it wasn't already taken
            newHistoryEntries.push({
              id: `${Date.now()}-${med.id}`,
              medicationId: med.id,
              medicationName: med.name,
              takenAt: now,
            });
          }
          return { ...med, taken: true };
        }
        return med;
      });
      if(newHistoryEntries.length > 0) {
        setHistory(prevHistory => [...prevHistory, ...newHistoryEntries]);
      }
      return updatedMeds;
    });

    setSelectedMedicationIds([]);
  }, [selectedMedicationIds]);
  
  const handleClearHistory = useCallback(() => {
      if (window.confirm('Are you sure you want to clear all medication history? This action cannot be undone.')) {
        setHistory([]);
      }
  }, []);

  const progress = medications.length > 0
    ? (medications.filter(m => m.taken).length / medications.length) * 100
    : 0;
    
  const renderNotificationButton = () => {
      if (!('Notification' in window)) return null;

      if (notificationPermission === 'granted') {
          return (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300 px-3 py-2 rounded-lg">
                  <BellIcon className="w-5 h-5" />
                  <span>Notifications Enabled</span>
              </div>
          );
      }
      return (
          <button
              onClick={requestNotificationPermission}
              disabled={notificationPermission === 'denied'}
              className="flex items-center gap-2 text-sm text-amber-800 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 px-3 py-2 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
              <BellIcon className="w-5 h-5" />
              <span>{notificationPermission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}</span>
          </button>
      )
  };
  
  const allSelected = medications.length > 0 && selectedMedicationIds.length === medications.length;
  const isIndeterminate = selectedMedicationIds.length > 0 && !allSelected;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <main className="max-w-3xl mx-auto pb-24">
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <PillIcon className="w-10 h-10 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight">
              Medication Assistant
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your prescription to automatically track your medications.
          </p>
        </header>

        <div className="flex justify-end mb-4">
            {renderNotificationButton()}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-4">
          <h2 className="text-lg font-semibold mb-4">Upload Prescription</h2>
          <FileUpload onFileUpload={handleFileUpload} isLoading={status === AppState.Loading} />
        </div>
        
        {!isAddingManually && status !== AppState.Loading && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setIsAddingManually(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Add Medication Manually</span>
            </button>
          </div>
        )}
        
        {isAddingManually && (
          <div className="mb-8">
            <ManualAddForm
              onAdd={handleAddManualMedication}
              onCancel={() => setIsAddingManually(false)}
            />
          </div>
        )}
        
        {status === AppState.Loading && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your prescription... this may take a moment.</p>
          </div>
        )}

        {status === AppState.Error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your medication data...</p>
          </div>
        ) : medications.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Today's Regimen</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsProgressVisible(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="View adherence progress"
                    >
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Progress</span>
                  </button>
                  <button
                    onClick={() => setIsHistoryVisible(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="View medication history"
                    >
                    <HistoryIcon className="w-5 h-5" />
                    <span>History</span>
                  </button>
                </div>
            </div>
            <div className="mb-6">
              <ProgressBar progress={progress} />
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
                <div className="relative flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            id="select-all"
                            aria-describedby="select-all-description"
                            name="select-all"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={allSelected}
                            ref={input => {
                                if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={handleSelectAll}
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="select-all" className="font-medium text-gray-700 dark:text-gray-300">
                            Select All
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
              {medications.map(med => {
                const dosesTaken = history.filter(h => h.medicationId === med.id).length;
                return (
                  <MedicationCard
                    key={med.id}
                    medication={med}
                    dosesTaken={dosesTaken}
                    onToggleTaken={handleToggleTaken}
                    onSetReminder={handleSetReminder}
                    notificationPermission={notificationPermission}
                    isSelected={selectedMedicationIds.includes(med.id)}
                    onSelect={handleSelectMedication}
                  />
                );
              })}
            </div>
          </div>
        ) : !isAddingManually && !isAddingManually && status !== AppState.Loading && (
            <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <PillIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No medications listed</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by uploading a photo of your prescription or adding one manually.
                </p>
            </div>
        )}
      </main>
      
      {selectedMedicationIds.length > 0 && (
        <BulkActionBar
          count={selectedMedicationIds.length}
          onDeselectAll={() => setSelectedMedicationIds([])}
          onDelete={handleBulkDelete}
          onMarkTaken={handleBulkMarkAsTaken}
        />
      )}
      
      {isHistoryVisible && (
        <HistoryModal 
            history={history} 
            onClose={() => setIsHistoryVisible(false)}
            onClearHistory={handleClearHistory}
        />
      )}

      {isProgressVisible && (
        <ProgressModal
          medications={medications}
          history={history}
          onClose={() => setIsProgressVisible(false)}
        />
      )}
      
      {medsForReview && (
        <ReviewModal
          extractedMeds={medsForReview}
          onSave={handleSaveReviewedMedications}
          onCancel={handleCancelReview}
        />
      )}
    </div>
  );
};

export default App;
