import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content Policy | Chapturs',
  description: 'Content Policy for Chapturs - Guidelines for publishing content on our platform.',
}

export default function ContentPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Content Policy</h1>
      <p><em>Last updated: March 17, 2026</em></p>

      <h2>Our Commitment</h2>
      <p>
        Chapturs is a platform for creative expression through webnovels and serial fiction. We are committed to fostering a creative environment while maintaining safety and legal compliance.
      </p>

      <h2>Allowed Content</h2>
      <ul>
        <li>Original fiction, including webnovels, serial stories, and fan fiction (with proper attribution)</li>
        <li>Comments and discussions related to published works</li>
        <li>Creator profiles and promotional content for your own works</li>
      </ul>

      <h2>Prohibited Content</h2>
      <p>The following content is strictly prohibited and will be removed:</p>
      <ul>
        <li><strong>Child Sexual Abuse Material (CSAM):</strong> Any sexual content involving minors. Zero tolerance. Immediate account termination and reporting to authorities.</li>
        <li><strong>Non-consensual intimate content:</strong> Content shared without the subject&apos;s consent.</li>
        <li><strong>Real-world threats:</strong> Credible threats of violence against individuals or groups.</li>
        <li><strong>Hate speech:</strong> Content that promotes violence or discrimination based on race, ethnicity, religion, gender, sexual orientation, or disability.</li>
        <li><strong>Spam and scams:</strong> Deceptive content, phishing, or misleading commercial content.</li>
        <li><strong>Copyright infringement:</strong> Content that infringes on others&apos; intellectual property rights.</li>
        <li><strong>Malware:</strong> Content containing malicious code or links to harmful software.</li>
      </ul>

      <h2>Content Ratings</h2>
      <p>All works must be accurately rated by the creator:</p>
      <ul>
        <li><strong>All Ages:</strong> Suitable for all readers. No graphic violence, sexual content, or mature themes.</li>
        <li><strong>Mature:</strong> Contains violence, dark themes, strong language, or suggestive content. Not sexually explicit.</li>
        <li><strong>Explicit:</strong> Contains sexual content. Must be clearly marked. Readers must opt in to view.</li>
      </ul>

      <h2>Reporting</h2>
      <p>
        If you encounter content that violates this policy, please report it using the report button on the content page or email <strong>report@chapturs.com</strong>. We review all reports within 24-48 hours.
      </p>

      <h2>Enforcement</h2>
      <p>Violations may result in:</p>
      <ul>
        <li>Content removal</li>
        <li>Warning or temporary suspension</li>
        <li>Permanent account termination</li>
        <li>Reporting to law enforcement (for illegal content)</li>
      </ul>

      <h2>Appeals</h2>
      <p>
        If you believe your content was removed in error, you may appeal via our <a href="/contact">contact page</a> (Support) with the subject line &quot;Content Appeal.&quot;
      </p>
    </div>
  )
}
