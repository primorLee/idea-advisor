"use client";

import { useState } from "react";

const ADVISOR_ROLES = [
  {
    id: "investor",
    title: "投资人",
    desc: "关注市场空间、增长潜力、竞争壁垒和回报。",
    accent: "from-indigo-500/20 to-blue-500/20",
  },
  {
    id: "engineer",
    title: "工程师",
    desc: "关注技术可行性、实现难度、资源需求和开发风险。",
    accent: "from-emerald-500/20 to-cyan-500/20",
  },
  {
    id: "user",
    title: "用户",
    desc: "关注产品是否真正解决痛点，是否愿意持续使用。",
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "marketer",
    title: "市场专家",
    desc: "关注定位、传播、获客和差异化。",
    accent: "from-fuchsia-500/20 to-pink-500/20",
  },
];

type Role = (typeof ADVISOR_ROLES)[number];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const generateFeedback = async (role: Role) => {
    const response = await fetch("/api/advisor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea,
        roleTitle: role.title,
        roleDesc: role.desc,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data.text;
  };

  const handleSubmit = async () => {
    if (!idea.trim() || loading) return;

    setSubmitted(true);
    setLoading(true);
    setFeedbacks({});

    try {
      const results = await Promise.all(
        ADVISOR_ROLES.map(async (role) => {
          const text = await generateFeedback(role);
          return [role.id, text] as const;
        })
      );

      const feedbackMap = Object.fromEntries(results);
      setFeedbacks(feedbackMap);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "调用失败，请检查 OpenRouter API Key 或后端日志。";
      alert(`调用失败：${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs tracking-wide text-slate-300">
                AI 创业评估台
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Idea Advisor
              </h1>
              <p className="mt-2 text-sm text-slate-300 md:text-base">
                输入你的创业想法，系统将从四个关键角色给出结构化反馈。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="例如：做一个帮助模拟 IC 设计团队自动整理仿真结果、生成报告并优化参数的 AI 工具"
              rows={6}
              className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm leading-6 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 md:text-base"
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 md:text-sm">
                建议尽量描述目标用户、场景与商业模式，结果会更精准。
              </p>
              <button
                onClick={handleSubmit}
                disabled={loading || !idea.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "分析中..." : "开始分析"}
              </button>
            </div>
          </div>
        </section>

        {submitted && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-100">顾问视角</h2>
              {loading && <span className="text-sm text-blue-300">正在生成反馈...</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {ADVISOR_ROLES.map((role) => (
                <article
                  key={role.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl"
                >
                  <div
                    className={`mb-3 h-1.5 w-full rounded-full bg-gradient-to-r ${role.accent}`}
                  />
                  <h3 className="text-lg font-semibold text-white">{role.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{role.desc}</p>

                  <div className="mt-4 min-h-44 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm leading-6 text-slate-200 whitespace-pre-wrap">
                    {loading ? "正在生成中..." : feedbacks[role.id] || "暂无内容"}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
