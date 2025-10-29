import React, { useState, useEffect } from 'react';
import { ParsedMedication } from '../types';
import { TrashIcon, PlusCircleIcon } from './icons';

interface ReviewModalProps {
    extractedMeds: ParsedMedication[];
    onSave: (meds: ParsedMedication[]) => void;
    onCancel: () => void;
}

interface EditableMedication extends ParsedMedication {
    tempId: number;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ extractedMeds, onSave, onCancel }) => {
    const [meds, setMeds] = useState<EditableMedication[]>([]);

    useEffect(() => {
        setMeds(extractedMeds.map((med, index) => ({ ...med, tempId: Date.now() + index })));
    }, [extractedMeds]);

    const handleInputChange = (tempId: number, field: keyof ParsedMedication, value: string) => {
        setMeds(currentMeds =>
            currentMeds.map(med =>
                med.tempId === tempId ? { ...med, [field]: value } : med
            )
        );
    };

    const handleDeleteMed = (tempId: number) => {
        setMeds(currentMeds => currentMeds.filter(med => med.tempId !== tempId));
    };

    const handleAddMed = () => {
        const newMed: EditableMedication = {
            tempId: Date.now(),
            name: '',
            dosage: '',
            quantity: '',
            instructions: '',
        };
        setMeds(currentMeds => [...currentMeds, newMed]);
    };

    const handleSave = () => {
        // Filter out any meds that don't have a name
        const validMeds = meds.filter(med => med.name.trim() !== '');
        // Strip tempId before saving
        const medsToSave = validMeds.map(({ tempId, ...rest }) => rest);
        onSave(medsToSave);
    };

    const validMedsCount = meds.filter(m => m.name.trim() !== '').length;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
                    <h2 id="review-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                        Review Extracted Medications
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Cancel and close review"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto flex-grow space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                        Please review the information extracted from your file. You can edit or delete any item, or add a new one if something was missed.
                    </p>
                    {meds.length > 0 ? meds.map((med, index) => (
                        <div key={med.tempId} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Medication #{index + 1}</h3>
                                <button
                                    onClick={() => handleDeleteMed(med.tempId)}
                                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                                    aria-label={`Delete medication ${med.name || 'entry'}`}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor={`name-${med.tempId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        id={`name-${med.tempId}`}
                                        value={med.name}
                                        onChange={(e) => handleInputChange(med.tempId, 'name', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Medication Name"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor={`dosage-${med.tempId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dosage</label>
                                        <input
                                            type="text"
                                            id={`dosage-${med.tempId}`}
                                            value={med.dosage}
                                            onChange={(e) => handleInputChange(med.tempId, 'dosage', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="e.g., 500mg"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`quantity-${med.tempId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                                        <input
                                            type="text"
                                            id={`quantity-${med.tempId}`}
                                            value={med.quantity}
                                            onChange={(e) => handleInputChange(med.tempId, 'quantity', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="e.g., 30 Tablets"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`instructions-${med.tempId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructions</label>
                                    <textarea
                                        id={`instructions-${med.tempId}`}
                                        value={med.instructions}
                                        onChange={(e) => handleInputChange(med.tempId, 'instructions', e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g., Take one tablet twice daily"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No medications to review.</p>
                        </div>
                    )}
                    <button 
                        onClick={handleAddMed}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border-2 border-dashed border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Add another medication
                    </button>
                </main>

                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={validMedsCount === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Save {validMedsCount > 0 ? `${validMedsCount} ` : ''}Medication(s)
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReviewModal;
