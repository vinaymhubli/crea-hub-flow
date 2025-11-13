-- Seed initial categories and skills data
-- This populates the admin-managed categories and skills tables with EXISTING categories and skills from the codebase

-- Insert ONLY existing categories (from DesignerServices.tsx line 72-75)
INSERT INTO public.categories (name, is_active) VALUES
('Logo Design', true),
('Web Design', true),
('UI/UX Design', true),
('Mobile App Design', true),
('Branding', true),
('Print Design', true),
('Illustration', true),
('Other', true)
ON CONFLICT (name) DO NOTHING;

-- Insert ONLY existing skills (from DesignerProfile.tsx line 104-114)
INSERT INTO public.skills (name, is_active) VALUES
('Adobe Photoshop', true),
('Adobe Illustrator', true),
('Adobe InDesign', true),
('Figma', true),
('Sketch', true),
('3D Modeling', true),
('Motion Graphics', true),
('Hand Drawing', true),
('Typography', true)
ON CONFLICT (name) DO NOTHING;

