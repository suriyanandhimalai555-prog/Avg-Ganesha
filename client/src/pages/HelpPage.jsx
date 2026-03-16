import React from 'react';
import { Mail, HelpCircle, MessageCircle, ShieldCheck, Heart } from 'lucide-react';
import { commonStyles, helpStyles } from '../styles/index.styles';

const HelpPage = () => {
  return (
    <div className={helpStyles.container + " overflow-y-auto"}>
      {/* Header */}
      <header className={helpStyles.header}>
        <div className={helpStyles.headerIcon}>
          <HelpCircle size={40} />
        </div>
        <p className={commonStyles.preTitle}>॥ அகில வெற்றி கணேஷா ॥</p>
        <h1 className={helpStyles.headerTitle}>DIVINE SUPPORT PORTAL</h1>
        <p className={helpStyles.headerSubtitle}>
          We are here to support your journey of devotion and contribution. 
          Reach out to our team for any assistance or inquiries.
        </p>
      </header>

      {/* Primary Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <section className={helpStyles.card}>
          <h2 className={helpStyles.cardTitle}>
            <Mail className="text-[#FBDB8C]" size={24} />
            Email Support
          </h2>
          <div className={helpStyles.contactBox}>
            <p className={helpStyles.contactLabel}>OFFICIAL DEVOTEE SUPPORT</p>
            <a 
              href="mailto:support@agilavetriganesha.com" 
              className={helpStyles.contactEmail}
            >
              support@agilavetriganesha.com
            </a>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-4">
              Typically responds within 24–48 hours.
            </p>
          </div>
        </section>

        <section className={helpStyles.card}>
          <h2 className={helpStyles.cardTitle}>
            <MessageCircle className="text-[#FBDB8C]" size={24} />
            Direct Assistance
          </h2>
          <div className={helpStyles.contactBox}>
            <p className={helpStyles.contactLabel}>SACRED HOTLINE</p>
            <a 
              href="tel:+917338286331" 
              className={helpStyles.contactEmail}
            >
              +91 73382 86331
            </a>
            <div className="pt-4">
              <a 
                href="https://wa.me/917338286331" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white text-[10px] font-black tracking-widest uppercase px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                <MessageCircle size={14} />
                Connect via WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Helpful Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={helpStyles.card}>
          <h3 className="font-serif font-bold text-[#FBDB8C] flex items-center gap-3 mb-4 text-sm uppercase tracking-[0.2em]">
            <ShieldCheck size={20} />
            Validation Guide
          </h3>
          <p className="text-xs text-white/40 leading-relaxed font-medium">
            Ensure your photo and ID proof are clear and well-lit. 
            Most validation requests are processed within 24 hours of submission.
          </p>
        </div>
        
        <div className={helpStyles.card}>
          <h3 className="font-serif font-bold text-[#FBDB8C] flex items-center gap-3 mb-4 text-sm uppercase tracking-[0.2em]">
            <Heart size={20} />
            Contribution Care
          </h3>
          <p className="text-xs text-white/40 leading-relaxed font-medium">
            Every offering is manually verified by our royal administrators. 
            Once confirmed, it will manifest in your dashboard stats.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <section className={helpStyles.card + " mt-8 shadow-[0_0_50px_rgba(0,0,0,0.6)]"}>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent opacity-50" />
        <h2 className={helpStyles.cardTitle}>Pillars of Knowledge (FAQ)</h2>
        <div className="space-y-4">
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>How do I track my offerings?</p>
            <p className={helpStyles.faqAnswer}>You can view your entire contribution history and statistics directly from your Royal Dashboard by tapping the DASHBOARD link in the sidebar.</p>
          </div>
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>Why is my offering still "Checking"?</p>
            <p className={helpStyles.faqAnswer}>Administrators manually verify the payment proof for every offering to ensure authenticity. This divine verification typically takes a few hours.</p>
          </div>
          <div className={helpStyles.faqItem}>
            <p className={helpStyles.faqQuestion}>Is my devotee data secure?</p>
            <p className={helpStyles.faqAnswer}>Yes, we use sacred encryption and secure protocols to protect your personal information and transaction data with the utmost privacy.</p>
          </div>
        </div>
      </section>

      <footer className="text-center pt-10 pb-10">
        <p className="text-[#FBDB8C]/20 font-serif italic text-sm tracking-widest">
          ॥ May Lord Ganesha guide your path with success and prosperity ॥
        </p>
      </footer>
    </div>
  );
};

export default HelpPage;
