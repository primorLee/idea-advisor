"use client";

import { useState, useRef, useCallback } from "react";
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
  AlertTriangle,
  MessageSquare,
  DollarSign,
  FileText,
  Rocket,
  BarChart2,
  Target,
  CheckCircle2,
  Archive,
  ChevronDown,
  PieChart,
  Send,
  SkipForward,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Markdown from "@/components/Markdown";

// ─── Advisor roles ────────────────────────────────────────────────────────────

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

// ─── Execute actions ──────────────────────────────────────────────────────────

const EXECUTE_ACTIONS = [
  { type: "mvp", label: "MVP 设计", Icon: Rocket, color: "text-indigo-400", bg: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30" },
  { type: "interview", label: "用户访谈", Icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30" },
  { type: "pricing", label: "定价方案", Icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30" },
  { type: "landing", label: "Landing Page", Icon: FileText, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30" },
  { type: "funding", label: "融资叙事", Icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30" },
  { type: "competitor", label: "竞品对比", Icon: BarChart2, color: "text-rose-400", bg: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30" },
  { type: "gtm", label: "GTM 初版", Icon: Target, color: "text-cyan-400", bg: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30" },
  { type: "roi", label: "成本/ROI", Icon: PieChart, color: "text-teal-400", bg: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  roleId: RoleId;
  roleTitle: string;
  round: number;
  status: "pending" | "loading" | "done" | "error";
  text?: string;
}

type PreviousComment = { roleTitle: string; text: string; round: number };

type RoundPhase = "debating" | "awaiting-user" | "summarizing" | "done";

interface FinalDecision {
  verdict: string;
  biggest_risk: string;
  key_dispute: string;
  key_assumption: string;
  next_actions: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterContext(all: PreviousComment[], mode: string) {
  if (mode === "brief") return all.slice(-3);
  if (mode === "full") return all;
  return all.slice(-8);
}

// ─── ToggleGroup ──────────────────────────────────────────────────────────────

function ToggleGroup({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (v: string | number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 border
            ${value === opt.value
              ? "bg-indigo-500/30 border-indigo-500/50 text-indigo-300"
              : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10"
            }
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── UserInputPanel ───────────────────────────────────────────────────────────

function UserInputPanel({
  round,
  nextRound,
  onSubmit,
  onSkip,
}: {
  round: number;
  nextRound: number;
  onSubmit: (text: string) => void;
  onSkip: () => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 rounded-2xl border border-indigo-500/25 bg-indigo-950/20 backdrop-blur-md overflow-hidden"
    >
      <div className="h-px w-full bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-transparent" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg p-1.5 bg-indigo-500/15 shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">第{round}轮结束，轮到你发言</p>
            <p className="text-xs text-slate-500">分享你的观点、追问或补充信息，顾问将在第{nextRound}轮纳入考量</p>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="例如：我们已经有了早期用户验证，月活留存率 60%……"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none focus:border-indigo-500/50 transition-colors"
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
            跳过，直接开始第{nextRound}轮
          </button>
          <button
            onClick={() => onSubmit(draft.trim())}
            disabled={!draft.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            发言
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── RoundSummaryCard ─────────────────────────────────────────────────────────

function RoundSummaryCard({
  round,
  nextRound,
  summary,
  loading,
  onNext,
  isLastRound,
}: {
  round: number;
  nextRound: number;
  summary: string;
  loading: boolean;
  onNext: () => void;
  isLastRound: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 backdrop-blur-md overflow-hidden"
    >
      <div className="h-px w-full bg-gradient-to-r from-emerald-500/40 via-cyan-500/20 to-transparent" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg p-1.5 bg-emerald-500/15 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">创始人发言摘要 · 第{round}轮</p>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 ml-auto" />}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 rounded-full bg-slate-700/40 animate-pulse" style={{ width: `${[90, 70, 80][i]}%` }} />
            ))}
          </div>
        ) : (
          <Markdown className="text-slate-300">{summary}</Markdown>
        )}

        {!loading && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all group"
            >
              {isLastRound ? "生成最终判断" : `开始第${nextRound}轮辩论`}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── SpeechCard ───────────────────────────────────────────────────────────────

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
            <h3 className={`font-semibold ${isDevil ? "text-red-300" : "text-white"}`}>{title}</h3>
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
            <Markdown className={isDevil ? "text-red-200" : "text-slate-300"}>
              {message.text}
            </Markdown>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ─── ProgressDots ─────────────────────────────────────────────────────────────

function ProgressDots({ messages }: { messages: Message[] }) {
  const activeIdx = messages.findIndex((m) => m.status === "loading");
  const activeRole =
    activeIdx >= 0 ? ADVISOR_ROLES.find((r) => r.id === messages[activeIdx].roleId) : null;

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

// ─── FinalDecisionCard ────────────────────────────────────────────────────────

function FinalDecisionCard({ decision, loading }: { decision: FinalDecision | null; loading: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mt-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-md shadow-2xl overflow-hidden"
    >
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl p-2 bg-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-white font-bold text-lg">最终决策汇总</h2>
          <span className="ml-auto text-xs text-indigo-400 font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            GPT-5.4-Pro · 深度推理
          </span>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              正在综合分析所有顾问观点，生成最终判断...
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 rounded-full bg-slate-700/40 animate-pulse" style={{ width: `${[90, 70, 80, 65, 75][i]}%` }} />
            ))}
          </div>
        )}

        {decision && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">最终判断</p>
              <p className="text-white font-semibold leading-relaxed">{decision.verdict}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs text-red-400 font-medium">最大风险</p>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{decision.biggest_risk}</p>
              </div>
              <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs text-amber-400 font-medium">核心争议</p>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{decision.key_dispute}</p>
              </div>
              <div className="rounded-xl bg-blue-950/20 border border-blue-500/20 p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-xs text-blue-400 font-medium">待验证假设</p>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{decision.key_assumption}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">下一步行动</p>
              <div className="flex flex-col gap-1.5">
                {decision.next_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-slate-300 text-sm">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ─── ExecutionPanel ───────────────────────────────────────────────────────────

function ExecutionPanel({
  idea,
  messages,
  sessionId,
  startupCapital,
}: {
  idea: string;
  messages: Message[];
  sessionId: string | null;
  startupCapital: string;
}) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const handleExecute = async (actionType: string) => {
    if (executing) return;
    if (outputs[actionType]) {
      setExpandedType((prev) => (prev === actionType ? null : actionType));
      return;
    }

    setActiveType(actionType);
    setExecuting(true);
    setExpandedType(actionType);

    const debateContext = messages
      .filter((m) => m.status === "done" && m.text)
      .map((m) => `【${m.roleTitle} 第${m.round}轮】\n${m.text}`)
      .join("\n\n");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, debateContext, actionType, startupCapital }),
      });
      const data = await res.json();
      const content: string = data.text ?? data.error ?? "生成失败";

      const newOutputs = { ...outputs, [actionType]: content };
      setOutputs(newOutputs);

      if (sessionId) {
        await supabase
          .from("debate_sessions")
          .update({ execution_outputs: newOutputs })
          .eq("id", sessionId);
      }
    } catch {
      setOutputs((prev) => ({ ...prev, [actionType]: "网络错误，请重试" }));
    } finally {
      setActiveType(null);
      setExecuting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">第三层</span>
        <span className="text-slate-300 font-semibold">执行延展</span>
        <span className="text-xs text-slate-500 ml-1">— 从判断直接进入行动</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {EXECUTE_ACTIONS.map(({ type, label, Icon, color, bg }) => {
          const isDone = !!outputs[type];
          const isLoading = activeType === type && executing;
          const isExpanded = expandedType === type;

          return (
            <button
              key={type}
              onClick={() => handleExecute(type)}
              disabled={executing && activeType !== type}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
                ${bg} ${isDone ? "opacity-100" : "opacity-90"}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader2 className={`w-4 h-4 animate-spin ${color}`} />
              ) : isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Icon className={`w-4 h-4 ${color}`} />
              )}
              <span className="text-slate-200">{label}</span>
              {isDone && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {expandedType && (outputs[expandedType] || (activeType === expandedType && executing)) && (
          <motion.div
            key={expandedType}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
              {activeType === expandedType && executing ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-3 rounded-full bg-slate-700/40 animate-pulse" style={{ width: `${[100, 85, 92, 70, 88, 60][i]}%` }} />
                  ))}
                </div>
              ) : (
                <Markdown className="text-slate-300">{outputs[expandedType]}</Markdown>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [debating, setDebating] = useState(false);
  const [finalDecision, setFinalDecision] = useState<FinalDecision | null>(null);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Settings
  const [rounds, setRounds] = useState<number>(2);
  const [contextMode, setContextMode] = useState("standard");
  const [startupCapital, setStartupCapital] = useState("");

  // Round-phase state: tracks whether each round is awaiting user input, summarizing, or done
  const [roundPhase, setRoundPhase] = useState<Record<number, RoundPhase>>({});
  const [roundSummaries, setRoundSummaries] = useState<Record<number, string>>({});

  // Mutable refs shared across async calls
  const allPreviousRef = useRef<PreviousComment[]>([]);
  const completedMessagesRef = useRef<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const updateMessage = useCallback((roleId: RoleId, round: number, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.roleId === roleId && m.round === round ? { ...m, ...patch } : m))
    );
  }, []);

  // Trigger final decision + Supabase save (called after last round completes)
  const triggerFinalDecision = useCallback(async () => {
    const completedMsgs = completedMessagesRef.current;

    setLoadingDecision(true);
    let decision: FinalDecision | null = null;
    try {
      const res = await fetch("/api/final-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, allMessages: completedMsgs }),
      });
      const data = await res.json();
      if (data.verdict) {
        decision = data as FinalDecision;
        setFinalDecision(decision);
      }
    } catch {
      // silent
    } finally {
      setLoadingDecision(false);
    }

    try {
      const { data: session } = await supabase
        .from("debate_sessions")
        .insert({ idea, messages: completedMsgs, final_decision: decision })
        .select("id")
        .single();
      if (session?.id) setSessionId(session.id);
    } catch {
      // silent
    }

    scrollToBottom();
  }, [idea]);

  // Run one round of advisor debate
  const runRound = useCallback(
    async (round: number, totalRounds: number, ctxMode: string, capital: string, ideaSnap: string) => {
      setDebating(true);

      for (const role of ADVISOR_ROLES) {
        updateMessage(role.id, round, { status: "loading" });
        scrollToBottom();

        const previousComments = filterContext(allPreviousRef.current, ctxMode);

        const response = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: ideaSnap,
            roleTitle: role.title,
            roleDesc: role.desc,
            previousComments,
            round,
            startupCapital: capital,
          }),
        });

        const data = await response.json().catch(() => ({}));
        const msgIdx = completedMessagesRef.current.findIndex(
          (m) => m.roleId === role.id && m.round === round
        );

        if (!response.ok) {
          const errText = data?.error || `请求失败 (${response.status})`;
          updateMessage(role.id, round, { status: "error", text: errText });
          if (msgIdx >= 0)
            completedMessagesRef.current[msgIdx] = {
              ...completedMessagesRef.current[msgIdx],
              status: "error",
              text: errText,
            };
          continue;
        }

        const text: string = data.text ?? "暂无结果";
        updateMessage(role.id, round, { status: "done", text });
        allPreviousRef.current.push({ roleTitle: role.title, text, round });
        if (msgIdx >= 0)
          completedMessagesRef.current[msgIdx] = {
            ...completedMessagesRef.current[msgIdx],
            status: "done",
            text,
          };
      }

      setDebating(false);

      if (round < totalRounds) {
        // Pause for user input between rounds
        setRoundPhase((prev) => ({ ...prev, [round]: "awaiting-user" }));
        scrollToBottom();
      } else {
        // Last round done → trigger final decision
        setRoundPhase((prev) => ({ ...prev, [round]: "done" }));
        await triggerFinalDecision();
      }
    },
    [updateMessage, triggerFinalDecision]
  );

  const handleSubmit = async () => {
    if (!idea.trim() || debating) return;

    setFinalDecision(null);
    setSessionId(null);
    setRoundPhase({});
    setRoundSummaries({});
    allPreviousRef.current = [];

    const roundList = Array.from({ length: rounds }, (_, i) => i + 1);
    const initial: Message[] = roundList.flatMap((round) =>
      ADVISOR_ROLES.map((role) => ({
        roleId: role.id,
        roleTitle: role.title,
        round,
        status: "pending" as const,
      }))
    );
    setMessages(initial);
    completedMessagesRef.current = [...initial];

    await runRound(1, rounds, contextMode, startupCapital, idea);
  };

  // Called when user submits their comment between rounds
  const handleUserSubmit = async (round: number, userText: string) => {
    const nextRound = round + 1;

    // Add user comment to context
    allPreviousRef.current.push({ roleTitle: "创始人", text: userText, round });

    // Generate summary
    setRoundPhase((prev) => ({ ...prev, [round]: "summarizing" }));
    scrollToBottom();

    try {
      const roundDebate = allPreviousRef.current
        .filter((c) => c.round === round && c.roleTitle !== "创始人")
        .map((c) => ({ roleTitle: c.roleTitle, text: c.text }));

      const res = await fetch("/api/round-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, round, roundDebate, userComment: userText }),
      });
      const data = await res.json();
      setRoundSummaries((prev) => ({ ...prev, [round]: data.text ?? "摘要生成失败" }));
    } catch {
      setRoundSummaries((prev) => ({ ...prev, [round]: "摘要生成失败" }));
    }

    setRoundPhase((prev) => ({ ...prev, [round]: "done" }));
    scrollToBottom();

    // Don't auto-start next round — user clicks button
    void nextRound;
  };

  // Called when user clicks "Skip"
  const handleSkipRound = (round: number) => {
    setRoundPhase((prev) => ({ ...prev, [round]: "done" }));
  };

  // Called when user clicks "Start round N+1" button
  const handleStartNextRound = (nextRound: number) => {
    runRound(nextRound, rounds, contextMode, startupCapital, idea);
  };

  const roundGroups = Array.from({ length: rounds }, (_, i) => i + 1).map((round) => ({
    round,
    messages: messages.filter((m) => m.round === round),
  }));

  const roundLabels: Record<number, string> = { 1: "初步立场", 2: "深入辩论", 3: "最终交锋" };

  const debateComplete =
    !debating &&
    messages.length > 0 &&
    messages.every((m) => m.status !== "pending" && m.status !== "loading") &&
    (finalDecision !== null || loadingDecision);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
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
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI 创业评估台 · 多轮辩论</span>
            </div>
            <a
              href="/archive"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all backdrop-blur-md"
            >
              <Archive className="w-3.5 h-3.5" />
              决策档案
            </a>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-tight">
            Idea{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Advisor
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            输入你的创业想法，五位顾问将依次辩论——
            <br className="hidden md:block" />
            每轮结束后你可以发言，顾问将在下一轮纳入你的观点。
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
                spellCheck={false}
                className="w-full bg-transparent text-white placeholder:text-slate-500 p-5 text-base leading-7 resize-none outline-none disabled:opacity-60"
              />

              {/* Settings row */}
              <div className="px-4 py-3 border-t border-white/10 space-y-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">辩论轮数</span>
                    <ToggleGroup
                      options={[
                        { value: 1, label: "1轮" },
                        { value: 2, label: "2轮" },
                        { value: 3, label: "3轮" },
                      ]}
                      value={rounds}
                      onChange={(v) => setRounds(v as number)}
                      disabled={debating}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">上下文</span>
                    <ToggleGroup
                      options={[
                        { value: "brief", label: "简洁" },
                        { value: "standard", label: "标准" },
                        { value: "full", label: "完整" },
                      ]}
                      value={contextMode}
                      onChange={(v) => setContextMode(v as string)}
                      disabled={debating}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap">启动资金</span>
                  <input
                    type="text"
                    value={startupCapital}
                    onChange={(e) => setStartupCapital(e.target.value)}
                    placeholder="选填，如：50万人民币"
                    disabled={debating}
                    className="flex-1 max-w-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-40"
                  />
                </div>
              </div>

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

              {roundGroups.map(({ round, messages: roundMsgs }, groupIdx) => {
                const hasStarted = roundMsgs.some((m) => m.status !== "pending");
                if (!hasStarted && groupIdx > 0) return null;

                const phase = roundPhase[round];
                const isLastRound = round === rounds;
                const nextRound = round + 1;
                const summary = roundSummaries[round] ?? "";

                return (
                  <section key={round} className="mb-10">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        第{round}轮
                      </span>
                      <span className="text-slate-300 font-semibold">
                        {roundLabels[round] ?? `第${round}轮辩论`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {roundMsgs.map((msg) => {
                        const role = ADVISOR_ROLES.find((r) => r.id === msg.roleId)!;
                        return (
                          <SpeechCard key={`${msg.roleId}-${round}`} message={msg} role={role} />
                        );
                      })}
                    </div>

                    {/* User input panel — shown between non-last rounds */}
                    {!isLastRound && phase === "awaiting-user" && (
                      <UserInputPanel
                        round={round}
                        nextRound={nextRound}
                        onSubmit={(text) => handleUserSubmit(round, text)}
                        onSkip={() => handleSkipRound(round)}
                      />
                    )}

                    {/* Summary card — only when summarizing or summary exists */}
                    {!isLastRound && (phase === "summarizing" || (phase === "done" && summary)) && (
                      <RoundSummaryCard
                        round={round}
                        nextRound={nextRound}
                        summary={summary}
                        loading={phase === "summarizing"}
                        onNext={() => handleStartNextRound(nextRound)}
                        isLastRound={false}
                      />
                    )}

                    {/* Skip case: done but no summary — show next-round button directly */}
                    {!isLastRound && phase === "done" && !summary && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex justify-end"
                      >
                        <button
                          onClick={() => handleStartNextRound(nextRound)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all group"
                        >
                          开始第{nextRound}轮辩论
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </motion.div>
                    )}
                  </section>
                );
              })}

              {/* Final decision */}
              {(loadingDecision || finalDecision) && (
                <FinalDecisionCard decision={finalDecision} loading={loadingDecision} />
              )}

              {/* Execution panel */}
              {debateComplete && (
                <ExecutionPanel
                  idea={idea}
                  messages={messages}
                  sessionId={sessionId}
                  startupCapital={startupCapital}
                />
              )}

              {sessionId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  本次辩论已保存至{" "}
                  <a href="/archive" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    决策档案
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </main>
  );
}
