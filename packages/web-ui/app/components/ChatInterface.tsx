import {
  Button,
  Caption1,
  Card,
  CardHeader,
  MessageBar,
  Spinner,
  Textarea,
  TextareaOnChangeData,
  Title3,
} from '@fluentui/react-components';
import { Bot24Regular, Send24Regular, Stop24Regular } from '@fluentui/react-icons';
import React, { useState } from 'react';

interface ChatInterfaceProps {
  onExecuteTask: (instruction: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'execution';
  content: string;
  timestamp: Date;
}

export function ChatInterface({ onExecuteTask, loading = false, error }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content:
        'Welcome! I can help you automate browser tasks. Just describe what you want to do, like "go to google.com and search for automation tools" or "take a screenshot of the current page".',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [quickCommands] = useState([
    'Take a screenshot',
    'Go to google.com',
    'Scroll down 500 pixels',
    'Wait for 2 seconds',
    'Go to github.com and search for automation',
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    const executionMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'execution',
      content: `Executing: ${inputValue}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, executionMessage]);
    setInputValue('');

    try {
      await onExecuteTask(inputValue);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader>
        <Title3>
          <Bot24Regular style={{ marginRight: '8px' }} />
          Automation Chat
        </Title3>
        <Caption1>Describe what you want to automate</Caption1>
      </CardHeader>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <MessageBar intent='error'>{error}</MessageBar>}

        {/* Quick Commands */}
        <div>
          <Caption1 style={{ marginBottom: '8px' }}>Quick Commands:</Caption1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickCommands.map((command, index) => (
              <Button
                key={index}
                size='small'
                appearance='subtle'
                onClick={() => handleQuickCommand(command)}
                disabled={loading}
              >
                {command}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid #e1e1e1',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minHeight: '300px',
            maxHeight: '400px',
          }}
        >
          {messages.map(message => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor:
                    message.type === 'user' ? '#0078d4' : message.type === 'execution' ? '#f3f2f1' : '#e6f3ff',
                  color: message.type === 'user' ? 'white' : '#323130',
                }}
              >
                <div style={{ fontSize: '14px' }}>{message.content}</div>
                <Caption1
                  style={{
                    color: message.type === 'user' ? 'rgba(255,255,255,0.8)' : '#605e5c',
                    marginTop: '4px',
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Caption1>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size='small' />
              <Caption1>Processing your request...</Caption1>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Textarea
            value={inputValue}
            onChange={(_: React.ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => setInputValue(data.value)}
            onKeyDown={handleKeyPress}
            placeholder='Describe what you want to automate...'
            rows={2}
            style={{ flex: 1 }}
            disabled={loading}
          />
          <Button
            appearance='primary'
            icon={loading ? <Stop24Regular /> : <Send24Regular />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            {loading ? 'Stop' : 'Send'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
