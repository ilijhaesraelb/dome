/**
 * Voice command detection for the D.O.M.E. voice-guided form agent.
 * Matches spoken phrases to structured agent commands.
 */

export type VoiceCommand =
  | "confirm"
  | "reject"
  | "next"
  | "back"
  | "stop"
  | "pause"
  | "resume"
  | "spell"
  | "correct"
  | "review"
  | "help"
  | "repeat"
  | "skip"
  | "restart_section"
  | "save"
  | "read_back";

export interface DetectedCommand {
  command: VoiceCommand;
  remainder: string;
}

type CommandEntry = { command: VoiceCommand; patterns: RegExp[] };

const COMMAND_TABLE: CommandEntry[] = [
  {
    command: "confirm",
    patterns: [
      /^(yes|yeah|yep|yup|correct|that'?s? correct|that is correct|confirm|confirmed|save it|save that|go ahead|proceed|ok|okay|right|affirmative|sounds (right|good)|that('s| is) right|perfect|exactly|that works|looks good|looks right)$/i,
    ],
  },
  {
    command: "reject",
    patterns: [
      /^(no|nope|wrong|that'?s? wrong|that is wrong|incorrect|not right|that'?s? not right|try again|redo( that)?|change that|edit that|fix that|that'?s? incorrect|not correct|incorrect|that'?s? not it|not that)$/i,
    ],
  },
  {
    command: "next",
    patterns: [
      /^(next|move on|continue|move forward|go on|next question|next field|next one|proceed|move to next|go to next)$/i,
    ],
  },
  {
    command: "back",
    patterns: [
      /^(back|go back|previous|previous question|previous field|last question|last field|go back one|go to previous)$/i,
    ],
  },
  {
    command: "stop",
    patterns: [
      /^(stop|stop session|end session|quit|exit|cancel|end|finish later|stop the session|end the session)$/i,
    ],
  },
  {
    command: "pause",
    patterns: [
      /^(pause|hold on|wait|wait a moment|one moment|hold|give me a moment|one sec|one second|pause session|hold up)$/i,
    ],
  },
  {
    command: "resume",
    patterns: [
      /^(resume|unpause|let'?s? continue|start again|go ahead|i'?m? ready|ready|let'?s? go|continue please|resume session)$/i,
    ],
  },
  {
    command: "spell",
    patterns: [
      /^(spell|spelling mode|spell it out|let me spell|i'?ll? spell|spell that|spell it|i want to spell)$/i,
    ],
  },
  {
    command: "review",
    patterns: [
      /^(review|review (my )?answers?|show (my )?answers?|what did i (say|answer)|read (back|my answers?)|go over my answers)$/i,
    ],
  },
  {
    command: "help",
    patterns: [
      /^(help|help me|what do i say|what should i say|i don'?t? know|not sure|explain|i'?m? confused|need help|i need help|what are my options)$/i,
    ],
  },
  {
    command: "repeat",
    patterns: [
      /^(repeat|say that again|repeat the question|what was the question|again|can you repeat|say it again|what did you say|i didn'?t? hear (you|that))$/i,
    ],
  },
  {
    command: "skip",
    patterns: [
      /^(skip|skip this|skip (this )?field|leave blank|not applicable|n\/a|don'?t? have one|i don'?t? have (one|that)|none|not sure|no answer|pass)$/i,
    ],
  },
  {
    command: "restart_section",
    patterns: [
      /^(restart section|redo section|start (this )?section (over|again)|go to (the )?beginning of (this )?section)$/i,
    ],
  },
  {
    command: "save",
    patterns: [
      /^(save|save (my )?progress|save now|save and (pause|stop|exit))$/i,
    ],
  },
  {
    command: "read_back",
    patterns: [
      /^(read (it )?back|read my answer|what (number|answer) did i (give|say|enter)|repeat my answer|what did i enter)$/i,
    ],
  },
];

export function detectCommand(transcript: string): DetectedCommand | null {
  const trimmed = transcript.trim();
  for (const entry of COMMAND_TABLE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        return { command: entry.command, remainder: "" };
      }
    }
  }
  return null;
}

export function isConfirmation(transcript: string): boolean {
  return detectCommand(transcript)?.command === "confirm";
}

export function isRejection(transcript: string): boolean {
  return detectCommand(transcript)?.command === "reject";
}

/** True when the transcript carries answer content (not a pure command) */
export function isAnswer(transcript: string): boolean {
  return detectCommand(transcript) === null && transcript.trim().length > 0;
}
