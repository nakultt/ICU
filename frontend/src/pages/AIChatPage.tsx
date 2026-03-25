import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function AIChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am the VisiCare AI Assistant. I have reviewed the patient's medical records, recent vitals, and doctor reports using our advanced Retrieval-Augmented Generation (RAG) system. What questions do you have?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [initIndexing, setInitIndexing] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleIndexData = async () => {
    if (!id) return;
    setInitIndexing(true);
    try {
      await api.ai.indexStats(id);
      // alert("Data successfully indexed for RAG!"); // Optional
    } catch (e) {
      console.error(e);
    } finally {
      setInitIndexing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !id) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    
    // Add User Message
    const updatedMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Format history for the API (exclude the first greeting maybe, but it's fine)
      const apiHistory = updatedMessages.slice(1, -1).map(m => ({ role: m.role, text: m.content }));
      
      const res = await api.ai.chat(id, userMsg, apiHistory);
      setMessages([...updatedMessages, { role: "ai", content: res.response }]);
    } catch (err: any) {
      setMessages([...updatedMessages, { role: "ai", content: "Sorry, I am currently facing an error answering your question. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">VisiCare AI Chat</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Semantic Search RAG Pipeline Active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleIndexData}
            disabled={initIndexing}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {initIndexing ? "Indexing..." : "Refresh Document Index"}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl shadow-cyan-900/5 mb-4 border border-slate-200 dark:border-slate-800">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] rounded-3xl px-6 py-4 ${
                  msg.role === "user" 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm shadow-md" 
                  : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px]">
                      AI
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gemini RAG</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-bl-sm px-6 py-4 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about vitals, doctor reports, diagnosis..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white rounded-2xl pl-6 pr-16 py-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-500 rounded-xl text-white flex items-center justify-center disabled:opacity-50 hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-3">
             <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Generative AI may produce inaccurate clinical information. Always verify.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
