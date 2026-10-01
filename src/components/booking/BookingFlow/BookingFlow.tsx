'use client';

import { useRef } from 'react';
import { STEPPER_STEPS, type StepperStep } from '@/lib/booking/bookingState';
import { formatDayMedium } from '@/lib/booking/dates';
import BookingStepper from '../BookingStepper/BookingStepper';
import ConfirmedStep from '../ConfirmedStep/ConfirmedStep';
import DateStep from '../DateStep/DateStep';
import DetailsStep from '../DetailsStep/DetailsStep';
import IntroStep from '../IntroStep/IntroStep';
import ItemStep from '../ItemStep/ItemStep';
import PaymentStep from '../PaymentStep/PaymentStep';
import type { SummaryRow } from '../types';
import styles from './BookingFlow.module.scss';
import type { BookingFlowProps } from './BookingFlow.types';
import { useBookingFlow } from './useBookingFlow';
import { useStepTransition } from './useStepTransition';

// The services' flows, one step on screen at a time. A session goes from
// its intro and the sessions to one session's details, a date and time,
// your details, payment and the confirmation; a commission has no date to
// pick. The items come from the catalogue, so any number of them works.
export default function BookingFlow({
  kind,
  content,
  items,
  contact
}: BookingFlowProps) {
  const flow = useBookingFlow(kind, items, content.timeZone);
  const { state, today } = flow;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shown = useStepTransition(state.step, stageRef, flow.instantSwapRef);

  const { draft } = state;
  const item = items.find((i) => i.id === draft.itemId) ?? items[0];
  const price = item.price ?? content.price;
  const steps: readonly StepperStep[] = STEPPER_STEPS[kind];
  const onStepper = (steps as readonly string[]).includes(shown);
  const session = kind === 'session';

  // The running summary: a session's day and time, the item's first fact
  // (its length or its format), and where a session meets once that's
  // being chosen.
  const { summary: summaryCopy, details: detailsCopy } = content;
  const rows: SummaryRow[] = [];
  if (session && summaryCopy.date && summaryCopy.time) {
    rows.push(
      {
        label: summaryCopy.date,
        value: draft.date ? formatDayMedium(draft.date) : summaryCopy.empty
      },
      {
        label: summaryCopy.time,
        value: draft.time
          ? `${draft.time} ${content.timeZoneLabel}`
          : summaryCopy.empty
      }
    );
  }
  if (item.facts[0]) rows.push(item.facts[0]);
  if (
    session &&
    summaryCopy.meetOn &&
    detailsCopy.meetOn &&
    (draft.detailsDone || shown === 'details')
  )
    rows.push({
      label: summaryCopy.meetOn,
      value:
        draft.details.meetOn === 'discord'
          ? detailsCopy.meetOn.discord
          : detailsCopy.meetOn.meet
    });
  const summary = { copy: summaryCopy, item, rows, price };

  return (
    <div className={styles.flow}>
      <h1 className={styles.srOnly}>{content.title}</h1>

      {onStepper ? (
        <BookingStepper
          steps={steps}
          labels={content.steps}
          current={shown as StepperStep}
          onJump={flow.goTo}
          label={content.stepsLabel}
        />
      ) : null}

      <div ref={stageRef} className={styles.stage}>
        {shown === 'intro' ? (
          <IntroStep
            kind={kind}
            content={content}
            items={items}
            price={content.price}
            onOpen={flow.open}
          />
        ) : null}

        {shown === 'item' ? (
          <ItemStep
            copy={content.item}
            items={items}
            selectedId={item.id}
            price={content.price}
            onSelect={flow.selectItem}
            onContinue={() => flow.goTo(session ? 'date' : 'details')}
          />
        ) : null}

        {shown === 'date' && today && content.date ? (
          <DateStep
            copy={content.date}
            summary={summary}
            date={draft.date}
            time={draft.time}
            today={today}
            onDate={flow.selectDate}
            onTime={flow.selectTime}
            onBack={() => flow.goTo('item')}
            onNext={() => flow.goTo('details')}
          />
        ) : null}

        {shown === 'details' ? (
          <DetailsStep
            copy={content.details}
            summary={summary}
            details={draft.details}
            onChange={flow.editDetails}
            onSubmit={flow.submitDetails}
            onBack={() => flow.goTo(session ? 'date' : 'item')}
          />
        ) : null}

        {shown === 'payment' ? (
          <PaymentStep
            copy={content.payment}
            summary={summary}
            price={price}
            paying={flow.paying}
            onPay={() => void flow.pay()}
            onBack={() => flow.goTo('details')}
          />
        ) : null}

        {shown === 'confirmed' && state.confirmation ? (
          <ConfirmedStep
            kind={kind}
            copy={content.confirmation}
            item={
              items.find((i) => i.id === state.confirmation?.itemId) ?? item
            }
            confirmation={state.confirmation}
            timeZone={content.timeZone}
            price={price}
            contact={contact}
          />
        ) : null}
      </div>
    </div>
  );
}
