import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Chapturs',
  description: 'Privacy Policy for Chapturs - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: March 17, 2026</em></p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Chapturs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at <a href="https://chapturs.com">chapturs.com</a> (the &quot;Service&quot;).
      </p>
      <p>
        By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the Service.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>Information You Provide</h3>
      <ul>
        <li><strong>Account Information:</strong> When you register via Google OAuth, we collect your name, email address, and profile picture.</li>
        <li><strong>Content:</strong> Any content you create, upload, or share on the platform, including stories, comments, and profile information.</li>
        <li><strong>Communications:</strong> Messages you send to us or other users through the platform.</li>
      </ul>
      <h3>Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage Data:</strong> Pages viewed, time spent on pages, reading progress, and interaction patterns.</li>
        <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
        <li><strong>Cookies:</strong> We use cookies and similar technologies to maintain your session and preferences.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain our Service</li>
        <li>To personalize your experience and deliver content recommendations</li>
        <li>To communicate with you about updates, security alerts, and support</li>
        <li>To process transactions and manage creator payouts</li>
        <li>To detect, prevent, and address technical issues or fraudulent activity</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>4. Sharing Your Information</h2>
      <p>We do not sell your personal information. We may share your information in the following situations:</p>
      <ul>
        <li><strong>With your consent:</strong> When you explicitly agree to share information.</li>
        <li><strong>Service providers:</strong> Third-party services that help us operate the platform (hosting, analytics, payment processing).</li>
        <li><strong>Legal requirements:</strong> When required by law or to protect our rights.</li>
        <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h2>5. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li><strong>Google OAuth:</strong> For authentication. Subject to <a href="https://policies.google.com/privacy">Google&apos;s Privacy Policy</a>.</li>
        <li><strong>Vercel:</strong> For hosting. Subject to <a href="https://vercel.com/legal/privacy-policy">Vercel&apos;s Privacy Policy</a>.</li>
        <li><strong>Supabase:</strong> For database services. Subject to <a href="https://supabase.com/privacy">Supabase&apos;s Privacy Policy</a>.</li>
        <li><strong>Google AdSense:</strong> For advertising. Subject to <a href="https://policies.google.com/technologies/ads">Google&apos;s Advertising Policy</a>.</li>
      </ul>

      <h2>6. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your personal information</li>
        <li>Object to or restrict processing of your information</li>
        <li>Data portability</li>
      </ul>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:
      </p>
      <ul>
        <li>Email: privacy@chapturs.com</li>
        <li>Website: <a href="https://chapturs.com/contact">chapturs.com/contact</a></li>
      </ul>
    </div>
  )
}
