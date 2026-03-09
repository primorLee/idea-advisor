import OpenAI from "openai";

export async function POST(request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
    }

    const { idea, round, roundDebate = [], userComment } = await request.json();

    if (!idea || !userComment) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const debateContext = roundDebate
      .map((c) => `【${c.roleTitle}】${c.text}`)
      .join("\n\n");

    const prompt = `这是第${round}轮辩论结束后的摘要任务。

创业想法：${idea}

本轮辩论内容：
${debateContext}

创始人在本轮结束后的发言：
"${userComment}"

请用100字以内，客观指出：
1）创始人的发言回应了哪个核心争议
2）带来了什么新信息或视角转变
3）对下一轮辩论方向有何影响

语气客观简练，不要夸奖，直接输出摘要内容。`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-5.3-chat",
      messages: [
        { role: "user", content: prompt },
      ],
      extra_headers: {
        "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.YOUR_SITE_NAME || "Idea Advisor",
      },
    });

    const text = completion.choices?.[0]?.message?.content || "暂无摘要";
    return Response.json({ text });
  } catch (error) {
    const message = error?.message || "Failed to generate summary";
    return Response.json({ error: message }, { status: 500 });
  }
}
