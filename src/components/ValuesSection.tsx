
import React from 'react';
import { Heart, Users, Rocket, Shield, Globe, Lightbulb } from 'lucide-react';

const ValuesSection = () => {
  const values = [
    {
      icon: Heart,
      title: "Quality First",
      description: "We maintain the highest standards in everything we do, from designer vetting to project delivery.",
      color: "text-red-600 bg-red-50"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe great design comes from seamless collaboration between clients and designers.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: Rocket,
      title: "Innovation",
      description: "We continuously innovate to provide cutting-edge tools and experiences for our community.",
      color: "text-purple-600 bg-purple-50"
    },
    {
      icon: Shield,
      title: "Trust",
      description: "We build trust through transparency, reliability, and consistent delivery of exceptional results.",
      color: "text-green-600 bg-green-50"
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "We make world-class design talent accessible to businesses of all sizes, everywhere.",
      color: "text-orange-600 bg-orange-50"
    },
    {
      icon: Lightbulb,
      title: "Creativity",
      description: "We foster creativity and empower designers to produce their best work in inspiring environments.",
      color: "text-yellow-600 bg-yellow-50"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Core Values</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These principles guide everything we do and shape the culture of our platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-6 ${value.color}`}>
                <value.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-6">Ready to Experience the Difference?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied clients who trust us with their design needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
              Browse Designers
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-colors cursor-pointer whitespace-nowrap">
              Start Your Project
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
