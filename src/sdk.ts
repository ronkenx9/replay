import {
  recallRun,
  type Backend,
  type StepReceipt,
} from "./core/recorder.js";
import {
  recordEvidence,
  type AgentEventType,
  type AgentToolCall,
  type EvidencePacket,
  type EvidenceReceipt,
} from "./core/evidence.js";

export interface ReplayRecordInput {
  eventType: AgentEventType;
  userMessage?: string;
  agentResponse?: string;
  memorySnapshot?: Record<string, unknown>;
  toolCalls?: AgentToolCall[];
  payload?: Record<string, unknown>;
}

export interface ReplayClient {
  readonly receipts: readonly EvidenceReceipt[];
  record(input: ReplayRecordInput): Promise<EvidenceReceipt>;
  wrap<Input, Output>(
    label: string,
    fn: (input: Input) => Promise<Output>,
  ): (input: Input) => Promise<Output>;
  recall(): ReturnType<typeof recallRun>;
}

export interface CreateReplayOptions {
  agentId: string;
  runId: string;
  backend: Backend;
}

function stringifyForEvidence(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function createReplay(options: CreateReplayOptions): ReplayClient {
  const receipts: EvidenceReceipt[] = [];
  let nextSequence = 1;

  async function record(input: ReplayRecordInput): Promise<EvidenceReceipt> {
    const packet: EvidencePacket = {
      agentId: options.agentId,
      sessionId: options.runId,
      eventType: input.eventType,
      userMessage: input.userMessage,
      agentResponse: input.agentResponse,
      memorySnapshot: {
        ...(input.memorySnapshot ?? {}),
        ...(input.payload ? { payload: input.payload } : {}),
      },
      toolCalls: input.toolCalls,
      sequence: nextSequence,
    };
    nextSequence += 1;

    const receipt = await recordEvidence(packet, options.backend);
    receipts.push(receipt);
    return receipt;
  }

  function wrap<Input, Output>(
    label: string,
    fn: (input: Input) => Promise<Output>,
  ): (input: Input) => Promise<Output> {
    return async (input: Input) => {
      const output = await fn(input);
      await record({
        eventType: "decision",
        userMessage: stringifyForEvidence(input),
        agentResponse: stringifyForEvidence(output),
        toolCalls: [{ tool: "llm", action: label }],
      });
      return output;
    };
  }

  return {
    get receipts() {
      return receipts;
    },
    record,
    wrap,
    recall() {
      return recallRun(receipts as StepReceipt[], options.backend);
    },
  };
}

