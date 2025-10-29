import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const roundedProgress = Math.round(progress);

  return (
    <div>
      <div 
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Medication completion progress"
      >
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${roundedProgress}%` }}
        ></div>
      </div>
      <p className="text-sm text-right mt-1 text-gray-500 dark:text-gray-400">
        {roundedProgress}% complete
      </p>
    </div>
  );
};

export default ProgressBar;
