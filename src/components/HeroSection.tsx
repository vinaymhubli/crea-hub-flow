
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://readdy.ai/api/search-image?query=Modern%20graphic%20designer%20working%20on%20creative%20project%20with%20multiple%20monitors%20showing%20UI%20UX%20design%20interface%20and%20colorful%20digital%20artwork%20in%20professional%20studio%20workspace%20with%20natural%20lighting%20and%20clean%20minimalist%20setup&width=1920&height=1080&seq=hero-video-poster&orientation=landscape"
      >
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        <source src="https://sample-videos.com/zip/10/mp4/720/mp4-SampleVideo_1280x720_1mb.mp4" type="video/mp4" />
        <source src="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4" type="video/mp4" />
        <source src="https://filesamples.com/samples/video/mp4/720/mp4-SampleVideo_1280x720_1mb.mp4" type="video/mp4" />
      </video>
      
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Professional%20graphic%20designer%20workspace%20with%20creative%20team%20collaborating%20on%20UI%20UX%20design%20projects%20using%20modern%20computers%20and%20design%20software%20with%20vibrant%20colorful%20interface%20elements%20and%20creative%20tools%20in%20contemporary%20office%20environment&width=1920&height=1080&seq=hero-bg-fallback&orientation=landscape')`
        }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
      <div className="absolute inset-0 backdrop-blur-[0.5px]"></div>
      
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              Connect with
              <span className="block bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
                Amazing Designers
              </span>
              <span className="text-green-100">Worldwide</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Connect with top designers instantly. Experience real-time collaboration, 
              browse portfolios, and bring your vision to life with our innovative platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/designers" 
                className="group bg-gradient-to-r from-green-600 to-green-500 text-white px-10 py-5 rounded-full text-xl font-semibold hover:from-green-500 hover:to-green-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-center whitespace-nowrap backdrop-blur-sm"
              >
                <span className="flex items-center justify-center gap-3">
                  Find Your Designer
                  <ArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link 
                to="/signup?role=designer" 
                className="group bg-white/10 backdrop-blur-md text-white border-2 border-white/30 px-10 py-5 rounded-full text-xl font-semibold hover:bg-white/20 hover:border-white/50 transition-all duration-300 transform hover:scale-105 text-center whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-3">
                  Join as Designer
                  <span className="text-xl group-hover:rotate-12 transition-transform">👨‍💻</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
          <ArrowDown className="text-white text-2xl" />
        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-white rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-32 left-20 w-1 h-1 bg-green-300 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-white rounded-full animate-pulse opacity-30"></div>
      </div>
    </section>
  );
};

export default HeroSection;
