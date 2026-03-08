import OpenAI from "openai";

function buildSystemPrompt(roleTitle, roleDesc, previousComments, round) {
  const isDevil = roleTitle === "恶魔代言人";

  if (isDevil) {
    const context = previousComments
      .map((c) => `【${c.roleTitle} 第${c.round}轮】${c.text}`)
      .join("\n\n");
    if (round === 1) {
      return `你是"恶魔代言人"，你的使命是质疑和挑战一切。\n以下是前面所有嘉宾的发言：\n\n${context}\n\n找出这个想法最致命的缺陷，以及所有人都忽视或过于乐观的问题。语气犀利，不要客气，不要表扬。200字以内。`;
    } else {
      return `你是"恶魔代言人"，这是第二轮辩论。\n以下是迄今所有发言：\n\n${context}\n\n经过一轮辩论，那些问题还没被正视？哪些反驳是在自欺欺人？进一步锁定致命缺陷。200字以内。`;
    }
  }

  if (previousComments.length === 0) {
    return `你是一位${roleTitle}。${roleDesc}\n请用第一人称，自由发表你对这个创业想法的看法。不限格式，说真实的观点，200字以内。`;
  }

  const context = previousComments
    .map((c) => `【${c.roleTitle} 第${c.round}轮】${c.text}`)
    .join("\n\n");
  const roundLabel = round === 1 ? "第一轮初步发言" : "第二轮深入辩论";
  return `你是一位${roleTitle}。${roleDesc}\n这是${roundLabel}。以下是此前的发言：\n\n${context}\n\n请针对以上观点，发表你的回应。可以认同、补充或反驳，用第一人称自由发言，200字以内。`;
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
    } = JSON.parse(rawBody);

    if (!idea || !roleTitle || !roleDesc) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "openai/gpt-5.3-chat",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(roleTitle, roleDesc, previousComments, round),
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
