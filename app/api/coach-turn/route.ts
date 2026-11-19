// Generates and scores one sales roleplay turn.
import Anthropic from "@anthropic-ai/sdk";

type Lang = "en" | "hi";
type Focus = "greeting" | "needs" | "objection" | "closing";

interface TurnEntry {
  role: "customer" | "associate";
  content: string;
}

interface RequestBody {
  lang?: Lang;
  category?: string;
  categoryLabel?: string;
  focus?: Focus;
  focusLabel?: string;
  employeeName?: string;
  turnNumber?: number;
  maxTurns?: number;
  history?: TurnEntry[];
}

// Short grounding facts per product category so the simulated customer asks
// realistic questions instead of generic ones. Kept in English — the model
// is perfectly capable of reasoning over English context and answering in
// Hindi when asked to.
const CATEGORY_CONTEXT: Record<string, string> = {
  tv: "Shopping for a new television. Real concerns: screen size for the room, LED vs QLED vs OLED picture quality, smart TV features/OS, and balancing a trusted brand against a tighter budget.",
  ac: "Shopping for an air conditioner. Real concerns: room size and tonnage needed, inverter vs non-inverter running cost, star energy rating, and split vs window unit.",
  fridge: "Shopping for a refrigerator. Real concerns: capacity for household size, frost-free vs direct-cool, convertible/multi-door flexibility, and running cost.",
  wm: "Shopping for a washing machine. Real concerns: front-load vs top-load, capacity in kg for household size, special wash programs, and budget.",
  laptop: "Shopping for a laptop. Real concerns: intended use (study, office work, gaming), budget, RAM/storage/processor adequacy, and brand/after-sales support.",
  mobile: "Shopping for a mobile phone. Real concerns: budget, camera quality, battery life, storage, and ecosystem/brand preference.",
};

const FOCUS_RUBRIC: Record<Focus, string> = {
  greeting:
    "GREETING & RAPPORT. The associate should greet you warmly, introduce themselves, and open with a friendly, helpful question — not launch straight into a sales pitch. Score down if the associate is cold, robotic, or skips straight to specs/price before any rapport.",
  needs:
    "NEEDS DISCOVERY. The associate should ask open-ended questions to uncover your real usage, household size, priorities and budget BEFORE recommending a specific model. Score down if they recommend something without first asking what you actually need.",
  objection:
    "OBJECTION HANDLING. You should raise a genuine concern (price too high, unsure about the brand, worried about a specific feature, want to compare elsewhere). The associate should acknowledge the concern empathetically and reframe with real value — not get defensive, dismissive, or just repeat the price.",
  closing:
    "CLOSING. The associate should summarize the value clearly and ask for the sale directly and confidently (e.g. proposing next steps, add-ons, or finalizing the purchase) rather than trailing off vaguely or leaving it entirely up to you.",
};

const FALLBACK_MODEL = "claude-haiku-4-5";
let cachedModelId: string | null = null;
let cachedModelAt = 0;
const MODEL_CACHE_MS = 10 * 60 * 1000; // re-check every 10 minutes per warm instance

async function pickHaikuModel(anthropic: Anthropic): Promise<string> {
  const now = Date.now();
  if (cachedModelId && now - cachedModelAt < MODEL_CACHE_MS) return cachedModelId;
  try {
    const list = await anthropic.models.list({ limit: 1000 });
    const haikuModels = list.data
      .filter((m) => m.id.includes("haiku"))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    cachedModelId = haikuModels[0]?.id || FALLBACK_MODEL;
  } catch (e) {
    console.error("coach-turn: model list failed, using fallback", e);
    cachedModelId = FALLBACK_MODEL;
  }
  cachedModelAt = now;
  return cachedModelId;
}

const SUBMIT_TURN_TOOL: Anthropic.Tool = {
  name: "submit_turn",
  description:
    "Submit the customer's in-character reply plus the score and feedback for the associate's most recent message.",
  input_schema: {
    type: "object",
    properties: {
      customerReply: {
        type: "string",
        description: "What the customer says next, in character, in the target language. 1-3 sentences, natural spoken retail-floor dialogue — never a lecture.",
      },
      turnScore: {
        type: "integer",
        description: "0-100 score for how well the associate's LAST message handled the stated coaching focus.",
        minimum: 0,
        maximum: 100,
      },
      feedback: {
        type: "string",
        description: "One short, specific, actionable sentence of coaching feedback on the associate's last message, in the target language.",
      },
      scenarioComplete: {
        type: "boolean",
        description: "True if the interaction has reached a natural end point (sale closed, customer walking away, or this was explicitly the final allowed turn).",
      },
    },
    required: ["customerReply", "turnScore", "feedback", "scenarioComplete"],
  },
};

