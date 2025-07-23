
import React from 'react';
import { ExternalLink } from 'lucide-react';

const TeamSection = () => {
  const team = [
    {
      name: "Rajesh Kumar",
      role: "Co-Founder & CEO",
      bio: "Former design director at Zomato with 8+ years of experience in product design and team building.",
      image: "https://readdy.ai/api/search-image?query=professional%20indian%20male%20CEO%20in%20his%2030s%2C%20confident%20smile%2C%20wearing%20formal%20business%20attire%2C%20clean%20corporate%20headshot%20with%20neutral%20background%2C%20leadership%20qualities%20visible%20in%20expression%2C%20modern%20professional%20photography%20style&width=400&height=400&seq=ceo-rajesh&orientation=squarish",
      linkedin: "#"
    },
    {
      name: "Priya Sharma",
      role: "Co-Founder & CTO",
      bio: "Ex-Google engineer specializing in real-time collaboration platforms and AI-driven matching systems.",
      image: "https://readdy.ai/api/search-image?query=professional%20indian%20female%20tech%20executive%20in%20her%20early%2030s%2C%20intelligent%20and%20approachable%20expression%2C%20business%20casual%20attire%2C%20clean%20corporate%20headshot%20with%20modern%20lighting%2C%20confident%20tech%20leader%20portrait&width=400&height=400&seq=cto-priya&orientation=squarish",
      linkedin: "#"
    },
    {
      name: "Amit Patel",
      role: "Head of Design",
      bio: "Award-winning designer with experience at Flipkart and Paytm, leading our quality assurance initiatives.",
      image: "https://readdy.ai/api/search-image?query=creative%20indian%20male%20design%20director%20in%20his%20early%2030s%2C%20artistic%20and%20thoughtful%20expression%2C%20casual%20creative%20attire%2C%20modern%20professional%20headshot%20with%20soft%20lighting%2C%20design-focused%20personality%20visible&width=400&height=400&seq=design-head-amit&orientation=squarish",
      linkedin: "#"
    },
    {
      name: "Sneha Gupta",
      role: "VP of Operations",
      bio: "Operations expert from McKinsey, ensuring smooth platform operations and exceptional client experience.",
      image: "https://readdy.ai/api/search-image?query=professional%20indian%20female%20operations%20executive%20in%20her%20late%2020s%2C%20warm%20and%20professional%20smile%2C%20business%20attire%2C%20clean%20corporate%20headshot%20with%20professional%20lighting%2C%20operations%20leadership%20qualities&width=400&height=400&seq=ops-sneha&orientation=squarish",
      linkedin: "#"
    },
    {
      name: "Karthik Reddy",
      role: "Head of Growth",
      bio: "Growth hacker from Swiggy with expertise in scaling marketplaces and building designer communities.",
      image: "https://readdy.ai/api/search-image?query=dynamic%20indian%20male%20growth%20executive%20in%20his%20early%2030s%2C%20energetic%20and%20ambitious%20expression%2C%20modern%20casual%20business%20attire%2C%20contemporary%20professional%20headshot%2C%20growth-focused%20personality%20visible&width=400&height=400&seq=growth-karthik&orientation=squarish",
      linkedin: "#"
    },
    {
      name: "Kavya Nair",
      role: "Head of Community",
      bio: "Community building expert focused on designer success and creating meaningful client-designer relationships.",
      image: "https://readdy.ai/api/search-image?query=friendly%20indian%20female%20community%20manager%20in%20her%20late%2020s%2C%20warm%20and%20welcoming%20smile%2C%20approachable%20casual%20attire%2C%20natural%20professional%20headshot%20with%20soft%20lighting%2C%20community-focused%20personality&width=400&height=400&seq=community-kavya&orientation=squarish",
      linkedin: "#"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Passionate individuals working together to revolutionize the design industry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="relative mb-6">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 object-cover rounded-full mx-auto mb-4 ring-4 ring-gray-100"
                />
                <div className="absolute bottom-0 right-1/2 transform translate-x-16 translate-y-2">
                  <a 
                    href={member.linkedin}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-green-600 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to Join Our Team?</h3>
            <p className="text-gray-600 mb-6">
              We're always looking for talented individuals who share our passion for design and innovation.
            </p>
            <button className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap">
              View Open Positions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
