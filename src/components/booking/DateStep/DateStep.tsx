'use client';

import { useId, useRef, useState } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { lastBookableDay, slotsFor } from '@/lib/booking/availability';
import {
  addDays,
  addMonths,
  formatDayLong,
  formatMonth,
  parseDateKey
} from '@/lib/booking/dates';
import BookingSummary from '../BookingSummary/BookingSummary';
import StepHeading from '../StepHeading/StepHeading';
import CalendarDays from './CalendarDays';
import styles from './DateStep.module.scss';
import type { DateStepProps } from './DateStep.types';
import TimeSlots from './TimeSlots';

const monthIndex = ({ year, month }: { year: number; month: number }) =>
  year * 12 + month;

// Figma "D1 · 3 Date and time": a month of free days beside the chosen
// day's times, with the running summary on the right.
export default function DateStep({
  copy,
  summaryCopy,
  service,
  date,
  time,
  today,
  timeZoneLabel,
  price,
  onDate,
  onTime,
  onBack,
  onNext
}: DateStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.3 });

  const firstMonth = parseDateKey(addDays(today, 1));
  const lastMonth = parseDateKey(lastBookableDay(today));
  const [view, setView] = useState<{ year: number; month: number }>(() =>
    date ? parseDateKey(date) : firstMonth
  );
  const canGoBack = monthIndex(view) > monthIndex(firstMonth);
  const canGoForward = monthIndex(view) < monthIndex(lastMonth);
  const monthTitle = formatMonth(view.year, view.month);

  const slots = date ? slotsFor(date, today) : [];
  const openCount = slots.filter((slot) => slot.open).length;

  return (
    <section ref={rootRef} className={styles.step} aria-labelledby={headingId}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <StepHeading
            id={headingId}
            label={copy.label}
            heading={copy.heading}
            sub={copy.sub}
          />

          <div className={styles.panel} data-enter>
            <CornerTicks />
            <div className={styles.calendar}>
              <div className={styles.monthBar}>
                <p className={styles.month} aria-live="polite">
                  <WordReveal
                    key={monthTitle}
                    text={monthTitle}
                    trigger="mount"
                  />
                </p>
                <div className={styles.monthNav}>
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() => setView((v) => addMonths(v, -1))}
                    disabled={!canGoBack}
                    aria-label={copy.previousMonth}
                  >
                    <ArrowIcon className={styles.back} />
                  </button>
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() => setView((v) => addMonths(v, 1))}
                    disabled={!canGoForward}
                    aria-label={copy.nextMonth}
                  >
                    <ArrowIcon />
                  </button>
                </div>
              </div>
              <div role="group" aria-label={monthTitle}>
                <CalendarDays
                  key={monthTitle}
                  year={view.year}
                  month={view.month}
                  today={today}
                  selected={date}
                  onSelect={onDate}
                  openTimesLabel={copy.openTimes}
                />
              </div>
            </div>

            <div className={styles.times}>
              {date ? (
                <>
                  <p className={styles.dayTitle}>
                    <WordReveal
                      key={date}
                      text={formatDayLong(date)}
                      trigger="mount"
                    />
                  </p>
                  <p className={styles.dayMeta}>
                    {openCount} {copy.openTimes} · {copy.zone}
                  </p>
                  <TimeSlots
                    key={date}
                    slots={slots}
                    selected={time}
                    onSelect={onTime}
                    label={formatDayLong(date)}
                  />
                </>
              ) : (
                <p className={styles.pickDay}>{copy.pickDay}</p>
              )}
            </div>
          </div>

          <div className={styles.actions} data-enter>
            <SigilChip variant="ghost" icon={null} onClick={onBack}>
              {copy.back}
            </SigilChip>
            <SigilChip
              variant="solid"
              icon={<ArrowIcon />}
              onClick={onNext}
              disabled={!time}
            >
              {copy.cta}
            </SigilChip>
          </div>
        </div>

        <BookingSummary
          copy={summaryCopy}
          service={service}
          date={date}
          time={time}
          timeZoneLabel={timeZoneLabel}
          price={price}
        />
      </div>
    </section>
  );
}
