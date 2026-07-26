import React from 'react';
import Link from 'next/link';
import BackHomeButton from '../../components/ui/BackHomeButton';

export const metadata = {
  title: 'Terms of Service | WorkforceOS',
  description: 'WorkforceOS Terms of Service — governing agreement between WorkforceOS and client organizations using the platform for HR and workforce management.',
};

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="space-y-4 scroll-mt-24">
    <h2 className="text-lg font-extrabold text-slate-900 border-l-4 border-primary pl-4">{title}</h2>
    <div className="text-slate-650 text-body-sm leading-relaxed space-y-3 pl-4">{children}</div>
  </section>
);

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded bg-primary text-white flex items-center justify-center font-bold text-sm">W</span>
          <span className="font-extrabold text-lg tracking-wider text-slate-900">WorkforceOS</span>
        </div>
        <BackHomeButton />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-sm space-y-10">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-headline-sm font-black text-slate-900 tracking-tight">Terms of Service</h1>
            <p className="text-body-xs text-outline mt-2">Last updated: <strong className="text-slate-700">July 8, 2026</strong> &nbsp;|&nbsp; Governing law: India &nbsp;|&nbsp; Jurisdiction: Courts of India</p>
            <p className="text-slate-600 text-body-sm mt-4 leading-relaxed">
              These Terms of Service ("Terms") constitute a legally binding agreement between <strong className="text-slate-900 font-bold">WorkforceOS</strong> ("Provider",
              "we", "us") and the organization ("Client", "Data Fiduciary") subscribing to and using the WorkforceOS platform.
              By accessing or using the platform, you agree to be bound by these Terms.
            </p>
            <div className="text-amber-900 bg-amber-50 border border-amber-200 p-4 rounded-xl text-body-xs mt-4 leading-relaxed">
              <strong className="flex items-center gap-1.5 mb-1 text-[11px] uppercase font-bold text-amber-950">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Notice to Employees
              </strong>
              If you are accessing WorkforceOS as an employee of a subscribing organization, your primary relationship is with your employer.
              These Terms govern the relationship between WorkforceOS and your employer organization.
            </div>
          </div>

          <Section id="definitions" title="1. Definitions">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">"Platform"</strong> — The WorkforceOS web application, mobile application, and API services.</li>
              <li><strong className="text-slate-900 font-bold">"Client"</strong> — The subscribing organization (company, firm, or entity) that has registered for the Platform.</li>
              <li><strong className="text-slate-900 font-bold">"User"</strong> — Any individual (employee, HR, admin) granted access by the Client.</li>
              <li><strong className="text-slate-900 font-bold">"Data Fiduciary"</strong> — The Client, as defined under the DPDP Act 2023, who determines the purpose and means of processing employee personal data.</li>
              <li><strong className="text-slate-900 font-bold">"Data Processor"</strong> — WorkforceOS, processing data on behalf of the Data Fiduciary.</li>
              <li><strong className="text-slate-900 font-bold">"Personal Data"</strong> — As defined under the Digital Personal Data Protection (DPDP) Act 2023.</li>
            </ul>
          </Section>

          <Section id="eligibility" title="2. Eligibility & Account Registration">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The Client must be a legally registered entity in India or any jurisdiction where the platform is used.</li>
              <li>The person registering on behalf of a Client organization must be authorized to enter into contracts on behalf of that entity.</li>
              <li>Users must be at least 18 years of age.</li>
              <li>Clients are responsible for maintaining the confidentiality of all account credentials and for all activities under their account.</li>
            </ul>
          </Section>

          <Section id="services" title="3. Scope of Services">
            <p>WorkforceOS provides the following functionality subject to the features enabled under the Client's subscription plan:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Employee onboarding, profile management, and HRIS data storage</li>
              <li>Attendance tracking with optional GPS verification</li>
              <li>Leave management and approval workflows</li>
              <li>Task and project management</li>
              <li>Payroll salary band management</li>
              <li>Expense claims and reimbursement workflows</li>
              <li>Asset checkout management</li>
              <li>Knowledge base and organizational communication</li>
            </ul>
            <p className="mt-2">Features may change, be added, or discontinued. We will provide reasonable notice for material changes.</p>
          </Section>

          <Section id="data-responsibilities" title="4. Data Responsibilities">
            <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-2">Client Obligations (as Data Fiduciary)</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mb-4">
              <li>Clients are responsible for obtaining all required consents from their employees before enrolling them on WorkforceOS.</li>
              <li>Clients must provide employees with a Data Processing Notice explaining what data is being collected and why.</li>
              <li>Clients must ensure they have a lawful basis for each category of personal data they configure the platform to collect.</li>
              <li>Clients must not enter data into the platform that they are not legally authorized to process.</li>
              <li>Clients are responsible for responding to employee data access and erasure requests within the timeframes mandated by the DPDP Act 2023.</li>
            </ul>
            
            <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-2">WorkforceOS Obligations (as Data Processor)</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Process personal data only on documented instructions from the Client.</li>
              <li>Implement appropriate technical and organizational security measures.</li>
              <li>Not sub-process data to third parties without Client notification.</li>
              <li>Assist Clients in fulfilling employee data rights requests.</li>
              <li>Notify Clients of a data breach within 72 hours of becoming aware of it.</li>
            </ul>
          </Section>

          <Section id="acceptable-use" title="5. Acceptable Use Policy">
            <p>Clients and Users must not:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Enter false, misleading, or fraudulent data into the platform.</li>
              <li>Attempt to reverse-engineer, decompile, or bypass any security mechanism of the platform.</li>
              <li>Use the platform to surveil employees in a manner that exceeds the scope disclosed to those employees.</li>
              <li>Store data on the platform that is unrelated to legitimate HR functions.</li>
              <li>Share API credentials or access tokens with unauthorized parties.</li>
              <li>Attempt to access data belonging to another organization's tenant.</li>
            </ul>
          </Section>

          <Section id="payment" title="6. Subscription & Payment">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Subscription fees are due as per the agreed payment schedule between WorkforceOS and the Client.</li>
              <li>Failure to pay subscription fees may result in suspension of access after a 14-day notice period.</li>
              <li>All fees are exclusive of applicable taxes (GST).</li>
              <li>Refunds are at the discretion of WorkforceOS and will be considered on a case-by-case basis.</li>
            </ul>
          </Section>

          <Section id="ip" title="7. Intellectual Property">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The WorkforceOS platform, including all software, design, and documentation, is the intellectual property of WorkforceOS.</li>
              <li>Clients retain ownership of all data they input into the platform.</li>
              <li>WorkforceOS is granted a limited, non-exclusive licence to process Client data solely to provide the contracted services.</li>
              <li>Clients may not copy, resell, white-label, or sublicence the platform without written permission.</li>
            </ul>
          </Section>

          <Section id="liability" title="8. Limitation of Liability">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>WorkforceOS is provided "as is". We do not warrant uninterrupted, error-free service.</li>
              <li>WorkforceOS's total liability to any Client for any claim arising under these Terms shall not exceed the subscription fees paid by the Client in the 3 months preceding the claim.</li>
              <li>We are not liable for: indirect, incidental, or consequential damages; loss of profits; data loss resulting from Client misconfiguration; or compliance failures arising from the Client's failure to obtain required employee consents.</li>
              <li>WorkforceOS is not responsible for the accuracy of data entered by Clients or their employees.</li>
            </ul>
          </Section>

          <Section id="termination" title="9. Termination">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Either party may terminate with 30 days' written notice.</li>
              <li>WorkforceOS may immediately suspend or terminate access for breach of these Terms, non-payment, or illegal use.</li>
              <li>Upon termination, Clients have 30 days to export their data. After this period, data will be deleted from our servers in accordance with our data retention policy.</li>
            </ul>
          </Section>

          <Section id="governing-law" title="10. Governing Law & Disputes">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>These Terms are governed by the laws of India.</li>
              <li>Disputes shall first be attempted to be resolved through good-faith negotiation.</li>
              <li>If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts of India.</li>
              <li>The Indian Arbitration and Conciliation Act 1996 shall apply to disputes submitted to arbitration.</li>
            </ul>
          </Section>

          <Section id="changes" title="11. Amendments">
            <p>
              We reserve the right to modify these Terms. Material changes will be communicated to Client administrators via email
              at least 30 days prior to taking effect. Continued use of the platform after the effective date constitutes
              acceptance of the revised Terms.
            </p>
          </Section>

          <Section id="contact" title="12. Contact">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">Email:</strong> paramkhodiyar1008@gmail.com</li>
              <li><strong className="text-slate-900 font-bold">Grievance Officer (Privacy):</strong> paramkhodiyar1008@gmail.com</li>
            </ul>
          </Section>

          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-outline text-body-xs">© 2026 WorkforceOS. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-3 text-body-xs">
              <Link href="/privacy-policy" className="text-primary hover:text-blue-750 underline font-semibold">Privacy Policy</Link>
              <Link href="/cookie-policy" className="text-primary hover:text-blue-750 underline font-semibold">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
