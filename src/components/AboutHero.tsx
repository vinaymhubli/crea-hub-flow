
import React from 'react';

const AboutHero = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20creative%20design%20team%20working%20together%20in%20bright%20collaborative%20workspace%2C%20designers%20brainstorming%20and%20sketching%20ideas%2C%20colorful%20post-it%20notes%20and%20design%20materials%20scattered%20on%20desk%2C%20natural%20lighting%20streaming%20through%20large%20windows%2C%20professional%20creative%20environment%20with%20laptops%20and%20design%20tools%2C%20inspiring%20workspace%20atmosphere%20with%20plants%20and%20modern%20furniture&width=1920&height=1080&seq=about-hero-bg&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-white/80"></div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Revolutionizing Design
          <span className="block text-green-600">Collaboration</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
          We're building a revolutionary real-time design platform that connects visionary clients with world-class designers for seamless creative collaboration worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
            <span className="font-semibold">Trusted by 10,000+ Clients</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
            <span className="font-semibold">5,000+ Expert Designers</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
