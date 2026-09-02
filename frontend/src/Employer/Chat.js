import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const EmployerChat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });
  const [mobileScreen, setMobileScreen] = useState("list");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const selectedThreadIdRef = useRef(selectedThreadId);
  const isMountedRef = useRef(true);

  const token = useMemo(() => {
    const t = localStorage.getItem("token");
    if (!t) console.warn("No token found in localStorage");
    return t;
  }, []);

  // Keep ref in sync so polling closure always has latest value
  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearInterval(pollingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setMobileScreen("chat");
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { if (isMountedRef.current) navigate("/"); return; }
    if (user.role !== "provider") { if (isMountedRef.current) navigate("/"); return; }
    if (token && isMountedRef.current) {
      loadThreads();
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const showToast = (text) => {
    setToast(text);
    if (text) setTimeout(() => setToast(""), 4000);
  };

  const validateMessage = (text) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    if (emailPattern.test(normalized)) return { valid: false, reason: 'Email addresses are not allowed in chat messages.' };
    const phonePattern = /(\+?\d[\d\s().-]{7,})/;
    if (phonePattern.test(normalized)) return { valid: false, reason: 'Phone numbers are not allowed in chat messages.' };
    const linkPattern = /(https?:\/\/|www\.|[a-z0-9]+\.(com|net|org|io|co|in|edu|gov|me|info|biz|xyz|site|online|tech|app|dev|blog|website|link|click|bit\.ly|tinyurl|goo\.gl|t\.co|fb\.me|instagram\.com|facebook\.com|twitter\.com|linkedin\.com|youtube\.com|github\.com|stackoverflow\.com))/i;
    if (linkPattern.test(normalized)) return { valid: false, reason: 'External links are not allowed in chat messages.' };
    return { valid: true };
  };

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadMessages = useCallback(async (threadId, silent = false) => {
    if (!isMountedRef.current) return;
    try {
      if (!silent) setLoadingMessages(true);
      const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          const incoming = data.messages || [];
          if (incoming.length !== lastMessageCountRef.current || !silent) {
            lastMessageCountRef.current = incoming.length;
            setMessages(incoming);
          }
        }
      } else {
        if (!silent && isMountedRef.current) showToast("Unable to load messages.");
      }
    } catch (_) {
      if (!silent && isMountedRef.current) showToast("Unable to load messages.");
    } finally {
      if (!silent && isMountedRef.current) setLoadingMessages(false);
    }
  }, [token]);

  const loadThreads = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      setLoadingThreads(true);
      if (!token) { if (isMountedRef.current) showToast("Please login to view chats."); return; }
      const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          setThreads(data.threads || []);
          if (!selectedThreadIdRef.current && data.threads?.length) {
            const firstActive = data.threads.find((t) => t.status === "approved") ||
              data.threads.find((t) => t.status === "pending") ||
              data.threads[0];
            if (firstActive) {
              setSelectedThreadId(firstActive.id);
              await loadMessages(firstActive.id);
            }
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        if (isMountedRef.current) showToast(errorData.message || `Unable to load chats (${response.status}).`);
      }
    } catch (error) {
      if (isMountedRef.current) showToast(`Unable to load chats: ${error.message || 'Network error'}`);
    } finally {
      if (isMountedRef.current) setLoadingThreads(false);
    }
  }, [token, loadMessages]);

  const startPolling = () => {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMountedRef.current) setThreads(data.threads || []);
        }
      } catch (_) {}
      const tid = selectedThreadIdRef.current;
      if (tid) await loadMessages(tid, true);
    }, 3000);
  };

  const handleSelectThread = async (threadId) => {
    lastMessageCountRef.current = 0;
    setSelectedThreadId(threadId);
    if (isMobileView) setMobileScreen("chat");
    setShowPendingModal(false);
    await loadMessages(threadId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId) return;
    const validation = validateMessage(newMessage);
    if (!validation.valid) { showToast(validation.reason); return; }
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setNewMessage("");
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.message || "Unable to send message.");
      }
    } catch (_) {
      showToast("Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const performAction = async (threadId, action) => {
    const endpoint = action;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await loadThreads();
        if (action === "decline" || action === "close") {
          setSelectedThreadId(null);
          setMessages([]);
        }
        if (action === "approve") {
          showToast("Chat request approved! You can now message the candidate.");
          setSelectedThreadId(threadId);
          await loadMessages(threadId);
          setShowPendingModal(false);
        }
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.message || "Unable to update chat.");
      }
    } catch (_) {
      showToast("Unable to update chat.");
    }
  };

  const handleReportThread = async (threadId) => {
    const reason = window.prompt("Tell us why you are reporting this chat (required):");
    if (!reason || !reason.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (response.ok) {
        showToast("Report submitted. Our team will review it shortly.");
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.message || "Unable to submit report.");
      }
    } catch (_) {
      showToast("Unable to submit report.");
    }
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const pendingThreads = threads.filter((t) => t.status === "pending");
  const activeThreads = threads.filter((t) => t.status === "approved");

  const statusLabel = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "approved": return "Active";
      case "declined": return "Declined";
      case "closed": return "Closed";
      default: return status;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "approved": return { bg: "#dcfce7", color: "#15803d" };
      case "pending": return { bg: "#fef9c3", color: "#a16207" };
      case "declined": return { bg: "#fee2e2", color: "#b91c1c" };
      case "closed": return { bg: "#f1f5f9", color: "#475569" };
      default: return { bg: "#f1f5f9", color: "#475569" };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const dateLabel = formatDate(msg.created_at);
      if (dateLabel !== lastDate) {
        groups.push({ type: "date", label: dateLabel });
        lastDate = dateLabel;
      }
      groups.push({ type: "message", data: msg });
    });
    return groups;
  }, [messages]);

  const filteredThreads = activeThreads.filter(t =>
    !searchQuery ||
    t.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showThreadList = !isMobileView || mobileScreen === "list";
  const showChatWindow = !isMobileView || mobileScreen === "chat";

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "#22c55e", color: "#fff", padding: "12px 20px",
          borderRadius: 12, boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
          fontWeight: 500, fontSize: 14, maxWidth: 320,
          animation: "slideIn 0.3s ease"
        }}>
          {toast}
        </div>
      )}

      {/* Pending Requests Modal */}
      {showPendingModal && (
        <div
          onClick={() => setShowPendingModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, backdropFilter: "blur(2px)"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
              maxHeight: "80vh", display: "flex", flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
              animation: "modalIn 0.25s ease"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #f0fdf4",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                  Chat Requests
                </p>
                <h3 style={{ margin: "2px 0 0", color: "#fff", fontSize: 18, fontWeight: 700 }}>
                  Pending Approvals
                  {pendingThreads.length > 0 && (
                    <span style={{
                      marginLeft: 10, background: "#fff", color: "#16a34a",
                      fontSize: 12, fontWeight: 700, padding: "2px 10px",
                      borderRadius: 999, verticalAlign: "middle"
                    }}>
                      {pendingThreads.length}
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                style={{
                  background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
                  width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "16px 20px", flex: 1 }}>
              {pendingThreads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <p style={{ margin: 0, fontWeight: 500, color: "#374151" }}>No pending requests</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13 }}>All caught up! New requests from candidates will appear here.</p>
                </div>
              ) : (
                pendingThreads.map((thread) => (
                  <div
                    key={thread.id}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px",
                      marginBottom: 12, background: "#fafafa", transition: "all 0.18s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#bbf7d0"; e.currentTarget.style.background = "#f0fdf4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fafafa"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      {/* Avatar + Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #86efac 0%, #22c55e 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 17
                        }}>
                          {thread.candidateName?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: 14, color: "#111827",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                          }}>
                            {thread.candidateName}
                          </div>
                          <div style={{
                            fontSize: 12, color: "#6b7280", marginTop: 2,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                          }}>
                            Applied for: <span style={{ color: "#16a34a", fontWeight: 600 }}>{thread.jobTitle}</span>
                          </div>
                          {thread.unreadCount > 0 && (
                            <span style={{
                              display: "inline-block", marginTop: 4,
                              background: "#fef9c3", color: "#a16207",
                              fontSize: 11, padding: "1px 8px", borderRadius: 20, fontWeight: 600
                            }}>
                              {thread.unreadCount} new message{thread.unreadCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => { handleSelectThread(thread.id); }}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a",
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; }}
                      >
                        View Chat
                      </button>
                      <button
                        onClick={() => performAction(thread.id, "approve")}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: "none", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                          color: "#fff", cursor: "pointer", transition: "all 0.2s",
                          boxShadow: "0 3px 10px rgba(34,197,94,0.25)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => performAction(thread.id, "decline")}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: "1.5px solid #fca5a5", background: "none", color: "#dc2626",
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Header />

      <div style={{ background: "#f0fdf4", minHeight: "100vh", paddingTop: 80, paddingBottom: 24 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", position: "relative" }}>

          {/* Back button — floats to the left */}
          {!isMobileView && (
            <button
              onClick={() => navigate(-1)}
              style={{
                position: "absolute", left: -52, top: 12,
                background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: "50%",
                width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#16a34a", transition: "all 0.2s", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(34,197,94,0.1)", zIndex: 10
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
              title="Go back"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Page Sub-header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", background: "#fff", borderRadius: 14,
            boxShadow: "0 2px 12px rgba(34,197,94,0.08)", border: "1px solid #bbf7d0",
            marginBottom: 14, flexWrap: "wrap", gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#86efac", fontWeight: 600 }}>Employer Chat Center</p>
                <h2 style={{ margin: 0, color: "#14532d", fontSize: 18, fontWeight: 700 }}>Conversations with Candidates</h2>
              </div>
            </div>

            {/* Pending Requests Button */}
            <button
              onClick={() => setShowPendingModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: pendingThreads.length > 0 ? "none" : "1.5px solid #bbf7d0",
                background: pendingThreads.length > 0
                  ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  : "#f0fdf4",
                color: pendingThreads.length > 0 ? "#fff" : "#16a34a",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: pendingThreads.length > 0 ? "0 4px 14px rgba(34,197,94,0.3)" : "none",
                position: "relative"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Pending Requests
              {pendingThreads.length > 0 && (
                <span style={{
                  background: pendingThreads.length > 0 ? "rgba(255,255,255,0.9)" : "#22c55e",
                  color: pendingThreads.length > 0 ? "#16a34a" : "#fff",
                  minWidth: 20, height: 20, borderRadius: 999, fontSize: 11, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px"
                }}>
                  {pendingThreads.length}
                </span>
              )}
            </button>
          </div>

          {/* Main Chat Layout */}
          <div style={{
            display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "300px 1fr", gap: 14,
            height: "calc(100vh - 200px)", minHeight: 500
          }}>

            {/* LEFT: Active Thread List */}
            {showThreadList && (
              <div style={{
              background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column",
              boxShadow: "0 4px 24px rgba(34,197,94,0.08)", border: "1px solid #bbf7d0", overflow: "hidden"
              }}>
              {/* Search */}
              <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid #f0fdf4", flexShrink: 0 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#86efac", fontWeight: 700 }}>
                  Active Chats · {activeThreads.length}
                </p>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f9fafb", border: "1.5px solid #bbf7d0", borderRadius: 10,
                  padding: "7px 12px"
                }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = "#22c55e"}
                  onBlurCapture={e => e.currentTarget.style.borderColor = "#bbf7d0"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1, border: "none", outline: "none", background: "transparent",
                      fontSize: 13, color: "#111827", fontFamily: "inherit"
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, fontSize: 17, lineHeight: 1 }}>×</button>
                  )}
                </div>
              </div>

              {/* Thread list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
                {loadingThreads && activeThreads.length === 0 && (
                  <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 13 }}>Loading...</div>
                )}
                {!loadingThreads && activeThreads.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                    <p style={{ margin: 0, fontSize: 13 }}>No active chats yet.</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12 }}>Approve a pending request to start chatting.</p>
                  </div>
                )}
                {filteredThreads.length === 0 && activeThreads.length > 0 && (
                  <div style={{ textAlign: "center", padding: "30px 16px", color: "#9ca3af" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                    <p style={{ margin: 0, fontSize: 13 }}>No results for "{searchQuery}"</p>
                  </div>
                )}
                {filteredThreads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      style={{
                        padding: "13px 14px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                        background: isActive ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "#fafafa",
                        border: isActive ? "none" : "1px solid #e5e7eb",
                        transition: "all 0.18s ease",
                        boxShadow: isActive ? "0 4px 14px rgba(34,197,94,0.28)" : "none",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0fdf4"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          background: isActive ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg, #86efac 0%, #22c55e 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 14
                        }}>
                          {thread.candidateName?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 600, fontSize: 13, color: isActive ? "#fff" : "#111827",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                          }}>
                            {thread.candidateName}
                          </div>
                          <div style={{
                            fontSize: 11, color: isActive ? "rgba(255,255,255,0.75)" : "#6b7280",
                            marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                          }}>
                            {thread.jobTitle}
                          </div>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span style={{
                            background: isActive ? "#fff" : "#22c55e", color: isActive ? "#16a34a" : "#fff",
                            minWidth: 18, height: 18, borderRadius: 999, fontSize: 10, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0
                          }}>
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}

            {/* RIGHT: Chat Window */}
            {showChatWindow && (
              <div style={{
              background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column",
              boxShadow: "0 4px 24px rgba(34,197,94,0.08)", border: "1px solid #bbf7d0", overflow: "hidden"
              }}>
              {!selectedThread ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p style={{ margin: 0, fontWeight: 500 }}>Select a conversation to get started</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13 }}>Active chats with candidates will appear here</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div style={{
                    padding: "14px 20px", borderBottom: "1px solid #f0fdf4",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "#fff", flexShrink: 0, zIndex: 2, flexWrap: "wrap", gap: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {isMobileView && (
                        <button
                          onClick={() => setMobileScreen("list")}
                          style={{
                            background: "#fff",
                            border: "1.5px solid #bbf7d0",
                            borderRadius: "50%",
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#16a34a",
                            flexShrink: 0
                          }}
                          title="Back to conversations"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                      )}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "linear-gradient(135deg, #86efac 0%, #22c55e 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 17, flexShrink: 0
                      }}>
                        {selectedThread.candidateName?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: "#111827", fontSize: 16, fontWeight: 700 }}>
                          {selectedThread.candidateName || "Candidate"}
                        </h4>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{selectedThread.jobTitle}</p>
                      </div>
                      <span style={{
                        marginLeft: 4, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                        background: statusColor(selectedThread.status).bg,
                        color: statusColor(selectedThread.status).color,
                      }}>
                        {statusLabel(selectedThread.status)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleReportThread(selectedThreadId)}
                        style={{
                          background: "none", border: "1.5px solid #fca5a5", color: "#dc2626",
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        Report
                      </button>
                      <button
                        onClick={() => performAction(selectedThreadId, "close")}
                        style={{
                          background: "none", border: "1.5px solid #e5e7eb", color: "#374151",
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        Close Chat
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    style={{
                      flex: 1, overflowY: "auto", padding: "20px 24px",
                      background: "#f9fafb", display: "flex", flexDirection: "column", gap: 2
                    }}
                  >
                    {loadingMessages ? (
                      <div style={{ textAlign: "center", padding: 40 }}>
                        <div style={{
                          width: 36, height: 36, border: "3px solid #bbf7d0",
                          borderTopColor: "#22c55e", borderRadius: "50%",
                          animation: "spin 0.7s linear infinite", margin: "0 auto 12px"
                        }} />
                        <p style={{ color: "#9ca3af", margin: 0, fontSize: 13 }}>Loading messages...</p>
                      </div>
                    ) : groupedMessages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                        <p style={{ margin: 0, fontWeight: 500 }}>No messages yet</p>
                        <p style={{ margin: "4px 0 0", fontSize: 13 }}>Start the conversation!</p>
                      </div>
                    ) : (
                      groupedMessages.map((item, idx) => {
                        if (item.type === "date") {
                          return (
                            <div key={`date-${idx}`} style={{ textAlign: "center", margin: "12px 0 8px" }}>
                              <span style={{
                                background: "#e5e7eb", color: "#6b7280", fontSize: 11,
                                padding: "3px 12px", borderRadius: 20, fontWeight: 500
                              }}>
                                {item.label}
                              </span>
                            </div>
                          );
                        }
                        const msg = item.data;
                        const isSelf = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: "flex",
                              justifyContent: isSelf ? "flex-end" : "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            <div style={{
                              maxWidth: "68%",
                              background: isSelf
                                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                : "#fff",
                              color: isSelf ? "#fff" : "#111827",
                              padding: "10px 14px",
                              borderRadius: isSelf ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: isSelf
                                ? "0 4px 12px rgba(34,197,94,0.25)"
                                : "0 2px 8px rgba(15,23,42,0.08)",
                              border: isSelf ? "none" : "1px solid #e5e7eb"
                            }}>
                              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {msg.message}
                              </p>
                              <span style={{
                                display: "block", fontSize: 10, marginTop: 5,
                                color: isSelf ? "rgba(255,255,255,0.7)" : "#9ca3af",
                                textAlign: "right"
                              }}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer */}
                  <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
                    {selectedThread?.status !== "approved" ? (
                      <div style={{
                        padding: "12px 16px", borderRadius: 10,
                        background: "#fefce8", color: "#92400e",
                        fontSize: 13, textAlign: "center", border: "1px solid #fde68a"
                      }}>
                        {selectedThread?.status === "pending"
                          ? "⏳ Approve this chat request to start messaging."
                          : "🔒 Only approved chats can exchange messages."}
                      </div>
                    ) : (
                      <div style={{
                        display: "flex", alignItems: "flex-end", gap: 10,
                        background: "#f9fafb", borderRadius: 14, padding: "8px 8px 8px 14px",
                        border: "1.5px solid #bbf7d0", transition: "border-color 0.2s"
                      }}
                        onFocusCapture={e => e.currentTarget.style.borderColor = "#22c55e"}
                        onBlurCapture={e => e.currentTarget.style.borderColor = "#bbf7d0"}
                      >
                        <textarea
                          rows={1}
                          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                          }}
                          onKeyDown={handleKeyDown}
                          style={{
                            flex: 1, border: "none", outline: "none", resize: "none",
                            background: "transparent", fontSize: 14, color: "#111827",
                            lineHeight: 1.5, minHeight: 24, maxHeight: 120,
                            fontFamily: "inherit", padding: 0, overflowY: "auto"
                          }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sending || !newMessage.trim()}
                          style={{
                            width: 40, height: 40, borderRadius: 10, border: "none",
                            background: !newMessage.trim() || sending
                              ? "#e5e7eb"
                              : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                            color: !newMessage.trim() || sending ? "#9ca3af" : "#fff",
                            cursor: !newMessage.trim() || sending ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, transition: "all 0.2s",
                            boxShadow: !newMessage.trim() || sending ? "none" : "0 4px 12px rgba(34,197,94,0.3)"
                          }}
                          onMouseEnter={e => { if (newMessage.trim() && !sending) e.currentTarget.style.transform = "scale(1.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          {sending
                            ? <div style={{ width: 16, height: 16, border: "2px solid #9ca3af", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                            : <SendIcon />}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { transform: scale(0.95) translateY(-10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #86efac; }
      `}</style>
    </>
  );
};

export default EmployerChat;