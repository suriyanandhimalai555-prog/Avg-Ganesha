/**
 * Unified Tailwind CSS styles for the entire application.
 * Consolidated into a single file for easier maintenance and simplified imports.
 */

export const commonStyles = {
  // Page Layouts
  pageContainer: "min-h-screen bg-floral-confetti bg-gs-cream font-sans text-gs-navy",
  mainContent: "max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8",
  
  // Typography
  pageTitle: "text-4xl md:text-5xl font-serif text-gs-navy font-bold mb-3",
  sectionTitle: "text-2xl font-bold font-serif text-gs-navy mb-4",
  badgeText: "text-gs-teal font-serif font-semibold tracking-widest text-sm mb-2",
  preTitle: "text-gs-teal font-serif font-semibold tracking-widest text-[10px] mb-0.5",
  
  // Cards
  card: "bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8",
  interactiveCard: "bg-white border border-gray-200 shadow-sm p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
  
  // Buttons
  buttonPrimary: "px-4 py-2 rounded-lg bg-gs-teal text-white font-bold text-sm hover:bg-[#1A7566] disabled:opacity-60 transition-colors",
  buttonSecondary: "px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors",
  buttonOutline: "mt-4 w-full py-3 rounded-full border-2 border-gs-teal text-gs-teal font-bold hover:bg-gs-teal hover:text-white transition-colors",
  buttonDanger: "flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg text-sm transition-all border border-red-100",
  buttonSmall: "text-[10px] px-2 py-1 bg-gs-teal/10 text-gs-teal border border-gs-teal/20 rounded font-bold hover:bg-gs-teal/20 transition",
  
  // Inputs
  input: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-shadow",
  label: "block text-xs font-bold text-gray-500 uppercase mb-1",
  
  // Tables
  tableContainer: "bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden",
  tableHead: "bg-gray-50 border-b border-gray-200",
  tableFooter: "bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200",
  paginationBtn: "text-xs font-bold text-gs-teal disabled:opacity-30 hover:underline",
  paginationText: "text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm",
  tableRow: "hover:bg-gray-50 transition-colors",
  tableCell: "px-6 py-4 whitespace-nowrap",
  tableHeaderCell: "px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50",
  
  // Modals
  modalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60",
  modalContent: "bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col",
  modalHeader: "p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0",
  modalFooter: "p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0",
};

export const sidebarStyles = {
  // Mobile Overlay
  overlayBase: "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
  overlayOpen: "opacity-100",
  overlayClosed: "opacity-0 pointer-events-none",
  
  // Sidebar Container
  sidebarBase: "fixed md:relative top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out flex-shrink-0",
  sidebarOpen: "translate-x-0",
  sidebarClosed: "-translate-x-full md:translate-x-0",
  
  // Logo Section
  logoSection: "p-6 border-b border-gray-100 flex-shrink-0 flex justify-between items-center bg-gs-cream/50",
  logoTitle: "text-2xl font-serif font-bold text-gs-navy tracking-wide",
  closeBtn: "md:hidden text-gray-400 hover:text-gs-navy",
  
  // User Badge
  userBadge: "px-6 py-4 border-b border-gray-100 bg-white",
  userBadgeLabel: "text-[10px] text-gs-teal uppercase tracking-widest font-bold",
  userBadgeName: "text-sm text-gs-navy font-bold mt-0.5",
  
  // Navigation
  navContainer: "flex-1 mt-6 overflow-y-auto custom-scrollbar px-2 space-y-1",
  navItemBase: "w-full flex items-center space-x-3 px-6 py-4 mb-1 transition-all duration-300 relative group overflow-hidden rounded-r-full border-l-4",
  navItemActive: "text-gs-teal bg-gs-teal/10 border-gs-teal font-bold",
  navItemSpecial: "text-gs-teal border-gs-teal/50 bg-gs-teal/5 hover:bg-gs-teal/15 font-medium",
  navItemInactive: "text-gray-600 hover:text-gs-teal hover:bg-gs-teal/5 border-transparent font-medium",
  navItemIcon: "relative z-10",
  navItemLabel: "tracking-wide z-10 transition-all",
  
  // Footer / Auth Button
  footerBase: "p-6 border-t border-gray-100 flex-shrink-0 transition-colors group",
  footerLoggedIn: "bg-gray-50/50 hover:bg-red-50/50",
  footerLoggedOut: "bg-gs-teal/5 hover:bg-gs-teal/10",
  authBtnBase: "flex items-center space-x-2 text-sm transition-all w-full",
  authBtnLoggedIn: "text-gray-500 group-hover:text-red-500",
  authBtnLoggedOut: "text-gs-teal font-bold",
};




