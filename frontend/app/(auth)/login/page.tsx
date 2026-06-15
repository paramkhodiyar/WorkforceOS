import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Sign In | WorkforceOS',
  description: 'Sign in to your WorkforceOS dashboard to manage employee attendance, leave adjustments, task state machines, and payroll compliance.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
