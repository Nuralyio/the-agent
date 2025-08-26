import React from 'react';
import { styles } from '../../Dashboard.styles';
import type { TabItem } from '../../Dashboard.types';

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'left' | 'right';
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange, variant = 'left' }) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

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
                  ...(hoveredTab === tab.id && activeTab !== tab.id ? styles.rightTabHover : {}),
                }}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
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
            ...(hoveredTab === tab.id && activeTab !== tab.id ? styles.tabButtonHover : {}),
          }}
          onClick={() => onTabChange(tab.id)}
          onMouseEnter={() => setHoveredTab(tab.id)}
          onMouseLeave={() => setHoveredTab(null)}
        >
          {tab.icon && <tab.icon style={{ fontSize: '16px' }} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
