// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import { useAuth } from "../context/AuthContext";
// import { API_BASE_URL } from "../config/api";

// const CandidateChat = () => {
//   const { user, loading: authLoading } = useAuth();
//   const navigate = useNavigate();
//   const isMountedRef = useRef(true);

//   const [threads, setThreads] = useState([]);
//   const [selectedThreadId, setSelectedThreadId] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [loadingThreads, setLoadingThreads] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [newMessage, setNewMessage] = useState("");
//   const [sending, setSending] = useState(false);
//   const [toast, setToast] = useState("");

//   useEffect(() => {
//     isMountedRef.current = true;
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (authLoading) return;
//     if (!user) {
//       if (isMountedRef.current) {
//         navigate("/");
//       }
//       return;
//     }
//     if (user.role !== "seeker") {
//       if (isMountedRef.current) {
//         navigate("/");
//       }
//       return;
//     }
//     if (isMountedRef.current) {
//       loadThreads();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [authLoading, user]);

//   const token = useMemo(() => localStorage.getItem("token"), []);

//   const showToast = (text) => {
//     setToast(text);
//     if (text) {
//       setTimeout(() => setToast(""), 4000);
//     }
//   };

//   const validateMessage = (text) => {
//     const normalized = text.replace(/\s+/g, ' ').trim();

//     // Email pattern
//     const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
//     if (emailPattern.test(normalized)) {
//       return { valid: false, reason: 'Email addresses are not allowed in chat messages.' };
//     }

//     // Phone number pattern
//     const phonePattern = /(\+?\d[\d\s().-]{7,})/;
//     if (phonePattern.test(normalized)) {
//       return { valid: false, reason: 'Phone numbers are not allowed in chat messages.' };
//     }

//     // External links pattern
//     const linkPattern = /(https?:\/\/|www\.|[a-z0-9]+\.(com|net|org|io|co|in|edu|gov|me|info|biz|xyz|site|online|tech|app|dev|blog|website|link|click|bit\.ly|tinyurl|goo\.gl|t\.co|fb\.me|instagram\.com|facebook\.com|twitter\.com|linkedin\.com|youtube\.com|github\.com|stackoverflow\.com))/i;
//     if (linkPattern.test(normalized)) {
//       return { valid: false, reason: 'External links are not allowed in chat messages.' };
//     }

//     return { valid: true };
//   };

//   const loadThreads = async () => {
//     if (!isMountedRef.current) return;
//     try {
//       setLoadingThreads(true);
//       const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         if (isMountedRef.current) {
//           setThreads(data.threads || []);
//           if (!selectedThreadId && data.threads?.length) {
//             setSelectedThreadId(data.threads[0].id);
//             await loadMessages(data.threads[0].id);
//           }
//         }
//       } else {
//         if (isMountedRef.current) {
//           showToast("Unable to load chats.");
//         }
//       }
//     } catch (_) {
//       if (isMountedRef.current) {
//         showToast("Unable to load chats.");
//       }
//     } finally {
//       if (isMountedRef.current) {
//         setLoadingThreads(false);
//       }
//     }
//   };

//   const loadMessages = async (threadId) => {
//     if (!isMountedRef.current) return;
//     try {
//       setLoadingMessages(true);
//       const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/messages`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         if (isMountedRef.current) {
//           setMessages(data.messages || []);
//         }
//       } else {
//         if (isMountedRef.current) {
//           showToast("Unable to load messages.");
//         }
//       }
//     } catch (_) {
//       if (isMountedRef.current) {
//         showToast("Unable to load messages.");
//       }
//     } finally {
//       if (isMountedRef.current) {
//         setLoadingMessages(false);
//       }
//     }
//   };

//   const handleSelectThread = async (threadId) => {
//     setSelectedThreadId(threadId);
//     await loadMessages(threadId);
//   };

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !selectedThreadId) return;

