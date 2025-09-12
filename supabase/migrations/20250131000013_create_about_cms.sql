-- Create about page content table
CREATE TABLE IF NOT EXISTS public.about_page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'mission', 'story', 'values', 'team', 'cta'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  image_url TEXT,
  background_image_url TEXT,
  icon TEXT,
  color_scheme TEXT, -- 'green', 'blue', 'purple', 'red', 'orange', 'yellow'
  image_position TEXT DEFAULT 'center', -- 'left', 'right', 'center', 'background'
  stats JSONB, -- For statistics like "50K+", "₹50Cr+", "15+"
  team_member JSONB, -- For team member data
  value_item JSONB, -- For core values data
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_about_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER about_page_content_updated_at
  BEFORE UPDATE ON public.about_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_content_updated_at();

-- Insert initial about page data
INSERT INTO public.about_page_content (section_type, title, subtitle, description, content, background_image_url, image_position, sort_order, is_published) VALUES
-- Hero section
('hero', 'Revolutionizing Design', 'Collaboration', 'We''re building a revolutionary real-time design platform that connects visionary clients with world-class designers for seamless creative collaboration worldwide.', 'Revolutionizing Design Collaboration', 'https://readdy.ai/api/search-image?query=modern%20creative%20design%20team%20working%20together%20in%20bright%20collaborative%20workspace%2C%20designers%20brainstorming%20and%20sketching%20ideas%2C%20colorful%20post-it%20notes%20and%20design%20materials%20scattered%20on%20desk%2C%20natural%20lighting%20streaming%20through%20large%20windows%2C%20professional%20creative%20environment%20with%20laptops%20and%20design%20tools%2C%20inspiring%20workspace%20atmosphere%20with%20plants%20and%20modern%20furniture&width=1920&height=1080&seq=about-hero-bg&orientation=landscape', 'background', 0, true),

-- Mission section
('mission', 'Our Mission is Simple:', 'Bridge Creative Gaps', 'We believe every business deserves access to exceptional design talent. Our platform eliminates geographical barriers and connects you with skilled designers who understand your vision and can bring it to life in real-time.', 'Our Mission is Simple: Bridge Creative Gaps', 'https://readdy.ai/api/search-image?query=diverse%20team%20of%20professional%20designers%20collaborating%20around%20large%20table%20with%20design%20sketches%20and%20digital%20tablets%2C%20modern%20office%20environment%20with%20floor-to-ceiling%20windows%2C%20creative%20workspace%20with%20design%20mood%20boards%20and%20colorful%20sticky%20notes%2C%20natural%20lighting%20creating%20warm%20atmosphere%2C%20multicultural%20team%20working%20on%20creative%20projects%20together&width=800&height=600&seq=mission-image&orientation=landscape', 'right', 1, true),

-- Story section header
('story', 'From a simple idea to a leading design collaboration platform', 'From a simple idea to a leading design collaboration platform', 'Our journey from a simple idea to becoming a leading design collaboration platform', 'From a simple idea to a leading design collaboration platform', null, 'center', 2, true),

-- Story timeline items
('story', 'Where It All Started', '2022 - The Beginning', 'It all began when our founders, Rajesh Kumar and Priya Sharma, experienced firsthand the challenges of finding reliable design talent for their previous startup. After countless hours searching for the right designers and dealing with communication gaps, they realized there had to be a better way. They envisioned a platform where businesses could instantly connect with pre-vetted designers, collaborate in real-time, and get exceptional results without the usual hassles of traditional freelancing.', 'Where It All Started', 'https://readdy.ai/api/search-image?query=young%20entrepreneurs%20working%20late%20in%20startup%20office%2C%20laptops%20and%20design%20mockups%20on%20desk%2C%20brainstorming%20session%20with%20whiteboard%20covered%20in%20sketches%20and%20ideas%2C%20warm%20lighting%20from%20desk%20lamps%2C%20determination%20and%20passion%20visible%20in%20their%20focused%20expressions%2C%20startup%20hustle%20atmosphere&width=800&height=600&seq=story-founding&orientation=landscape', 'left', 3, true),

