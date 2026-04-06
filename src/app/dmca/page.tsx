import type { Metadata } from 'next'
import AppLayout from '@/components/AppLayout'

export const metadata: Metadata = {
  title: 'DMCA Policy | Chapturs',
  description: 'Chapturs DMCA copyright infringement policy and takedown procedure.',
}

export default function DmcaPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1>DMCA Copyright Policy</h1>
        <p className="lead">
          Chapturs respects the intellectual property rights of others and expects our users to
          do the same. We respond to notices of alleged copyright infringement in accordance with
          the Digital Millennium Copyright Act (DMCA).
        </p>

        <h2>Reporting Alleged Infringement</h2>
        <p>
          If you believe that content on Chapturs infringes a copyright you own or control, please
          send a written notice to our designated DMCA agent at{' '}
          <a href="mailto:dmca@chapturs.com">dmca@chapturs.com</a> containing all of the following:
        </p>
        <ol>
          <li>
            A physical or electronic signature of the copyright owner or a person authorised to
            act on their behalf.
          </li>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>
            Identification of the material that is claimed to be infringing, with sufficient
            detail to allow us to locate it (e.g. the URL of the story or chapter).
          </li>
          <li>
            Your contact information: name, mailing address, telephone number, and email address.
          </li>
          <li>
            A statement that you have a good-faith belief that the disputed use is not authorised
            by the copyright owner, its agent, or the law.
          </li>
          <li>
            A statement that the information in the notification is accurate and, under penalty of
            perjury, that you are authorised to act on behalf of the copyright owner.
          </li>
        </ol>
        <p>
          We will review your request and respond promptly. Content that is found to be infringing
          will be removed or disabled.
        </p>

        <h2>Counter-Notice Procedure</h2>
        <p>
          If you believe that content you posted was removed in error, you may file a
          counter-notice by emailing <a href="mailto:dmca@chapturs.com">dmca@chapturs.com</a> with:
        </p>
        <ol>
          <li>Your physical or electronic signature.</li>
          <li>
            Identification of the content that was removed and its location before removal.
          </li>
          <li>
            A statement under penalty of perjury that you have a good-faith belief the content
            was removed as a result of mistake or misidentification.
          </li>
          <li>
            Your name, address, and phone number, along with a statement that you consent to the
            jurisdiction of the federal court in your district (or, if outside the United States,
            any judicial district in which Chapturs may be found).
          </li>
        </ol>

        <h2>Repeat Infringers</h2>
        <p>
          Chapturs has a policy of terminating accounts of users who are found to be repeat
          infringers of intellectual property rights.
        </p>

        <h2>Contact</h2>
        <p>
          All DMCA notices and counter-notices must be sent to:{' '}
          <a href="mailto:dmca@chapturs.com">dmca@chapturs.com</a>
        </p>
        <p>
          For general copyright questions or other legal enquiries please contact us at{' '}
          <a href="mailto:hello@chapturs.com">hello@chapturs.com</a>.
        </p>

        <p className="text-sm text-gray-500 mt-10">
          Last updated: {new Date().getFullYear()}
        </p>
      </div>
    </AppLayout>
  )
}
