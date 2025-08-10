import React from 'react';
import type { TabItem } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'left' | 'right';
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = 'left' 
}) => {
  if (variant === 'right') {
    return (
      <div style={styles.rightTabContainer}>
        <ul style={styles.rightTabList}>
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                style={{
                  ...styles.rightTab,
                  ...(activeTab === tab.id ? styles.rightTabActive : {}),
                }}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon && React.createElement(tab.icon, { style: { marginRight: '6px', fontSize: '16px' } })}
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={styles.tabNavigation}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          style={{
            ...styles.tabButton,
            ...(activeTab === tab.id ? styles.tabButtonActive : {}),
          }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <tab.icon style={{ marginRight: '6px', fontSize: '16px' }} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
