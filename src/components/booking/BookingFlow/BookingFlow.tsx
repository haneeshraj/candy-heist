'use client';

import { useRef, useState } from 'react';
import { flowCopy } from '@/content/services/flows';
import { STEPPER_STEPS, type StepperStep } from '@/lib/booking/bookingState';
import { formatDayMedium } from '@/lib/booking/dates';
import { amountsFor } from '@/lib/booking/price';
import { DEFAULT_BROWSE, type ServiceBrowse } from '@/lib/services/browse';
import { notifyError } from '@/lib/toast/notify';
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

// "Book me as a music producer", one step on screen at a time: the intro
// and every service, one service's details, then for a 1-1 session a date
// and time, your details, payment (a commission's half, a session's whole
// price) and the confirmation. The picked item's kind sets the steps and
// the copy. The items come from the catalogue, so any number works.
export default function BookingFlow({
  content,
  items,
  contact
}: BookingFlowProps) {
  const flow = useBookingFlow(items, content.timeZone);
  const { state, today } = flow;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shown = useStepTransition(state.step, stageRef, flow.instantSwapRef);
  // The search, filter and sort on the intro, kept while an item is open.
  const [browse, setBrowse] = useState<ServiceBrowse>(DEFAULT_BROWSE);

  const { draft } = state;
  const item = items.find((i) => i.id === draft.itemId) ?? items[0];
  const { kind } = item;
  const session = kind === 'session';
  const copy = flowCopy(content, kind);
  const amounts = amountsFor(kind, item.price, content.price);
  const steps: readonly StepperStep[] = STEPPER_STEPS[kind];
  const onStepper = (steps as readonly string[]).includes(shown);

  // The running summary. A session: its day and time, its length, and
  // where it meets once that's being chosen. A commission: its format,
  // the full price and what's left for delivery. Then what's paid now.
  const { summary: summaryCopy } = copy;
  const rows: SummaryRow[] = [];
  if (session)
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
  if (item.facts[0]) rows.push(item.facts[0]);
  if (
    session &&
    copy.details.meetOn &&
    (draft.detailsDone || shown === 'details')
  )
    rows.push({
      label: summaryCopy.meetOn,
      value:
        draft.details.meetOn === 'discord'
          ? copy.details.meetOn.discord
          : copy.details.meetOn.meet
    });
  if (amounts.later !== null)
    rows.push(
      { label: summaryCopy.price, value: amounts.price },
      { label: summaryCopy.later, value: amounts.later }
    );
  const summary = { copy: summaryCopy, item, rows, price: amounts.now };

  const confirmed = state.confirmation
    ? (items.find((i) => i.id === state.confirmation?.itemId) ?? item)
    : null;

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
            content={content}
            items={items}
            browse={browse}
            onBrowse={setBrowse}
            onOpen={flow.open}
          />
        ) : null}

        {shown === 'item' ? (
          <ItemStep
            copy={content.item}
            kinds={content.kinds}
            item={item}
            price={content.price}
            onBack={() => flow.goTo('intro')}
            onContinue={() => flow.goTo(session ? 'date' : 'details')}
          />
        ) : null}

        {shown === 'date' && today ? (
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
            copy={copy.details}
            summary={summary}
            details={draft.details}
            onChange={flow.editDetails}
            onSubmit={flow.submitDetails}
            onBack={() => flow.goTo(session ? 'date' : 'item')}
          />
        ) : null}

        {shown === 'payment' ? (
          <PaymentStep
            copy={copy.payment}
            summary={summary}
            price={amounts.now}
            paying={flow.paying}
            onPay={() =>
              void flow.pay().then((paid) => {
                if (!paid)
                  notifyError(
                    copy.payment.failed.title,
                    copy.payment.failed.text
                  );
              })
            }
            onBack={() => flow.goTo('details')}
          />
        ) : null}

        {shown === 'confirmed' && state.confirmation && confirmed ? (
          <ConfirmedStep
            copy={flowCopy(content, state.confirmation.kind).confirmation}
            item={confirmed}
            confirmation={state.confirmation}
            timeZone={content.timeZone}
            amounts={amountsFor(
              state.confirmation.kind,
              confirmed.price,
              content.price
            )}
            contact={contact}
          />
        ) : null}
      </div>
    </div>
  );
}
