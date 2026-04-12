import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: October 13, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Chapturs! By accessing or using our service, you agree to these Terms of Service. 
              If you don't agree, please don't use Chapturs. We've tried to keep this readable and fair.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>The Short Version:</strong> Be respectful, don't break the law, own your content, and we'll provide 
              a great platform for reading and creating stories. If we need to change things, we'll let you know.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Who Can Use Chapturs</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>You must be at least 13 years old</li>
              <li>You must provide accurate information</li>
              <li>You must comply with all local laws</li>
              <li>You can't use Chapturs if we've previously banned you</li>
              <li>One person, one account (no ban evasion)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your Account</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You're responsible for keeping your account secure. If someone gains unauthorized access, 
              let us know immediately. We use OAuth (Google, GitHub, Discord) so you don't need to manage passwords, 
              but you should secure those accounts.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Termination</h3>
            <p className="text-gray-700 mb-4">
              You can delete your account anytime in Account Settings. We can suspend or terminate accounts that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Violate these Terms</li>
              <li>Engage in illegal activity</li>
              <li>Abuse other users or the platform</li>
              <li>Create spam or fake engagement</li>
              <li>Attempt to hack or exploit the service</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We'll try to warn you first unless the violation is severe. You can appeal bans by contacting support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Your Content, Your Rights</h3>
            <p className="text-gray-700 mb-4">
              <strong>You own everything you create on Chapturs.</strong> Period. Your stories, comments, translations, 
              and other content remain yours. We'll never claim ownership or exclusive rights.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 License You Grant Us</h3>
            <p className="text-gray-700 mb-4">
              By posting content, you grant Chapturs a non-exclusive, worldwide, royalty-free license to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Host, display, and distribute your content</li>
              <li>Make backups and technical copies</li>
              <li>Show your content to users (according to your privacy settings)</li>
              <li>Allow users to read, comment, and interact with your stories</li>
              <li>Create thumbnails, excerpts, and previews for discovery</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> This license ends when you delete your content. We may keep backups for a reasonable 
              period (30 days) but won't display deleted content publicly.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 No AI Training</h3>
            <p className="text-gray-700 mb-4">
              <strong>We will not use your content to train AI models</strong> or sell it to AI companies. When we use AI 
              for quality assessment, it's ephemeral processing only—your content isn't stored or used for training.
            </p>
            <p className="text-gray-700 mb-4">
              You own your words. They're not training data for someone else's product.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 AI-Generated Content Disclosure</h3>
            <p className="text-gray-700 mb-4">
              Chapturs supports the use of AI tools in the creative process. To maintain transparency and trust within our community, authors must disclose when a work has been created or significantly assisted by AI tools.
            </p>
            <p className="text-gray-700 mb-4">
              Chapturs provides an <strong>AI Use Disclosure</strong> field on every work with three options:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>None:</strong> No AI tools were used in creating this content.</li>
              <li><strong>Assisted:</strong> AI tools were used for brainstorming, editing, grammar, translations, or minor enhancements, but the core creative work is human-authored.</li>
              <li><strong>Generated:</strong> AI tools were used to generate the primary text or narrative content.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              AI-generated content is welcome on Chapturs as long as it is properly labeled. Works marked as "Assisted" or "Generated" will display a disclosure badge visible to readers. We reserve the right to remove or reclassify content that is discovered to be AI-generated without proper disclosure. Repeated violations may result in account suspension.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.5 Content You're Responsible For</h3>
            <p className="text-gray-700 mb-4">
              You promise that your content:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Is yours or you have permission to post it</li>
              <li>Doesn't violate anyone's copyright, trademark, or other rights</li>
              <li>Doesn't contain illegal material</li>
              <li>Follows our Community Guidelines (see below)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.6 Copyright Infringement</h3>
            <p className="text-gray-700 mb-4">
              We respect copyright. If you believe content on Chapturs infringes your copyright, send a DMCA notice to{' '}
              <a href="mailto:dmca@chapturs.com" className="text-blue-600 hover:underline">dmca@chapturs.com</a> with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Description of the copyrighted work</li>
              <li>URL of the infringing content</li>
              <li>Your contact information</li>
              <li>Statement of good faith belief</li>
              <li>Statement under penalty of perjury that you own the copyright</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We'll remove infringing content promptly. Repeat infringers will be banned.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Community Guidelines</h2>
            <p className="text-gray-700 mb-4">
              Chapturs is a creative community. We expect everyone to:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">✅ Do:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Be respectful and constructive</li>
              <li>Give credit where it's due</li>
              <li>Help other creators improve</li>
              <li>Report bugs and abuse</li>
              <li>Create original content (or have permission for adaptations)</li>
              <li>Tag mature content appropriately</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">❌ Don't:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Harassment:</strong> Bully, threaten, or abuse others</li>
              <li><strong>Hate Speech:</strong> Content promoting hate based on race, religion, gender, sexuality, etc.</li>
              <li><strong>Illegal Content:</strong> Child exploitation, terrorism, illegal drugs, etc.</li>
              <li><strong>Spam:</strong> Fake engagement, vote manipulation, repetitive content</li>
              <li><strong>Impersonation:</strong> Pretending to be someone else</li>
              <li><strong>Scams:</strong> Fraudulent schemes or misleading content</li>
              <li><strong>Copyright Theft:</strong> Posting others' work without permission</li>
              <li><strong>Exploits:</strong> Hacking, DDoS, or other technical abuse</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Mature Content Policy</h3>
            <p className="text-gray-700 mb-4">
              Mature content (violence, sexual content, strong language) is allowed if:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Properly tagged and age-gated</li>
              <li>Not the cover/thumbnail (NSFW imagery)</li>
              <li>Follows all laws (no illegal content, period)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Creator Monetization</h2>
            <p className="text-gray-700 mb-4">
              (When we launch paid features) Creators can earn money through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Tips:</strong> One-time donations from readers</li>
              <li><strong>Individual Supporter Subscriptions:</strong> Monthly support from specific fans (unlocks supporter badge + optional bonus content)</li>
              <li><strong>Platform Premium Pool:</strong> Share of Chapturs Premium revenue based on how much subscribers read your content (like YouTube Premium)</li>
              <li><strong>Ad Revenue Sharing:</strong> Earn from ads displayed on your content (customizable splits and density)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>All main content remains free to read.</strong> We don't support paywalled chapters. Creators can 
              optionally publish supporter-exclusive bonus content for direct subscribers, but stories are always accessible to everyone.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Advanced Ad Features:</strong> Creators can customize ad density and revenue splits to optimize for 
              either discovery (featured placement with lower splits) or maximum earnings (higher ad frequency with better splits).
            </p>
            <p className="text-gray-700 mb-4">
              See the <Link href="/legal/creator-agreement" className="text-blue-600 hover:underline">Creator Agreement</Link> for detailed terms on monetization, payouts, and revenue sharing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive for 99.9% uptime but can't guarantee uninterrupted service. We may:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Perform maintenance (we'll notify you)</li>
              <li>Experience outages (we'll fix them ASAP)</li>
              <li>Change or discontinue features (with notice)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We're committed to keeping Chapturs running, but we're not liable for downtime or data loss. 
              Keep backups of important content!
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 "As Is" Service</h3>
            <p className="text-gray-700 mb-4">
              Chapturs is provided "as is" without warranties. We don't guarantee it's perfect, secure, or error-free. 
              We'll do our best, but bugs happen.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 User Content</h3>
            <p className="text-gray-700 mb-4">
              We don't endorse or verify user content. Creators are responsible for what they post. We moderate, 
              but we can't review everything before it's published.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.3 Liability Limit</h3>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, Chapturs and its team aren't liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Lost profits, data, or content</li>
              <li>Third-party actions or content</li>
              <li>Service interruptions or errors</li>
            </ul>
            <p className="text-gray-700 mb-4">
              If we are liable, it's limited to the amount you paid us in the last 12 months (or $100, whichever is greater).
            </p>
            <p className="text-gray-700 mb-4 text-sm italic">
              (Legal requires this language, but we genuinely care about making things right if something goes wrong!)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to defend and hold harmless Chapturs from claims arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your content</li>
              <li>Your use of the service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of others' rights</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Translation:</strong> If you post something illegal or infringing and we get sued, you're responsible, not us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Contact Us First</h3>
            <p className="text-gray-700 mb-4">
              If you have an issue, please email{' '}
              <a href="mailto:support@chapturs.com" className="text-blue-600 hover:underline">support@chapturs.com</a>.
              We'll work to resolve it fairly and quickly.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">10.2 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the Commonwealth of Virginia and the United States. 
              Any disputes will be resolved in courts of competent jurisdiction.
            </p>            <h3 className="text-xl font-semibold text-gray-800 mb-3">10.3 No Class Actions</h3>
            <p className="text-gray-700 mb-4">
              Disputes must be brought individually, not as part of a class action. (Required by lawyers, but we'll 
              be reasonable if issues affect many users.)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms. For significant changes, we'll:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Email you 30 days in advance</li>
              <li>Show a prominent notice on the site</li>
              <li>Give you time to review changes</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Continued use after changes means you accept them. If you don't agree, you can delete your account 
              before the changes take effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Miscellaneous</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, plus our Privacy Policy and Creator Agreement, are the complete agreement between us.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.2 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any part of these Terms is invalid, the rest remains in effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.3 No Waiver</h3>
            <p className="text-gray-700 mb-4">
              If we don't enforce a term once, it doesn't mean we won't enforce it later.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.4 Assignment</h3>
            <p className="text-gray-700 mb-4">
              You can't transfer your account or these Terms. We can assign them if Chapturs is acquired 
              (but your rights remain the same).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact</h2>
            <p className="text-gray-700 mb-4">
              Questions about these Terms?
            </p>
            <ul className="list-none text-gray-700 mb-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:legal@chapturs.com" className="text-blue-600 hover:underline">legal@chapturs.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@chapturs.com" className="text-blue-600 hover:underline">support@chapturs.com</a></li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Commitment</h3>
            <p className="text-gray-700">
              We built Chapturs to empower creators, not exploit them. These Terms are designed to be fair and protect 
              everyone—creators, readers, and the platform. If something seems unfair or unclear, please let us know. 
              We're committed to building a grassroots community together.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-600">
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              {' · '}
              <Link href="/legal/creator-agreement" className="text-blue-600 hover:underline">Creator Agreement</Link>
              {' · '}
              <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
