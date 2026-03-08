import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(request) {
  try {
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    if (!rawBody) {
      return Response.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    const { idea, roleTitle, roleDesc } = JSON.parse(rawBody);

    if (!idea || !roleTitle || !roleDesc) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一位${roleTitle}。${roleDesc}
请用第一人称、真实、具体、简洁地评价这个创业想法。
控制在150字左右。
直接输出内容，不要问候语，不要标题。`,
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
    console.error("OpenRouter API error:", error);
    return Response.json(
      { error: "Failed to get response from OpenRouter" },
      { status: 500 }
    );
  }
}