function buildSystemPrompt(opts: {
  lang: Lang;
  category: string;
  categoryLabel: string;
  focus: Focus;
  focusLabel: string;
  employeeName: string;
  turnNumber: number;
  maxTurns: number;
}): string {
  const langName = opts.lang === "hi" ? "Hindi" : "English";
  const categoryCtx = CATEGORY_CONTEXT[opts.category] || `Shopping for: ${opts.categoryLabel}.`;
  const rubric = FOCUS_RUBRIC[opts.focus] || FOCUS_RUBRIC.greeting;
  const isFinalTurn = opts.turnNumber >= opts.maxTurns;

  return [
    `You are role-playing as a customer on the floor of an Indian consumer-electronics retail store, talking to a sales associate named ${opts.employeeName} who is practicing their skills in a training simulation.`,
    ``,
    `SCENARIO: ${categoryCtx}`,
    ``,
    `COACHING FOCUS this scenario is training: ${opts.focusLabel}. ${rubric}`,
    ``,
    `Stay consistently in character as ONE specific customer (invent a believable mood/personality on your first reply and keep it consistent) across the whole conversation. Keep every customer reply short and natural — the way a real shopper actually talks on a shop floor, never a lecture, never breaking character, never mentioning that this is a simulation.`,
    ``,
    `After reading the associate's latest message, call the submit_turn tool with: the customer's next reply (in ${langName}), a 0-100 score for how well THAT message handled the stated coaching focus, one short specific actionable feedback sentence (in ${langName}) the associate can apply immediately, and whether the scenario has reached a natural end.`,
    isFinalTurn
      ? `This is turn ${opts.turnNumber} of ${opts.maxTurns} — the LAST allowed turn. You must bring the interaction to a natural close now (either the sale closes, or you politely end the conversation) and set scenarioComplete to true.`
      : `This is turn ${opts.turnNumber} of ${opts.maxTurns}. Set scenarioComplete to true only if the conversation has genuinely reached a natural end already (e.g. the sale is clearly closed or you would realistically walk away) — otherwise false.`,
    `Write customerReply and feedback in ${langName}, regardless of what language this instruction is in.`,
  ].join("\n");
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lang: Lang = body.lang === "hi" ? "hi" : "en";
  const category = String(body.category || "");
  const categoryLabel = String(body.categoryLabel || category);
  const focus: Focus = (["greeting", "needs", "objection", "closing"] as const).includes(body.focus as Focus)
    ? (body.focus as Focus)
    : "greeting";
  const focusLabel = String(body.focusLabel || focus);
  const employeeName = String(body.employeeName || "the associate").slice(0, 80);
  const maxTurns = Math.min(Math.max(Number(body.maxTurns) || 5, 1), 8);
  const turnNumber = Math.min(Math.max(Number(body.turnNumber) || 1, 1), maxTurns);
  const history = Array.isArray(body.history) ? body.history.slice(-40) : [];

  if (!category || history.at(-1)?.role !== "associate" || history.some((turn) => !turn)) {
    return Response.json(
      { error: "Request must include a category and end with the associate's latest message." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_BASE_URL && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      { error: "AI Gateway not active yet — this site needs one production deploy before AI calls work." },
      { status: 503 }
    );
  }

  try {
    const anthropic = new Anthropic();
    const model = await pickHaikuModel(anthropic);

    const system = buildSystemPrompt({ lang, category, categoryLabel, focus, focusLabel, employeeName, turnNumber, maxTurns });
    const messages: Anthropic.MessageParam[] = history.map((turn) => ({
      role: turn.role === "associate" ? "user" : "assistant",
      content: String(turn.content || "").slice(0, 2000),
    }));

    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system,
      messages,
      tools: [SUBMIT_TURN_TOOL],
      tool_choice: { type: "tool", name: "submit_turn" },
    });

    const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
    if (!toolUse) {
      return Response.json({ error: "Model did not return a structured turn." }, { status: 502 });
    }

    const input = toolUse.input as {
      customerReply?: string;
      turnScore?: number;
      feedback?: string;
      scenarioComplete?: boolean;
    };

    const turnScore = Math.max(0, Math.min(100, Math.round(Number(input.turnScore) || 0)));
    const scenarioComplete = turnNumber >= maxTurns ? true : Boolean(input.scenarioComplete);

    return Response.json({
      customerReply: String(input.customerReply || "").slice(0, 2000),
      turnScore,
      feedback: String(input.feedback || "").slice(0, 600),
      scenarioComplete,
      turnNumber,
      maxTurns,
      model,
    });
  } catch (e) {
    console.error("coach-turn failed", e);
    return Response.json({ error: "The coach is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