export const adminStyles = {
  // Navbar
  navbar: "bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm",
  navbarInner: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  navbarContent: "flex items-center justify-between h-20",
  navbarLogoWrapper: "p-2.5 bg-gs-teal/10 rounded-xl text-gs-teal border border-gs-teal/20",
  navbarTitle: "text-lg md:text-xl font-serif font-bold text-gs-navy tracking-tight",
  logoutBtn: "flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors",
  
  // Stats
  statCardBase: "bg-white border border-gray-100 rounded-3xl p-6 relative overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
  statCardActive: "ring-2 ring-gs-teal border-transparent shadow-md",
  statCardInactive: "hover:border-gs-teal/30",
  statCardDecoration: "absolute top-0 left-0 w-1 h-full bg-gs-teal opacity-50 transition-all group-hover:w-1.5",
  statCardLabel: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2",
  statCardValue: "text-3xl font-bold font-serif text-gs-navy",
  statCardValueAmber: "text-3xl font-bold font-serif text-amber-600",
  statCardIconWrapper: "absolute top-6 right-6 p-4 rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-white group-hover:shadow-sm",
  
  // Sections
  sectionBox: "bg-gs-cream/30 border border-gs-teal/10 rounded-3xl p-8 mb-10 shadow-sm transition-all",
  donationStatBox: "bg-white border border-gray-100 rounded-3xl p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-all",
  donationStatIcon: "w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm",
  
  // Status Badges
  statusBadgeBase: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
  statusConfirmed: "bg-green-50 text-green-700 border-green-100",
  statusRejected: "bg-red-50 text-red-700 border-red-100",
  statusPending: "bg-amber-50 text-amber-700 border-amber-100",
  
  // Roles
  roleBase: "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border",
  roleAdmin: "bg-purple-50 text-purple-700 border-purple-200",
  roleUser: "bg-gray-50 text-gray-500 border-gray-200",
  
  // Action Buttons
  actionBtnApprove: "text-[10px] px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold hover:bg-green-100 transition-all active:scale-95",
  actionBtnReject: "text-[10px] px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-all active:scale-95",
};

export const authStyles = {
  // Container
  authCard: "w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_10px_40px_rgba(45,156,138,0.1)] relative z-10",
  topLineDecoration: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gs-teal to-transparent opacity-60 rounded-t-3xl",
  
  // Header
  headerWrapper: "text-center mb-8",
  headerEmoji: "text-5xl mb-3 animate-float",
  headerTitle: "text-3xl font-serif text-gs-navy font-bold tracking-tight mb-1",
  headerSubtitle: "text-gray-500 text-xs tracking-[0.2em] font-medium uppercase mt-2",
  
  // Form
  form: "space-y-5",
  inputGroup: "group",
  inputLabel: "block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors",
  inputIconWrapper: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
  inputBase: "w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400",
  
  // Buttons
  submitButton: "w-full bg-gs-teal hover:bg-[#238071] text-white font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-6",
  
  // Footer
  footerBox: "mt-8 text-center bg-gray-50 rounded-xl py-4 border border-gray-100",
};

