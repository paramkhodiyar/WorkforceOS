import type { Metadata } from 'next';
import HomepageClient from './HomepageClient';

export const metadata: Metadata = {
  title: 'WorkforceOS | Next-Gen Enterprise HRMS & Operations Platform',
  description: 'WorkforceOS is the ultimate Human Resource Management System (HRMS) for modern teams. Streamline shift attendance, double-approval leaves, task state machines, composite performance reviews, and automated payroll with PF, ESIC, and PT calculations.',
  keywords: 'HRMS, HR Software, Human Resource Management System, Workforce OS, Attendance Tracker, Indian Payroll compliance',
};

export default function Homepage() {
  return <HomepageClient />;
}
