import React from 'react';
import Link from 'next/link';
import BackHomeButton from '../../components/ui/BackHomeButton';

export const metadata = {
  title: 'Privacy Policy | WorkforceOS',
  description: 'WorkforceOS Privacy Policy — how we collect, process, protect and retain employee and organizational data in compliance with the Digital Personal Data Protection Act 2023 and IT Rules 2011.',
};

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="space-y-4 scroll-mt-24">
    <h2 className="text-lg font-extrabold text-slate-900 border-l-4 border-primary pl-4">{title}</h2>
    <div className="text-slate-650 text-body-sm leading-relaxed space-y-3 pl-4">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded bg-primary text-white flex items-center justify-center font-extrabold text-sm">W</span>
          <span className="font-extrabold text-lg tracking-wider text-slate-900">WorkforceOS</span>
        </div>
        <BackHomeButton />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-sm space-y-10">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-headline-md font-black text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-body-xs text-outline mt-2">Last updated: <strong className="text-slate-700">July 8, 2026</strong> &nbsp;|&nbsp; Governing law: India</p>
            <p className="text-slate-600 text-body-sm mt-4 leading-relaxed">
              This Privacy Policy describes how <strong className="text-slate-900 font-bold">WorkforceOS</strong> ("we", "us", "our") collects, processes,
              stores, and protects personal data when you or your organization uses our platform. It applies to all users — organization
              administrators, HR managers, team leads, and employees — accessing WorkforceOS through web or mobile interfaces.
            </p>
            <p className="text-slate-600 text-body-sm mt-3 leading-relaxed">
              This policy is published in compliance with the <strong className="text-slate-900 font-bold">Digital Personal Data Protection (DPDP) Act 2023</strong>,
              the <strong className="text-slate-900 font-bold">Information Technology (IT) Act 2000</strong>, and the
              <strong className="text-slate-900 font-bold"> IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011</strong>.
            </p>
          </div>

          <Section id="data-collected" title="1. Personal Data We Collect">
            <p>We collect the following categories of personal data to operate HR workflows for client organizations:</p>
            <div className="overflow-x-auto mt-3 border border-slate-150 rounded-xl">
              <table className="w-full text-xs border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-bold border-r border-slate-200">Category</th>
                    <th className="p-3 font-bold border-r border-slate-200">Data Points</th>
                    <th className="p-3 font-bold">Classification</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-150">
                  {[
                    ['Identity', 'Full name, work email, employee ID, designation', 'Personal Data'],
                    ['Contact', 'Personal email, mobile number, home address', 'Personal Data'],
                    ['Financial', 'Bank account number, IFSC code, account holder name', 'Sensitive Personal Data'],
                    ['Tax Identity', 'PAN number', 'Sensitive Personal Data'],
                    ['Government ID', 'Last 4 digits of Aadhaar (voluntary, unverified)', 'Sensitive Personal Data'],
                    ['Health', 'Blood group (voluntary)', 'Sensitive Personal Data'],
                    ['Biometric', 'Fingerprint scan (via device hardware, not stored on our servers)', 'Sensitive Personal Data'],
                    ['Location', 'GPS coordinates at attendance check-in/check-out', 'Personal Data'],
                    ['Behavioral', 'Attendance timestamps, leave records, task activity', 'Personal Data'],
                    ['Emergency Contact', 'Name, relationship, phone number of designated contact', 'Personal Data'],
                  ].map(([cat, data, cls]) => (
                    <tr key={cat}>
                      <td className="p-3 font-bold text-slate-800 border-r border-slate-200">{cat}</td>
                      <td className="p-3 border-r border-slate-200">{data}</td>
                      <td className={`p-3 font-extrabold ${cls.includes('Sensitive') ? 'text-amber-700' : 'text-slate-655'}`}>{cls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="biometric" title="2. Biometric Data — Special Notice">
            <p>
              WorkforceOS offers an <strong className="text-slate-900 font-bold">optional biometric login feature</strong> on its mobile application.
              When enabled by the user:
            </p>
            <ul className="list-grid list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Fingerprint authentication is performed entirely by the <strong className="text-slate-900 font-bold">device's native operating system</strong> (Android BiometricPrompt).</li>
              <li><strong className="text-slate-950 font-extrabold">WorkforceOS does not receive, transmit, or store fingerprint data on any server.</strong></li>
              <li>The biometric scan only unlocks a previously stored authentication token on the device.</li>
              <li>Users may disable biometric login at any time from the login screen.</li>
            </ul>
            <div className="text-amber-900 bg-amber-50 border border-amber-200 p-4 rounded-xl text-body-xs mt-3 leading-relaxed">
              <strong className="flex items-center gap-1.5 mb-1 text-[11px] uppercase font-bold text-amber-950">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Biometric Consent Rules
              </strong>
              Biometric data is classified as <strong>Sensitive Personal Data</strong> under the DPDP Act 2023 and the IT Rules 2011.
              Enabling this feature constitutes your explicit consent for device-level biometric processing.
            </div>
          </Section>

          <Section id="location" title="3. Location Data — Special Notice">
            <p>
              When an employee performs an attendance check-in or check-out, the platform captures their
              <strong className="text-slate-900 font-bold"> GPS coordinates</strong> to verify physical presence at the work location.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Location is captured only at the moment of check-in or check-out — not continuously tracked.</li>
              <li>Location data is stored linked to the attendance record and accessible to HR and the employee's manager.</li>
              <li>You will be prompted by the mobile application to grant location permission before this feature activates.</li>
              <li>Denying location permission will not prevent login but may prevent geolocation-based attendance verification.</li>
            </ul>
          </Section>

          <Section id="legal-basis" title="4. Legal Basis for Processing">
            <p>We process personal data on the following legal bases under the DPDP Act 2023:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">Contractual necessity</strong> — Processing employment-related data to fulfil the HR management services contracted by your organization.</li>
              <li><strong className="text-slate-900 font-bold">Consent</strong> — For sensitive data (biometrics, location, health data). Consent is collected at point of collection and may be withdrawn.</li>
              <li><strong className="text-slate-900 font-bold">Legitimate interests</strong> — For audit trails, security logging, and fraud prevention.</li>
              <li><strong className="text-slate-900 font-bold">Legal obligation</strong> — For payroll tax compliance requiring PAN data retention.</li>
            </ul>
          </Section>

          <Section id="data-sharing" title="5. Who We Share Data With">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">Your employer (Client Organization)</strong> — As the Data Fiduciary, they control what data is collected about you.</li>
              <li><strong className="text-slate-900 font-bold">Cloud Infrastructure Providers</strong> — We use Vercel (web hosting) and Supabase/PostgreSQL (database). Both maintain SOC 2 compliance.</li>
              <li><strong className="text-slate-950 font-extrabold">We do not sell, rent, or trade personal data to any third party.</strong></li>
              <li>We may disclose data if required by a court of law, regulatory authority, or in response to a valid legal order under Indian law.</li>
            </ul>
          </Section>

          <Section id="security" title="6. Data Security">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Bank account numbers and PAN numbers are encrypted at rest using <strong className="text-slate-900 font-bold">AES-256-GCM encryption</strong>.</li>
              <li>All API communications are over <strong className="text-slate-900 font-bold">TLS 1.2+</strong>.</li>
              <li>Authentication uses <strong className="text-slate-900 font-bold">short-lived JWT tokens</strong>.</li>
              <li>Access to sensitive data is restricted by <strong className="text-slate-900 font-bold">role-based access controls (RBAC)</strong> — employees can only view their own data.</li>
              <li>We conduct periodic security reviews. In the event of a data breach, affected parties will be notified within 72 hours in accordance with DPDP Act 2023 requirements.</li>
            </ul>
          </Section>

          <Section id="retention" title="7. Data Retention">
            <div className="overflow-x-auto mt-3 border border-slate-150 rounded-xl">
              <table className="w-full text-xs border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-bold border-r border-slate-200">Data Type</th>
                    <th className="p-3 font-bold">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-150">
                  {[
                    ['Active employee records', 'Duration of employment + 2 years'],
                    ['Attendance & leave records', 'Duration of employment + 3 years (payroll audit requirements)'],
                    ['PAN / bank data', 'Duration of employment + 7 years (income tax requirement)'],
                    ['Audit logs', '2 years'],
                    ['Auth tokens (device-stored)', 'Until logout or token expiry'],
                  ].map(([type, period]) => (
                    <tr key={type}>
                      <td className="p-3 font-bold text-slate-800 border-r border-slate-200">{type}</td>
                      <td className="p-3">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="rights" title="8. Your Rights (DPDP Act 2023)">
            <p>As a Data Principal (employee), you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">Right to Access</strong> — Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-slate-900 font-bold">Right to Correction</strong> — Update inaccurate personal information via your Profile page.</li>
              <li><strong className="text-slate-900 font-bold">Right to Erasure</strong> — Request deletion of your personal data (subject to legal retention obligations). Contact your HR administrator or email us directly.</li>
              <li><strong className="text-slate-900 font-bold">Right to Grievance Redressal</strong> — Lodge a complaint with our designated Grievance Officer.</li>
              <li><strong className="text-slate-900 font-bold">Right to Nominate</strong> — Nominate another person to exercise your rights on your behalf in the event of death or incapacity.</li>
            </ul>
          </Section>

          <Section id="aadhaar" title="9. Aadhaar Data Notice">
            <p>
              The "Last 4 digits of Aadhaar" field in employee profiles is <strong className="text-slate-900 font-bold">entirely optional and voluntary</strong>.
              This data is <strong className="text-slate-900 font-bold">not verified against UIDAI systems</strong> and is not used for any authentication purpose.
              It is stored solely for internal HR reference. WorkforceOS is not a licensed Aadhaar Authentication User Agency (AUA) under the Aadhaar Act 2016.
            </p>
            <p>Employees are under no obligation to provide this information.</p>
          </Section>

          <Section id="grievance" title="10. Grievance Officer">
            <p>
              In accordance with the DPDP Act 2023 and IT Rules 2011, we have designated a Grievance Officer. To raise a
              privacy complaint or exercise your data rights:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900 font-bold">Name:</strong> Param Khodiyar</li>
              <li><strong className="text-slate-900 font-bold">Email:</strong> privacy@workforceos.com</li>
              <li><strong className="text-slate-900 font-bold">Response Time:</strong> Within 30 days of receipt</li>
            </ul>
          </Section>

          <Section id="changes" title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email to organization
              administrators at least 30 days before taking effect. Continued use of the platform after the effective date constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-outline text-body-xs">© 2026 WorkforceOS. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-3 text-body-xs">
              <Link href="/terms-conditions" className="text-primary hover:text-blue-750 underline font-semibold">Terms of Service</Link>
              <Link href="/cookie-policy" className="text-primary hover:text-blue-750 underline font-semibold">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
