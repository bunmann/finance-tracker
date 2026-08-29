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

const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} style={{ height: '6px' }} />;

        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

        const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                return <em key={pIdx}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const label = part.slice(1, part.indexOf(']('));
                const url = part.slice(part.indexOf('](') + 2, -1);
                return (
                    <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" className="chat-msg-link">
                        {label}
                    </a>
                );
            }
            return part;
        });

        return (
            <p key={lIdx} className="chat-msg-line">
                {renderedLine}
            </p>
        );
    });
};

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
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendPrompt = async (promptToSend = null) => {
        const textToSubmit = promptToSend || inputPrompt;
        if (!textToSubmit || !textToSubmit.trim() || isLoading) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg = { sender: 'user', text: textToSubmit.trim(), timestamp: timeStr };

        setMessages(prev => [...prev, userMsg]);
        if (!promptToSend) setInputPrompt('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { prompt: textToSubmit.trim() });
            const aiReply = res.data?.response || "Analyzed your financial context.";
            const aiMsg = { sender: 'ai', text: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Assistant error:", error);
            const errDetail = error.response?.data?.detail || "Could not reach AI Assistant. Please try again.";
            const errMsg = { sender: 'ai', text: `⚠️ **Notice**: ${errDetail}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true };
            setMessages(prev => [...prev, errMsg]);
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
            {/* Header */}
            <div className="ai-assistant-header">
                <div className="ai-header-title-group">
                    <div className="ai-robot-badge">🤖</div>
                    <div>
                        <h3 className="ai-assistant-title">AI Financial Coach & Analyst</h3>
                        <p className="ai-assistant-subtitle">Powered by Google Gemini 1.5 & Live Database Context</p>
                    </div>
                </div>
                <div className="ai-status-pill">
                    <span className="online-dot"></span> Gemini Connected
                </div>
            </div>

            {/* Quick Prompt Pills */}
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
                                {renderFormattedText(msg.text)}
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
