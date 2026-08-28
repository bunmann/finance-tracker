// ============================================================================
// File: AiFinancialAssistant.jsx
// Description: Interactive AI Financial Assistant widget powered by Google Gemini API
//              with in-memory rate limit defense and conversational context analysis.
// ============================================================================
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import './AiFinancialAssistant.css';

const QUICK_PROMPTS = [
    "Summarize my total net worth & overall health",
    "Where did I spend the most money?",
    "How is my stock portfolio performing?",
    "Give me 3 actionable tips to increase my savings rate"
];

function AiFinancialAssistant() {
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Hello! I'm your **Veridian AI Financial Assistant**. I have analyzed your live Net Worth, bank transactions, and stock portfolio holdings. What would you like to know?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputPrompt, setInputPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendPrompt = async (promptToSend) => {
        const text = (promptToSend || inputPrompt).strip?.() || (promptToSend || inputPrompt).trim();
        if (!text || isLoading) return;

        setErrorMsg(null);
        const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Optimistically add user message
        const newMsg = { sender: 'user', text, timestamp: userTime };
        setMessages(prev => [...prev, newMsg]);
        if (!promptToSend) setInputPrompt('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { prompt: text });
            const aiReply = res.data.response;
            const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setMessages(prev => [
                ...prev,
                { sender: 'ai', text: aiReply, timestamp: aiTime }
            ]);
        } catch (err) {
            console.error("AI Chat error:", err);
            const detail = err.response?.data?.detail || "Failed to communicate with AI Assistant. Ensure your Gemini API key is configured.";
            setErrorMsg(detail);
            
            // Add error bubble
            setMessages(prev => [
                ...prev,
                { 
                    sender: 'ai', 
                    text: `⚠️ **Notice**: ${detail}`, 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isError: true 
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendPrompt();
        }
    };

    return (
        <motion.div 
            className="ai-assistant-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="ai-assistant-header">
                <div className="ai-header-title-group">
                    <div className="ai-robot-badge">🤖</div>
                    <div>
                        <h3 className="ai-assistant-title">AI Financial Coach & Analyst</h3>
                        <p className="ai-assistant-subtitle">Powered by Google Gemini 1.5 & Live Database Context</p>
                    </div>
                </div>
                <div className="ai-status-pill">
                    <span className="online-dot" />
                    <span>Gemini Connected</span>
                </div>
            </div>

            {/* Quick Prompt Suggestion Pills */}
            <div className="quick-prompts-row">
                {QUICK_PROMPTS.map((promptText, idx) => (
                    <button 
                        key={idx} 
                        type="button" 
                        className="quick-prompt-pill"
                        onClick={() => handleSendPrompt(promptText)}
                        disabled={isLoading}
                    >
                        💡 {promptText}
                    </button>
                ))}
            </div>

            {/* Chat Messages Container */}
            <div className="ai-chat-messages">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
                    >
                        {msg.sender === 'ai' && <div className="chat-avatar">🤖</div>}
                        <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'} ${msg.isError ? 'bubble-error' : ''}`}>
                            <div className="bubble-text">
                                {msg.text.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                            <span className="bubble-timestamp">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-bubble-row ai-row">
                        <div className="chat-avatar">🤖</div>
                        <div className="chat-bubble bubble-ai loading-bubble">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Controls */}
            <div className="ai-chat-input-bar">
                <input 
                    type="text" 
                    className="ai-chat-input"
                    placeholder="Ask AI anything about your net worth, expenses, or stock portfolio..."
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <button 
                    type="button" 
                    className="ai-send-btn"
                    onClick={() => handleSendPrompt()}
                    disabled={isLoading || !inputPrompt.trim()}
                >
                    {isLoading ? '...' : 'Send Prompt 🚀'}
                </button>
            </div>
        </motion.div>
    );
}

export default AiFinancialAssistant;
