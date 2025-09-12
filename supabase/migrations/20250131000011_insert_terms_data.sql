-- Update existing Terms and Conditions data to match Privacy Policy structure
UPDATE public.content_pages 
SET 
  title = 'Terms and Conditions',
  content = '<h2>1. Acceptance of Terms</h2>

<p>By accessing and using Meet My Designer ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Description of Service</h2>

<p>Meet My Designer is a platform that connects clients with verified designers for real-time collaboration and consultation services.</p>

<h2>3. User Accounts</h2>

<p>Users must provide accurate information and maintain account security. All users must be at least 18 years old to create an account.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Account Responsibilities</h3>
  </div>
  <ul class="space-y-2">
    <li>• Users are responsible for all activities under their account</li>
    <li>• Users must notify us immediately of any unauthorized use</li>
    <li>• Users may not share account credentials</li>
    <li>• Users must provide accurate and complete information</li>
  </ul>
</div>

<h2>4. Designer Verification</h2>

<p>All designers undergo a comprehensive verification process including portfolio review, skill assessment, and background checks.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Verification Process</h3>
  </div>
  <ul class="space-y-2">
    <li>• Portfolio review and skill assessment</li>
    <li>• Background checks and identity verification</li>
    <li>• Professional standards evaluation</li>
    <li>• Ongoing performance monitoring</li>
  </ul>
</div>

<h2>5. Payment Terms</h2>

<p>Payments are processed securely through our platform with funds held in escrow until project completion.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Payment Processing</h3>
  </div>
  <ul class="space-y-2">
    <li>• Secure payment processing through our platform</li>
    <li>• Funds held in escrow until project completion</li>
    <li>• Support for all major payment methods</li>
    <li>• Transparent fee structure</li>
  </ul>
</div>

<h2>6. Intellectual Property</h2>

<p>Clients retain ownership of their original content and receive full rights to completed work. Designers retain rights to their portfolio and process.</p>

<h2>7. Prohibited Activities</h2>

<p>Users may not violate applicable laws, infringe on intellectual property rights, engage in fraudulent practices, or harass other users.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Prohibited Activities</h3>
  </div>
  <ul class="space-y-2">
    <li>• Violate any applicable laws or regulations</li>
    <li>• Infringe on intellectual property rights</li>
    <li>• Engage in fraudulent or deceptive practices</li>
    <li>• Harass or abuse other users</li>
    <li>• Share inappropriate or offensive content</li>
  </ul>
</div>

<h2>8. Limitation of Liability</h2>

<p>Meet My Designer is not liable for indirect, incidental, or consequential damages, loss of profits, or damages exceeding the amount paid for services.</p>

<h2>9. Termination</h2>

<p>Users may terminate their account at any time. We may terminate accounts for violations of these terms with appropriate notice.</p>

<h2>10. Changes to Terms</h2>

<p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification.</p>

<h2>11. Contact Information</h2>

<p>For questions about these terms, please contact us at legal@meetmydesigner.com or through our support channels.</p>',
  updated_at = NOW()
WHERE page_type = 'terms';

-- Insert if not exists
INSERT INTO public.content_pages (page_type, title, content, is_published, created_at, updated_at) 
SELECT 'terms', 'Terms and Conditions', '<h2>1. Acceptance of Terms</h2>

<p>By accessing and using Meet My Designer ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Description of Service</h2>

<p>Meet My Designer is a platform that connects clients with verified designers for real-time collaboration and consultation services.</p>

<h2>3. User Accounts</h2>

<p>Users must provide accurate information and maintain account security. All users must be at least 18 years old to create an account.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Account Responsibilities</h3>
  </div>
  <ul class="space-y-2">
    <li>• Users are responsible for all activities under their account</li>
    <li>• Users must notify us immediately of any unauthorized use</li>
    <li>• Users may not share account credentials</li>
    <li>• Users must provide accurate and complete information</li>
  </ul>
</div>

<h2>4. Designer Verification</h2>

<p>All designers undergo a comprehensive verification process including portfolio review, skill assessment, and background checks.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Verification Process</h3>
  </div>
  <ul class="space-y-2">
    <li>• Portfolio review and skill assessment</li>
    <li>• Background checks and identity verification</li>
    <li>• Professional standards evaluation</li>
    <li>• Ongoing performance monitoring</li>
  </ul>
</div>

<h2>5. Payment Terms</h2>

<p>Payments are processed securely through our platform with funds held in escrow until project completion.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Payment Processing</h3>
  </div>
  <ul class="space-y-2">
    <li>• Secure payment processing through our platform</li>
    <li>• Funds held in escrow until project completion</li>
    <li>• Support for all major payment methods</li>
    <li>• Transparent fee structure</li>
  </ul>
</div>

<h2>6. Intellectual Property</h2>

<p>Clients retain ownership of their original content and receive full rights to completed work. Designers retain rights to their portfolio and process.</p>

<h2>7. Prohibited Activities</h2>

<p>Users may not violate applicable laws, infringe on intellectual property rights, engage in fraudulent practices, or harass other users.</p>

<div class="my-8 p-6 border rounded-lg bg-white">
  <div class="flex items-center mb-4">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
    <h3 class="text-lg font-semibold">Prohibited Activities</h3>
  </div>
  <ul class="space-y-2">
    <li>• Violate any applicable laws or regulations</li>
    <li>• Infringe on intellectual property rights</li>
    <li>• Engage in fraudulent or deceptive practices</li>
    <li>• Harass or abuse other users</li>
    <li>• Share inappropriate or offensive content</li>
  </ul>
</div>

<h2>8. Limitation of Liability</h2>

<p>Meet My Designer is not liable for indirect, incidental, or consequential damages, loss of profits, or damages exceeding the amount paid for services.</p>

<h2>9. Termination</h2>

<p>Users may terminate their account at any time. We may terminate accounts for violations of these terms with appropriate notice.</p>

<h2>10. Changes to Terms</h2>

<p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification.</p>

<h2>11. Contact Information</h2>

<p>For questions about these terms, please contact us at legal@meetmydesigner.com or through our support channels.</p>', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.content_pages WHERE page_type = 'terms'
);
