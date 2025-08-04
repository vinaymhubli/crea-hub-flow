export default function ContactMethods() {
  const contactMethods = [
    {
      icon: 'ri-mail-line',
      title: 'Email Support',
      description: 'Send us a detailed message and we\'ll get back to you within 2 hours.',
      contact: 'support@meetmydesigners.com',
      action: 'Send Email',
      color: 'green',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700'
    },
    {
      icon: 'ri-phone-line',
      title: 'Phone Support',
      description: 'Speak directly with our support team for immediate assistance.',
      contact: '+91 98765 43210',
      action: 'Call Now',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: 'ri-chat-3-line',
      title: 'Live Chat',
      description: 'Chat with our team in real-time for quick answers to your questions.',
      contact: 'Available 24/7',
      action: 'Start Chat',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      icon: 'ri-map-pin-line',
      title: 'Visit Our Office',
      description: 'Meet us in person at our headquarters in the heart of Mumbai.',
      contact: 'Bandra Kurla Complex, Mumbai',
      action: 'Get Directions',
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonBg: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Multiple Ways to Reach Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the contact method that works best for you. We're committed to providing 
            exceptional support through every channel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {contactMethods.map((method, index) => (
            <div key={index} className={`${method.bgColor} rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-16 h-16 ${method.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <i className={`${method.icon} text-2xl ${method.iconColor}`}></i>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {method.title}
              </h3>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {method.description}
              </p>
              
              <p className="font-medium text-gray-800 mb-6">
                {method.contact}
              </p>
              
              <button className={`${method.buttonBg} text-white px-6 py-3 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap hover:shadow-md`}>
                {method.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}