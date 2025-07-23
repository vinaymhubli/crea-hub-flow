
import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      icon: '🎨',
      title: 'Smart Logo Generator',
      description: 'Create professional logos in minutes with AI-powered design suggestions tailored to your brand.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🖼️',
      title: 'AI Image Creation',
      description: 'Generate stunning images, illustrations, and graphics from simple text descriptions.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '✨',
      title: 'Design Enhancement',
      description: 'Improve existing designs with AI-powered suggestions and automatic optimizations.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '📐',
      title: 'Template Generator',
      description: 'Create custom templates for social media, presentations, and marketing materials.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🎭',
      title: 'Color Palette AI',
      description: 'Generate harmonious color schemes that perfectly match your brand and design goals.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🔤',
      title: 'Typography Assistant',
      description: 'Get intelligent font pairing suggestions and typography layouts for your designs.',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Powerful AI Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how our AI assistant can transform your design workflow and help you create professional-quality designs effortlessly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group p-8 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-card-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
