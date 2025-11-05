-- Insert refund policy sections data
INSERT INTO public.website_sections (page, section_name, section_type, title, content, icon, background_color, is_published, sort_order) VALUES
('refund-policy', 'RefundHero', 'hero', 'Refund & Cancellation Policy', 'Last updated: January 1, 2024', 'Scale', 'bg-gradient-to-br from-primary/10 via-background to-secondary/10', true, 1),
('refund-policy', 'OverviewSection', 'content', 'Overview', 'At Meetmydesigners, we strive to provide excellent service and ensure customer satisfaction. This policy outlines our refund and cancellation procedures for all services and transactions.', null, 'bg-white', true, 2),
('refund-policy', 'GeneralRefundPolicy', 'card', 'General Refund Policy', '• Refunds are processed within 5-10 business days
• Refunds will be issued to the original payment method
• Processing fees may apply to certain refunds
• Partial refunds may be issued based on work completed
• All refund requests must be submitted through our support system', 'CheckCircle', 'bg-white', true, 3),
('refund-policy', 'SessionCancellationPolicy', 'content', 'Session Cancellation Policy', 'You may cancel or reschedule your design session under the following conditions:', null, 'bg-white', true, 4),
('refund-policy', 'CancellationTimeframes', 'card', 'Cancellation Timeframes', '**24+ Hours Before Session**: Full refund or free rescheduling
**2-24 Hours Before Session**: 50% refund or rescheduling with fee
**Less than 2 Hours Before Session**: No refund, rescheduling with full fee', 'Clock', 'bg-white', true, 5),
('refund-policy', 'DesignProjectRefunds', 'content', 'Design Project Refunds', 'For ongoing design projects, refunds are calculated based on work completed and project milestones.', null, 'bg-white', true, 6),
('refund-policy', 'ProjectRefundStructure', 'card', 'Project Refund Structure', '• **0-25% Complete**: 90% refund (10% processing fee)
• **26-50% Complete**: 60% refund
• **51-75% Complete**: 30% refund
• **76-100% Complete**: No refund (work delivered)
• **Quality Issues**: Full refund if work doesn''t meet agreed standards', 'CreditCard', 'bg-white', true, 7),
('refund-policy', 'SubscriptionRefunds', 'content', 'Subscription and Membership Refunds', 'Monthly and annual subscriptions can be cancelled at any time with the following terms:', null, 'bg-white', true, 8),
('refund-policy', 'SubscriptionTerms', 'card', 'Subscription Terms', '• Monthly subscriptions: Cancellation effective next billing cycle
• Annual subscriptions: Prorated refund for unused months
• Premium features: Access continues until end of billing period
• No refunds for partially used months', 'Shield', 'bg-white', true, 9),
('refund-policy', 'RefundRequestProcess', 'content', 'Refund Request Process', 'To request a refund, please follow these steps:', null, 'bg-white', true, 10),
('refund-policy', 'HowToRequestRefund', 'card', 'How to Request a Refund', '1. Contact our support team at support@meetmydesigner.com
2. Provide your order number and reason for refund
3. Include any relevant documentation or screenshots
4. Our team will review your request within 2 business days
5. You''ll receive confirmation and timeline for processing', 'FileText', 'bg-white', true, 11),
('refund-policy', 'NonRefundableItems', 'content', 'Non-Refundable Items', 'The following items are generally not eligible for refunds:', null, 'bg-white', true, 12),
('refund-policy', 'Exclusions', 'card', 'Exclusions', '• Completed and delivered design work
• Digital products and templates
• Services used beyond agreed scope
• Refunds requested after 30 days of service completion
• Third-party fees and processing charges', 'AlertTriangle', 'bg-white', true, 13),
('refund-policy', 'DisputeResolution', 'content', 'Dispute Resolution', 'If you''re not satisfied with our refund decision, you can escalate your case through our dispute resolution process. We''re committed to fair and transparent resolution of all issues.', null, 'bg-white', true, 14),
('refund-policy', 'ContactInformation', 'content', 'Contact Information', 'For questions about refunds or cancellations, please contact us at:
• Email: support@meetmydesigner.com
• Phone: +1 (555) 123-4567
• Live Chat: Available on our website', null, 'bg-white', true, 15),
('refund-policy', 'PolicyUpdates', 'content', 'Policy Updates', 'We reserve the right to update this refund and cancellation policy at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the updated policy.', null, 'bg-white', true, 16);
