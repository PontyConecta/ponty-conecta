import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OnboardingProgress({ steps, currentStep, accentColor = 'indigo', onStepClick }) {
  const colorMap = {
    indigo: { active: 'bg-[#9038fa]', line: 'bg-[#9038fa]' },
    orange: { active: 'bg-[#b77aff]', line: 'bg-[#b77aff]' },
    purple: { active: 'bg-[#9038fa]', line: 'bg-[#9038fa]' },
  };
  const colors = colorMap[accentColor] || colorMap.indigo;

  const handleClick = (stepNumber) => {
    // Only allow clicking on completed steps (not current or future)
    if (onStepClick && stepNumber < currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div 
            className={`flex items-center gap-2 ${s.number < currentStep && onStepClick ? 'cursor-pointer group' : ''}`}
            onClick={() => handleClick(s.number)}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${currentStep >= s.number ? `${colors.active} text-white` : ''}
              ${s.number < currentStep && onStepClick ? 'group-hover:scale-110 group-hover:ring-2 group-hover:ring-[#9038fa]/30' : ''}
            `}
            style={currentStep >= s.number ? {} : { backgroundColor: 'var(--border-color)' }}
            >
              {currentStep > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
            </div>
            <span className={`hidden sm:block text-sm ${currentStep >= s.number ? 'font-medium' : ''} ${s.number < currentStep && onStepClick ? 'group-hover:text-[#9038fa]' : ''}`}
              style={{ color: currentStep >= s.number ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {s.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-8 h-0.5" style={{ backgroundColor: currentStep > s.number ? '#9038fa' : 'var(--border-color)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}