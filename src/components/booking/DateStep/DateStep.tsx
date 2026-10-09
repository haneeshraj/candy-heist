'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { formatDayLong, formatMonth, parseDateKey } from '@/lib/booking/dates';
import { bookableWindow } from '@/lib/booking/hours';
import { dayIn, slotsByDay, zoneName } from '@/lib/booking/zone';
import BookingSummary from '../BookingSummary/BookingSummary';
import StepHeading from '../StepHeading/StepHeading';
import CalendarDays from './CalendarDays';
import styles from './DateStep.module.scss';
import type { DateStepProps } from './DateStep.types';
import TimeSlots from './TimeSlots';
import { useMonthSlots } from './useMonthSlots';

const monthIndex = ({ year, month }: { year: number; month: number }) =>
  year * 12 + month;

// Figma "D1 · 3 Date and time": a month of free days beside the chosen
// day's times, with the running summary on the right. The times come from
// the server, a month at a time, in the visitor's own zone: Candy's hours,
// less what's on his calendar and what's booked.
export default function DateStep({
  copy,
  summary,
  itemId,
  hours,
  date,
  start,
  today,
  timeZone,
  onDate,
  onStart,
  onBack,
  onNext
}: DateStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.3 });

  const firstMonth = parseDateKey(today);
  // The last day Candy takes bookings to, as the visitor's calendar has it.
  const [lastMonth] = useState(() => {
    const { latest } = bookableWindow(hours, new Date());
    return parseDateKey(dayIn(new Date(latest.getTime() - 1), timeZone));
  });
  const [view, setView] = useState<{ year: number; month: number }>(() =>
    date ? parseDateKey(date) : firstMonth
  );
  const canGoBack = monthIndex(view) > monthIndex(firstMonth);
  const canGoForward = monthIndex(view) < monthIndex(lastMonth);
  const monthTitle = formatMonth(view.year, view.month);

  const month = useMonthSlots(itemId, view, timeZone);
  const byDay = useMemo(
    () =>
      month.status === 'ready'
        ? slotsByDay(month.slots, timeZone)
        : new Map<string, never[]>(),
    [month, timeZone]
  );
  const openByDay = useMemo(
    () =>
      new Map(
        [...byDay].map(([day, slots]) => [
          day,
          slots.filter((slot) => slot.open).length
        ])
      ),
    [byDay]
  );
  const slots = date ? (byDay.get(date) ?? []) : [];
  const openCount = slots.filter((slot) => slot.open).length;

  // A time kept from before (a reload, a step back) that's gone since.
  const viewingPicked =
    date !== null &&
    monthIndex(parseDateKey(date)) === monthIndex(view) &&
    month.status === 'ready';
  const pickedStillOpen = slots.some(
    (slot) => slot.open && slot.start === start
  );
  useEffect(() => {
    if (viewingPicked && start && !pickedStillOpen) onStart(null);
  }, [viewingPicked, start, pickedStillOpen, onStart]);

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
                    onClick={() =>
                      setView((v) =>
                        v.month === 1
                          ? { year: v.year - 1, month: 12 }
                          : { year: v.year, month: v.month - 1 }
                      )
                    }
                    disabled={!canGoBack}
                    aria-label={copy.previousMonth}
                  >
                    <ArrowIcon className={styles.back} />
                  </button>
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() =>
                      setView((v) =>
                        v.month === 12
                          ? { year: v.year + 1, month: 1 }
                          : { year: v.year, month: v.month + 1 }
                      )
                    }
                    disabled={!canGoForward}
                    aria-label={copy.nextMonth}
                  >
                    <ArrowIcon />
                  </button>
                </div>
              </div>
              <div
                role="group"
                aria-label={monthTitle}
                aria-busy={month.status === 'loading' || undefined}
              >
                <CalendarDays
                  key={`${monthTitle}-${month.status}`}
                  year={view.year}
                  month={view.month}
                  today={today}
                  openByDay={openByDay}
                  selected={date}
                  onSelect={onDate}
                  openTimesLabel={copy.openTimes}
                />
              </div>
              {month.status !== 'ready' ? (
                <p className={styles.monthNote} role="status">
                  {month.status === 'loading' ? copy.loading : copy.unavailable}
                </p>
              ) : null}
            </div>

            <div className={styles.times}>
              {date && month.status === 'ready' ? (
                <>
                  <p className={styles.dayTitle}>
                    <WordReveal
                      key={date}
                      text={formatDayLong(date)}
                      trigger="mount"
                    />
                  </p>
                  <p className={styles.dayMeta}>
                    {openCount} {copy.openTimes} · {zoneName(timeZone)}
                  </p>
                  <TimeSlots
                    key={date}
                    slots={slots}
                    selected={start}
                    onSelect={onStart}
                    timeZone={timeZone}
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
              disabled={!start}
            >
              {copy.cta}
            </SigilChip>
          </div>
        </div>

        <BookingSummary {...summary} />
      </div>
    </section>
  );
}
