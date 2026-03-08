"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Cpu,
  User,
  Megaphone,
  Flame,
  Loader2,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const ADVISOR_ROLES = [
  {
    id: "investor",
    title: "投资人",
    desc: "关注市场空间、增长潜力、竞争壁垒和回报。",
    gradient: "from-indigo-500 to-blue-500",
    border: "border-indigo-500/30",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    Icon: TrendingUp,
    isDevil: false,
  },
  {
    id: "engineer",
    title: "工程师",
    desc: "关注技术可行性、实现难度、资源需求和开发风险。",
    gradient: "from-emerald-500 to-cyan-500",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    Icon: Cpu,
    isDevil: false,
  },
  {
    id: "user",
    title: "用户",
    desc: "关注产品是否真正解决痛点，是否愿意持续使用。",
    gradient: "from-amber-500 to-orange-500",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    Icon: User,
    isDevil: false,
  },
  {
    id: "marketer",
    title: "市场专家",
    desc: "关注定位、传播、获客和差异化。",
    gradient: "from-fuchsia-500 to-pink-500",
    border: "border-fuchsia-500/30",
    iconBg: "bg-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
    Icon: Megaphone,
    isDevil: false,
  },
  {
    id: "devil",
    title: "恶魔代言人",
    desc: "专门质疑和挑战所有人，找出致命缺陷。",
    gradient: "from-red-600 to-rose-600",
    border: "border-red-500/40",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    Icon: Flame,
    isDevil: true,
  },
] as const;

type RoleId = (typeof ADVISOR_ROLES)[number]["id"];
type Role = (typeof ADVISOR_ROLES)[number];

interface Message {
  roleId: RoleId;
  round: 1 | 2;
  status: "pending" | "loading" | "done" | "error";
  text?: string;
}

