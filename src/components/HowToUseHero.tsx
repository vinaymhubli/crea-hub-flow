export default function HowToUseHero() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20design%20team%20working%20together%20in%20bright%20creative%20office%20space%20with%20laptops%20computers%20and%20design%20tools%20scattered%20around%20collaborative%20workspace%20environment%20with%20natural%20lighting%20and%20minimalist%20aesthetic%20professional%20designers%20brainstorming%20and%20creating%20beautiful%20digital%20interfaces&width=1200&height=800&seq=hero-how-to-use&orientation=landscape')`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center bg-white/80 backdrop-blur-sm text-green-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
          <i className="ri-lightbulb-line mr-2"></i>
          Complete Guide to Success
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
          How to Use Our
          <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Platform</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
          Whether you're looking to hire talented designers or showcase your creative skills, 
          we've got you covered with step-by-step guides for maximum success.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-user-heart-line text-3xl text-green-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Customers</h3>
            <p className="text-gray-600 mb-6">Learn how to find, hire, and work with amazing designers to bring your ideas to life.</p>
            <div className="flex items-center justify-center text-green-600 font-semibold">
              <span>Start Your Journey</span>
              <i className="ri-arrow-right-line ml-2"></i>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-palette-line text-3xl text-blue-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Designers</h3>
            <p className="text-gray-600 mb-6">Discover how to showcase your skills, attract clients, and grow your design business.</p>
            <div className="flex items-center justify-center text-blue-600 font-semibold">
              <span>Build Your Success</span>
              <i className="ri-arrow-right-line ml-2"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}