export const dashboardStyles = {
  // Layout
  container: "animate-fade-in space-y-8 pb-12",
  statsGrid: "flex-1 grid grid-cols-1 md:grid-cols-2 gap-6",
  statsRow: "flex flex-col lg:flex-row gap-8 items-start",
  donationGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  donationStatsGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  loadingContainer: "min-h-screen flex items-center justify-center text-gs-teal font-serif text-xl animate-pulse bg-gs-cream",
  
  // Info Cards
  infoCard: "bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md h-32 transition-all",
  infoCardLabel: "text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-3",
  infoCardValue: "text-3xl font-bold font-serif",
  
  // Status Badges
  statusBadgeBase: "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
  statusBadgeApproved: "bg-green-50 text-green-700 border-green-100",
  statusBadgeSubmitted: "bg-blue-50 text-blue-700 border-blue-100",
  statusBadgeRejected: "bg-red-50 text-red-700 border-red-100",
  statusBadgePending: "bg-gs-teal/5 text-gs-teal border-gs-teal/10",
  
  // Level Badge Container
  badgeWrapper: "w-full lg:w-auto flex justify-center items-center h-32 lg:h-auto",
  badgeBase: "relative w-36 h-36 rounded-full p-1 flex items-center justify-center border-4 bg-white shadow-sm transition-all duration-700 overflow-hidden",
  badgeOverlay: "absolute inset-0 opacity-10",
  badgeContent: "relative z-10 flex flex-col items-center text-center",
  
  badgeStatusLabel: "text-[8px] font-bold tracking-[0.3em]",
  badgeStatusValue: "text-[10px] font-bold tracking-widest uppercase",
  
  // Level Varieties
  levelGradientGold: "bg-gradient-to-br from-yellow-400 via-amber-200 to-yellow-600",
  levelBorderGold: "border-yellow-400/30",
  levelGlowGold: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
  
  levelGradientTeal: "bg-gradient-to-br from-gs-teal via-[#2D9C8A] to-gs-navy",
  levelBorderTeal: "border-gs-teal/30",
  levelGlowTeal: "shadow-[0_0_15px_rgba(45,156,138,0.2)]",
  
  levelGradientMint: "bg-gradient-to-br from-gs-teal/60 via-gs-teal/40 to-gs-teal/20",
  levelBorderMint: "border-gs-teal/20",
  levelGlowMint: "shadow-sm",
  
  levelGradientGray: "bg-gray-100",
  levelBorderGray: "border-gray-200",
  levelGlowNone: "shadow-none",
  
  // Donation Cards
  donationCard: "bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all",
  donationIconWrapper: "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
  donationLabel: "text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1",
  donationValue: "text-xl font-bold font-serif text-gs-navy",
  
  // Breakdown
  breakdownCard: "bg-white border border-gray-100 rounded-2xl p-6 shadow-sm",
  breakdownTitle: "text-xs font-bold text-gs-teal uppercase tracking-widest mb-4 border-b border-gs-teal/10 pb-2",
  breakdownItem: "flex justify-between items-center",
  breakdownValue: "font-bold text-gs-navy",
  
  // Hero Section
  heroWrapper: "flex justify-center mt-8",
  heroCard: "relative w-full max-w-3xl rounded-3xl border border-gs-teal/20 bg-white shadow-[0_10px_40px_rgba(45,156,138,0.08)] overflow-hidden group h-72",
  heroOverlay: "absolute inset-0 bg-gs-cream/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
  heroContent: "w-full h-full flex flex-col items-center justify-center relative z-10",
  heroEmoji: "text-8xl animate-float",
  heroTitle: "text-gs-navy font-serif font-bold text-2xl mt-4",
  heroSubtitle: "text-gray-500 text-sm mt-1 mb-3",
  heroBadge: "bg-gs-teal/5 border border-gs-teal/10 px-4 py-1.5 rounded-full",
  heroBadgeText: "text-gs-teal font-serif text-[10px] tracking-[0.2em] font-bold",
};

export const donateStyles = {
  // Layout
  section: "pt-16 px-4 max-w-5xl mx-auto",
  headerWrapper: "text-center mb-12",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  
  // Category Cards
  categoryCard: "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col",
  categoryTitle: "text-lg font-serif text-gs-navy font-bold",
  fixedPrice: "text-gs-teal font-bold text-xl mt-2",
  amountLabel: "text-gray-500 text-sm mt-2",
  
  // Donation Modal
  modalLabel: "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2",
  bankDetailsBox: "p-4 bg-gray-50 rounded-xl text-sm",
  
  // Payment Proof
  proofBoxBase: "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
  proofBoxActive: "border-gs-teal bg-gs-teal/5",
  proofBoxInactive: "border-gray-300 hover:border-gs-teal",
  
  // Alerts
  alertBase: "flex items-start gap-3 p-4 border rounded-xl",
  alertInfo: "bg-blue-50 border-blue-200",
  alertWarning: "bg-amber-50 border-amber-200",
  alertDanger: "bg-red-50 border-red-200",
  
  alertTitle: "font-bold",
  alertInfoTitle: "text-blue-800",
  alertWarningTitle: "text-amber-800",
  alertDangerTitle: "text-red-800",
  
  alertText: "text-sm mt-1",
  alertInfoText: "text-blue-700",
  alertWarningText: "text-amber-700",
  alertDangerText: "text-red-700",
};

