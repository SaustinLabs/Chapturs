import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Chapturs',
  description: 'Get in touch with the Chapturs team.',
}

export default function Contact() {
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
              <p className="text-blue-600 dark:text-blue-400">hello@chapturs.com</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Support</h3>
              <p className="text-blue-600 dark:text-blue-400">support@chapturs.com</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Legal / Privacy</h3>
              <p className="text-blue-600 dark:text-blue-400">legal@chapturs.com</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Creator Partnerships</h3>
              <p className="text-blue-600 dark:text-blue-400">creators@chapturs.com</p>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Report Content</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Found content that violates our policies? Let us know.
          </p>
          <p className="text-blue-600 dark:text-blue-400">report@chapturs.com</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">Office</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Chapturs<br />
            United States
          </p>
        </div>
      </div>
    </div>
  )
}
