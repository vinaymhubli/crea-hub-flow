
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=diverse%20team%20of%20creative%20professionals%20celebrating%20success%20in%20modern%20design%20studio%20with%20laptops%20tablets%20and%20design%20tools%20scattered%20around%20collaborative%20workspace%20environment%20with%20bright%20lighting%20and%20inspiring%20creative%20atmosphere&width=1200&height=600&seq=cta-success&orientation=landscape')`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Start Your
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Creative Journey?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Join thousands of successful customers and designers who are already creating amazing work together. 
            Your next great project is just one click away.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* For Customers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="ri-user-heart-fill text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">I Need Design Work</h3>
              <p className="text-white/80 mb-6">Find talented designers and bring your creative vision to life with professional results.</p>
              <Link to="/designers" className="bg-white text-green-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center">
                <i className="ri-search-eye-line mr-2"></i>
                Browse Designers
              </Link>
            </div>
            
            {/* For Designers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="ri-palette-fill text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">I'm a Designer</h3>
              <p className="text-white/80 mb-6">Showcase your skills, connect with clients, and build a thriving design business.</p>
              <Link to="/designers" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center">
                <i className="ri-user-add-line mr-2"></i>
                Join as Designer
              </Link>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/80">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">5,000+</div>
              <div className="text-white/80">Verified Designers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50,000+</div>
              <div className="text-white/80">Projects Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.2%</div>
              <div className="text-white/80">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-300/20 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 left-20 w-12 h-12 bg-pink-300/20 rounded-full animate-ping"></div>
    </section>
  );
}
