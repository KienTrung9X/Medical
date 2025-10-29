import React, { useState } from 'react';
import { ParsedMedication } from '../types';

interface ManualAddFormProps {
    onAdd: (medication: ParsedMedication) => void;
    onCancel: () => void;
}

const ManualAddForm: React.FC<ManualAddFormProps> = ({ onAdd, onCancel }) => {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [quantity, setQuantity] = useState('');
    const [instructions, setInstructions] = useState('');
    const [totalQuantity, setTotalQuantity] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Medication name is required.');
            return;
        }
        setError('');
        onAdd({ 
            name, 
            dosage, 
            quantity, 
            instructions,
            totalQuantity: totalQuantity ? parseInt(totalQuantity, 10) : null
        });
        // Clear form
        setName('');
        setDosage('');
        setQuantity('');
        setInstructions('');
        setTotalQuantity('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Medication Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., Ibuprofen"
                        required
                    />
                     {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dosage</label>
                        <input
                            type="text"
                            id="dosage"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., 200mg"
                        />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity (Text)</label>
                        <input
                            type="text"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., 30 Tablets"
                        />
                    </div>
                    <div>
                        <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Quantity (Numeric)</label>
                        <input
                            type="number"
                            id="totalQuantity"
                            value={totalQuantity}
                            onChange={(e) => setTotalQuantity(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., 30"
                            min="1"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructions</label>
                    <textarea
                        id="instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., Take one tablet by mouth every 4-6 hours"
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Add Medication
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualAddForm;