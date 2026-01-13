import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { useCreateEvent } from '@/features/events/hooks/useCreateEvent';
import { WizardData, WizardStep, DEFAULT_WIZARD_DATA, STEPS, STEP_TITLES } from './types';
import { StepEventType } from './steps/StepEventType';
import { StepEventDetails } from './steps/StepEventDetails';
import { StepCourseSelection } from './steps/StepCourseSelection';
import { StepDateTime } from './steps/StepDateTime';
import { StepSettings } from './steps/StepSettings';
import { StepReview } from './steps/StepReview';

interface CreateEventWizardProps {
  onClose: () => void;
  initialType?: WizardData['eventType'];
}

export function CreateEventWizard({ onClose, initialType }: CreateEventWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialType ? 'details' : 'type');
  const [data, setData] = useState<WizardData>({
    ...DEFAULT_WIZARD_DATA,
    eventType: initialType || 'society_day',
  });
  const [direction, setDirection] = useState(1);

  const { mutate: createEvent, isPending } = useCreateEvent();

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const goToStep = (step: WizardStep) => {
    const newIndex = STEPS.indexOf(step);
    setDirection(newIndex > currentStepIndex ? 1 : -1);
    setCurrentStep(step);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setDirection(1);
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setDirection(-1);
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleCreate = () => {
    const eventInput = {
      name: data.name,
      description: data.description || undefined,
      event_type: data.eventType,
      start_date: data.startDate,
      end_date: data.endDate || undefined,
      scoring_format: data.scoringFormat,
      handicap_allowance: data.handicapAllowance,
      max_handicap: data.maxHandicap,
      max_participants: data.maxParticipants || undefined,
      visibility: data.visibility,
    };

    const roundInputs = data.rounds.map(round => ({
      course_id: round.courseId,
      course_name: round.courseName,
      course_location: round.courseLocation,
      round_date: round.roundDate,
      first_tee_time: round.firstTeeTime,
      tee_time_interval: round.teeTimeInterval,
      holes: round.holes,
      shotgun_start: round.shotgunStart,
    }));

    createEvent(
      { event: eventInput, rounds: roundInputs },
      {
        onSuccess: (event) => {
          onClose();
          navigate(`/events/${event.id}`);
        },
      }
    );
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={currentStepIndex > 0 ? prevStep : onClose}
          className="p-2 -ml-2 hover:bg-muted rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium">{STEP_TITLES[currentStep]}</span>
        <button onClick={onClose} className="p-2 -mr-2 hover:bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute inset-0 overflow-y-auto"
          >
            {currentStep === 'type' && (
              <StepEventType
                value={data.eventType}
                onChange={(eventType) => updateData({ eventType })}
                onNext={nextStep}
              />
            )}
            {currentStep === 'details' && (
              <StepEventDetails data={data} onChange={updateData} onNext={nextStep} />
            )}
            {currentStep === 'course' && (
              <StepCourseSelection data={data} onChange={updateData} onNext={nextStep} />
            )}
            {currentStep === 'datetime' && (
              <StepDateTime data={data} onChange={updateData} onNext={nextStep} />
            )}
            {currentStep === 'settings' && (
              <StepSettings data={data} onChange={updateData} onNext={nextStep} />
            )}
            {currentStep === 'review' && (
              <StepReview
                data={data}
                onEdit={goToStep}
                onCreate={handleCreate}
                isCreating={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
