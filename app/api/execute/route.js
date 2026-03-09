import OpenAI from "openai";
import { NextResponse } from "next/server";

const ACTION_PROMPTS = {
  mvp: {
    label: "MVP 设计",
    prompt: `你是一位产品经理。基于以下创业想法和顾问辩论，设计一个最小可验证产品（MVP）方案。
输出包含：
1. **核心假设**（1-2条，这个MVP要验证什么）
2. **MVP 功能清单**（5-8条，只保留验证核心假设的必要功能）
3. **非MVP功能**（明确排除什么，以及为什么）
4. **2周交付方案**（技术栈建议 + 关键里程碑）
5. **成功指标**（如何判断MVP验证成功）
语言简洁，可操作性强。`,
  },
  interview: {
    label: "用户访谈问题",
    prompt: `你是一位用户研究专家。基于以下创业想法和顾问辩论中暴露的核心争议，设计用户访谈问题。
输出10个深度访谈问题，要求：
- 前3题：了解用户现状和痛点（开放性）
- 中4题：验证辩论中的核心争议点
- 后3题：探索付费意愿和使用场景
每题后附注：[问这题的目的]
避免引导性问题，用中文输出。`,
  },
  pricing: {
    label: "定价方案",
    prompt: `你是一位定价策略专家。基于以下创业想法和顾问辩论，设计定价方案。
输出3种定价策略方案（选一种推进，另两种备选）：
每个方案包含：
- 定价模式（订阅/按次/免费增值等）
- 具体价格区间
- 目标客户群
- 核心价值主张
- 风险点
最后给出你的推荐方案及理由（2-3句话）。`,
  },
  landing: {
    label: "Landing Page 文案",
    prompt: `你是一位文案撰写专家。基于以下创业想法和顾问辩论，为产品创作 Landing Page 文案。
输出以下模块：
1. **主标题**（8-12字，突出核心价值，不能是产品名）
2. **副标题**（20-30字，解释产品是什么、为谁服务）
3. **痛点描述**（3条，每条15字以内）
4. **产品价值点**（3条，每条有标题+2句话说明）
5. **社会证明文案**（虚构3条用户证言，贴近真实场景）
6. **CTA 按钮文案**（2个变体）
语言接地气，避免大词和空话。`,
  },
  funding: {
    label: "融资叙事",
    prompt: `你是一位有经验的创业顾问，帮助创始人准备投资人叙事。基于以下创业想法和顾问辩论，构建融资故事框架。
按以下结构输出（每部分2-4句话）：
1. **问题**：市场上存在什么痛点？规模有多大？
2. **解决方案**：我们用什么方式解决？
3. **市场**：目标市场规模（TAM/SAM/SOM估算思路）
4. **产品**：核心差异化是什么？
5. **商业模式**：如何赚钱？
6. **牵引力**（预期）：上线后的关键指标目标
7. **团队**：需要什么关键能力（引导创始人思考）
8. **融资需求**：本轮目标金额和用途（建议框架）
同时指出：顾问辩论中投资人最可能追问的2个尖锐问题，及建议回答方向。`,
  },
  competitor: {
    label: "竞品对比",
    prompt: `你是一位市场分析师。基于以下创业想法和顾问辩论，进行竞品分析。
输出：
1. **竞品矩阵**（4-6个主要竞品或替代方案，表格形式）
   列：产品名 | 定位 | 定价 | 核心功能 | 弱点
2. **竞争格局总结**（3-4句话，市场现状如何）
3. **差异化机会**（3条，我们可以在哪里建立优势）
4. **需要警惕的竞争风险**（2条）
如果是全新赛道，竞品可以是"现有替代方案"（如Excel、人工操作等）。`,
  },
  gtm: {
    label: "GTM 初版",
    prompt: `你是一位增长策略专家。基于以下创业想法和顾问辩论，制定Go-to-Market初版策略。
输出：
1. **目标客户画像**（最精准的第一批用户是谁，越具体越好）
2. **获客渠道优先级**（列5个渠道，按ROI排序，每个说明理由和执行动作）
3. **前30天行动计划**（具体任务清单）
4. **前60天行动计划**
5. **前90天行动计划**
6. **关键指标**（每个阶段要达到什么数字才算成功）
聚焦低成本高效率的冷启动方式，不要假设有大预算。`,
  },
  roi: {
    label: "成本/ROI 分析",
    prompt: `你是一位财务顾问和创业分析师。基于以下创业想法、顾问辩论记录和启动资金情况，进行成本与收益分析。
输出以下内容：

1. **启动成本拆解**（一次性投入，分类估算）
   - 产品开发（技术、设计）
   - 运营成本（服务器、工具、办公）
   - 市场推广（冷启动阶段）
   - 人力成本（前3个月）
   - 其他（法律、注册等）
   - 合计估算

2. **月度运营成本**（稳定运营后的月均支出）

3. **收入预测**（3种情景，月收入）
   - 保守：最低可接受情景
   - 中性：合理预期
   - 乐观：顺利推进情景
   附：每种情景的关键假设

4. **盈亏平衡分析**
   - 盈亏平衡点（月收入需达到多少）
   - 预计达到盈亏平衡的时间线

5. **ROI 预测**
   - 12个月预期ROI
   - 24个月预期ROI
   - 36个月预期ROI

6. **启动资金充足性评估**（若用户提供了启动资金则必须输出此项）
   - 现有资金能支撑多少个月
   - 是否足以达到盈亏平衡
   - 若有缺口：缺口金额及建议补充方式

语言直接，数字尽量给出区间而非精确值，并说明估算依据。`,
  },
};

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 OPENROUTER_API_KEY" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 });
  }

  const { idea, debateContext, actionType, startupCapital = "" } = body;
  if (!idea || !debateContext || !actionType) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const action = ACTION_PROMPTS[actionType];
  if (!action) {
    return NextResponse.json({ error: `未知 actionType: ${actionType}` }, { status: 400 });
  }

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
      model: "openai/gpt-5.3-chat",
      messages: [
        { role: "system", content: action.prompt },
        {
          role: "user",
          content: `创业想法：${idea}${startupCapital ? `\n启动资金：${startupCapital}` : ""}\n\n顾问辩论记录：\n${debateContext}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "暂无结果";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[execute] error:", err);
    return NextResponse.json(
      { error: err?.message || "AI 调用失败" },
      { status: 500 }
    );
  }
}
