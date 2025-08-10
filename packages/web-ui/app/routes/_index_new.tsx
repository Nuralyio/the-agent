import type { MetaFunction } from '@remix-run/node';
import { Dashboard } from '~/components/Dashboard';

export const meta: MetaFunction = () => {
  return [
    { title: 'Browser Automation Dashboard' },
    { name: 'description', content: 'Real-time browser automation visualization and control' },
  ];
};

export default function Index() {
  return <Dashboard />;
}
