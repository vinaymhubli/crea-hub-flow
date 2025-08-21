import ContactHero from '../components/ContactHero';
import ContactMethods from '../components/ContactMethods';
import ContactForm from '../components/ContactForm';
import MapSection from '../components/MapSection';

export default function Contact() {
  return (
    <main>
      <ContactHero />
      <ContactMethods />
      <ContactForm />
      <MapSection />
    </main>
  );
}