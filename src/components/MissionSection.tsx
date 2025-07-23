
import React from 'react';

const MissionSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Our Mission is Simple:
              <span className="block text-green-600">Bridge Creative Gaps</span>
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              We believe every business deserves access to exceptional design talent. Our platform eliminates geographical barriers and connects you with skilled designers who understand your vision and can bring it to life in real-time.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Whether you're a startup looking for your first logo or an enterprise needing comprehensive design solutions, we're here to make the creative process seamless, efficient, and enjoyable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mt-1">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Innovation First</h3>
                  <p className="text-gray-600 text-sm">Cutting-edge tools and processes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mt-1">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Quality Focused</h3>
                  <p className="text-gray-600 text-sm">Premium design standards always</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://readdy.ai/api/search-image?query=diverse%20team%20of%20professional%20designers%20collaborating%20around%20large%20table%20with%20design%20sketches%20and%20digital%20tablets%2C%20modern%20office%20environment%20with%20floor-to-ceiling%20windows%2C%20creative%20workspace%20with%20design%20mood%20boards%20and%20colorful%20sticky%20notes%2C%20natural%20lighting%20creating%20warm%20atmosphere%2C%20multicultural%20team%20working%20on%20creative%20projects%20together&width=800&height=600&seq=mission-image&orientation=landscape"
              alt="Our Mission"
              className="w-full h-96 object-cover rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold">99%</div>
              <div className="text-sm">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
