export default function MapSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Visit Our Office
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Located in the heart of Mumbai's business district, our office is easily accessible 
            and we'd love to meet you in person.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Office Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-map-pin-fill text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                  <p className="text-gray-600">
                    Meet My Designers<br />
                    Plot No. C-54, G Block<br />
                    Bandra Kurla Complex<br />
                    Mumbai, Maharashtra 400051
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-time-fill text-blue-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Office Hours</h4>
                  <div className="text-gray-600 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-subway-fill text-purple-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Public Transport</h4>
                  <p className="text-gray-600">
                    Kurla Station (5 min walk)<br />
                    BKC Metro Station (3 min walk)<br />
                    Multiple bus routes available
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-car-fill text-orange-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Parking</h4>
                  <p className="text-gray-600">
                    Free visitor parking available<br />
                    Valet service during business hours<br />
                    EV charging stations on-site
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-80">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.542222262945!2d72.86364431533558!3d19.059073787097447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8f0b14b7d0f%3A0x6d50f4c632f1b8a8!2sBandra%20Kurla%20Complex%2C%20Bandra%20East%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1635420000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Meet My Designers Office Location"
                ></iframe>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-4">Schedule a Visit</h3>
              <p className="mb-6 opacity-90">
                Want to discuss your project in person? Schedule a meeting with our team and 
                let's explore how we can help bring your vision to life.
              </p>
              <button className="bg-white text-green-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}