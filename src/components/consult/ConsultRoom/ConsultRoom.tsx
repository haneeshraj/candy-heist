'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormTrap, type FormTrapHandle } from '@/components/common/FormTrap';
import { NameGate } from '@/components/consult/NameGate';
import { NoteList } from '@/components/consult/NoteList';
import { SubmitBar } from '@/components/consult/SubmitBar';
import { ToolRack, type ToolTarget } from '@/components/consult/ToolRack';
import { TrackMeters } from '@/components/consult/TrackMeters';
import { TrackStage, type Span } from '@/components/consult/TrackStage';
import { useConsultAudio } from '@/hooks/useConsultAudio';
import type { Tools } from '@/lib/consult/audio';
import {
  MAX_CHAINED_SECTIONS,
  MAX_NOTES,
  chainIsEmpty,
  decodeWaveform,
  emptyChain,
  formatSpan,
  parseFeedback,
  startingChain,
  type Chain,
  type Feedback,
  type Note
} from '@/lib/consult/engine';
import { closingSoon, formatLeft } from '@/lib/consult/left';
import { submitFeedback } from '@/lib/consult/submit';
import { fill } from '@/lib/text/fill';
import { notifyError, notifySuccess } from '@/lib/toast/notify';
import { clearDraft, loadDraft, saveDraft, type Draft } from './draft';
import styles from './ConsultRoom.module.scss';
import type { ConsultRoomProps } from './ConsultRoom.types';

// A feedback link, once the producer has said who he is: the track and its
// waveform with his notes under it, the tools beside them, and the send at
// the foot. What he writes is kept in his browser as he goes, and sent as
// one piece of feedback; he can send more after.

const WHOLE = 'whole';

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** The feedback as it would be sent: blank notes dropped, empty tools as none. */
function outgoing(name: string, draft: Draft): Feedback {
  const notes = draft.notes
    .map((note) => ({
      ...note,
      text: note.text.trim(),
      chain: note.end !== null && !chainIsEmpty(note.chain) ? note.chain : null
    }))
    .filter((note) => note.text !== '' || note.chain !== null)
    .sort((a, b) => a.at - b.at);
  return {
    name,
    notes,
    chain: chainIsEmpty(draft.chain) ? null : draft.chain
  };
}

