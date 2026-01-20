import { PageHeader } from '@/components/ui'

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for Triple A Book Club.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main max-w-3xl">
        <PageHeader
          title="Terms of Service"
          description="Last updated: January 2026"
        />

        <div className="prose prose-invert max-w-none">
          <div className="space-y-8 text-white/70">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Triple A Book Club's website and services, you accept 
                and agree to be bound by these terms and conditions. If you do not agree to 
                these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Membership</h2>
              <p>
                Membership is free and open to anyone who loves reading. By creating an account, 
                you agree to provide accurate information and maintain the security of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Book Suggestions & Voting</h2>
              <p>Members can:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Suggest up to 3 books per month per category</li>
                <li>Vote for suggested books during voting periods</li>
                <li>Participate in discussions respectfully</li>
              </ul>
              <p className="mt-4">
                The club administrators reserve the right to remove inappropriate suggestions 
                or ban members who violate community guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Post offensive, harmful, or inappropriate content</li>
                <li>Harass or bully other members</li>
                <li>Attempt to manipulate voting or suggestion systems</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Intellectual Property</h2>
              <p>
                Book cover images and descriptions are the property of their respective 
                publishers and authors. Our website design and content are protected by 
                applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Disclaimer</h2>
              <p>
                The service is provided "as is" without warranties of any kind. We do not 
                guarantee the accuracy of book information or the availability of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the service 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Contact</h2>
              <p>
                For questions about these terms, please contact us at terms@tripleabookclub.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
