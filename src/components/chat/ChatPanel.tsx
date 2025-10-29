import React, { useState, useEffect, useRef } from 'react';
import DataService from '../../services/DataService';
import { useGlobalState } from '../../hooks/useGlobalState';
import type { ChatMessage, HistoryItem } from '../../types';

interface ChatPanelProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ className = '', isCollapsed = false, onToggle }) => {
  const { updateSqlGenerationState, showError } = useGlobalState();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  ]);
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isLoading) {
      const userMessage = { id: Date.now(), text: newMessage, sender: 'user' as const };
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);
      updateSqlGenerationState({ isGenerating: true, lastPrompt: newMessage });

      try {
        // Send prompt to data service with history
        const response = await DataService.instance.sendPrompt(newMessage, chatHistory);
        
        if (response && response.sql) {
          // Update global state with generated SQL
          updateSqlGenerationState({ 
            generatedSql: response.sql, 
            isGenerating: false 
          });
          
          const aiMessage = { 
            id: Date.now() + 1, 
            text: "Your SQL is in the query editor.", 
            sender: 'ai' as const 
          };
          setChatMessages(prev => [...prev, aiMessage]);
          
          // Add to chat history
          setChatHistory(prev => [...prev, {
            user_prompt: newMessage,
            system_response: response.sql
          }]);
        } else {
          // Format the JSON response for display
          const jsonResponse = JSON.stringify(response, null, 2);
          const aiMessage = { 
            id: Date.now() + 1, 
            text: `**Data Service Response:**\n\`\`\`json\n${jsonResponse}\n\`\`\``, 
            sender: 'ai' as const 
          };
          setChatMessages(prev => [...prev, aiMessage]);
          updateSqlGenerationState({ isGenerating: false });
          
          // Add to chat history
          setChatHistory(prev => [...prev, {
            user_prompt: newMessage,
            system_response: `**Data Service Response:**\n\`\`\`json\n${jsonResponse}\n\`\`\``
          }]);
        }
      } catch (error) {
        showError('Failed to generate SQL. Please try again.');
        updateSqlGenerationState({ isGenerating: false });
      }
     
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setChatHistory([]);
  };

  // If collapsed, show only the toggle button
  if (isCollapsed) {
    return (
      <div className={`bg-light border-start d-flex flex-column h-100 ${className}`} style={{ height: '100%' }}>
        <div className="p-2 border-bottom flex-shrink-0 d-flex justify-content-center">
          <button 
            className="btn btn-sm"
            style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
            onClick={onToggle}
            title="Expand chat panel"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
        </div>
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div 
            style={{ 
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(360deg)',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#aa0000'
            }}
          >
            AI Assistant
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-light border-start d-flex flex-column h-100 ${className}`} style={{ height: '100%' }}>
      <div className="p-2 border-bottom flex-shrink-0 panel-header" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)', borderBottomWidth: '2px' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted mb-0 d-flex align-items-center">
            <i className="bi bi-chat-dots me-2"></i>AI Assistant
          </h6>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm"
              style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
              onClick={handleClearChat}
              disabled={chatMessages.length === 0}
              title="Clear chat history"
            >
              <i className="bi bi-trash"></i>
            </button>
            <button 
              className="btn btn-sm"
              style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
              onClick={onToggle}
              title="Collapse chat panel"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-grow-1 p-3 overflow-auto chat-panel-scroll d-flex flex-column">
        <div className="flex-grow-1">
          {chatMessages.map((message) => (
            <div key={message.id} className={`mb-3 ${message.sender === 'user' ? 'text-end' : 'text-start'}`}>
              <div 
                className={`d-inline-block p-2 rounded ${message.sender === 'user' ? 'text-white' : 'bg-white border'}`}
                style={message.sender === 'user' ? { backgroundColor: '#aa0000' } : {}}
              >
                {message.text}
              </div>
            </div>
          ))}
          
          {/* Progress bar while loading */}
          {isLoading && (
            <div className="mb-3 text-start">
              <div className="d-inline-block p-2 rounded bg-white border">
                <div className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm text-danger me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted">Generating response...</span>
                </div>
                <div className="progress mt-2" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-danger" 
                    role="progressbar" 
                    style={{ width: '100%', animation: 'progress-bar-stripes 1s linear infinite' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-3 border-top flex-shrink-0">
        <div className="d-flex gap-2">
          <textarea
            className="form-control flex-grow-1"
            placeholder={isLoading ? "Almost there..." : "redfive standing by..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={3}
            style={{ resize: 'vertical', minHeight: '75px' }}
          />
          <button 
            className="btn align-self-start" 
            style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white', marginTop: '2px' }}
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            {isLoading ? (
              <i className="bi bi-hourglass-split"></i>
            ) : (
              <i className="bi bi-send"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
