"use client";

import { useState } from "react";

const ADVISOR_ROLES = [
  {
    id: "investor",
    title: "投资人",
    desc: "关注市场空间、增长潜力、竞争壁垒和回报。",
  },
  {
    id: "engineer",
    title: "工程师",
    desc: "关注技术可行性、实现难度、资源需求和开发风险。",
  },
  {
    id: "user",
    title: "用户",
    desc: "关注产品是否真正解决痛点，是否愿意持续使用。",
  },
  {
    id: "marketer",
    title: "市场专家",
    desc: "关注定位、传播、获客和差异化。",
  },
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const generateFeedback = async (role: {
    id: string;
    title: string;
    desc: string;
  }) => {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data.text;
  };

  const handleSubmit = async () => {
    if (!idea.trim()) return;

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
      alert("调用失败，请检查 OpenRouter API Key 或后端日志。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "42px", marginBottom: "12px" }}>Idea Advisor</h1>
      <p style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}>
        输入你的创业想法，获取多视角反馈。
      </p>

      <div style={{ marginBottom: "24px" }}>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="例如：做一个帮助模拟 IC 设计团队自动整理仿真结果、生成报告并优化参数的 AI 工具"
          rows={6}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "16px",
            borderRadius: "12px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "none",
          background: "black",
          color: "white",
          cursor: "pointer",
          marginBottom: "36px",
        }}
      >
        开始分析
      </button>

      {submitted && (
        <div>
          <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>顾问视角</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {ADVISOR_ROLES.map((role) => (
              <div
                key={role.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "14px",
                  padding: "18px",
                  background: "#fafafa",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{role.title}</h3>
                <p style={{ color: "#666", lineHeight: 1.6 }}>{role.desc}</p>

                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "white",
                    border: "1px dashed #ccc",
                    color: "#333",
                    lineHeight: 1.6,
                    minHeight: "90px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {loading ? "正在生成中..." : feedbacks[role.id] || "暂无内容"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}