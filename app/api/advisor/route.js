import OpenAI from "openai";

function buildSystemPrompt(roleTitle, roleDesc, previousComments, round, startupCapital) {
  const isDevil = roleTitle === "恶魔代言人";
  const capitalCtx = startupCapital ? `\n启动资金：${startupCapital}` : "";
  const fmt = (comments) =>
    comments.map((c) => `【${c.roleTitle} 第${c.round}轮】${c.text}`).join("\n\n");

  // ── 恶魔代言人 ──────────────────────────────────────────────────────────────
  if (isDevil) {
    const context = fmt(previousComments);
    if (round === 1) {
      return `你是"恶魔代言人"，使命是质疑和挑战一切。${capitalCtx}\n以下是前面所有嘉宾的发言：\n\n${context}\n\n找出这个想法最致命的缺陷，以及所有人都忽视或过于乐观的问题。语气犀利，不要客气，不要表扬。200字以内。`;
    }
    return `你是"恶魔代言人"，这是第${round}轮辩论。${capitalCtx}\n以下是迄今所有发言：\n\n${context}\n\n经过${round - 1}轮辩论，哪些核心问题仍未被真正正视？哪些反驳是在自欺欺人？\n重要：不要重复你在前几轮已经说过的内容，必须找出新的致命角度或被忽视的深层矛盾。200字以内。`;
  }

  // ── 普通顾问，第一位发言 ─────────────────────────────────────────────────
  if (previousComments.length === 0) {
    return `你是一位${roleTitle}。${roleDesc}${capitalCtx}\n请用第一人称，自由发表你对这个创业想法的初步看法。不限格式，说真实的观点，200字以内。`;
  }

  const context = fmt(previousComments);

  // ── 普通顾问，第一轮后续发言 ─────────────────────────────────────────────
  if (round === 1) {
    return `你是一位${roleTitle}。${roleDesc}${capitalCtx}\n以下是此前的发言：\n\n${context}\n\n请针对以上观点发表你的回应。可以认同、补充或反驳，用第一人称自由发言，200字以内。`;
  }

  // ── 普通顾问，第二轮及以后（核心修复：禁止重复，要求针对质疑回应）────────
  const ownPrev = previousComments
    .filter((c) => c.roleTitle === roleTitle && c.round === round - 1)
    .slice(-1)[0];

  const ownCtx = ownPrev
    ? `\n你在第${round - 1}轮的发言是："${ownPrev.text}"\n【本轮请勿重复以上观点】\n`
    : "";

  return `你是一位${roleTitle}。${roleDesc}${capitalCtx}${ownCtx}
以下是所有人迄今的发言记录：

${context}

这是第${round}轮深入辩论。你必须做到以下三点：
1）直接回应其他人对你立场的质疑或反驳
2）基于新的讨论，更新或深化你的判断（不是重申）
3）提出比上一轮更具体的建议，或更尖锐的新问题
200字以内。`;
}

export async function POST(request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const rawBody = await request.text();

    if (!rawBody) {
      return Response.json({ error: "Empty request body" }, { status: 400 });
    }

    const {
      idea,
      roleTitle,
      roleDesc,
      previousComments = [],
      round = 1,
      startupCapital = "",
    } = JSON.parse(rawBody);

    if (!idea || !roleTitle || !roleDesc) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "openai/gpt-5.3-chat",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(roleTitle, roleDesc, previousComments, round, startupCapital),
        },
        {
          role: "user",
          content: `创业想法：${idea}`,
        },
      ],
      extra_headers: {
        "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.YOUR_SITE_NAME || "Idea Advisor",
      },
    });

    const text = completion.choices?.[0]?.message?.content || "暂无结果";

    return Response.json({ text });
  } catch (error) {
    const status = error?.status || 500;
    const openRouterMessage =
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to get response from OpenRouter";

    console.error("OpenRouter API error details:", {
      status,
      message: openRouterMessage,
      raw: error,
    });

    return Response.json(
      {
        error: `OpenRouter request failed: ${openRouterMessage}`,
      },
      { status: Number.isInteger(status) ? status : 500 }
    );
  }
}