function SpeechCard({ message, role }: { message: Message; role: Role }) {
  const { Icon, gradient, border, iconBg, iconColor, title, isDevil } = role;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border ${border} bg-white/5 backdrop-blur-md shadow-xl overflow-hidden ${
        isDevil ? "shadow-red-900/20" : ""
      }`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-xl p-2 ${iconBg} shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${isDevil ? "text-red-300" : "text-white"}`}>
              {title}
            </h3>
            <p className="text-xs text-slate-500 truncate">{role.desc}</p>
          </div>
          {message.status === "loading" && (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-slate-400" />
          )}
        </div>

        <div className="min-h-[80px]">
          {message.status === "pending" && (
            <p className="text-slate-600 text-sm italic">等待发言...</p>
          )}
          {message.status === "loading" && (
            <div className="space-y-2 pt-1">
              <div className="h-3 rounded-full bg-slate-700/60 animate-pulse w-full" />
              <div className="h-3 rounded-full bg-slate-700/60 animate-pulse w-4/5" />
              <div className="h-3 rounded-full bg-slate-700/60 animate-pulse w-5/6" />
              <div className="h-3 rounded-full bg-slate-700/40 animate-pulse w-3/5" />
            </div>
          )}
          {message.status === "error" && (
            <p className="text-red-400 text-sm leading-relaxed">{message.text}</p>
          )}
          {message.status === "done" && message.text && (
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                isDevil ? "text-red-200" : "text-slate-300"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProgressDots({ messages }: { messages: Message[] }) {
  const activeIdx = messages.findIndex((m) => m.status === "loading");
  const activeRole =
    activeIdx >= 0
      ? ADVISOR_ROLES.find((r) => r.id === messages[activeIdx].roleId)
      : null;

  return (
    <div className="flex items-center gap-3 mb-6">
      {activeRole && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeRole.id}-${messages[activeIdx].round}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-slate-400"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>
              <span className="text-white font-medium">{activeRole.title}</span>{" "}
              正在发言（第{messages[activeIdx].round}轮）...
            </span>
          </motion.div>
        </AnimatePresence>
      )}
      <div className="ml-auto flex gap-1.5">
        {messages.map((m, i) => {
          const role = ADVISOR_ROLES.find((r) => r.id === m.roleId)!;
          return (
            <div
              key={i}
              title={`${role.title} 第${m.round}轮`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                m.status === "done"
                  ? `bg-gradient-to-r ${role.gradient}`
                  : m.status === "loading"
                  ? "bg-white scale-125"
                  : m.status === "error"
                  ? "bg-red-700"
                  : "bg-slate-700"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [debating, setDebating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const updateMessage = (roleId: RoleId, round: 1 | 2, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.roleId === roleId && m.round === round ? { ...m, ...patch } : m
      )
    );
  };

  const handleSubmit = async () => {
    if (!idea.trim() || debating) return;

    const initial: Message[] = ([1, 2] as const).flatMap((round) =>
      ADVISOR_ROLES.map((role) => ({
        roleId: role.id,
        round,
        status: "pending" as const,
      }))
    );
    setMessages(initial);
    setDebating(true);

    const previousComments: { roleTitle: string; text: string; round: number }[] = [];

    try {
      for (const round of [1, 2] as const) {
        for (const role of ADVISOR_ROLES) {
          updateMessage(role.id, round, { status: "loading" });
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            100
          );

          const response = await fetch("/api/advisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idea,
              roleTitle: role.title,
              roleDesc: role.desc,
              previousComments,
              round,
            }),
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            updateMessage(role.id, round, {
              status: "error",
              text: data?.error || `请求失败 (${response.status})`,
            });
            continue;
          }

          const text: string = data.text ?? "暂无结果";
          updateMessage(role.id, round, { status: "done", text });
          previousComments.push({ roleTitle: role.title, text, round });
        }
      }
    } finally {
      setDebating(false);
    }
  };

  const round1Messages = messages.filter((m) => m.round === 1);
  const round2Messages = messages.filter((m) => m.round === 2);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-red-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:px-8 md:py-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI 创业评估台 · 两轮辩论</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-tight">
            Idea{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Advisor
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            输入你的创业想法，五位顾问将依次发言两轮——
            <br className="hidden md:block" />
            后发言者会对前面的观点做出回应，恶魔代言人专门挑战一切。
          </p>
        </motion.header>

        {/* Input card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative rounded-2xl border border-slate-700/60 bg-white/5 backdrop-blur-md p-2 shadow-2xl">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="例如：做一个帮助模拟 IC 设计团队自动整理仿真结果、生成报告并优化参数的 AI 工具..."
                rows={5}
                disabled={debating}
                className="w-full bg-transparent text-white placeholder:text-slate-500 p-5 text-base leading-7 resize-none outline-none disabled:opacity-60"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-white/10 bg-black/20 rounded-xl mt-1">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                  建议描述目标用户、场景与商业模式，结果更精准
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={debating || !idea.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  {debating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      辩论进行中...
                    </>
                  ) : (
                    <>
                      开始辩论
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Debate results */}
        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ProgressDots messages={messages} />

              {/* Round 1 */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    第一轮
                  </span>
                  <span className="text-slate-300 font-semibold">初步立场</span>
                </div>
                <div className="flex flex-col gap-4">
                  {round1Messages.map((msg) => {
                    const role = ADVISOR_ROLES.find((r) => r.id === msg.roleId)!;
                    return (
                      <SpeechCard key={`${msg.roleId}-1`} message={msg} role={role} />
                    );
                  })}
                </div>
              </section>

              {/* Round 2 — only show section header once round 2 starts */}
              {round2Messages.some((m) => m.status !== "pending") && (
                <section>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      第二轮
                    </span>
                    <span className="text-slate-300 font-semibold">深入辩论</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {round2Messages.map((msg) => {
                      const role = ADVISOR_ROLES.find((r) => r.id === msg.roleId)!;
                      return (
                        <SpeechCard key={`${msg.roleId}-2`} message={msg} role={role} />
                      );
                    })}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </main>
  );
}
