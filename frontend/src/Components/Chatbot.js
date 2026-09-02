import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your job search assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();

    // Job search related
    if (message.includes("job") || message.includes("find") || message.includes("search")) {
      return {
        text: "I can help you find jobs! You can:\n• Browse all jobs by clicking 'Companies' in the menu\n• Use the search bar at the top to search by keywords\n• Filter jobs by category\n• View job details and apply directly\n\nWould you like me to show you how to search for specific jobs?",
        quickReplies: ["Browse Jobs", "Search by Category", "How to Apply"],
      };
    }

    // Registration/Login
    if (message.includes("register") || message.includes("sign up") || message.includes("create account")) {
      return {
        text: "To register:\n1. Click the 'Register' button in the top right\n2. Choose your role (Candidate or Employer)\n3. Fill in your details\n4. Start exploring jobs!\n\nWould you like to register now?",
        quickReplies: ["Register as Candidate", "Register as Employer"],
      };
    }

    if (message.includes("login") || message.includes("sign in")) {
      return {
        text: "To login:\n1. Click the 'Login' button in the top right\n2. Enter your email and password\n3. Access your dashboard\n\nNeed help with your account?",
        quickReplies: ["Forgot Password", "Create Account"],
      };
    }

    // Categories
    if (message.includes("category") || message.includes("type") || message.includes("kind")) {
      return {
        text: "We have jobs in various categories like:\n• Technology/IT\n• Healthcare\n• Finance\n• Education\n• Marketing\n• And many more!\n\nYou can browse jobs by category on the homepage or use the search filters.",
        quickReplies: ["View Categories", "Browse Jobs"],
      };
    }

    // Application process
    if (message.includes("apply") || message.includes("application") || message.includes("how to apply")) {
      return {
        text: "To apply for a job:\n1. Browse available jobs\n2. Click on a job that interests you\n3. Read the job details\n4. Click 'Apply Now' button\n5. Upload your resume and fill in required details\n\nMake sure you're logged in as a candidate!",
        quickReplies: ["Browse Jobs", "Login", "Create Resume"],
      };
    }

    // Resume
    if (message.includes("resume") || message.includes("cv")) {
      return {
        text: "To create or upload your resume:\n1. Login as a candidate\n2. Go to 'Create Resume' in your profile\n3. Fill in your details and upload your resume\n4. Your resume will be saved for future applications\n\nNeed help creating a resume?",
        quickReplies: ["Create Resume", "Login"],
      };
    }

    // Company/Employer
    if (message.includes("employer") || message.includes("company") || message.includes("post job")) {
      return {
        text: "For employers:\n• Register as an Employer/Provider\n• Post job openings\n• Manage applications\n• View candidate profiles\n• Use premium features for better reach\n\nWould you like to register as an employer?",
        quickReplies: ["Register as Employer", "Post a Job"],
      };
    }

    // Help/Support
    if (message.includes("help") || message.includes("support") || message.includes("contact")) {
      return {
        text: "I'm here to help! You can:\n• Ask me about jobs, categories, or registration\n• Get help with the application process\n• Learn about our features\n\nFor more support, visit the Contact page or reach out to our team.",
        quickReplies: ["Contact Us", "Browse Jobs", "Register"],
      };
    }

    // Greetings
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return {
        text: "Hello! 👋 I'm here to help you find your dream job. What would you like to know?",
        quickReplies: ["Find Jobs", "How to Apply", "Register"],
      };
    }

    // Default response
    return {
      text: "I'm here to help you with:\n• Finding jobs\n• Registration and login\n• Application process\n• Resume creation\n• Job categories\n\nTry asking me about any of these topics, or use the quick reply buttons!",
      quickReplies: ["Find Jobs", "How to Apply", "Register", "Help"],
    };
  };

  const handleQuickReply = (reply) => {
    let action = "";
    switch (reply) {
      case "Browse Jobs":
        action = "browse";
        break;
      case "Search by Category":
        action = "categories";
        break;
      case "Register as Candidate":
        action = "register-candidate";
        break;
      case "Register as Employer":
        action = "register-employer";
        break;
      case "Login":
        action = "login";
        break;
      case "Create Resume":
        action = "resume";
        break;
      case "Contact Us":
        action = "contact";
        break;
      case "View Categories":
        action = "categories";
        break;
      case "How to Apply":
        action = "apply";
        break;
      default:
        action = reply.toLowerCase();
    }

    if (action === "browse" || action === "categories") {
      navigate("/jobs");
      setIsOpen(false);
      return;
    }
    if (action === "register-candidate" || action === "register-employer") {
      // Trigger register modal or navigate
      const registerBtn = document.querySelector('[data-target="#register"]');
      if (registerBtn) {
        registerBtn.click();
      }
      setIsOpen(false);
      return;
    }
    if (action === "login") {
      const loginBtn = document.querySelector('[data-target="#signin"]');
      if (loginBtn) {
        loginBtn.click();
      }
      setIsOpen(false);
      return;
    }
    if (action === "resume") {
      navigate("/candidate/create-resume");
      setIsOpen(false);
      return;
    }
    if (action === "contact") {
      navigate("/Services");
      setIsOpen(false);
      return;
    }

    // Otherwise, send as a message
    handleSendMessage(reply);
  };

  const handleSendMessage = async (messageText = null) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    // Add user message
    const userMessage = {
      text: text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          text: botResponse.text,
          sender: "bot",
          timestamp: new Date(),
          quickReplies: botResponse.quickReplies,
        },
      ]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-toggle-btn"
          aria-label="Open chatbot"
        >
          <i className="ti-comments" style={{ fontSize: "24px" }}></i>
          <span className="chatbot-badge">Need Help?</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <i className="ti-headphone" style={{ fontSize: "20px" }}></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px" }}>Job Assistant</h4>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              aria-label="Close chatbot"
            >
              <i className="ti-close"></i>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-message ${msg.sender}`}>
                {msg.sender === "bot" && (
                  <div className="chatbot-avatar-small">
                    <i className="ti-headphone"></i>
                  </div>
                )}
                <div className="chatbot-message-content">
                  <p style={{ margin: 0, whiteSpace: "pre-line" }}>{msg.text}</p>
                  {msg.quickReplies && (
                    <div className="chatbot-quick-replies">
                      {msg.quickReplies.map((reply, replyIdx) => (
                        <button
                          key={replyIdx}
                          onClick={() => handleQuickReply(reply)}
                          className="chatbot-quick-reply-btn"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message bot">
                <div className="chatbot-avatar-small">
                  <i className="ti-headphone"></i>
                </div>
                <div className="chatbot-message-content">
                  <div className="chatbot-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="chatbot-input"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="chatbot-send-btn"
              aria-label="Send message"
            >
              <i className="ti-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .chatbot-toggle-btn {
            position: fixed;
            bottom: 84px;
            right: 20px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
            border: none;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(78, 115, 223, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: all 0.3s ease;
            flex-direction: column;
            padding: 8px;
          }

          .chatbot-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(78, 115, 223, 0.5);
          }

          .chatbot-badge {
            font-size: 10px;
            margin-top: 2px;
            font-weight: 600;
          }

          .chatbot-window {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 380px;
            height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            z-index: 1001;
            overflow: hidden;
          }

          .chatbot-header {
            background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .chatbot-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .chatbot-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .chatbot-close-btn {
            background: transparent;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
          }

          .chatbot-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .chatbot-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .chatbot-message {
            display: flex;
            gap: 8px;
            align-items: flex-start;
          }

          .chatbot-message.user {
            flex-direction: row-reverse;
          }

          .chatbot-message-content {
            max-width: 75%;
            padding: 10px 14px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .chatbot-message.user .chatbot-message-content {
            background: #4e73df;
            color: white;
          }

          .chatbot-avatar-small {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #e9ecef;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4e73df;
            flex-shrink: 0;
          }

          .chatbot-quick-replies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
          }

          .chatbot-quick-reply-btn {
            padding: 6px 12px;
            border: 1px solid #dee2e6;
            background: white;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            color: #495057;
          }

          .chatbot-quick-reply-btn:hover {
            background: #4e73df;
            color: white;
            border-color: #4e73df;
          }

          .chatbot-typing-indicator {
            display: flex;
            gap: 4px;
            padding: 8px 0;
          }

          .chatbot-typing-indicator span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #6c757d;
            animation: typing 1.4s infinite;
          }

          .chatbot-typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
          }

          .chatbot-typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
          }

          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.7;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }

          .chatbot-input-container {
            padding: 12px;
            background: white;
            border-top: 1px solid #dee2e6;
            display: flex;
            gap: 8px;
          }

          .chatbot-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #dee2e6;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
          }

          .chatbot-input:focus {
            border-color: #4e73df;
          }

          .chatbot-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4e73df;
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .chatbot-send-btn:hover:not(:disabled) {
            background: #224abe;
            transform: scale(1.05);
          }

          .chatbot-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 480px) {
            .chatbot-window {
              width: calc(100vw - 40px);
              height: calc(100vh - 40px);
              bottom: 20px;
              right: 20px;
            }
          }
        `}
      </style>
    </>
  );
};

export default Chatbot;

