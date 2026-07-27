import { encodeDcbor } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';

function textHash(text) {
  return hashHex(new TextEncoder().encode(text));
}

function transcriptEvents(transcript) {
  return transcript
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
  return output;
}

function bodyFromReceipt(receipt) {
  const { receiptHash, ...body } = receipt;
  return body;
}

export function createLocalModelSessionReceipt({
  capturedAt,
  clientVersion,
  outputSchema,
  plan,
  prompt,
  requestedModel,
  transcript,
}) {
  const events = transcriptEvents(transcript);
  const started = events.find((event) => event.type === 'thread.started');
  if (typeof started?.thread_id !== 'string' || started.thread_id.length === 0) {
    throw new Error('Codex JSONL transcript is missing thread.started');
  }
  const body = {
    schema: 'scopa.local-model-session-receipt.v1',
    capturedAt,
    claim: 'locally captured Codex CLI transcript; not provider-signed',
    client: {
      name: 'codex-cli',
      version: clientVersion,
    },
    request: {
      outputSchemaSha256: textHash(outputSchema),
      prompt,
      promptSha256: textHash(prompt),
      provider: 'openai',
      requestedModel,
    },
    response: {
      planSha256: textHash(plan),
      threadId: started.thread_id,
      transcriptSha256: textHash(transcript),
    },
  };
  return {
    ...body,
    receiptHash: hashHex(encodeDcbor(body)),
  };
}

export function verifyLocalModelSessionReceipt({
  receipt,
  outputSchema,
  plan,
  transcript,
}) {
  const events = transcriptEvents(transcript);
  const started = events.find((event) => event.type === 'thread.started');
  const strings = collectStrings(events);
  const planText = plan.trim();
  const checks = {
    outputSchemaHash:
      receipt?.request?.outputSchemaSha256 === textHash(outputSchema),
    planHash: receipt?.response?.planSha256 === textHash(plan),
    planInTranscript: strings.some((value) => value.trim() === planText),
    promptHash:
      receipt?.request?.promptSha256 === textHash(receipt?.request?.prompt ?? ''),
    receiptHash:
      receipt?.receiptHash === hashHex(encodeDcbor(bodyFromReceipt(receipt))),
    threadId:
      typeof started?.thread_id === 'string' &&
      started.thread_id === receipt?.response?.threadId,
    transcriptHash:
      receipt?.response?.transcriptSha256 === textHash(transcript),
  };
  return Object.freeze({
    schema: 'scopa.local-model-session-receipt-verification.v1',
    ok: Object.values(checks).every(Boolean),
    checks,
    claim: receipt?.claim ?? null,
  });
}
