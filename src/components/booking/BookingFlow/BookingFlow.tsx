'use client';

import { useRef } from 'react';
import { STEPPER_STEPS, type StepperStep } from '@/lib/booking/bookingState';
import BookingStepper from '../BookingStepper/BookingStepper';
import ConfirmedStep from '../ConfirmedStep/ConfirmedStep';
import DateStep from '../DateStep/DateStep';
import DetailsStep from '../DetailsStep/DetailsStep';
import IntroStep from '../IntroStep/IntroStep';
import PaymentStep from '../PaymentStep/PaymentStep';
import SessionStep from '../SessionStep/SessionStep';
import styles from './BookingFlow.module.scss';
import type { BookingFlowProps } from './BookingFlow.types';
import { useBookingFlow } from './useBookingFlow';
import { useStepTransition } from './useStepTransition';

const isStepperStep = (step: string): step is StepperStep =>
  STEPPER_STEPS.includes(step as StepperStep);

// The booking page, from the Figma "Design 1 · Guided steps" flow: the
// intro and sessions, a session's details, date and time, your details,
// payment, then the confirmation. One step on screen at a time.
export default function BookingFlow({ content, services }: BookingFlowProps) {
  const flow = useBookingFlow(services, content.timeZone);
  const { state, today } = flow;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shown = useStepTransition(state.step, stageRef, flow.instantSwapRef);

  const { draft } = state;
  const service = services.find((s) => s.id === draft.serviceId) ?? services[0];
  const shared = {
    summaryCopy: content.summary,
    service,
    date: draft.date,
    time: draft.time,
    timeZoneLabel: content.timeZoneLabel,
    price: content.price
  };

  return (
    <div className={styles.flow}>
      <h1 className={styles.srOnly}>{content.title}</h1>

      {isStepperStep(shown) ? (
        <BookingStepper
          labels={content.steps}
          current={shown}
          onJump={flow.goTo}
          label={content.stepsLabel}
        />
      ) : null}

      <div ref={stageRef} className={styles.stage}>
        {shown === 'intro' ? (
          <IntroStep
            content={content}
            services={services}
            selectedId={draft.serviceId}
            onSelect={flow.selectService}
            onNext={() => flow.goTo('session')}
          />
        ) : null}

        {shown === 'session' ? (
          <SessionStep
            copy={content.session}
            services={services}
            selectedId={service.id}
            onSelect={flow.selectService}
            onBook={() => flow.goTo('date')}
          />
        ) : null}

        {shown === 'date' && today ? (
          <DateStep
            {...shared}
            copy={content.date}
            today={today}
            onDate={flow.selectDate}
            onTime={flow.selectTime}
            onBack={() => flow.goTo('session')}
            onNext={() => flow.goTo('details')}
          />
        ) : null}

        {shown === 'details' ? (
          <DetailsStep
            {...shared}
            copy={content.details}
            details={draft.details}
            onChange={flow.editDetails}
            onSubmit={flow.submitDetails}
            onBack={() => flow.goTo('date')}
          />
        ) : null}

        {shown === 'payment' ? (
          <PaymentStep
            {...shared}
            copy={content.payment}
            paying={flow.paying}
            onPay={() => void flow.pay()}
            onBack={() => flow.goTo('details')}
          />
        ) : null}

        {shown === 'confirmed' && state.confirmation ? (
          <ConfirmedStep
            copy={content.confirmation}
            service={
              services.find((s) => s.id === state.confirmation?.serviceId) ??
              service
            }
            confirmation={state.confirmation}
            timeZone={content.timeZone}
            timeZoneLabel={content.timeZoneLabel}
            price={content.price}
          />
        ) : null}
      </div>
    </div>
  );
}
