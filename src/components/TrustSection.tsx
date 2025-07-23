
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowLeft, ArrowRight, ArrowRight as ArrowRightIcon, CheckCircle } from 'lucide-react';

const TrustSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      company: 'TechStart Solutions',
      role: 'CEO & Founder',
      rating: 5,
      review: 'The designer we worked with was absolutely fantastic! They understood our vision perfectly and delivered beyond our expectations. The communication was seamless throughout the project.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20businesswoman%20smiling%20confidently%2C%20modern%20office%20background%2C%20contemporary%20business%20attire%2C%20confident%20expression%2C%20professional%20headshot%20photography%2C%20clean%20corporate%20environment&width=120&height=120&seq=client-1&orientation=squarish'
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      company: 'InnovateCorp',
      role: 'Product Manager',
      rating: 5,
      review: 'Working with this platform has been a game-changer for our startup. The quality of designers and the ease of collaboration made our product launch successful. Highly recommended!',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20businessman%20in%20modern%20office%2C%20confident%20smile%2C%20contemporary%20business%20casual%20attire%2C%20professional%20corporate%20headshot%2C%20clean%20modern%20workspace%20background&width=120&height=120&seq=client-2&orientation=squarish'
    },
    {
      id: 3,
      name: 'Ananya Patel',
      company: 'Digital Dreams',
      role: 'Marketing Director',
      rating: 5,
      review: 'The creative talent on this platform is exceptional. Our brand identity project was completed with such attention to detail and creativity. The entire process was smooth and professional.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20woman%20marketing%20executive%2C%20creative%20workspace%20background%2C%20modern%20business%20attire%2C%20confident%20professional%20expression%2C%20contemporary%20office%20environment&width=120&height=120&seq=client-3&orientation=squarish'
    },
    {
      id: 4,
      name: 'Vikram Singh',
      company: 'EcoGreen Industries',
      role: 'Founder & CEO',
      rating: 5,
      review: 'From concept to execution, the designer we connected with was outstanding. They brought fresh ideas to our sustainability campaign and delivered results that exceeded our goals.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20entrepreneur%20in%20modern%20sustainable%20office%2C%20confident%20business%20leader%2C%20eco-friendly%20workspace%20background%2C%20professional%20corporate%20headshot%2C%20clean%20contemporary%20design&width=120&height=120&seq=client-4&orientation=squarish'
    },
    {
      id: 5,
      name: 'Meera Reddy',
      company: 'FinanceFlow',
      role: 'Chief Marketing Officer',
      rating: 5,
      review: 'The platform made it incredibly easy to find the right designer for our fintech project. The quality of work and professionalism was top-notch throughout our collaboration.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20woman%20finance%20executive%2C%20modern%20corporate%20office%20background%2C%20business%20professional%20attire%2C%20confident%20leadership%20expression%2C%20contemporary%20financial%20services%20environment&width=120&height=120&seq=client-5&orientation=squarish'
    },
    {
      id: 6,
      name: 'Arjun Gupta',
      company: 'HealthTech Plus',
      role: 'Chief Technology Officer',
      rating: 5,
      review: 'The technical expertise and design skills of our assigned designer were remarkable. They helped us create a user-friendly healthcare app that our patients absolutely love.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20technology%20executive%2C%20modern%20healthcare%20tech%20office%2C%20business%20casual%20attire%2C%20confident%20tech%20leader%20expression%2C%20contemporary%20medical%20technology%20workspace&width=120&height=120&seq=client-6&orientation=squarish'
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length, isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setIsAnimating(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const prevTestimonial = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setIsAnimating(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our{' '}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Clients
              </span>
              {' '}Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Real stories from businesses that have transformed their ideas into reality
            </p>
          </div>

          {/* Enhanced Testimonials Display */}
          <div className="relative max-w-4xl mx-auto">
            <div 
              className="relative min-h-[350px] bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=subtle%20abstract%20geometric%20pattern%20background%2C%20soft%20pastel%20colors%2C%20minimalist%20design%20texture%2C%20clean%20modern%20background%20pattern%2C%20professional%20business%20backdrop&width=800&height=400&seq=testimonial-bg&orientation=landscape')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay'
              }}
            >
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-white/90"></div>
              
              <div className={`relative z-10 p-10 md:p-12 transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                {testimonials[currentTestimonial] && (
                  <>
                    {/* Large Quote Icon */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full">
                        <span className="text-white text-xl">"</span>
                      </div>
                    </div>

                    {/* Star Rating with Animation */}
                    <div className="flex justify-center mb-6">
                      {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, index) => (
                        <Star 
                          key={index} 
                          className="text-yellow-400 text-xl mx-1 fill-current animate-pulse"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                      ))}
                    </div>
                    
                    {/* Review Text */}
                    <blockquote className="text-gray-800 text-lg md:text-xl leading-relaxed text-center mb-8 font-medium max-w-3xl mx-auto">
                      "{testimonials[currentTestimonial].review}"
                    </blockquote>
                    
                    {/* Enhanced Client Info */}
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <img 
                          src={testimonials[currentTestimonial].image} 
                          alt={testimonials[currentTestimonial].name}
                          className="w-20 h-20 rounded-full object-cover object-top border-4 border-white shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                          <CheckCircle className="text-white w-3 h-3" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-gray-900 text-xl mb-1">{testimonials[currentTestimonial].name}</h4>
                        <p className="text-green-600 font-semibold text-base mb-1">{testimonials[currentTestimonial].role}</p>
                        <p className="text-gray-500 text-sm">{testimonials[currentTestimonial].company}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Navigation Controls */}
            <div className="flex items-center justify-center mt-8 space-x-6">
              <button 
                onClick={prevTestimonial}
                className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:border-green-400 hover:shadow-lg transition-all duration-300 group hover:scale-105"
              >
                <ArrowLeft className="text-gray-600 group-hover:text-green-600 w-5 h-5" />
              </button>
              
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentTestimonial(index);
                        setIsAnimating(false);
                      }, 300);
                      setIsAutoPlaying(false);
                      setTimeout(() => setIsAutoPlaying(true), 12000);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentTestimonial === index 
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 w-8 shadow-md' 
                        : 'bg-gray-300 hover:bg-gray-400 w-2'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextTestimonial}
                className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:border-green-400 hover:shadow-lg transition-all duration-300 group hover:scale-105"
              >
                <ArrowRight className="text-gray-600 group-hover:text-green-600 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Call to Action Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 md:p-10 text-center text-white relative overflow-hidden shadow-xl">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Design Journey?
            </h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Connect with world-class designers and bring your ideas to life
            </p>
            
            <Link 
              to="/designers" 
              className="bg-white text-green-600 px-8 py-3 rounded-full text-lg font-bold hover:bg-gray-50 transition-all duration-300 whitespace-nowrap inline-flex items-center space-x-3 group shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Start Your Project</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
