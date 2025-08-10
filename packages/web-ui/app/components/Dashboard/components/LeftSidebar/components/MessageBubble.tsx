import React from 'react';
import { Person20Regular, Bot20Regular, Copy20Regular, List20Regular } from '@fluentui/react-icons';
import type { ChatMessage } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy: (text: string) => void;
  formatTime: (date: Date) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCopy, formatTime }) => {
  return (
    <div style={styles.messageWrapper}>
      <div
        style={{
          ...styles.avatar,
          ...(message.type === 'user' ? styles.avatarUser : styles.avatarSystem),
        }}
      >
        {message.type === 'user' ? (
          <Person20Regular style={{ fontSize: '14px' }} />
        ) : (
          <Bot20Regular style={{ fontSize: '14px' }} />
        )}
      </div>
      <div
        style={{
          ...styles.messageBubble,
          ...(message.type === 'user' ? styles.messageBubbleUser : {}),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ ...styles.messageText, flex: 1, margin: 0 }}>{message.text}</p>
          {message.type === 'user' && (
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px 6px',
                borderRadius: '4px',
                marginLeft: '8px',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => onCopy(message.text)}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
              title='Copy message'
            >
              <Copy20Regular style={{ fontSize: '14px' }} />
            </button>
          )}
        </div>
        <div style={styles.messageTime}>{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
};
