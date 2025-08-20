import type { MetaFunction } from '@remix-run/node';
import { Dashboard } from '~/components/Dashboard';

export const meta: MetaFunction = () => [
  { title: 'The Agent Dashboard' },
  { name: 'description', content: 'Real-time AI agent monitor and control' },
];

export default function Index() {
  return <Dashboard />;
}
