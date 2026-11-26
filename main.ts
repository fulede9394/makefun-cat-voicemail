// Funniest Cat Voicemail Greeting — make.fun entry
// Biscuit the cat records his own voicemail greeting. The joke is
// cat-specific (asleep on the laptop, knocking things off) and lands
// in one breath, the way a real greeting has to.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

// The house gate: entry.txt must be UTF-8 text of 1 to 120 characters,
// not only white space. Keep the limits in one frozen place so the
// checks below and the writer can never drift apart.
const VOICEMAIL_SPEC = Object.freeze({
  minChars: 1,
  maxChars: 120,
  fileName: "entry.txt",
  // The grader runs the program with MAKEFUN_OUTPUT_DIR set; /output
  // is the fallback the rules name.
  defaultDir: "/output",
});

// Biscuit speaks in three beats: who you reached, what he is doing
// instead of answering, and what happens to your message.
const GREETING_BEATS = Object.freeze([
  "Hi, you've reached Biscuit.",
  "I'm asleep on your laptop.",
  "Leave a message after the beep — I'll knock it off later.",
]);

function compose(beats: readonly string[]): string {
  return beats.join(" ");
}

function validate(text: string): string[] {
  const problems: string[] = [];
  if (text.length < VOICEMAIL_SPEC.minChars) problems.push("empty greeting");
  if (text.length > VOICEMAIL_SPEC.maxChars) {
    problems.push(`greeting is ${text.length} chars, over ${VOICEMAIL_SPEC.maxChars}`);
  }
  if (text.trim().length === 0) problems.push("greeting is only whitespace");
  if (text.includes("\n")) problems.push("greeting must be a single line");
  if (/[\u0000-\u001F]/.test(text)) problems.push("greeting holds a control character");
  if (!text.includes("Biscuit")) problems.push("the cat forgot to introduce himself");
  if (!text.includes("beep")) problems.push("no voicemail beep cue");
  return problems;
}

function fingerprint(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

function resolveOutputDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? VOICEMAIL_SPEC.defaultDir);
}

async function handOff(text: string): Promise<void> {
  const outDir = resolveOutputDir();
  await mkdir(outDir, { recursive: true });
  const target = join(outDir, VOICEMAIL_SPEC.fileName);
  await writeFile(target, text, "utf8");
  // Round-trip: read it back and confirm the file holds exactly the
  // greeting we validated, byte for byte.
  const roundTripped = await readFile(target, "utf8");
  if (roundTripped !== text) {
    throw new Error("entry.txt does not match the validated greeting");
  }
  console.log(`greeting (${text.length} chars, sha ${fingerprint(text)}): ${text}`);
}

const greeting = compose(GREETING_BEATS);
const problems = validate(greeting);
if (problems.length > 0) {
  throw new Error(`invalid greeting: ${problems.join("; ")}`);
}
await handOff(greeting);
