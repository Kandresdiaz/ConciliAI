import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  tab?: string; 
}

interface Props {
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<Props> = ({ steps, currentStep, onNext, onPrev, onClose }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Safe access to step
  const step = steps && steps.length > currentStep ? steps[currentStep] : null;

  useEffect(() => {
    if (!step) {
        setTargetRect(null);
        return;
    }

    const updatePosition = () => {
      const element = document.getElementById(step.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetRect(element.getBoundingClientRect());
      } else {
        // If element not found, fallback to null (center modal)
        setTargetRect(null);
      }
    };

    // Small delay to allow DOM updates (tab switching)
    const timer = setTimeout(updatePosition, 150);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timer);
    };
  }, [currentStep, step ? step.targetId : 'no-step']); // Safe dependency

  if (!step) return null;

  const getTooltipStyle = () => {
    // If no target rect (element missing), center the modal
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' as const };
    
    const gap = 20;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = targetRect.top - gap;
        left = targetRect.left + targetRect.width / 2;
        return { top, left, transform: 'translate(-50%, -100%)', position: 'absolute' as const };
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2;
        return { top, left, transform: 'translate(-50%, 0)', position: 'absolute' as const };
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - gap;
        return { top, left, transform: 'translate(-100%, -50%)', position: 'absolute' as const };
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + gap;
        return { top, left, transform: 'translate(0, -50%)', position: 'absolute' as const };
      case 'center':
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' as const };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
      {/* Background Mask */}
      {targetRect ? (
        <>
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: targetRect.top }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }} />
          
          {/* Spotlight Border */}
          <div 
            className="absolute border-4 border-yellow-400 rounded-lg shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all duration-300 pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Floating Info Card */}
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 transition-all duration-300 animate-bounce-small z-[101] w-80 max-w-[90vw]"
        style={getTooltipStyle()}
      >
        <div className="flex justify-between items-start mb-4">
           <h3 className="text-xl font-bold text-indigo-900">{step.title}</h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          {step.content}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
             {steps.map((_, idx) => (
               <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-200'}`} />
             ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={onPrev}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <button 
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md"
            >
              {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
              {currentStep !== steps.length - 1 && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};