('story', 'Scaling New Heights', '2024 - Today', 'Today, we''re proud to serve over 10,000 satisfied clients and work with more than 5,000 talented designers worldwide. Our platform has facilitated over 50,000 successful design projects, from simple logos to complex brand identities. We''ve built advanced collaboration tools, AI-powered matching algorithms, and quality assurance systems that make design collaboration seamless and efficient. But we''re just getting started.', 'Scaling New Heights', 'https://readdy.ai/api/search-image?query=modern%20successful%20tech%20company%20office%20with%20diverse%20team%20celebrating%20achievement%2C%20high-fiving%20and%20cheering%20around%20conference%20table%2C%20large%20monitors%20showing%20design%20portfolios%20and%20success%20metrics%2C%20contemporary%20workspace%20with%20plants%20and%20natural%20lighting%2C%20celebration%20of%20growth%20and%20success&width=800&height=600&seq=story-success&orientation=landscape', 'right', 4, true),

-- Values section header
('values', 'Our Core Values', 'These principles guide everything we do and shape the culture of our platform', 'These principles guide everything we do and shape the culture of our platform', 'Our Core Values', null, 'center', 5, true),

-- Team section header
('team', 'Meet Our Team', 'Passionate individuals working together to revolutionize the design industry', 'Passionate individuals working together to revolutionize the design industry', 'Meet Our Team', null, 'center', 6, true),

-- CTA section
('cta', 'Ready to Experience the Difference?', 'Join thousands of satisfied clients who trust us with their design needs', 'Join thousands of satisfied clients who trust us with their design needs', 'Ready to Experience the Difference?', null, 'center', 7, true);

-- Insert core values
INSERT INTO public.about_page_content (section_type, title, description, icon, color_scheme, image_position, value_item, sort_order, is_published) VALUES
('value_item', 'Quality First', 'We maintain the highest standards in everything we do, from designer vetting to project delivery.', 'Heart', 'red', 'center', '{"title": "Quality First", "description": "We maintain the highest standards in everything we do, from designer vetting to project delivery.", "icon": "Heart", "color": "text-red-600 bg-red-50"}', 8, true),
('value_item', 'Collaboration', 'We believe great design comes from seamless collaboration between clients and designers.', 'Users', 'blue', 'center', '{"title": "Collaboration", "description": "We believe great design comes from seamless collaboration between clients and designers.", "icon": "Users", "color": "text-blue-600 bg-blue-50"}', 9, true),
('value_item', 'Innovation', 'We continuously innovate to provide cutting-edge tools and experiences for our community.', 'Rocket', 'purple', 'center', '{"title": "Innovation", "description": "We continuously innovate to provide cutting-edge tools and experiences for our community.", "icon": "Rocket", "color": "text-purple-600 bg-purple-50"}', 10, true),
('value_item', 'Trust', 'We build trust through transparency, reliability, and consistent delivery of exceptional results.', 'Shield', 'green', 'center', '{"title": "Trust", "description": "We build trust through transparency, reliability, and consistent delivery of exceptional results.", "icon": "Shield", "color": "text-green-600 bg-green-50"}', 11, true),
('value_item', 'Accessibility', 'We make world-class design talent accessible to businesses of all sizes, everywhere.', 'Globe', 'orange', 'center', '{"title": "Accessibility", "description": "We make world-class design talent accessible to businesses of all sizes, everywhere.", "icon": "Globe", "color": "text-orange-600 bg-orange-50"}', 12, true),
('value_item', 'Creativity', 'We foster creativity and empower designers to produce their best work in inspiring environments.', 'Lightbulb', 'yellow', 'center', '{"title": "Creativity", "description": "We foster creativity and empower designers to produce their best work in inspiring environments.", "icon": "Lightbulb", "color": "text-yellow-600 bg-yellow-50"}', 13, true);

