import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-2 w-full px-4 pt-3 pb-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: i < currentStep ? '100%' : '0%',
              background: 'var(--text-primary)',
            }}
          />
        </div>
      ))}
    </div>
  );
};
