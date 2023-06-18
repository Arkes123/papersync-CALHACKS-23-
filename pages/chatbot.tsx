import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'

// message contents
interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  

    const handleSendMessage = () => {
      if (inputValue.trim() !== '') {
        const newMessage: Message = {
          id: Date.now(),
          content: inputValue.trim(),
          sender: 'user',
        };
  
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setInputValue('');
      }
    };
  
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '300px', height: '400px', background: '#E5E7EB', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: '80%', overflowY: 'auto' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    background: message.sender === 'user' ? '#DCF8C6' : '#E5E7EB',
                    color: message.sender === 'user' ? '#256C1B' : '#1F2937',
                    padding: '8px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your message..."
              style={{ padding: '8px', borderRadius: '8px', border: 'none' }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '8px 16px',
                background: '#3B82F6',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                marginLeft: '8px',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default Chatbot;
  