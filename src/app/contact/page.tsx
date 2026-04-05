import { Metadata } from 'next'
import { prisma } from '@/lib/database/PrismaService'

export const metadata: Metadata = {
  title: 'Contact Us | Chapturs',
  description: 'Get in touch with the Chapturs team.',
}

async function getEmailSettings() {
  try {
    const rows = await prisma.siteSettings.findMany({ where: { group: 'email' } })
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value
    return map
  } catch {
    return {}
  }
}

function addr(map: Record<string, string>, key: string, fallback: string) {
  return map[key] || fallback
}

export default async function Contact() {
  const emails = await getEmailSettings()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Get in Touch</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Have questions, feedback, or need help? We&apos;d love to hear from you.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">General Inquiries</h3>
              <a href={`mailto:${addr(emails, 'email_hello', 'hello@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {addr(emails, 'email_hello', 'hello@chapturs.com')}
              </a>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Support</h3>
              <a href={`mailto:${addr(emails, 'email_support', 'support@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {addr(emails, 'email_support', 'support@chapturs.com')}
              </a>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Creator Partnerships</h3>
              <a href={`mailto:${addr(emails, 'email_creators', 'creators@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {addr(emails, 'email_creators', 'creators@chapturs.com')}
              </a>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Feedback</h3>
              <a href={`mailto:${addr(emails, 'email_feedback', 'feedback@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {addr(emails, 'email_feedback', 'feedback@chapturs.com')}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Report &amp; Legal</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Report Content</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Content that violates our policies</p>
                <a href={`mailto:${addr(emails, 'email_report', 'report@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {addr(emails, 'email_report', 'report@chapturs.com')}
                </a>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">DMCA / Copyright</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Copyright takedown requests</p>
                <a href={`mailto:${addr(emails, 'email_dmca', 'dmca@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {addr(emails, 'email_dmca', 'dmca@chapturs.com')}
                </a>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Legal &amp; Privacy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Legal inquiries and privacy requests</p>
                <a href={`mailto:${addr(emails, 'email_legal', 'legal@chapturs.com')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {addr(emails, 'email_legal', 'legal@chapturs.com')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