//     const validation = validateMessage(newMessage);
//     if (!validation.valid) {
//       showToast(validation.reason);
//       return;
//     }

//     setSending(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/chat/threads/${selectedThreadId}/messages`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ message: newMessage.trim() }),
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setMessages(data.messages || []);
//         setNewMessage("");
//       } else {
//         const error = await response.json().catch(() => ({}));
//         showToast(error.message || "Unable to send message.");
//       }
//     } catch (_) {
//       showToast("Unable to send message.");
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleReportThread = async (threadId) => {
//     const reason = window.prompt("Tell us why you are reporting this chat (required):");
//     if (!reason || !reason.trim()) return;
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/report`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ reason: reason.trim() }),
//       });
//       if (response.ok) {
//         showToast("Report submitted. Thank you for keeping the community safe.");
//       } else {
//         const error = await response.json().catch(() => ({}));
//         showToast(error.message || "Unable to submit report.");
//       }
//     } catch (_) {
//       showToast("Unable to submit report.");
//     }
//   };

//   const selectedThread = threads.find((t) => t.id === selectedThreadId);

//   const statusLabel = (status) => {
//     switch (status) {
//       case "pending":
//         return "Waiting for employer approval";
//       case "approved":
//         return "Active";
//       case "declined":
//         return "Declined";
//       case "closed":
//         return "Closed";
//       default:
//         return status;
//     }
//   };

//   return (
//     <>
//       {toast && (
//         <div
//           className="alert alert-info"
//           style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
//         >
//           {toast}
//         </div>
//       )}
//       <Header />
//       <section className="padd-top-80 padd-bot-80" style={{ background: "#f8f9fc" }}>
//         <div className="container">
//           <div className="row">
//             <div className="col-md-4">
//               <div className="chat-panel">
//                 <div className="chat-panel__head" style={{ position: 'relative' }}>
//                   <button
//                     onClick={() => navigate(-1)}
//                     style={{
//                       position: 'absolute',
//                       left: '-70px',
//                       top: '-10px',
//                       background: 'none',
//                       border: 'none',
//                       fontSize: '24px',
//                       cursor: 'pointer',
//                       padding: '8px',
//                       color: '#000000',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       transition: 'all 0.2s',
//                       borderRadius: '50%',
//                       width: '40px',
//                       height: '40px',
//                       zIndex: 10
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.backgroundColor = '#f3f4f6';
//                       e.currentTarget.style.transform = 'scale(1.1)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.backgroundColor = 'transparent';
//                       e.currentTarget.style.transform = 'scale(1)';
//                     }}
//                     title="Go back"
//                   >
//                     <i className="ti-arrow-left"></i>
//                   </button>
//                   <div>
//                     <p className="chat-panel__eyebrow">Candidate Inbox</p>
//                     <h3>Chats with employers</h3>
//                     <p className="chat-panel__subtext">
//                       Employers can message you after approving your request. Pending chats will appear here.
//                     </p>
//                   </div>
//                   <button
//                     className="btn theme-btn"
//                     style={{ width: "100%", marginTop: 12 }}
//                     onClick={loadThreads}
//                     disabled={loadingThreads}
//                   >
//                     {loadingThreads ? "Refreshing..." : "Refresh"}
//                   </button>
//                 </div>
//                 <div className="chat-thread-list">
//                   {threads.length === 0 && (
//                     <p style={{ color: "#6b7280" }}>
//                       No chats yet. Request a conversation from a job detail page once you apply.
//                     </p>
//                   )}
//                   {threads.map((thread) => (
//                     <div
//                       key={thread.id}
//                       className={`chat-thread ${thread.id === selectedThreadId ? "chat-thread--active" : ""}`}
//                       onClick={() => handleSelectThread(thread.id)}
//                     >
//                       <div style={{ display: "flex", justifyContent: "space-between" }}>
//                         <div>
//                           <strong>{thread.jobTitle}</strong>
//                           <div style={{ fontSize: 12, color: "#6b7280" }}>{thread.companyName}</div>
//                         </div>
//                         {thread.unreadCount > 0 && (
//                           <span className="chat-thread__badge">{thread.unreadCount}</span>
//                         )}
//                       </div>
//                       <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
//                         {statusLabel(thread.status)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <div className="col-md-8">
//               <div className="chat-window">
//                 {!selectedThread && (
//                   <div className="chat-window__empty">
//                     <p>Select a conversation to get started.</p>
//                   </div>
//                 )}
//                 {selectedThread && (
//                   <>
//                     <div className="chat-window__head">
//                       <div>
//                         <h4 style={{ margin: 0 }}>{selectedThread.jobTitle}</h4>
//                         <p style={{ margin: 0, color: "#6b7280" }}>{selectedThread.companyName}</p>
//                         <span className="chat-window__status">{statusLabel(selectedThread.status)}</span>
//                       </div>
//                       <button
//                         className="btn btn-sm btn-danger"
//                         onClick={() => handleReportThread(selectedThread.id)}
//                       >
//                         Report
//                       </button>
//                     </div>
//                     <div className="chat-window__body">
//                       {loadingMessages ? (
//                         <div style={{ textAlign: "center", padding: 20 }}>Loading messages...</div>
//                       ) : messages.length === 0 ? (
//                         <div style={{ textAlign: "center", padding: 20, color: "#9ca3af" }}>
//                           No messages yet.
//                         </div>
//                       ) : (
//                         messages.map((msg) => (
//                           <div
//                             key={msg.id}
//                             className={`chat-message ${
//                               msg.sender_id === user.id ? "chat-message--self" : "chat-message--other"
//                             }`}
//                           >
//                             <div className="chat-message__bubble">
//                               <p style={{ margin: 0 }}>{msg.message}</p>
//                               <span>{new Date(msg.created_at).toLocaleString()}</span>
//                             </div>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                     <div className="chat-window__footer">
//                       {selectedThread.status !== "approved" ? (
//                         <div className="chat-window__notice">
//                           Once the employer approves your request, you can exchange messages here.
//                         </div>
//                       ) : (
//                         <>
//                           <textarea
//                             rows="2"
//                             placeholder="Type your message..."
//                             value={newMessage}
//                             onChange={(e) => setNewMessage(e.target.value)}
//                           ></textarea>
//                           <button
//                             className="btn theme-btn"
//                             onClick={handleSendMessage}
//                             disabled={sending || !newMessage.trim()}
//                           >
//                             {sending ? "Sending..." : "Send Message"}
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//       <style>
//         {`
//           .chat-panel {
//             background: #fff;
//             border-radius: 16px;
//             box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
//             padding: 24px;
//             height: 100%;
//           }
//           .chat-panel__eyebrow {
//             text-transform: uppercase;
//             letter-spacing: 0.2em;
//             font-size: 11px;
//             margin-bottom: 4px;
//             color: #94a3b8;
//           }
//           .chat-panel__head h3 {
//             margin: 0;
//           }
//           .chat-panel__subtext {
//             color: #6b7280;
//             font-size: 13px;
//           }
//           .chat-thread-list {
//             margin-top: 18px;
//             max-height: 480px;
//             overflow-y: auto;
//           }
//           .chat-thread {
//             border: 1px solid #e5e7eb;
//             border-radius: 12px;
//             padding: 12px;
//             margin-bottom: 12px;
//             cursor: pointer;
//             transition: border 0.2s, box-shadow 0.2s;
//           }
//           .chat-thread--active {
//             border-color: #4e73df;
//             box-shadow: 0 10px 20px rgba(79, 70, 229, 0.1);
//           }
//           .chat-thread__badge {
//             background: #ef4444;
//             color: white;
//             padding: 2px 8px;
//             border-radius: 999px;
//             font-size: 12px;
//           }
//           .chat-window {
//             background: white;
//             border-radius: 16px;
//             box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
//             display: flex;
//             flex-direction: column;
//             min-height: 520px;
//           }
//           .chat-window__head {
//             padding: 20px;
//             border-bottom: 1px solid #e5e7eb;
//             display: flex;
//             justify-content: space-between;
//             align-items: flex-start;
//           }
//           .chat-window__status {
//             display: inline-block;
//             margin-top: 8px;
//             padding: 4px 10px;
//             border-radius: 20px;
//             background: #eef2ff;
//             color: #4338ca;
//             font-size: 12px;
//           }
//           .chat-window__body {
//             flex: 1;
//             padding: 20px;
//             overflow-y: auto;
//             background: #f9fafb;
//           }
//           .chat-window__footer {
//             border-top: 1px solid #e5e7eb;
//             padding: 16px;
//             display: flex;
//             flex-direction: column;
//             gap: 10px;
//           }
//           .chat-window__footer textarea {
//             width: 100%;
//             resize: vertical;
//             border-radius: 12px;
//             border: 1px solid #d1d5db;
//             padding: 10px;
//           }
//           .chat-window__notice {
//             padding: 12px;
//             border-radius: 10px;
//             background: #fff7ed;
//             color: #92400e;
//           }
//           .chat-message {
//             display: flex;
//             margin-bottom: 14px;
//           }
//           .chat-message--self {
//             justify-content: flex-end;
//           }
//           .chat-message__bubble {
//             max-width: 70%;
//             background: white;
//             padding: 10px 14px;
//             border-radius: 18px;
//             box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
//             position: relative;
//           }
//           .chat-message--self .chat-message__bubble {
//             background: #4e73df;
//             color: white;
//           }
//           .chat-message__bubble span {
//             display: block;
//             font-size: 10px;
//             margin-top: 6px;
//             color: rgba(255,255,255,0.7);
//           }
//         `}
//       </style>
//     </>
//   );
// };

// export default CandidateChat;

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

// Send icon as inline SVG to avoid react-icons import issues in all setups
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CandidateChat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
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
    if (!user) {
      if (isMountedRef.current) navigate("/");
      return;
    }
    if (user.role !== "seeker") {
      if (isMountedRef.current) navigate("/");
      return;
    }
    if (isMountedRef.current) {
      loadThreads();
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const showToast = (text) => {
    setToast(text);
    if (text) setTimeout(() => setToast(""), 4000);
  };

  const validateMessage = (text) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    if (emailPattern.test(normalized))
      return { valid: false, reason: "Email addresses are not allowed in chat messages." };
    const phonePattern = /(\+?\d[\d\s().-]{7,})/;
    if (phonePattern.test(normalized))
      return { valid: false, reason: "Phone numbers are not allowed in chat messages." };
    const linkPattern = /(https?:\/\/|www\.|[a-z0-9]+\.(com|net|org|io|co|in|edu|gov|me|info|biz|xyz|site|online|tech|app|dev|blog|website|link|click|bit\.ly|tinyurl|goo\.gl|t\.co|fb\.me|instagram\.com|facebook\.com|twitter\.com|linkedin\.com|youtube\.com|github\.com|stackoverflow\.com))/i;
    if (linkPattern.test(normalized))
      return { valid: false, reason: "External links are not allowed in chat messages." };
    return { valid: true };
  };

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  }, []);

  const handleMessagesScroll = useCallback((e) => {
    const element = e.target;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadThreads = async () => {
    if (!isMountedRef.current) return;
    try {
      setLoadingThreads(true);
      const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          setThreads(data.threads || []);
          if (!selectedThreadIdRef.current && data.threads?.length) {
            setSelectedThreadId(data.threads[0].id);
            await loadMessages(data.threads[0].id);
          }
        }
      } else {
        if (isMountedRef.current) showToast("Unable to load chats.");
      }
    } catch (_) {
      if (isMountedRef.current) showToast("Unable to load chats.");
    } finally {
      if (isMountedRef.current) setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId, silent = false) => {
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
          // Only update state if message count changed to prevent flicker
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
  };

  // Polling every 3 seconds
  const startPolling = () => {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;
      // Silently refresh threads
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMountedRef.current) setThreads(data.threads || []);
        }
      } catch (_) { }
      // Silently refresh messages for selected thread
      const tid = selectedThreadIdRef.current;
      if (tid) await loadMessages(tid, true);
    }, 3000);
  };

  const handleSelectThread = async (threadId) => {
    lastMessageCountRef.current = 0;
    setSelectedThreadId(threadId);
    if (isMobileView) setMobileScreen("chat");
    await loadMessages(threadId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId) return;
    const validation = validateMessage(newMessage);
    if (!validation.valid) {
      showToast(validation.reason);
      return;
    }
    setSending(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat/threads/${selectedThreadId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReportThread = async (threadId) => {
    const reason = window.prompt("Tell us why you are reporting this chat (required):");
    if (!reason || !reason.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/threads/${threadId}/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (response.ok) {
        showToast("Report submitted. Thank you for keeping the community safe.");
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.message || "Unable to submit report.");
      }
    } catch (_) {
      showToast("Unable to submit report.");
    }
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const statusLabel = (status) => {
    switch (status) {
      case "pending": return "Waiting for employer approval";
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
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Group messages by date
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

  const showThreadList = !isMobileView || mobileScreen === "list";
  const showChatWindow = !isMobileView || mobileScreen === "chat";

  return (
    <>
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
      <Header />

      <div style={{ background: "#f0fdf4", minHeight: "100vh", paddingTop: 80, paddingBottom: 24 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>


          {/* Main Chat Layout */}
          <div style={{ position: "relative" }}>
            {/* Back arrow — floats to the left of the thread list box */}
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
            <div style={{
              display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "320px 1fr", gap: 16,
              height: "calc(100vh - 130px)", minHeight: 500
            }}>

              {/* LEFT: Thread List */}
              {showThreadList && (
                <div style={{
                background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column",
                boxShadow: "0 4px 24px rgba(34,197,94,0.08)", border: "1px solid #bbf7d0", overflow: "hidden"
                }}>
                {/* Search bar */}
                <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid #f0fdf4", flexShrink: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#f9fafb", border: "1.5px solid #bbf7d0", borderRadius: 10,
                    padding: "7px 12px", transition: "border-color 0.2s"
                  }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = "#22c55e"}
                    onBlurCapture={e => e.currentTarget.style.borderColor = "#bbf7d0"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        flex: 1, border: "none", outline: "none", background: "transparent",
                        fontSize: 13, color: "#111827", fontFamily: "inherit"
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, fontSize: 17, lineHeight: 1 }}
                        title="Clear"
                      >×</button>
                    )}
                  </div>
                </div>

                {/* Scrollable thread list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
                  {threads.length === 0 && !loadingThreads && (
                    <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                      <p style={{ margin: 0, fontSize: 13 }}>No chats yet. Request a conversation from a job detail page once you apply.</p>
                    </div>
                  )}
                  {(() => {
                    const filtered = threads.filter(t =>
                      !searchQuery ||
                      t.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (filtered.length === 0 && threads.length > 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "30px 16px", color: "#9ca3af" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                          <p style={{ margin: 0, fontSize: 13 }}>No results for "{searchQuery}"</p>
                        </div>
                      );
                    }
                    return filtered.map((thread) => {
                      const isActive = thread.id === selectedThreadId;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          style={{
                            padding: "16px 18px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                            background: isActive ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "#fafafa",
                            border: isActive ? "none" : "1px solid #e5e7eb",
                            transition: "all 0.18s ease",
                            boxShadow: isActive ? "0 4px 14px rgba(34,197,94,0.28)" : "none",
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0fdf4"; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                        >
                          {/* Top row: job title (left) + status badge (top-right) */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontWeight: 600, fontSize: 13, color: isActive ? "#fff" : "#111827",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                lineHeight: 1.3
                              }}>
                                {thread.jobTitle}
                              </div>
                              <div style={{
                                fontSize: 12, color: isActive ? "rgba(255,255,255,0.75)" : "#6b7280",
                                marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                              }}>
                                {thread.companyName}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                              <span style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                                background: isActive ? "rgba(255,255,255,0.22)" : statusColor(thread.status).bg,
                                color: isActive ? "#fff" : statusColor(thread.status).color,
                                whiteSpace: "nowrap"
                              }}>
                                {statusLabel(thread.status)}
                              </span>
                              {thread.unreadCount > 0 && (
                                <span style={{
                                  background: isActive ? "#fff" : "#22c55e", color: isActive ? "#16a34a" : "#fff",
                                  minWidth: 18, height: 18, borderRadius: 999, fontSize: 10, fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                                }}>
                                  {thread.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                </div>
              )}

              {/* RIGHT: Chat Window */}
              {showChatWindow && (
                <div style={{
                background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column",
                boxShadow: "0 4px 24px rgba(34,197,94,0.08)", border: "1px solid #bbf7d0",
                overflow: "hidden"
                }}>
                {!selectedThread ? (
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", color: "#9ca3af"
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>Select a conversation to get started</p>
                    <p style={{ margin: "6px 0 0", fontSize: 13 }}>Your chats with employers will appear here</p>
                  </div>
                ) : (
                  <>
                    {/* Fixed Chat Header */}
                    <div style={{
                      padding: "14px 20px", borderBottom: "1px solid #f0fdf4",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "#fff", flexShrink: 0, zIndex: 2
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
                          width: 42, height: 42, borderRadius: "50%",
                          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0
                        }}>
                          {selectedThread.jobTitle?.[0]?.toUpperCase() || "J"}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: "#111827", fontSize: 16, fontWeight: 700 }}>
                            {selectedThread.jobTitle}
                          </h4>
                          <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
                            {selectedThread.companyName}
                          </p>
                        </div>
                        <span style={{
                          marginLeft: 8, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                          background: statusColor(selectedThread.status).bg,
                          color: statusColor(selectedThread.status).color,
                        }}>
                          {statusLabel(selectedThread.status)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleReportThread(selectedThread.id)}
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
                    </div>

                    {/* Scrollable Messages Area */}
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleMessagesScroll}
                      style={{
                        flex: 1, overflowY: "auto", padding: "20px 24px",
                        background: "#f9fafb", display: "flex", flexDirection: "column", gap: 2,
                        position: "relative"
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
                              <div key={`date-${idx}`} style={{
                                textAlign: "center", margin: "12px 0 8px",
                                position: "relative"
                              }}>
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

                    {/* Floating Scroll to Latest Button - Fixed Position */}
                    {showScrollButton && (
                      <button
                        onClick={() => scrollToBottom()}
                        style={{
                          position: "absolute",
                          bottom: 80,
                          right: 20,
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#ffffff",
                          border: "2px solid #3b82f6",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                          transition: "all 0.2s ease",
                          zIndex: 5,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.25)";
                        }}
                        title="Scroll to latest message"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    )}

                    {/* Fixed Input Footer */}
                    <div style={{
                      padding: "12px 16px", borderTop: "1px solid #e5e7eb",
                      background: "#fff", flexShrink: 0
                    }}>
                      {selectedThread.status !== "approved" ? (
                        <div style={{
                          padding: "12px 16px", borderRadius: 10,
                          background: "#fefce8", color: "#92400e",
                          fontSize: 13, textAlign: "center", border: "1px solid #fde68a"
                        }}>
                          ⏳ Once the employer approves your request, you can exchange messages here.
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
                              // Auto-resize
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
      </div>


      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #86efac; }
      `}</style>
    </>
  );
};

export default CandidateChat;