import Header from '../components/Header';
import Footer from '../components/Footer';
import ContactHero from '../components/ContactHero';
import ContactMethods from '../components/ContactMethods';
import ContactForm from '../components/ContactForm';
import MapSection from '../components/MapSection';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ContactHero />
      <ContactMethods />
      <ContactForm />
      <MapSection />
      <Footer />
    </div>
  );
}