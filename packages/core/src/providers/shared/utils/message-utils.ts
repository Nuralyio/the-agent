import { HumanMessage, SystemMessage, AIMessage as LangChainAIMessage, BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '../../../engine/ai-engine';

/**
 * Utility functions for working with LangChain messages
 */

/**
 * Build a messages array from prompt and optional system prompt
 */
export function buildMessages(prompt: string, systemPrompt?: string): (SystemMessage | HumanMessage)[] {
  const messages: (SystemMessage | HumanMessage)[] = [];
  
  if (systemPrompt) {
    messages.push(new SystemMessage(systemPrompt));
  }
  
  messages.push(new HumanMessage(prompt));
  
  return messages;
}

/**
 * Convert AIMessage array to LangChain BaseMessage array
 */
export function convertToLangChainMessages(messages: AIMessage[]): BaseMessage[] {
  return messages.map(msg => {
    if (msg.role === 'system') {
      return new SystemMessage(msg.content);
    } else if (msg.role === 'user') {
      return new HumanMessage(msg.content);
    } else {
      return new LangChainAIMessage(msg.content);
    }
  });
}