-- Insert team members
INSERT INTO public.about_page_content (section_type, title, subtitle, description, image_url, image_position, team_member, sort_order, is_published) VALUES
('team_member', 'Rajesh Kumar', 'Co-Founder & CEO', 'Former design director at Zomato with 8+ years of experience in product design and team building.', 'https://readdy.ai/api/search-image?query=professional%20indian%20male%20CEO%20in%20his%2030s%2C%20confident%20smile%2C%20wearing%20formal%20business%20attire%2C%20clean%20corporate%20headshot%20with%20neutral%20background%2C%20leadership%20qualities%20visible%20in%20expression%2C%20modern%20professional%20photography%20style&width=400&height=400&seq=ceo-rajesh&orientation=squarish', 'center', '{"name": "Rajesh Kumar", "role": "Co-Founder & CEO", "bio": "Former design director at Zomato with 8+ years of experience in product design and team building.", "image": "https://readdy.ai/api/search-image?query=professional%20indian%20male%20CEO%20in%20his%2030s%2C%20confident%20smile%2C%20wearing%20formal%20business%20attire%2C%20clean%20corporate%20headshot%20with%20neutral%20background%2C%20leadership%20qualities%20visible%20in%20expression%2C%20modern%20professional%20photography%20style&width=400&height=400&seq=ceo-rajesh&orientation=squarish", "linkedin": "#"}', 14, true),
('team_member', 'Priya Sharma', 'Co-Founder & CTO', 'Ex-Google engineer specializing in real-time collaboration platforms and AI-driven matching systems.', 'https://readdy.ai/api/search-image?query=professional%20indian%20female%20tech%20executive%20in%20her%20early%2030s%2C%20intelligent%20and%20approachable%20expression%2C%20business%20casual%20attire%2C%20clean%20corporate%20headshot%20with%20modern%20lighting%2C%20confident%20tech%20leader%20portrait&width=400&height=400&seq=cto-priya&orientation=squarish', 'center', '{"name": "Priya Sharma", "role": "Co-Founder & CTO", "bio": "Ex-Google engineer specializing in real-time collaboration platforms and AI-driven matching systems.", "image": "https://readdy.ai/api/search-image?query=professional%20indian%20female%20tech%20executive%20in%20her%20early%2030s%2C%20intelligent%20and%20approachable%20expression%2C%20business%20casual%20attire%2C%20clean%20corporate%20headshot%20with%20modern%20lighting%2C%20confident%20tech%20leader%20portrait&width=400&height=400&seq=cto-priya&orientation=squarish", "linkedin": "#"}', 15, true),
('team_member', 'Amit Patel', 'Head of Design', 'Award-winning designer with experience at Flipkart and Paytm, leading our quality assurance initiatives.', 'https://readdy.ai/api/search-image?query=creative%20indian%20male%20design%20director%20in%20his%20early%2030s%2C%20artistic%20and%20thoughtful%20expression%2C%20casual%20creative%20attire%2C%20modern%20professional%20headshot%20with%20soft%20lighting%2C%20design-focused%20personality%20visible&width=400&height=400&seq=design-head-amit&orientation=squarish', 'center', '{"name": "Amit Patel", "role": "Head of Design", "bio": "Award-winning designer with experience at Flipkart and Paytm, leading our quality assurance initiatives.", "image": "https://readdy.ai/api/search-image?query=creative%20indian%20male%20design%20director%20in%20his%20early%2030s%2C%20artistic%20and%20thoughtful%20expression%2C%20casual%20creative%20attire%2C%20modern%20professional%20headshot%20with%20soft%20lighting%2C%20design-focused%20personality%20visible&width=400&height=400&seq=design-head-amit&orientation=squarish", "linkedin": "#"}', 16, true),
('team_member', 'Sneha Gupta', 'VP of Operations', 'Operations expert from McKinsey, ensuring smooth platform operations and exceptional client experience.', 'https://readdy.ai/api/search-image?query=professional%20indian%20female%20operations%20executive%20in%20her%20late%2020s%2C%20warm%20and%20professional%20smile%2C%20business%20attire%2C%20clean%20corporate%20headshot%20with%20professional%20lighting%2C%20operations%20leadership%20qualities&width=400&height=400&seq=ops-sneha&orientation=squarish', 'center', '{"name": "Sneha Gupta", "role": "VP of Operations", "bio": "Operations expert from McKinsey, ensuring smooth platform operations and exceptional client experience.", "image": "https://readdy.ai/api/search-image?query=professional%20indian%20female%20operations%20executive%20in%20her%20late%2020s%2C%20warm%20and%20professional%20smile%2C%20business%20attire%2C%20clean%20corporate%20headshot%20with%20professional%20lighting%2C%20operations%20leadership%20qualities&width=400&height=400&seq=ops-sneha&orientation=squarish", "linkedin": "#"}', 17, true),
('team_member', 'Karthik Reddy', 'Head of Growth', 'Growth hacker from Swiggy with expertise in scaling marketplaces and building designer communities.', 'https://readdy.ai/api/search-image?query=dynamic%20indian%20male%20growth%20executive%20in%20his%20early%2030s%2C%20energetic%20and%20ambitious%20expression%2C%20modern%20casual%20business%20attire%2C%20contemporary%20professional%20headshot%2C%20growth-focused%20personality%20visible&width=400&height=400&seq=growth-karthik&orientation=squarish', 'center', '{"name": "Karthik Reddy", "role": "Head of Growth", "bio": "Growth hacker from Swiggy with expertise in scaling marketplaces and building designer communities.", "image": "https://readdy.ai/api/search-image?query=dynamic%20indian%20male%20growth%20executive%20in%20his%20early%2030s%2C%20energetic%20and%20ambitious%20expression%2C%20modern%20casual%20business%20attire%2C%20contemporary%20professional%20headshot%2C%20growth-focused%20personality%20visible&width=400&height=400&seq=growth-karthik&orientation=squarish", "linkedin": "#"}', 18, true),
('team_member', 'Kavya Nair', 'Head of Community', 'Community building expert focused on designer success and creating meaningful client-designer relationships.', 'https://readdy.ai/api/search-image?query=friendly%20indian%20female%20community%20manager%20in%20her%20late%2020s%2C%20warm%20and%20welcoming%20smile%2C%20approachable%20casual%20attire%2C%20natural%20professional%20headshot%20with%20soft%20lighting%2C%20community-focused%20personality&width=400&height=400&seq=community-kavya&orientation=squarish', 'center', '{"name": "Kavya Nair", "role": "Head of Community", "bio": "Community building expert focused on designer success and creating meaningful client-designer relationships.", "image": "https://readdy.ai/api/search-image?query=friendly%20indian%20female%20community%20manager%20in%20her%20late%2020s%2C%20warm%20and%20welcoming%20smile%2C%20approachable%20casual%20attire%2C%20natural%20professional%20headshot%20with%20soft%20lighting%2C%20community-focused%20personality&width=400&height=400&seq=community-kavya&orientation=squarish", "linkedin": "#"}', 19, true);

-- Insert statistics
INSERT INTO public.about_page_content (section_type, title, image_position, stats, sort_order, is_published) VALUES
('stats', 'Projects Completed', 'center', '{"value": "50K+", "color": "green"}', 20, true),
('stats', 'Designer Earnings', 'center', '{"value": "₹50Cr+", "color": "blue"}', 21, true),
('stats', 'Countries', 'center', '{"value": "15+", "color": "purple"}', 22, true);

-- RLS policies
ALTER TABLE public.about_page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published about page content
CREATE POLICY "Anyone can view published about page content" ON public.about_page_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all about page content
CREATE POLICY "Admins can manage all about page content" ON public.about_page_content
  FOR ALL USING (is_admin(auth.uid()));
