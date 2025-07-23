
import React from 'react';

const StorySection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From a simple idea to India's leading design collaboration platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="order-2 lg:order-1">
            <img 
              src="https://readdy.ai/api/search-image?query=young%20entrepreneurs%20working%20late%20in%20startup%20office%2C%20laptops%20and%20design%20mockups%20on%20desk%2C%20brainstorming%20session%20with%20whiteboard%20covered%20in%20sketches%20and%20ideas%2C%20warm%20lighting%20from%20desk%20lamps%2C%20determination%20and%20passion%20visible%20in%20their%20focused%20expressions%2C%20startup%20hustle%20atmosphere&width=800&height=600&seq=story-founding&orientation=landscape"
              alt="Our Beginning"
              className="w-full h-96 object-cover rounded-2xl shadow-xl"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4">
              2022 - The Beginning
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Where It All Started</h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              It all began when our founders, Rajesh Kumar and Priya Sharma, experienced firsthand the challenges of finding reliable design talent for their previous startup. After countless hours searching for the right designers and dealing with communication gaps, they realized there had to be a better way.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              They envisioned a platform where businesses could instantly connect with pre-vetted designers, collaborate in real-time, and get exceptional results without the usual hassles of traditional freelancing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4">
              2024 - Today
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Scaling New Heights</h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Today, we're proud to serve over 10,000 satisfied clients and work with more than 5,000 talented designers across India and beyond. Our platform has facilitated over 50,000 successful design projects, from simple logos to complex brand identities.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We've built advanced collaboration tools, AI-powered matching algorithms, and quality assurance systems that make design collaboration seamless and efficient. But we're just getting started.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">50K+</div>
                <div className="text-sm text-gray-600">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">₹50Cr+</div>
                <div className="text-sm text-gray-600">Designer Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">15+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
          </div>
          <div>
            <img 
              src="https://readdy.ai/api/search-image?query=modern%20successful%20tech%20company%20office%20with%20diverse%20team%20celebrating%20achievement%2C%20high-fiving%20and%20cheering%20around%20conference%20table%2C%20large%20monitors%20showing%20design%20portfolios%20and%20success%20metrics%2C%20contemporary%20workspace%20with%20plants%20and%20natural%20lighting%2C%20celebration%20of%20growth%20and%20success&width=800&height=600&seq=story-success&orientation=landscape"
              alt="Our Success"
              className="w-full h-96 object-cover rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
