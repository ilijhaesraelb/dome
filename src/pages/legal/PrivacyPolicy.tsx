import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import LegalEntityNotice from "@/components/LegalEntityNotice";
import domeLogo from "@/assets/dome-logo.png";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last Updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              D.O.M.E. AI ("D.O.M.E.," "Platform," "we," "our," or "us") is owned and operated by AREI GROUP, a company incorporated in the State of Delaware and registered as a foreign entity in the State of New York.
            </p>
            <p>
              This Privacy Policy explains how D.O.M.E. collects, uses, stores, processes, and protects personal information submitted through www.domeai.org and related platform services.
            </p>
            <p>By using D.O.M.E., you acknowledge and agree to the practices described in this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Who We Are</h2>
            <p>DOME AI is owned and operated by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Accelerated Real Estate Investment Corp. (AREI GROUP)</li>
              <li>A Delaware Corporation and foreign registered corporation in New York State</li>
            </ul>
            <p>AREI GROUP is the data controller and responsible entity for all information collected through DOME AI.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Government Affiliation Disclaimer</h2>
            <p>
              D.O.M.E. and AREI GROUP are private entities and are not affiliated with, endorsed by, authorized by, or sponsored by the United States Citizenship and Immigration Services (USCIS), Department of Homeland Security (DHS), Internal Revenue Service (IRS), or any government agency.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Information We Collect</h2>
            <p>
              D.O.M.E. may collect information and documents submitted by users in connection with immigration, tax, nonprofit, educational, business, and community-support workflows.
            </p>
            <p>Information collected may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full legal name</li>
              <li>Date of birth</li>
              <li>Mailing and residential address information</li>
              <li>Contact information</li>
              <li>Government-issued identification</li>
              <li>USCIS receipt numbers</li>
              <li>Immigration case information</li>
              <li>Tax identification information</li>
              <li>Uploaded forms and supporting documents</li>
              <li>Organizational and financial information</li>
              <li>Signature and verification records</li>
              <li>Device and browser information</li>
              <li>Login and authentication information</li>
              <li>Usage and analytics data</li>
            </ul>
            <p>
              Users voluntarily provide USCIS receipt numbers and related information for workflow organization, case tracking, document preparation assistance, and platform functionality.
            </p>

            <h3 className="font-display text-lg font-semibold text-foreground mt-4">Immigration Information</h3>
            <p>Depending on the services used, DOME AI may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>USCIS Receipt Numbers</li>
              <li>Alien Registration Numbers (A-Numbers)</li>
              <li>USCIS Online Account Numbers</li>
              <li>Immigration Case Numbers</li>
              <li>Passport Information</li>
              <li>Visa Information</li>
              <li>Employment Authorization Information</li>
              <li>Immigration Application Information</li>
              <li>Supporting Documentation</li>
            </ul>
            <p>
              USCIS Receipt Numbers are treated as Personally Identifiable Information (PII) and are protected using industry-standard security controls.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. How Information Is Used</h2>
            <p>Information submitted through D.O.M.E. may be used to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide AI-guided workflow assistance</li>
              <li>Organize user-submitted information</li>
              <li>Prepare and generate document drafts</li>
              <li>Support immigration-related workflows</li>
              <li>Retrieve or display case-related information</li>
              <li>Improve workflow accuracy</li>
              <li>Generate exports and document previews</li>
              <li>Detect incomplete or inconsistent submissions</li>
              <li>Maintain security, fraud prevention, and audit systems</li>
              <li>Support communication between users and authorized service providers</li>
              <li>Improve accessibility and platform functionality</li>
            </ul>
            <p className="font-medium">D.O.M.E. does not sell personal information to third parties.</p>

            <h3 className="font-display text-lg font-semibold text-foreground mt-4">Use of USCIS Receipt Numbers</h3>
            <p>USCIS Receipt Numbers may be used to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identify and organize immigration cases</li>
              <li>Associate uploaded documents with the correct case file</li>
              <li>Assist users with case tracking and case management</li>
              <li>Generate reports and application packages</li>
              <li>Support authorized legal representatives or accredited representatives assisting the user</li>
              <li>Facilitate integrations with government systems where legally permitted</li>
              <li>Improve platform workflow and user experience</li>
            </ul>
            <p>DOME AI does not sell USCIS Receipt Numbers to third parties.</p>
            <p>Receipt Numbers are only used for legitimate case-management and service-delivery purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Third-Party and Government Service Integrations</h2>
            <p>
              D.O.M.E. may interact with third-party systems, APIs, government services, or external platforms authorized or selected by users in order to support workflow functionality, case tracking, notifications, document preparation assistance, or related services.
            </p>
            <p>
              Use of such integrations is subject to applicable laws, user authorization, and third-party terms and policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. AI-Assisted Processing</h2>
            <p>
              D.O.M.E. may use AI-assisted systems to organize information, identify inconsistencies, support workflow guidance, assist with document preparation, and improve platform functionality.
            </p>
            <p>
              Users remain responsible for reviewing and verifying all information before filing, exporting, signing, or submitting documents to any government agency or third party.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Data Sharing</h2>
            <p>User information may be shared only:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>With user authorization</li>
              <li>With authorized attorneys, representatives, accountants, or organizations selected by the user</li>
              <li>With service providers supporting platform infrastructure and operations</li>
              <li>When legally required by law, court order, subpoena, or government request</li>
            </ul>
            <p>D.O.M.E. does not share user information with immigration authorities unless legally required.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Security Measures</h2>
            <p>
              D.O.M.E. uses commercially reasonable administrative, technical, and organizational safeguards designed to protect submitted information from unauthorized access, misuse, disclosure, alteration, or destruction.
            </p>
            <p>Security measures may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encrypted data transmission</li>
              <li>Secure authentication systems</li>
              <li>Role-based access controls</li>
              <li>Audit logging</li>
              <li>Secure cloud infrastructure</li>
              <li>Document access controls</li>
              <li>Secure third-party payment processing systems</li>
            </ul>
            <p>No method of transmission or storage is guaranteed to be completely secure.</p>

            <h3 className="font-display text-lg font-semibold text-foreground mt-4">Protection of Immigration Information</h3>
            <p>DOME AI employs administrative, technical, and physical safeguards designed to protect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>USCIS Receipt Numbers</li>
              <li>A-Numbers</li>
              <li>Passport Information</li>
              <li>Immigration Records</li>
              <li>Uploaded Documents</li>
            </ul>
            <p>Access is restricted to authorized users, representatives, and personnel with a legitimate business need.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">10. Data Retention</h2>
            <p>
              D.O.M.E. retains personal information, uploaded documents, USCIS receipt numbers, and related case information only for as long as necessary to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide requested services</li>
              <li>Maintain platform functionality</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce agreements</li>
              <li>Maintain security and audit records</li>
            </ul>
            <p>
              Users may request deletion of their accounts and associated information subject to legal, fraud prevention, security, compliance, and recordkeeping obligations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">11. User Rights</h2>
            <p>Users may have the ability to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access their information</li>
              <li>Correct inaccurate information</li>
              <li>Export their data</li>
              <li>Request account deletion</li>
              <li>Control sharing permissions</li>
            </ul>
            <p>Requests may be subject to identity verification and applicable legal obligations.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">12. Children's Privacy</h2>
            <p>
              D.O.M.E. is not intended for use by children under the age of 13 without parental or legal guardian supervision.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">13. Changes to This Privacy Policy</h2>
            <p>
              D.O.M.E. may update this Privacy Policy periodically. Updated versions will be posted on this page with revised effective dates.
            </p>
            <p>
              Continued use of the platform after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">14. Contact Information</h2>
            <p>AREI GROUP</p>
            <p>D.O.M.E. AI</p>
            <p>www.domeai.org</p>
            <p>
              For privacy or compliance inquiries, users may contact the platform through the official contact methods provided on the website.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/security" className="hover:text-foreground">Security</Link>
          <Link to="/platform-position" className="hover:text-foreground">Platform Position</Link>
          <span>© {new Date().getFullYear()} D.O.M.E.</span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
          <LegalEntityNotice />
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;