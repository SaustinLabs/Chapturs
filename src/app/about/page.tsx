import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Chapturs',
  description: 'Learn about Chapturs - the platform connecting creators and readers through webnovels.',
}

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>About Chapturs</h1>
      
      <h2>Our Mission</h2>
      <p>
        Chapturs connects creators and readers through the power of serialized storytelling. We believe every story deserves an audience, and every creator deserves to be fairly compensated for their work.
      </p>

      <h2>For Readers</h2>
      <p>
        Discover new stories across genres—from fantasy and romance to sci-fi and horror. Follow your favorite creators, get notified when new chapters drop, and support the authors you love.
      </p>

      <h2>For Creators</h2>
      <p>
        Publish your work, build your audience, and earn revenue through our creator monetization program. With transparent revenue sharing and powerful analytics, Chapturs gives you the tools to turn your passion into a sustainable creative career.
      </p>

      <h2>Our Values</h2>
      <ul>
        <li><strong>Creator-first:</strong> 70% of ad revenue goes directly to creators.</li>
        <li><strong>Quality content:</strong> We invest in content moderation and quality tools.</li>
        <li><strong>Community:</strong> Stories bring people together. We build for connection.</li>
        <li><strong>Transparency:</strong> Clear policies, fair terms, honest communication.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions? Visit our <a href="/contact">contact page</a> to reach the right team.
      </p>
    </div>
  )
}
