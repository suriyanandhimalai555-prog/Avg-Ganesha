import React from 'react';
import { Mail, HelpCircle, MessageCircle, ShieldCheck, Heart } from 'lucide-react';
import { commonStyles, helpStyles } from '../styles/index.styles';

const HelpPage = () => {
  return (
    <div className={helpStyles.container}>
      {/* Header */}
      <header className={helpStyles.header}>
        <div className={helpStyles.headerIcon}>
          <HelpCircle size={40} />
        </div>
        <p className={commonStyles.badgeText}>॥ அகில வெற்றி கணேஷா ॥</p>
        <h1 className={helpStyles.headerTitle}>How can we help you?</h1>
        <p className={helpStyles.headerSubtitle}>
          We are here to support your journey of devotion and contribution. 
          Reach out to our team for any assistance or inquiries.
        </p>
      </header>

      {/* Primary Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className={helpStyles.card}>
          <h2 className={helpStyles.cardTitle}>
            <Mail className="text-gs-teal" size={24} />
            Email Support
          </h2>
          <div className={helpStyles.contactBox}>
            <p className={helpStyles.contactLabel}>Official Support Email</p>
            <a 
              href="mailto:support@agilavetriganesha.com" 
              className={helpStyles.contactEmail}
            >
              support@agilavetriganesha.com
            </a>
            <p className="text-gray-500 text-[10px] mt-2 leading-relaxed max-w-[200px]">
              Typically responds within 24–48 hours.
            </p>
          </div>
        </section>

        <section className={helpStyles.card}>
          <h2 className={helpStyles.cardTitle}>
            <MessageCircle className="text-gs-teal" size={24} />
            Phone & WhatsApp
          </h2>
          <div className={helpStyles.contactBox}>
            <p className={helpStyles.contactLabel}>Contact Number</p>
            <a 
              href="tel:+917338286331" 
              className={helpStyles.contactEmail}
            >
              +91 73382 86331
            </a>
            <div className="pt-2">
              <a 
                href="https://wa.me/917338286331" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:shadow-md transition-all active:scale-95"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Helpful Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={helpStyles.card}>
          <h3 className="font-serif font-bold text-gs-navy flex items-center gap-2 mb-4 text-sm uppercase tracking-wide">
            <ShieldCheck className="text-gs-teal" size={18} />
            KYC Assistance
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Ensure your photo and ID proof are clear and well-lit. 
            Most KYC approvals are processed within 24 hours of submission.
          </p>
        </div>
        
        <div className={helpStyles.card}>
          <h3 className="font-serif font-bold text-gs-navy flex items-center gap-2 mb-4 text-sm uppercase tracking-wide">
            <Heart className="text-gs-teal" size={18} />
            Donation Receipts
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            All donations are manually verified by our admins. 
            Once confirmed, your donation will appear in your history and statistics.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <section className={helpStyles.card}>
        <h2 className={helpStyles.cardTitle}>Frequently Asked Questions</h2>
        <div className="space-y-2">
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>How do I track my donations?</p>
            <p className={helpStyles.faqAnswer}>You can view your entire donation history and total contribution statistics directly from your Dashboard.</p>
          </div>
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>Why is my donation still "Pending"?</p>
            <p className={helpStyles.faqAnswer}>Administrators manually verify the payment proof for every donation to ensure authenticity. This typically takes a few hours.</p>
          </div>
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>Is my data secure?</p>
            <p className={helpStyles.faqAnswer}>Yes, we use industry-standard encryption and secure protocols to protect your personal information and transaction data.</p>
          </div>
        </div>
      </section>

      <footer className="text-center pt-8">
        <p className="text-gs-teal/40 font-serif italic text-sm">
          May Lord Ganesha guide your path with success and prosperity.
        </p>
      </footer>
    </div>
  );
};

export default HelpPage;
