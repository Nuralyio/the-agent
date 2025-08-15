import React from 'react';
import { styles } from '../../Dashboard.styles';

interface SettingsTabProps {
  selectedEngine: string;
  setSelectedEngine: (value: string) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (value: boolean) => void;
  selectedAIProvider?: string;
  setSelectedAIProvider?: (value: string) => void;
  headlessMode: boolean;
  setHeadlessMode: (value: boolean) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  selectedEngine,
  setSelectedEngine,
  advancedOpen,
  setAdvancedOpen,
  selectedAIProvider = 'ollama',
  setSelectedAIProvider = () => {},
  headlessMode,
  setHeadlessMode,
}) => {
  return (
    <div style={styles.settingsContainer}>
      {/* AI Provider Selection */}
      <div style={styles.settingsGroup}>
        <div style={styles.settingsCard}>
          <label style={styles.label}>AI Provider</label>
          <select style={styles.select} value={selectedAIProvider} onChange={e => setSelectedAIProvider(e.target.value)}>
            <option value='ollama'>Ollama (Local)</option>
            <option value='openai'>OpenAI (GPT)</option>
          </select>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            {selectedAIProvider === 'ollama' ? 
              'Local AI models via Ollama server' : 
              'Cloud-based OpenAI GPT models'
            }
          </div>
        </div>
      </div>

      {/* Engine Selection */}
      <div style={styles.settingsGroup}>
        <div style={styles.settingsCard}>
          <label style={styles.label}>Automation Engine</label>
          <select style={styles.select} value={selectedEngine} onChange={e => setSelectedEngine(e.target.value)}>
            <option value='playwright'>Playwright</option>
            <option value='selenium'>Selenium</option>
            <option value='puppeteer'>Puppeteer</option>
          </select>
        </div>
      </div>

      {/* Advanced Settings */}
      <div style={styles.settingsGroup}>
        <div style={styles.collapsibleHeader} onClick={() => setAdvancedOpen(!advancedOpen)}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Advanced Configuration</span>
          <span style={{ fontSize: '12px' }}>{advancedOpen ? '▼' : '▶'}</span>
        </div>
        {advancedOpen && (
          <div style={styles.collapsibleContent}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Timeout (seconds)</label>
              <input type='number' style={styles.input} defaultValue='10' min='5' max='300' />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Browser Mode</label>
              <select 
                style={styles.select} 
                value={headlessMode ? 'headless' : 'headed'} 
                onChange={e => setHeadlessMode(e.target.value === 'headless')}
              >
                <option value='headless'>Headless (Background)</option>
                <option value='headed'>Headed (Visible)</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Viewport Size</label>
              <select style={styles.select}>
                <option value='1920x1080'>Desktop Full HD (1920×1080)</option>
                <option value='1366x768'>Desktop Standard (1366×768)</option>
                <option value='1280x720'>Desktop HD (1280×720)</option>
                <option value='1024x768'>Desktop Standard (1024×768)</option>
                <option value='768x1024'>Tablet Portrait (768×1024)</option>
                <option value='1024x768'>Tablet Landscape (1024×768)</option>
                <option value='390x844'>Mobile iPhone 12 (390×844)</option>
                <option value='375x667'>Mobile iPhone SE (375×667)</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>User Agent</label>
              <select style={styles.select}>
                <option value='default'>Default Browser</option>
                <option value='chrome-desktop'>Chrome Desktop</option>
                <option value='firefox-desktop'>Firefox Desktop</option>
                <option value='safari-desktop'>Safari Desktop</option>
                <option value='chrome-mobile'>Chrome Mobile</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Current Configuration Card */}
      <div style={styles.statusCard}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ ...styles.statusIndicator, backgroundColor: '#10a37f' }}></span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>Current Configuration</span>
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
          <div>
            AI Provider:{' '}
            <strong style={{ color: selectedAIProvider === 'openai' ? '#00D084' : '#FF6B35' }}>
              {selectedAIProvider === 'ollama' ? 'Ollama (Local)' : 'OpenAI (GPT)'}
            </strong>
          </div>
          <div style={{ marginTop: '4px' }}>
            Engine:{' '}
            <strong style={{ color: '#007ACC' }}>
              {selectedEngine.charAt(0).toUpperCase() + selectedEngine.slice(1)}
            </strong>
          </div>
          <div style={{ marginTop: '4px' }}>
            Browser Mode:{' '}
            <strong style={{ color: headlessMode ? '#9333ea' : '#059669' }}>
              {headlessMode ? 'Headless' : 'Headed (Visible)'}
            </strong>
          </div>
          <div style={{ marginTop: '4px' }}>Ready to execute automation tasks</div>
        </div>
      </div>
    </div>
  );
};
