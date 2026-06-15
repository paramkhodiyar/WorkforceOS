import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact & Request Demo | WorkforceOS',
  description: 'Get in touch with the WorkforceOS team. Request a personalized 30-minute demo to see how our modular enterprise HRMS automates shift attendance, leaves, tasks, and payroll compliance.',
};

export default function ContactPage() {
  return <ContactPageClient />;
}
