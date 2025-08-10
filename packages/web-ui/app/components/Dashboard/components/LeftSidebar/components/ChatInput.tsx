import React from 'react';
import { Lightbulb20Regular, Send20Regular, Clock20Regular } from '@fluentui/react-icons';
import { styles } from '../../../Dashboard.styles';

interface ChatInputProps {
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  onRunTask: () => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Go to google.com and search for 'OpenAI'",
  "Navigate to github.com and find trending repositories",
  "Visit amazon.com and search for 'wireless headphones'",
  "Go to wikipedia.org and search for 'artificial intelligence'",
  "Open linkedin.com and scroll through the feed",
];

export const ChatInput: React.FC<ChatInputProps> = ({
  taskDescription,
  setTaskDescription,
  onRunTask,
  isLoading,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onRunTask();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setTaskDescription(prompt);
  };

  const suggestionStyle = {
    display: 'inline-block',
    backgroundColor: '#2a2a2a',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '6px 12px',
    margin: '4px',
    fontSize: '12px',
    color: '#e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
  };

  const suggestionHoverStyle = {
    backgroundColor: '#374151',
    borderColor: '#007ACC',
    color: '#ffffff',
  };

  return (
    <div style={styles.inputContainer}>
      {/* Suggestion Bubbles */}
      {!taskDescription && (
        <div style={{ padding: '0 16px 12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Lightbulb20Regular style={{ marginRight: '4px', fontSize: '14px' }} />
            Quick examples:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                style={suggestionStyle}
                onClick={() => handleSuggestionClick(prompt)}
                onMouseOver={(e) => {
                  Object.assign(e.currentTarget.style, suggestionHoverStyle);
                }}
                onMouseOut={(e) => {
                  Object.assign(e.currentTarget.style, suggestionStyle);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.inputWrapper}>
        <textarea
          style={styles.textInput}
          placeholder='Message AI Assistant...'
          value={taskDescription}
          onChange={e => setTaskDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          style={{
            ...styles.sendButton,
            opacity: !taskDescription.trim() || isLoading ? 0.5 : 0.9,
          }}
          onClick={onRunTask}
          disabled={!taskDescription.trim() || isLoading}
          onMouseOver={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#005999';
            }
          }}
          onMouseOut={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#007ACC';
            }
          }}
        >
          {isLoading ? <Clock20Regular /> : <Send20Regular />}
        </button>
      </div>
    </div>
  );
};
