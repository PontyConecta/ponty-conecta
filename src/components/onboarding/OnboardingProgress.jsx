import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OnboardingProgress({ steps, currentStep, accentColor = 'indigo', onStepClick }) {
  const colorMap = {
    indigo: { active: 'bg-[#7DB04B]', line: 'bg-[#7DB04B]' },
    orange: { active: 'bg-[#B5956A]', line: 'bg-[#B5956A]' },
    purple: { active: 'bg-[#7DB04B]', line: 'bg-[#7DB04B]' },
  };
  const colors = colorMap[accentColor] || colorMap.indigo;

  const handleClick = (stepNumber) => {
    if (onStepClick && stepNumber < currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div 
            className={`flex items-center gap-1.5 ${s.number < currentStep && onStepClick ? 'cursor-pointer group' : ''}`}
            onClick={() => handleClick(s.number)}
          >
            <div className={`
              w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0
              ${currentStep >= s.number ? `${colors.active} text-white` : 'bg-muted'}
              ${s.number < currentStep && onStepClick ? 'group-hover:scale-110 group-hover:ring-2 group-hover:ring-[#7DB04B]/30' : ''}
            `}>
              {currentStep > s.number ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : s.number}
            </div>
            <span className={`hidden sm:block text-xs sm:text-sm whitespace-nowrap ${currentStep >= s.number ? 'font-medium text-foreground' : 'text-muted-foreground'} ${s.number < currentStep && onStepClick ? 'group-hover:text-[#7DB04B]' : ''}`}>
              {s.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-4 sm:w-8 h-0.5 flex-shrink-0 ${currentStep > s.number ? 'bg-[#7DB04B]' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}