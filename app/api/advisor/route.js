import OpenAI from "openai";

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

    const { idea, roleTitle, roleDesc } = JSON.parse(rawBody);

    if (!idea || !roleTitle || !roleDesc) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "openai/gpt-5.3-instant",
      messages: [
        {
          role: "system",
          content: `你是一位${roleTitle}。${roleDesc}
请用第一人称、真实、具体、简洁地评价这个创业想法。
输出结构：
1）我最认可的点（1句）
2）我最担心的风险（1-2句）
3）我给你的建议（2-3条，短句）
控制在180字以内。不要问候语，不要标题。`,
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
