import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OnboardingProgress({ steps, currentStep, accentColor = 'indigo' }) {
  const colorMap = {
    indigo: { active: 'bg-[#9038fa]', line: 'bg-[#9038fa]' },
    orange: { active: 'bg-[#b77aff]', line: 'bg-[#b77aff]' },
    purple: { active: 'bg-[#9038fa]', line: 'bg-[#9038fa]' },
  };
  const colors = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${currentStep >= s.number ? `${colors.active} text-white` : 'bg-slate-200 text-slate-500'}
            `}>
              {currentStep > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
            </div>
            <span className={`hidden sm:block text-sm ${currentStep >= s.number ? 'font-medium' : ''}`}
              style={{ color: currentStep >= s.number ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {s.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${currentStep > s.number ? colors.line : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}