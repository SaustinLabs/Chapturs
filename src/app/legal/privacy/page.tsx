import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: October 13, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Chapturs ("we," "our," or "us"). We're committed to protecting your privacy and being transparent 
              about how we collect, use, and share your information. This Privacy Policy explains our practices in plain 
              language because we believe you deserve to understand what happens with your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Account Information:</strong> When you sign up with Google, GitHub, or Discord, we receive your email address, name, and profile picture from that service.</li>
              <li><strong>Profile Data:</strong> Username, display name, bio, and avatar you choose to add.</li>
              <li><strong>Content:</strong> Stories, chapters, comments, translations, glossary entries, and other content you create.</li>
              <li><strong>Communications:</strong> Messages you send to us or other users through the platform.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> How you interact with stories (views, reading progress, likes, bookmarks).</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers.</li>
              <li><strong>Analytics:</strong> Page views, time spent reading, navigation patterns (we use internal analytics).</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Provide the Service:</strong> Enable you to read, create, and share stories.</li>
              <li><strong>Personalization:</strong> Recommend stories based on your reading history and preferences.</li>
              <li><strong>Creator Tools:</strong> Provide analytics so creators understand their audience.</li>
              <li><strong>Quality Control:</strong> Use AI to assess story quality and detect spam/abuse.</li>
              <li><strong>Community Features:</strong> Enable comments, translations, and collaboration.</li>
              <li><strong>Monetization:</strong> Process payments, subscriptions, and creator earnings.</li>
              <li><strong>Communication:</strong> Send notifications about your account, stories, and platform updates.</li>
              <li><strong>Security:</strong> Prevent fraud, abuse, and protect user accounts.</li>
              <li><strong>Improvement:</strong> Analyze usage to improve features and fix bugs.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Public Information</h3>
            <p className="text-gray-700 mb-4">
              The following is publicly visible to all users:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your username, display name, and avatar</li>
              <li>Stories, chapters, and content you publish</li>
              <li>Comments, translations, and glossary entries you create</li>
              <li>Your reading lists and liked stories (if you make them public)</li>
              <li>Creator statistics (views, subscribers) if you choose to display them</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We share data with trusted third parties who help us run Chapturs:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>RackNerd (VPS):</strong> Hosting and deployment</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Cloudflare:</strong> Image storage (R2), CDN, and DNS</li>
              <li><strong>Upstash:</strong> Caching and analytics processing</li>
              <li><strong>OpenRouter:</strong> AI quality assessment (content only, not personal data)</li>
              <li><strong>Stripe:</strong> Payment processing (if/when we add paid features)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              All service providers are contractually obligated to protect your data and use it only for providing services to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 We DO NOT Sell Your Data</h3>
            <p className="text-gray-700 mb-4">
              <strong>We will never sell, rent, or trade your personal information to third parties for marketing purposes.</strong> 
              This is a firm commitment. We're building a creator-first platform, not a data harvesting operation.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law, to protect our rights, prevent fraud, or ensure user safety. 
              We'll fight overly broad requests and notify you when legally permitted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Access and Download</h3>
            <p className="text-gray-700 mb-4">
              You can access all your data through your account dashboard. We're working on a data export feature to download 
              everything in a standard format (coming soon).
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Edit and Update</h3>
            <p className="text-gray-700 mb-4">
              You can edit your profile, stories, and content anytime through your account settings and creator dashboard.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Delete Your Account</h3>
            <p className="text-gray-700 mb-4">
              You can delete your account in Account Settings. When you delete your account:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your personal information is permanently deleted within 30 days</li>
              <li>Published stories can be removed or anonymized (your choice)</li>
              <li>Comments become attributed to "Deleted User"</li>
              <li>Some data may be retained for legal/security purposes (e.g., ban evasion prevention)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 Marketing Communications</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of promotional emails anytime by clicking "unsubscribe" in any email. 
              We'll still send essential account-related notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We take security seriously and implement industry-standard measures:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Encrypted connections (HTTPS/TLS)</li>
              <li>Encrypted database storage</li>
              <li>OAuth 2.0 authentication (no passwords stored)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-gray-700 mb-4">
              However, no system is 100% secure. If you discover a security vulnerability, please report it to us immediately 
              at <a href="mailto:security@chapturs.com" className="text-blue-600 hover:underline">security@chapturs.com</a> 
              (we'll set up a responsible disclosure program).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Chapturs is not intended for children under 13. We don't knowingly collect information from children under 13. 
              If you're a parent and believe your child has provided us with information, please contact us and we'll delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Users</h2>
            <p className="text-gray-700 mb-4">
              Chapturs is operated in the United States. If you're accessing from elsewhere, your data may be transferred to 
              and processed in the US. By using Chapturs, you consent to this transfer.
            </p>
            <p className="text-gray-700 mb-4">
              For EU users: We comply with GDPR. You have additional rights including data portability, right to be forgotten, 
              and right to object to processing. Contact us to exercise these rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. AI and Content Analysis</h2>
            <p className="text-gray-700 mb-4">
              We use AI (Groq/Llama models) to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Assess story quality and provide feedback to creators</li>
              <li>Detect spam, abuse, and inappropriate content</li>
              <li>Generate reading recommendations</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> We only send story content to AI services, never personal information. AI providers 
              don't store or train on your content. All processing is ephemeral and privacy-focused.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy occasionally. We'll notify you of significant changes via email or a prominent 
              notice on the site. Continued use after changes constitutes acceptance.
            </p>
            <p className="text-gray-700 mb-4">
              Version history will be available so you can see exactly what changed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Questions about this Privacy Policy or your data? We're here to help:
            </p>
            <ul className="list-none text-gray-700 mb-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:privacy@chapturs.com" className="text-blue-600 hover:underline">privacy@chapturs.com</a></li>
              <li><strong>Data Protection Officer:</strong> (We'll designate one when we grow)</li>
            </ul>
            <p className="text-gray-700">
              We'll respond to all privacy requests within 30 days (usually much faster).
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <Link href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
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
