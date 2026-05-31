import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";

const TermsOfService = () => {
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
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-10">Last Updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using D.O.M.E. AI ("D.O.M.E.," "Platform," "we," "our," or "us"), users agree to these Terms & Conditions and all applicable laws and regulations.
            </p>
            <p>If you do not agree with these Terms, you must discontinue use of the platform.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Responsible Entity</h2>
            <p>D.O.M.E. AI and www.domeai.org are owned and operated by AREI GROUP.</p>
            <p>AREI GROUP is incorporated in the State of Delaware and registered as a foreign entity in the State of New York.</p>
            <p>
              References to "D.O.M.E.," "Platform," "we," "our," or "us" refer to AREI GROUP and its authorized operations associated with the D.O.M.E. platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Government Affiliation Disclaimer</h2>
            <p>
              D.O.M.E. is a private technology platform and is not affiliated with, endorsed by, authorized by, or sponsored by USCIS, DHS, IRS, or any government agency.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Platform Purpose</h2>
            <p>
              D.O.M.E. provides AI-guided workflow assistance, document organization, educational support, automation tools, case-management support, and related technology services.
            </p>
            <p>Platform services may support immigration, tax, nonprofit, business, educational, and community-support workflows.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. No Legal or Professional Representation</h2>
            <p>
              Use of the platform does not create an attorney-client relationship, accountant-client relationship, representative relationship, or fiduciary relationship unless separately established through authorized professionals or approved representatives.
            </p>
            <p>D.O.M.E. does not guarantee immigration approvals, tax outcomes, legal outcomes, or government decisions.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. User Responsibilities</h2>
            <p>Users are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Providing accurate information</li>
              <li>Reviewing generated documents</li>
              <li>Verifying all submissions</li>
              <li>Maintaining account security</li>
              <li>Ensuring lawful use of the platform</li>
            </ul>
            <p>Users must not submit false, fraudulent, misleading, or unauthorized information.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. USCIS Receipt Numbers and Case Information</h2>
            <p>
              Users may voluntarily provide USCIS receipt numbers and related case information to support workflow organization, case tracking, document preparation assistance, and platform functionality.
            </p>
            <p>USCIS receipt numbers are treated as personally identifiable information (PII).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. AI-Assisted Features</h2>
            <p>
              D.O.M.E. may use AI-assisted systems to help organize information, identify inconsistencies, support workflow guidance, and assist with document preparation.
            </p>
            <p>
              Users remain solely responsible for reviewing and validating all generated content before filing, exporting, signing, or submitting any information to government agencies or third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Document Uploads</h2>
            <p>
              By uploading documents or information, users confirm that they have the legal right and authorization to submit and process the information provided.
            </p>
            <p>
              Uploaded information may be analyzed by automated systems and AI-assisted tools for workflow guidance, issue detection, organization, and document preparation support.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">10. Account Access and Security</h2>
            <p>
              Users are responsible for maintaining the confidentiality of account credentials and for all activities occurring under their accounts.
            </p>
            <p>
              D.O.M.E. reserves the right to suspend or terminate accounts for suspected fraud, abuse, unauthorized access, or violations of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">11. Fees and Platform Contributions</h2>
            <p>
              Certain platform services, exports, advanced workflow tools, or filing-support features may require payment or platform-support contributions.
            </p>
            <p>All applicable fees will be disclosed before payment is processed.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">12. Intellectual Property</h2>
            <p>
              All platform content, software, workflows, branding, designs, and technology are owned by AREI GROUP or its licensors and are protected by applicable intellectual property laws.
            </p>
            <p>
              Users may not copy, reproduce, reverse engineer, distribute, or commercially exploit platform materials without written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">13. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, AREI GROUP and D.O.M.E. shall not be liable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Government decisions</li>
              <li>Filing outcomes</li>
              <li>Delays</li>
              <li>Data loss</li>
              <li>Service interruptions</li>
              <li>Third-party actions</li>
              <li>Indirect or consequential damages</li>
            </ul>
            <p>Use of the platform is at the user's own risk.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">14. Third-Party Services</h2>
            <p>
              D.O.M.E. may integrate with third-party systems, APIs, government services, or external providers.
            </p>
            <p>D.O.M.E. is not responsible for the availability, accuracy, or policies of third-party services.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">15. Modifications to the Platform</h2>
            <p>
              D.O.M.E. reserves the right to modify, suspend, discontinue, or update platform functionality at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">16. Changes to Terms</h2>
            <p>These Terms & Conditions may be updated periodically.</p>
            <p>
              Continued use of the platform after updates become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">17. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the State of Delaware without regard to conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">18. Contact Information</h2>
            <p>AREI GROUP</p>
            <p>D.O.M.E. AI</p>
            <p>www.domeai.org</p>
            <p>Official contact methods are available through the website.</p>
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
      </footer>
    </div>
  );
};

export default TermsOfService;