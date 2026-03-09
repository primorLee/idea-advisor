import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 OPENROUTER_API_KEY" }, { status: 500 });
  }

  const model = process.env.FINAL_DECISION_MODEL || "openai/gpt-5.4-pro";

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 });
  }

  const { idea, allMessages } = body;
  if (!idea || !allMessages) {
    return NextResponse.json({ error: "缺少 idea 或 allMessages" }, { status: 400 });
  }

  // Build debate transcript
  const transcript = allMessages
    .filter((m) => m.status === "done" && m.text)
    .map((m) => `【${m.roleTitle} 第${m.round}轮】\n${m.text}`)
    .join("\n\n");

  const systemPrompt = `你是综合顾问委员会的主席。你的职责是在所有顾问完成辩论后，做出最终的结构化判断。

请严格以如下 JSON 格式输出，不要包含任何其他内容、不要加 markdown 代码块：
{
  "verdict": "一句话最终判断（50字以内，直接给出立场）",
  "biggest_risk": "当前阶段最大风险（30字以内）",
  "key_dispute": "顾问之间最核心的分歧点（30字以内）",
  "key_assumption": "最需要尽快验证的核心假设（30字以内）",
  "next_actions": ["具体行动1", "具体行动2", "具体行动3"]
}`;

  const userContent = `创业想法：${idea}\n\n辩论记录：\n${transcript}`;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.YOUR_SITE_NAME || "Idea Advisor",
      },
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    // Strip markdown code fences if model wraps response
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "模型返回格式无效", raw }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[final-decision] error:", err);
    return NextResponse.json(
      { error: err?.message || "AI 调用失败" },
      { status: 500 }
    );
  }
}