export default function ConsultRoom({
  room,
  copy,
  renderedAt
}: ConsultRoomProps) {
  const waveform = useMemo(
    () => decodeWaveform(room.waveform) ?? new Uint8Array(),
    [room.waveform]
  );
  const trapRef = useRef<FormTrapHandle | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    notes: [],
    chain: startingChain(newId())
  }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [target, setTarget] = useState(WHOLE);
  const [marking, setMarking] = useState<Span | null>(null);
  const [bypass, setBypass] = useState(false);
  const [sending, setSending] = useState(false);

  const ready = outgoing(name ?? '', draft);
  const toolCount =
    ready.notes.filter((note) => note.chain !== null).length +
    (ready.chain ? 1 : 0);
  // With no tool on there's no before and after; the next one put on is
  // heard at once, not behind a switch left at "as it is".
  const canCompare = toolCount > 0;
  if (!canCompare && bypass) setBypass(false);

  const tools = useMemo<Tools>(
    () => ({ notes: draft.notes, chain: draft.chain }),
    [draft]
  );
  // Taken apart rather than kept as one object: the refs among these are
  // passed on, never read while rendering, and the compiler tells them
  // apart from the state only by name.
  const {
    elementRef,
    positionRef,
    analyserRef,
    metersRef,
    second,
    duration,
    playing,
    failed,
    toggle,
    seek
  } = useConsultAudio(room.durationMs / 1000, tools, bypass);

  // Kept as he works, once he's in.
  useEffect(() => {
    if (name !== null) saveDraft(room.token, draft);
  }, [name, room.token, draft]);

  const left = new Date(room.expiresAt).getTime() - renderedAt;
  const leftText = fill(
    closingSoon(left) ? copy.room.closesSoon : copy.room.closes,
    {
      left: formatLeft(left)
    }
  );

  const sections = draft.notes
    .filter((note) => note.end !== null)
    .sort((a, b) => a.at - b.at);
  const targets: ToolTarget[] = [
    { id: WHOLE, label: copy.tools.whole },
    ...sections.map((note) => ({
      id: note.id,
      label: fill(copy.tools.section, { span: formatSpan(note.at, note.end) })
    }))
  ];
  const picked = sections.find((note) => note.id === target) ?? null;
  const chain = picked ? (picked.chain ?? emptyChain()) : draft.chain;

  function start(entered: string) {
    // Whatever was written here before carries on, with an EQ to start
    // from if its chain was left empty.
    const saved = loadDraft(room.token);
    if (saved)
      setDraft(
        saved.chain.devices.length
          ? saved
          : { ...saved, chain: startingChain(newId()) }
      );
    setName(entered);
  }

  const setNotes = (change: (notes: Note[]) => Note[]) =>
    setDraft((current) => ({ ...current, notes: change(current.notes) }));

  function setChain(next: Chain) {
    if (picked)
      setNotes((notes) =>
        notes.map((note) =>
          note.id === picked.id ? { ...note, chain: next } : note
        )
      );
    else setDraft((current) => ({ ...current, chain: next }));
  }

  function addMoment() {
    if (draft.notes.length >= MAX_NOTES) return;
    const note: Note = {
      id: newId(),
      at: positionRef.current,
      end: null,
      text: '',
      chain: null
    };
    setNotes((notes) => [...notes, note]);
    setActiveId(note.id);
  }

  function addSection() {
    if (!marking || draft.notes.length >= MAX_NOTES) return;
    if (sections.length >= MAX_CHAINED_SECTIONS) return;
    const note: Note = {
      id: newId(),
      at: marking.from,
      end: marking.to,
      text: '',
      chain: startingChain(newId())
    };
    setNotes((notes) => [...notes, note]);
    setActiveId(note.id);
    setTarget(note.id);
    setMarking(null);
  }

  function pick(id: string, andPlay = true) {
    const note = draft.notes.find((n) => n.id === id);
    if (!note) return;
    setActiveId(id);
    if (note.end !== null) setTarget(id);
    if (andPlay) seek(note.at);
  }

  function remove(id: string) {
    setNotes((notes) => notes.filter((note) => note.id !== id));
    if (activeId === id) setActiveId(null);
    if (target === id) setTarget(WHOLE);
  }

  async function send() {
    if (name === null || sending) return;
    const feedback = outgoing(name, draft);
    if (!parseFeedback(feedback, duration)) {
      notifyError(copy.submit.invalid.title, copy.submit.invalid.text);
      return;
    }
    setSending(true);
    try {
      const result = await submitFeedback(
        room.token,
        feedback,
        trapRef.current?.check()
      );
      if (result.ok) {
        notifySuccess(copy.submit.sent.title, copy.submit.sent.text);
        clearDraft(room.token);
        setDraft({ notes: [], chain: startingChain(newId()) });
        setActiveId(null);
        setTarget(WHOLE);
        return;
      }
      const words =
        copy.submit[result.reason === 'unavailable' ? 'failed' : result.reason];
      notifyError(words.title, words.text);
    } catch {
      notifyError(copy.submit.failed.title, copy.submit.failed.text);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.room}>
      {/* The track, played through the tools; its controls are drawn below. */}
      <audio
        ref={elementRef}
        src={room.audioUrl}
        crossOrigin="anonymous"
        preload="auto"
      />
      <FormTrap ref={trapRef} />

      {name === null ? (
        <NameGate
          copy={copy.gate}
          label={copy.label}
          title={room.title}
          message={room.message}
          fromLabel={copy.room.from}
          left={leftText}
          onStart={start}
        />
      ) : (
        <div className={styles.work}>
          <header className={styles.header}>
            <p className={styles.label}>{copy.label}</p>
            <h1 className={styles.title}>{room.title}</h1>
            <p className={styles.meta}>
              <span>{copy.room.artist}</span>
              {room.bpm ? (
                <span>
                  {fill(copy.room.bpm, {
                    bpm: String(Number(room.bpm.toFixed(2)))
                  })}
                </span>
              ) : null}
              <span className={styles.left}>{leftText}</span>
            </p>
            {room.message ? (
              <blockquote className={styles.message}>
                <span className={styles.from}>{copy.room.from}</span>
                {room.message}
              </blockquote>
            ) : null}
          </header>

          <div className={styles.columns}>
            <div className={styles.listen}>
              <div className={styles.stage}>
                <TrackStage
                  copy={copy.room}
                  waveform={waveform}
                  duration={duration}
                  positionRef={positionRef}
                  second={second}
                  playing={playing}
                  failed={failed}
                  notes={draft.notes}
                  activeId={activeId}
                  marking={marking}
                  bypass={bypass}
                  canCompare={canCompare}
                  onBypass={setBypass}
                  onToggle={toggle}
                  onSeek={seek}
                  onMark={setMarking}
                  onPick={(id) => pick(id, false)}
                  meters={
                    <TrackMeters
                      copy={copy.room.meters}
                      metersRef={metersRef}
                      playing={playing}
                    />
                  }
                />
              </div>
              <NoteList
                copy={copy.notes}
                notes={draft.notes}
                activeId={activeId}
                marking={marking}
                position={second}
                full={draft.notes.length >= MAX_NOTES}
                onAddMoment={addMoment}
                onAddSection={addSection}
                onText={(id, text) =>
                  setNotes((notes) =>
                    notes.map((note) =>
                      note.id === id ? { ...note, text } : note
                    )
                  )
                }
                onRemove={remove}
                onPick={pick}
                onTools={(id) => {
                  setActiveId(id);
                  setTarget(id);
                }}
              />
            </div>

            {/* Scrolls on its own beside the track: the site's smooth
                scrolling leaves its wheel to it. */}
            <div className={styles.rack} data-lenis-prevent>
              <ToolRack
                copy={copy.tools}
                targets={targets}
                target={picked ? picked.id : WHOLE}
                onTarget={(id) => {
                  setTarget(id);
                  if (id !== WHOLE) setActiveId(id);
                }}
                chain={chain}
                analyserRef={analyserRef}
                playing={playing}
                onChange={setChain}
              />
            </div>
          </div>

          <SubmitBar
            copy={copy.submit}
            noteCount={ready.notes.length}
            toolCount={toolCount}
            sending={sending}
            onSend={send}
          />
        </div>
      )}
    </main>
  );
}
