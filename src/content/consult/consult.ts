import { z } from 'zod';
import consultData from './consult.json';

// A feedback link's page: the name it asks for, the room it opens on, the
// notes, the tools and the send, and the page a closed link shows. Plain
// JSON checked against this schema, as the contact page's copy is.

const text = z.string().trim().min(1);
const toast = z.object({ title: text, text });
const plural = z.object({ one: text, other: text });

export const consultCopySchema = z.object({
  meta: z.object({ title: text, description: text }),
  label: text,
  gate: z.object({
    /** Over the track's title. */
    lead: text,
    name: z.object({ label: text, placeholder: text }),
    start: text,
    private: text,
    unreleased: text
  }),
  room: z.object({
    artist: text,
    from: text,
    /** `{left}` is how long the link stays open: "3 days", "5 hours". */
    closes: text,
    closesSoon: text,
    play: text,
    pause: text,
    loading: text,
    unplayable: text,
    hint: text,
    /** The before and after, by the play button. */
    compare: text,
    asItIs: text,
    withTools: text,
    /** While there's nothing on to compare. */
    compareHint: text,
    /** `{bpm}` is the track's tempo, as Candy gave it. */
    bpm: text,
    meters: z.object({
      loudness: text,
      momentary: text,
      shortTerm: text,
      integrated: text,
      unit: text,
      reset: text,
      scope: text,
      stereo: text,
      correlation: text
    })
  }),
  notes: z.object({
    label: text,
    empty: text,
    /** `{time}` is the playhead: "1:23". */
    addMoment: text,
    /** `{span}` is the section: "1:20–1:45". */
    addSection: text,
    placeholder: text,
    remove: text,
    tools: text,
    toolsCount: text,
    play: text,
    full: text
  }),
  tools: z.object({
    label: text,
    whole: text,
    section: text,
    noSection: text,
    remove: text,
    devices: z.object({
      label: text,
      hint: text,
      full: text,
      chain: text,
      empty: text,
      on: text,
      off: text,
      earlier: text,
      later: text
    }),
    eq: z.object({
      hint: text,
      points: text,
      type: text,
      frequency: text,
      gain: text,
      q: text,
      slope: text,
      full: text
    }),
    width: z.object({ width: text }),
    dynamics: z.object({
      mode: text,
      threshold: text,
      ratio: text,
      knee: text,
      attack: text,
      release: text,
      makeup: text,
      hint: text
    })
  }),
  submit: z.object({
    /** `{notes}` and `{tools}` are the two counts below, in words. */
    summary: text,
    notes: plural,
    tools: plural,
    send: text,
    sending: text,
    nothing: text,
    sent: toast,
    invalid: toast,
    limited: toast,
    closed: toast,
    failed: toast
  }),
  closed: z.object({ headline: text, text, home: text })
});

export type ConsultCopy = z.infer<typeof consultCopySchema>;

export const consultCopy: ConsultCopy = consultCopySchema.parse(consultData);
