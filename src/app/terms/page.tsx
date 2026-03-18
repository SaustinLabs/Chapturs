import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Chapturs',
  description: 'Terms of Service for Chapturs - Rules and guidelines for using our webnovel platform.',
}

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p><em>Last updated: March 17, 2026</em></p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Chapturs (&quot;Service&quot;), operated by Chapturs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Chapturs is an online platform that allows creators to publish webnovels and readers to discover, read, and support creative content. The Service includes features for content creation, reading, monetization, and community interaction.
      </p>

      <h2>3. User Accounts</h2>
      <ul>
        <li>You must provide accurate and complete information when creating an account.</li>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>You must be at least 13 years old to use the Service.</li>
        <li>One person or entity may maintain only one account.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
      </ul>

      <h2>4. User Content</h2>
      <h3>Your Rights</h3>
      <p>
        You retain ownership of any content you create and publish on Chapturs. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to host, display, and distribute your content on the Service.
      </p>
      <h3>Content Guidelines</h3>
      <p>You agree not to post content that:</p>
      <ul>
        <li>Violates any applicable law or regulation</li>
        <li>Infringes on the intellectual property rights of others</li>
        <li>Contains hate speech, harassment, or threats</li>
        <li>Contains explicit sexual content involving minors</li>
        <li>Is spam, misleading, or fraudulent</li>
        <li>Contains malware or harmful code</li>
      </ul>
      <h3>Content Moderation</h3>
      <p>
        We reserve the right to review, moderate, or remove any content that violates these Terms or our Content Policy. We use both automated systems and human review for content moderation.
      </p>

      <h2>5. Monetization</h2>
      <ul>
        <li>Creators may earn revenue through ad sharing and premium content features.</li>
        <li>Revenue share is 70% to the creator, 30% to the platform, unless otherwise agreed.</li>
        <li>Payouts are processed monthly for balances above the minimum threshold.</li>
        <li>We reserve the right to withhold payments for accounts suspected of fraud or abuse.</li>
      </ul>

      <h2>6. Prohibited Activities</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal purpose</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Use bots, scrapers, or automated tools without our permission</li>
        <li>Manipulate engagement metrics (views, likes, comments)</li>
        <li>Impersonate another person or entity</li>
        <li>Interfere with or disrupt the Service</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        The Chapturs name, logo, and all related trademarks are owned by us. You may not use our trademarks without our prior written consent. The Service and its original content (excluding user-generated content) are protected by copyright and other intellectual property laws.
      </p>

      <h2>8. Advertising</h2>
      <p>
        The Service may display advertisements from third-party ad networks, including Google AdSense. These ads may be personalized based on your interests. You may opt out of personalized advertising through your browser settings or ad preferences.
      </p>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Chapturs and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify users of material changes via email or a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about these Terms, contact us at:
      </p>
      <ul>
        <li>Email: legal@chapturs.com</li>
        <li>Website: <a href="https://chapturs.com/contact">chapturs.com/contact</a></li>
      </ul>
    </div>
  )
}