export const kycStyles = {
  // Layout
  container: "max-w-2xl mx-auto space-y-8 animate-fade-in pb-12",
  header: "text-center space-y-4",
  headerIconWrapper: "w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto border-4 border-gs-teal/20 shadow-sm",
  headerTitle: "text-3xl font-serif text-gs-navy font-bold tracking-wide",
  headerSubtitle: "text-gray-500 text-sm",
  
  // Status Cards
  statusCard: "bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden shadow-sm",
  statusCardDecoration: "absolute top-0 left-0 w-1 h-full bg-gs-teal opacity-50",
  statusCardContent: "flex items-center gap-5 relative z-10 pl-2",
  
  statusLabel: "text-xs uppercase tracking-widest text-gray-400 font-bold mb-1",
  statusValue: "text-xl font-bold font-serif",
  statusValueApproved: "text-[#10b981]",
  statusValueSubmitted: "text-blue-600",
  statusValueRejected: "text-red-600",
  statusValuePending: "text-gs-teal",
  
  // Form
  form: "bg-white border border-gray-100 rounded-3xl p-8 space-y-8 shadow-sm",
  inputGroup: "space-y-3",
  inputLabel: "text-xs font-bold text-gray-500 uppercase tracking-wider",
  uploadBoxBase: "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative group cursor-pointer",
  uploadBoxActive: "border-gs-teal bg-gs-teal/5",
  uploadBoxInactive: "border-gray-300 bg-gray-50 hover:border-gs-teal hover:bg-gs-teal/5",
  fileInput: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
  
  uploadIconActive: "text-gs-teal mb-3",
  uploadIconInactive: "text-gray-400 group-hover:text-gs-teal transition-colors mb-3",
  uploadFileName: "text-gs-navy font-bold truncate w-full px-4",
  uploadStatusText: "text-xs text-gs-teal mt-1 font-medium",
  uploadPlaceholderText: "text-gray-500 group-hover:text-gs-navy font-medium transition-colors",
  uploadMimeText: "text-xs text-gray-400 mt-2",
  
  // Rejection
  rejectionBox: "bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm font-medium",
  rejectionTitle: "font-bold mb-1",
  rejectionReason: "text-red-600 italic",
  
  // Button
  submitBtnBase: "w-full py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-md",
  submitBtnDisabled: "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none",
  submitBtnEnabled: "bg-gs-teal hover:bg-[#1A7566] text-white hover:shadow-lg hover:-translate-y-0.5",
  
  // Info/Success Cards
  infoCard: "text-center p-10 bg-white border border-gray-100 shadow-sm rounded-3xl animate-pulse",
  infoTitle: "text-gs-teal font-serif text-xl font-bold mb-2",
  infoSubtitle: "text-gray-500 text-sm",
  successCard: "text-center p-10 bg-[#f0fdf4] border border-[#bbf7d0] shadow-sm rounded-3xl",
  successTitle: "text-[#16a34a] font-serif font-bold text-xl mb-2",
  successSubtitle: "text-[#15803d] text-sm",
  
  loadingText: "text-gs-teal text-center font-serif text-xl tracking-widest mt-20 animate-pulse",
};

export const plansStyles = {
  // Layout
  headerWrapper: "max-w-4xl mx-auto text-center mb-10 space-y-2",
  headerEmoji: "text-5xl mb-3",
  headerTagline: "text-gray-500 font-medium text-sm",
  headerDescription: "text-gray-500 text-xs max-w-2xl mx-auto leading-relaxed mt-2",
  
  // Empty State
  emptyCard: "max-w-xl mx-auto text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm",
  emptyEmoji: "text-6xl mb-4",
  
  // Grid
  grid: "max-w-[90rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16",
  
  // Plan Cards
  planCardBase: "rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col hover:-translate-y-1 shadow-[0_10px_30px_rgba(45,156,138,0.08)]",
  planCardHeader: "p-8 text-center relative overflow-hidden border-b",
  planCardBody: "p-8 flex-1 flex flex-col bg-white",
  planCardFooter: "bg-gray-50 px-6 py-4 border-t border-gray-100",
  
  // Typography
  planName: "text-2xl font-bold font-serif text-gs-navy tracking-wide mb-1",
  planElement: "text-xs uppercase font-bold tracking-widest mb-1",
  planTagline: "text-[10px] uppercase font-bold tracking-widest text-gray-500 opacity-80",
  planPrice: "text-3xl font-serif font-bold",
  planPriceSub: "text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2",
  
  // Benefits
  benefitItem: "flex items-start gap-3 text-gray-600 text-xs font-medium leading-relaxed",
  benefitBullet: "rounded-full p-1 mt-0.5 flex-shrink-0 text-[10px]",
  
  // CTA
  ctaButton: "w-full py-3.5 rounded-full text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300",
};
