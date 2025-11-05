import { useState } from 'react';

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const categories = [
    { id: 'general', label: 'General', icon: 'ri-question-line' },
    { id: 'customers', label: 'For Customers', icon: 'ri-user-heart-line' },
    { id: 'designers', label: 'For Designers', icon: 'ri-palette-line' },
    { id: 'payments', label: 'Payments & Billing', icon: 'ri-bank-card-line' }
  ];

  const faqs = {
    general: [
      {
        id: 'what-is-platform',
        question: 'What is our design platform?',
        answer: 'We are a revolutionary real-time design collaboration platform that connects customers with talented designers instantly. Our platform enables live collaboration, secure payments, and seamless project management.',
      },
      {
        id: 'how-it-works',
        question: 'How does the platform work?',
        answer: 'Simply browse our curated marketplace of designers, connect with those who match your needs, discuss your project requirements, and start collaborating in real-time. Our platform handles everything from initial contact to final delivery and payment.'
      },
      {
        id: 'is-it-safe',
        question: 'Is it safe to use the platform?',
        answer: 'Absolutely! We use secure escrow payments, verify all designers, and provide 24/7 customer support. Your payments are protected until you\'re completely satisfied with the work delivered.'
      },
      {
        id: 'support-available',
        question: 'What support is available?',
        answer: 'We offer 24/7 customer support through chat, email, and phone. Our dedicated team helps resolve any issues quickly and ensures smooth project completion for both customers and designers.'
      }
    ],
    customers: [
      {
        id: 'find-right-designer',
        question: 'How do I find the right designer for my project?',
        answer: 'Use our advanced filters to search by skills, experience, budget, ratings, and availability. Review portfolios, read client reviews, and chat with designers before making your decision. Our AI also suggests the best matches for your specific needs.'
      },
      {
        id: 'project-cost',
        question: 'How much will my project cost?',
        answer: 'Project costs vary based on complexity, designer experience, and timeline. Most designers offer custom quotes after discussing your requirements. You can also set your budget range to find designers within your price range.'
      },
      {
        id: 'project-timeline',
        question: 'How long does a typical project take?',
        answer: 'Timelines vary by project complexity. Simple designs may take 1-3 days, while complex projects can take 1-4 weeks. Designers will provide estimated timelines during the initial discussion phase.'
      },
      {
        id: 'revisions-included',
        question: 'Are revisions included in the project cost?',
        answer: 'Most designers include 2-3 revision rounds in their initial quote. Additional revisions may incur extra charges, which will be clearly communicated upfront. Always discuss revision policies before starting your project.'
      },
      {
        id: 'payment-protection',
        question: 'How is my payment protected?',
        answer: 'We use secure escrow payments. Your money is held safely until you approve the final work. If you\'re not satisfied, our dispute resolution team will help find a fair solution.'
      }
    ],
    designers: [
      {
        id: 'join-as-designer',
        question: 'How do I join as a designer?',
        answer: 'Click "Join as Designer", complete your profile with portfolio samples, verify your identity, and set your services and rates. Our team reviews applications within 24-48 hours. Once approved, you can start receiving project requests immediately.'
      },
      {
        id: 'commission-fees',
        question: 'What fees does the platform charge?',
        answer: 'We charge a 10% service fee on completed projects. This covers payment processing, platform maintenance, customer support, and marketing to bring you more clients. No hidden fees or monthly charges.'
      },
      {
        id: 'get-paid',
        question: 'How and when do I get paid?',
        answer: 'Payments are released automatically when customers approve your work. You can withdraw earnings weekly to your bank account or PayPal. Payments typically arrive within 2-3 business days after withdrawal request.'
      },
      {
        id: 'build-reputation',
        question: 'How can I build my reputation on the platform?',
        answer: 'Deliver high-quality work on time, maintain excellent communication with clients, gather positive reviews, and showcase your best projects in your portfolio. Active designers with great reviews get more visibility and higher-paying projects.'
      },
      {
        id: 'project-disputes',
        question: 'What happens if there\'s a project dispute?',
        answer: 'Our mediation team helps resolve disputes fairly. We review project requirements, communications, and deliverables to find a solution that works for both parties. Most disputes are resolved within 3-5 business days.'
      }
    ],
    payments: [
      {
        id: 'payment-methods',
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit cards, debit cards, PayPal, UPI, net banking, and digital wallets. All payments are processed securely through encrypted channels with industry-standard security measures.'
      },
      {
        id: 'escrow-system',
        question: 'How does the escrow system work?',
        answer: 'When you fund a project, your payment is held in escrow until the work is completed to your satisfaction. This protects both customers and designers, ensuring fair transactions for everyone.'
      },
      {
        id: 'refund-policy',
        question: 'What is the refund policy?',
        answer: 'If you\'re not satisfied with the delivered work and the designer cannot resolve the issues through revisions, you may be eligible for a partial or full refund. Each case is reviewed individually by our support team.'
      },
      {
        id: 'additional-costs',
        question: 'Are there any additional costs or hidden fees?',
        answer: 'No hidden fees! The project cost quoted by designers is what you pay, plus our transparent 3% payment processing fee. Any additional costs (like extra revisions or scope changes) will be clearly communicated and approved by you first.'
      },
      {
        id: 'invoices-receipts',
        question: 'Can I get invoices and receipts?',
        answer: 'Yes! All transactions automatically generate detailed invoices and receipts that you can download from your account dashboard. These are perfect for business expense tracking and tax purposes.'
      }
    ]
  };

  const toggleQuestion = (questionId: string) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="ri-question-answer-line mr-2"></i>
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find quick answers to the most common questions about our platform, services, and processes.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setOpenQuestion(null);
              }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <i className={`${category.icon} mr-2`}></i>
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs[activeCategory as keyof typeof faqs].map((faq) => (
              <div
                key={faq.id}
                className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() => toggleQuestion(faq.id)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className={`w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                    openQuestion === faq.id ? 'rotate-180' : ''
                  }`}>
                    <i className="ri-arrow-down-s-line text-purple-600"></i>
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  openQuestion === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-8 pb-6">
                    <div className="border-t border-gray-200 pt-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-customer-service-2-line text-2xl text-purple-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our friendly support team is here to help you 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = 'tel:+916201233267'}
                className="bg-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-phone-line mr-2"></i>
                Call Us Now
              </button>
              <button 
                onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=meetmydesigners@gmail.com', '_blank')}
                className="bg-white text-purple-600 border-2 border-purple-200 px-6 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-mail-line mr-2"></i>
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}