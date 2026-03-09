"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Archive,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Clock,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Markdown from "@/components/Markdown";

interface DebateMessage {
  roleId: string;
  roleTitle: string;
  round: number;
  status: string;
  text?: string;
}

interface FinalDecision {
  verdict: string;
  biggest_risk: string;
  key_dispute: string;
  key_assumption: string;
  next_actions: string[];
}

interface Session {
  id: string;
  created_at: string;
  idea: string;
  messages: DebateMessage[];
  final_decision: FinalDecision | null;
  execution_outputs: Record<string, string>;
}

const EXECUTION_LABELS: Record<string, string> = {
  mvp: "MVP 设计",
  interview: "用户访谈",
  pricing: "定价方案",
  landing: "Landing Page",
  funding: "融资叙事",
  competitor: "竞品对比",
  gtm: "GTM 初版",
  roi: "成本/ROI",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"debate" | "decision" | "execution">("debate");

  const executionKeys = Object.keys(session.execution_outputs || {});
  const allMessages = (session.messages || []).filter((m) => m.status === "done");
  const rounds = [...new Set(allMessages.map((m) => m.round))].sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/60 bg-white/5 backdrop-blur-md overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl p-2 bg-indigo-500/10 border border-indigo-500/20 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium leading-snug line-clamp-2">
              {session.idea}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {timeAgo(session.created_at)}
              </span>
              {session.final_decision && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  有最终判断
                </span>
              )}
              {executionKeys.map((k) => (
                <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">
                  {EXECUTION_LABELS[k] || k}
                </span>
              ))}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10">
              <div className="flex border-b border-white/10 px-5">
                {(["debate", "decision", "execution"] as const).map((tab) => {
                  const labels = { debate: "辩论记录", decision: "最终判断", execution: "执行模块" };
                  const disabled = tab === "decision" ? !session.final_decision : tab === "execution" ? executionKeys.length === 0 : false;
                  return (
                    <button
                      key={tab}
                      onClick={() => !disabled && setActiveTab(tab)}
                      disabled={disabled}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === tab ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}
                        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
                      `}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 space-y-4">
                {activeTab === "debate" && (
                  <>
                    {rounds.map((round) => {
                      const msgs = allMessages.filter((m) => m.round === round);
                      if (msgs.length === 0) return null;
                      const roundLabels: Record<number, string> = { 1: "初步立场", 2: "深入辩论", 3: "最终交锋" };
                      return (
                        <div key={round}>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
                            第{round}轮 · {roundLabels[round] ?? ""}
                          </p>
                          <div className="space-y-3">
                            {msgs.map((m, i) => (
                              <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <p className="text-xs text-slate-500 mb-1.5">{m.roleTitle}</p>
                                <Markdown className="text-slate-300">{m.text ?? ""}</Markdown>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {activeTab === "decision" && session.final_decision && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-xs text-slate-500 mb-1">最终判断</p>
                      <p className="text-white font-semibold">{session.final_decision.verdict}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <p className="text-xs text-red-400">最大风险</p>
                        </div>
                        <p className="text-sm text-slate-300">{session.final_decision.biggest_risk}</p>
                      </div>
                      <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-amber-400" />
                          <p className="text-xs text-amber-400">核心争议</p>
                        </div>
                        <p className="text-sm text-slate-300">{session.final_decision.key_dispute}</p>
                      </div>
                      <div className="rounded-xl bg-blue-950/20 border border-blue-500/20 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Lightbulb className="w-3 h-3 text-blue-400" />
                          <p className="text-xs text-blue-400">待验证假设</p>
                        </div>
                        <p className="text-sm text-slate-300">{session.final_decision.key_assumption}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-xs text-slate-500 mb-2">下一步行动</p>
                      <div className="space-y-1.5">
                        {session.final_decision.next_actions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-300">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "execution" && (
                  <div className="space-y-4">
                    {executionKeys.map((k) => (
                      <div key={k} className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className="text-xs text-slate-500 mb-2">{EXECUTION_LABELS[k] || k}</p>
                        <Markdown className="text-slate-300">
                          {session.execution_outputs[k]}
                        </Markdown>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ArchivePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载失败");
        setSessions(data || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:px-8 md:py-20">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回评估台
          </a>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-indigo-500/10 border border-indigo-500/20">
              <Archive className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">决策档案</h1>
              <p className="text-sm text-slate-500">每次辩论自动保存，记录你的创业判断历史</p>
            </div>
          </div>
        </motion.header>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载档案中...</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-1">请检查 Supabase 配置或数据表是否已创建</p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="text-center py-20">
            <Archive className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">还没有保存的辩论记录</p>
            <p className="text-slate-600 text-sm mt-1">完成一次辩论后会自动保存到这里</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-all"
            >
              开始第一次辩论
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 mb-6">共 {sessions.length} 条记录</p>
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
