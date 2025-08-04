export default function ContactHero() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-24">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20office%20space%20with%20glass%20walls%2C%20natural%20lighting%2C%20comfortable%20seating%20areas%2C%20plants%2C%20and%20a%20welcoming%20reception%20desk.%20Clean%2C%20professional%20environment%20with%20soft%20colors%20and%20contemporary%20furniture.%20Bright%20and%20inviting%20workspace%20atmosphere&width=1200&height=600&seq=contact-hero-bg&orientation=landscape')`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Get in Touch
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Have questions about our platform? Need help finding the perfect designer? 
          Our team is here to help you succeed. Reach out to us anytime!
        </p>
        
        <div className="flex flex-wrap justify-center gap-8 mt-12">
          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
              <i className="ri-time-line text-green-600"></i>
            </div>
            <span className="text-gray-700 font-medium">24/7 Support</span>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
              <i className="ri-chat-smile-2-line text-blue-600"></i>
            </div>
            <span className="text-gray-700 font-medium">Live Chat Available</span>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
            <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full">
              <i className="ri-phone-line text-purple-600"></i>
            </div>
            <span className="text-gray-700 font-medium">Quick Response</span>
          </div>
        </div>
      </div>
    </section>
  );
}