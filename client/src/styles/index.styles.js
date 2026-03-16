/**
 * Unified Tailwind CSS styles for the entire application.
 * Consolidated into a single file for easier maintenance and simplified imports.
 */

export const commonStyles = {
  // Royal Theme Tokens
  royalBlue: "bg-gradient-to-br from-[#060B28] via-[#0A194E] to-[#040924]",
  royalGold: "from-[#FCD34D] via-[#B45309] to-[#F59E0B]",
  royalGlow: "shadow-[0_0_15px_rgba(251,191,36,0.2)]",
  royalBorder: "border-[#FBDB8C]/20",

  // Page Layouts
  pageContainer: "min-h-screen bg-[#060B28] font-sans text-white relative overflow-hidden",
  mainContent: "max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 relative z-10",

  // Typography
  pageTitle: "text-3xl md:text-5xl font-serif text-white font-bold mb-3 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]",
  sectionTitle: "text-2xl font-bold font-serif text-[#FBDB8C] mb-4 uppercase tracking-widest",
  badgeText: "text-[#FBDB8C] font-serif font-semibold tracking-[0.2em] text-sm mb-2 uppercase opacity-80",
  preTitle: "text-[#FBDB8C] font-serif font-semibold tracking-[0.3em] text-[8px] md:text-[10px] mb-1 uppercase opacity-60",

  // Cards
  card: "bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] p-8 mb-8 relative overflow-hidden group transition-all",
  interactiveCard: "bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 shadow-[0_0_20px_rgba(0,0,0,0.4)] p-8 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer transition-all hover:border-[#FBDB8C]/40 hover:-translate-y-1",

  // Buttons
  buttonPrimary: "px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white font-black text-[10px] tracking-[0.2em] uppercase hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] disabled:opacity-50 transition-all active:scale-95",
  buttonSecondary: "px-8 py-3.5 border border-[#FBDB8C]/30 rounded-full font-black text-[#FBDB8C] text-[10px] tracking-[0.2em] uppercase hover:bg-white/5 transition-all active:scale-95",
  buttonOutline: "mt-4 w-full py-4 rounded-full border-2 border-[#FBDB8C]/50 text-[#FBDB8C] font-black tracking-[0.3em] uppercase hover:bg-[#FBDB8C] hover:text-[#060B28] transition-all",
  buttonDanger: "flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase transition-all border border-red-500/20",
  buttonSmall: "text-[9px] px-3 py-1.5 bg-[#FBDB8C]/10 text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-lg font-black hover:bg-[#FBDB8C]/20 transition-all uppercase tracking-widest",

  // Inputs
  input: "w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 focus:ring-1 focus:ring-[#FBDB8C]/20 outline-none transition-all placeholder-white/20",
  label: "block text-[10px] font-black text-[#FBDB8C]/40 uppercase mb-2 tracking-[0.2em]",

  // Tables
  tableContainer: "bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md",
  tableHead: "bg-black/20 border-b border-white/5",
  tableFooter: "bg-black/20 px-8 py-6 flex items-center justify-between border-t border-white/5",
  paginationBtn: "text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-4 py-2 rounded-lg transition-all",
  paginationText: "text-[10px] font-black text-[#FBDB8C]/60 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-sm uppercase tracking-widest",
  tableRow: "hover:bg-white/5 transition-all group",
  tableCell: "px-8 py-6 whitespace-nowrap text-white/60 text-sm",
  tableHeaderCell: "px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] bg-black/10",

  // Modals
  modalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in",
  modalContent: "bg-[#060B28] border border-[#FBDB8C]/30 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative",
  modalHeader: "p-8 border-b border-[#FBDB8C]/10 flex items-center justify-between flex-shrink-0 bg-white/5",
  modalFooter: "p-8 border-t border-[#FBDB8C]/10 flex justify-end gap-3 flex-shrink-0 bg-white/5",
};

export const sidebarStyles = {
  // Mobile Overlay
  overlayBase: "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
  overlayOpen: "opacity-100",
  overlayClosed: "opacity-0 pointer-events-none",

  // Sidebar Container
  sidebarBase: "fixed md:relative top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-[#060B28] to-[#040924] border-r border-[#FBDB8C]/20 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out flex-shrink-0",
  sidebarOpen: "translate-x-0",
  sidebarClosed: "-translate-x-full md:translate-x-0",

  // Logo Section
  logoSection: "p-6 border-b border-[#FBDB8C]/10 flex-shrink-0 flex justify-between items-center bg-black/20",
  logoTitle: "text-xl font-serif font-bold text-white tracking-widest uppercase",
  closeBtn: "md:hidden text-gray-400 hover:text-gs-navy",

  // User Badge
  userBadge: "px-6 py-4 border-b border-[#FBDB8C]/10 bg-black/20",
  userBadgeLabel: "text-[10px] text-[#FBDB8C]/60 uppercase tracking-widest font-bold",
  userBadgeName: "text-sm text-white font-bold mt-0.5",

  // Navigation
  navContainer: "flex-1 mt-6 overflow-y-auto custom-scrollbar px-3 space-y-2",
  navItemBase: "w-full flex items-center space-x-3 px-6 py-4 mb-1 transition-all duration-300 relative group overflow-hidden rounded-xl border border-[#FBDB8C]/10 shadow-sm",
  navItemActive: "text-[#FBDB8C] bg-[#FBDB8C]/10 border-[#FBDB8C]/40 font-bold shadow-[0_0_15px_rgba(251,219,140,0.1)]",
  navItemSpecial: "text-[#FBDB8C]/90 border-[#FBDB8C]/20 bg-white/5 hover:bg-white/10 font-medium",
  navItemInactive: "text-white/60 hover:text-[#FBDB8C] hover:bg-white/5 border-transparent font-medium",
  navItemIcon: "relative z-10",
  navItemLabel: "tracking-wide z-10 transition-all",

  // Footer / Auth Button
  footerBase: "p-6 border-t border-[#FBDB8C]/10 flex-shrink-0 transition-colors group",
  footerLoggedIn: "bg-black/20 hover:bg-red-500/10",
  footerLoggedOut: "bg-[#FBDB8C]/5 hover:bg-[#FBDB8C]/10",
  authBtnBase: "flex items-center space-x-2 text-sm transition-all w-full",
  authBtnLoggedIn: "text-white/40 group-hover:text-red-400",
  authBtnLoggedOut: "text-[#FBDB8C] font-bold",
};




export const adminStyles = {
  // Navbar
  navbar: "bg-[#060B28] border-b border-[#FBDB8C]/20 sticky top-0 z-20 shadow-xl backdrop-blur-md",
  navbarInner: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  navbarContent: "flex items-center justify-between h-24",
  navbarLogoWrapper: "p-3 bg-[#FBDB8C]/10 rounded-2xl text-[#FBDB8C] border border-[#FBDB8C]/20 shadow-[0_0_15px_rgba(251,219,140,0.1)]",
  navbarTitle: "text-lg md:text-xl font-serif font-black text-white tracking-[0.1em] uppercase",
  logoutBtn: "flex items-center gap-2 px-6 py-2.5 text-xs font-black text-[#FBDB8C] hover:bg-white/5 border border-[#FBDB8C]/20 rounded-full transition-all uppercase tracking-widest",
  
  // Stats
  statCardBase: "bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-3xl p-6 relative overflow-hidden group cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(251,219,140,0.1)] hover:-translate-y-1",
  statCardActive: "ring-2 ring-[#FBDB8C] border-transparent shadow-lg",
  statCardInactive: "hover:border-[#FBDB8C]/40",
  statCardDecoration: "absolute top-0 left-0 w-[1px] h-full bg-[#FBDB8C] opacity-30",
  statCardLabel: "text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-3",
  statCardValue: "text-3xl font-serif font-black text-white tracking-widest",
  statCardValueAmber: "text-3xl font-serif font-black text-[#FBDB8C] tracking-widest drop-shadow-[0_0_8px_rgba(251,219,140,0.3)]",
  statCardIconWrapper: "absolute top-6 right-6 p-4 rounded-2xl bg-white/5 text-[#FBDB8C] transition-all group-hover:bg-[#FBDB8C]/10",
  
  // Sections
  sectionBox: "bg-white/5 border border-[#FBDB8C]/10 rounded-[2rem] p-10 mb-12 shadow-inner backdrop-blur-md",
  donationStatBox: "bg-gradient-to-br from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-3xl p-6 flex justify-between items-center shadow-lg hover:border-[#FBDB8C]/40 transition-all",
  donationStatIcon: "w-12 h-12 rounded-2xl bg-[#FBDB8C]/10 text-[#FBDB8C] flex items-center justify-center shadow-[0_0_15px_rgba(251,219,140,0.2)]",
  
  // Status Badges
  statusBadgeBase: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border backdrop-blur-sm",
  statusConfirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  statusRejected: "bg-red-500/10 text-red-400 border-red-500/20",
  statusPending: "bg-[#FBDB8C]/10 text-[#FBDB8C] border-[#FBDB8C]/20",
  
  // Roles
  roleBase: "inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
  roleAdmin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  roleUser: "bg-white/5 text-white/40 border-white/10",
  
  // Action Buttons
  actionBtnApprove: "text-[9px] px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95",
  actionBtnReject: "text-[9px] px-4 py-2 bg-red-500/10 text-red-400 border border-red-200 rounded-xl font-black uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95",
};

export const authStyles = {
  // Container
  authCard: "w-full max-w-md bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden",
  topLineDecoration: "absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/60 to-transparent",

  // Header
  headerWrapper: "text-center mb-10",
  headerEmoji: "mb-6 transform hover:scale-110 transition-transform duration-500",
  headerTitle: "text-3xl font-serif text-white font-bold tracking-[0.1em] uppercase drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]",
  headerSubtitle: "text-[#FBDB8C]/40 text-[10px] tracking-[0.3em] font-bold uppercase mt-2",

  // Form
  form: "space-y-6",
  inputGroup: "group",
  inputLabel: "block text-[10px] font-bold text-[#FBDB8C]/40 mb-2 uppercase tracking-[0.2em] group-focus-within:text-[#FBDB8C] transition-colors",
  inputIconWrapper: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none",
  inputBase: "w-full bg-white/5 border border-[#FBDB8C]/10 text-white rounded-xl py-3.5 pl-12 pr-4 focus:border-[#FBDB8C]/40 focus:ring-1 focus:ring-[#FBDB8C]/20 outline-none transition-all placeholder-white/10 text-sm",

  // Buttons
  submitButton: "w-full bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] text-white font-bold py-4 rounded-full shadow-lg hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-3 mt-8 uppercase tracking-[0.2em] text-xs",

  // Footer
  footerBox: "mt-10 text-center pt-8 border-t border-[#FBDB8C]/10",
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
  section: "pt-10 px-4 max-w-6xl mx-auto",
  headerWrapper: "text-center mb-12",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8",

  // Category Cards
  categoryCard: "bg-gradient-to-b from-[#0A194E] to-[#040924] rounded-2xl border border-[#FBDB8C]/10 shadow-lg transition-all hover:shadow-[0_0_30px_rgba(251,219,140,0.1)] hover:-translate-y-1 hover:border-[#FBDB8C]/40 flex flex-col relative overflow-hidden group",
  categoryImageWrapper: "relative h-48 overflow-hidden",
  categoryImage: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
  categoryImageOverlay: "absolute inset-0 bg-transparent",
  categoryContent: "p-8 flex-1 flex flex-col relative z-10",
  categoryTitle: "text-lg font-serif text-white font-bold tracking-wide uppercase",
  fixedPrice: "text-[#FBDB8C] font-black text-2xl mt-4 tracking-tighter drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]",
  amountLabel: "text-[#FBDB8C]/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2",

  // Donation Modal
  modalOverlay: "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in",
  modalContent: "bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)] relative",
  modalHeader: "p-6 border-b border-[#FBDB8C]/10 flex justify-between items-center bg-white/5",
  modalLabel: "block text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-3",
  bankDetailsBox: "p-6 bg-white/5 border border-[#FBDB8C]/10 rounded-2xl text-sm text-white/80 space-y-2 backdrop-blur-md",

  // Payment Proof
  proofBoxBase: "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
  proofBoxActive: "border-[#FBDB8C] bg-[#FBDB8C]/10",
  proofBoxInactive: "border-white/10 bg-white/5 hover:border-[#FBDB8C]/40 hover:bg-white/10",

  // Alerts
  alertBase: "flex items-start gap-4 p-5 border rounded-2xl backdrop-blur-md",
  alertInfo: "bg-blue-900/10 border-blue-500/30",
  alertWarning: "bg-amber-900/10 border-amber-500/30",
  alertDanger: "bg-red-900/10 border-red-500/30",

  alertTitle: "font-black uppercase tracking-widest text-xs",
  alertInfoTitle: "text-blue-400",
  alertWarningTitle: "text-amber-400",
  alertDangerTitle: "text-red-400",

  alertText: "text-xs mt-2 leading-relaxed opacity-80",
  alertInfoText: "text-blue-300",
  alertWarningText: "text-amber-300",
  alertDangerText: "text-red-300",
};

export const kycStyles = {
  // Layout
  container: "max-w-2xl mx-auto space-y-8 animate-fade-in pb-12",
  header: "text-center space-y-4",
  headerIconWrapper: "w-24 h-24 bg-[#0A194E] rounded-full flex items-center justify-center mx-auto border-4 border-[#FBDB8C]/20 shadow-xl",
  headerTitle: "text-3xl font-serif text-white font-bold tracking-widest uppercase",
  headerSubtitle: "text-[#FBDB8C]/40 text-xs font-bold uppercase tracking-[0.2em]",

  // Status Cards
  statusCard: "bg-gradient-to-r from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-2xl p-8 relative overflow-hidden shadow-lg",
  statusCardDecoration: "absolute top-0 left-0 w-1 h-full bg-[#FBDB8C] opacity-30",
  statusCardContent: "flex items-center gap-6 relative z-10",

  statusLabel: "text-[10px] uppercase tracking-[0.3em] text-[#FBDB8C]/40 font-black mb-2",
  statusValue: "text-2xl font-bold font-serif tracking-widest uppercase",
  statusValueApproved: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  statusValueSubmitted: "text-blue-400",
  statusValueRejected: "text-red-400",
  statusValuePending: "text-[#FBDB8C]",

  // Form
  form: "bg-[#0A194E]/40 border border-[#FBDB8C]/10 rounded-3xl p-10 space-y-10 shadow-inner backdrop-blur-md",
  inputGroup: "space-y-4",
  inputLabel: "text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em]",
  uploadBoxBase: "border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-500 relative group cursor-pointer overflow-hidden",
  uploadBoxActive: "border-[#FBDB8C] bg-[#FBDB8C]/10 shadow-[inner_0_0_20px_rgba(251,191,36,0.1)]",
  uploadBoxInactive: "border-white/10 bg-white/5 hover:border-[#FBDB8C]/40 hover:bg-white/10",
  fileInput: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",

  uploadIconActive: "text-[#FBDB8C] mb-4 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]",
  uploadIconInactive: "text-white/20 group-hover:text-[#FBDB8C] transition-colors mb-4",
  uploadFileName: "text-white font-bold tracking-widest truncate w-full px-6",
  uploadStatusText: "text-[10px] text-[#FBDB8C] mt-2 font-black uppercase tracking-widest",
  uploadPlaceholderText: "text-white/30 group-hover:text-white font-bold transition-colors tracking-wide",
  uploadMimeText: "text-[9px] text-white/20 mt-3 uppercase tracking-widest",

  // Rejection
  rejectionBox: "bg-red-900/20 border border-red-900/40 p-6 rounded-2xl text-red-200 text-xs font-bold leading-relaxed",
  rejectionTitle: "font-black uppercase tracking-widest mb-2 text-red-400",
  rejectionReason: "italic text-red-300/80",

  // Button
  submitBtnBase: "w-full py-4.5 rounded-full font-black text-xs tracking-[0.3em] uppercase transition-all duration-500 shadow-xl",
  submitBtnDisabled: "bg-white/5 text-white/20 cursor-not-allowed shadow-none border border-white/5",
  submitBtnEnabled: "bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:-translate-y-1 scale-100 active:scale-95",

  // Info/Success Cards
  infoCard: "text-center p-12 bg-white/5 border border-[#FBDB8C]/10 shadow-2xl rounded-3xl animate-pulse backdrop-blur-md",
  infoTitle: "text-[#FBDB8C] font-serif text-2xl font-bold mb-3 tracking-widest uppercase",
  infoSubtitle: "text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase",
  successCard: "text-center p-12 bg-emerald-900/20 border border-emerald-500/30 shadow-2xl rounded-3xl backdrop-blur-md",
  successTitle: "text-emerald-400 font-serif font-bold text-2xl mb-3 tracking-widest uppercase",
  successSubtitle: "text-emerald-300/60 text-[10px] font-bold tracking-[0.2em] uppercase",

  loadingText: "text-[#FBDB8C] text-center font-serif text-xl tracking-[0.3em] mt-24 animate-pulse uppercase",
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

export const helpStyles = {
  container: "max-w-4xl mx-auto space-y-10 animate-fade-in pb-20",
  header: "text-center space-y-6 mb-16",
  headerIcon: "w-24 h-24 bg-[#0A194E] rounded-full flex items-center justify-center mx-auto border-4 border-[#FBDB8C]/20 shadow-2xl text-[#FBDB8C] mb-6 drop-shadow-[0_0_15px_rgba(251,219,140,0.3)]",
  headerTitle: "text-4xl font-serif text-white font-black tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(251,219,140,0.2)]",
  headerSubtitle: "text-[#FBDB8C]/40 text-sm max-w-xl mx-auto tracking-widest leading-relaxed font-medium uppercase",

  card: "bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-3xl p-10 shadow-[0_0_30px_rgba(0,0,0,0.4)] relative overflow-hidden group transition-all hover:border-[#FBDB8C]/40",
  cardTitle: "text-xl font-serif font-black text-[#FBDB8C] mb-8 flex items-center gap-4 tracking-widest uppercase",

  contactBox: "bg-white/5 border border-[#FBDB8C]/10 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-5 backdrop-blur-md",
  contactEmail: "text-2xl font-black text-white hover:text-[#FBDB8C] transition-colors break-all tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]",
  contactLabel: "text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-[0.4em] mb-2",

  faqItem: "border-b border-[#FBDB8C]/10 py-6 last:border-0",
  faqQuestion: "text-base font-black text-white mb-3 tracking-wide",
  faqAnswer: "text-sm text-white/40 leading-relaxed font-medium",
};

export const royalDashboardStyles = {
  container: "min-h-screen bg-[#060B28] text-white p-4 md:p-8 animate-fade-in",
  headerTitle: "text-2xl md:text-3xl font-serif font-bold text-[#FBDB8C] tracking-[0.1em] uppercase text-center mb-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]",

  statsRow: "grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12",

  // Premium Card
  card: "relative bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.4)] group overflow-hidden h-44",
  cardGlowTop: "absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/60 to-transparent",
  cardGlowBottom: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/60 to-transparent",

  cardIcon: "w-10 h-10 mb-3 text-[#FBDB8C] drop-shadow-[0_0_8px_rgba(251,219,140,0.4)]",
  cardLabel: "text-[10px] font-bold text-[#FBDB8C]/60 uppercase tracking-[0.2em] mb-2",
  cardValue: "text-2xl font-serif font-bold text-white tracking-widest uppercase",

  // Status Badge (Large)
  statusBadge: "relative w-48 h-48 md:w-56 md:h-56 flex flex-col items-center justify-center mx-auto",
  statusRing: "absolute inset-0 rounded-full border-[3px] border-[#FBDB8C]/30 shadow-[0_0_40px_rgba(251,219,140,0.15)] flex items-center justify-center",
  statusRingInner: "absolute w-[92%] h-[92%] rounded-full border border-dashed border-[#FBDB8C]/10 animate-spin-slow",
  statusContent: "relative z-10 flex flex-col items-center text-center p-4 bg-[#060B28]/80 rounded-full backdrop-blur-sm",
  statusIcon: "w-12 h-12 md:w-16 md:h-16 text-[#FBDB8C] mb-2 drop-shadow-[0_0_10px_rgba(251,219,140,0.4)]",
  statusTextPre: "text-[#FBDB8C]/60 font-bold text-[8px] tracking-[0.3em] uppercase mb-1",
  statusText: "text-[#FBDB8C] font-serif font-bold text-sm md:text-base tracking-[0.1em] uppercase",

  // Large Content Area
  mainBox: "relative bg-[#060B27]/50 border border-[#FBDB8C]/10 rounded-2xl min-h-[400px] shadow-inner overflow-hidden flex flex-col items-center p-12",
  mainBoxDecoration: "absolute inset-0 opacity-[0.03] pointer-events-none",

  // Contribution Breakdown
  breakdownWrapper: "w-full max-w-2xl relative z-10",
  breakdownTitle: "text-base font-serif font-black text-[#FBDB8C] tracking-[0.3em] uppercase mb-8 text-center border-b border-[#FBDB8C]/10 pb-4",
  contributionsList: "space-y-4",
  contributionItem: "flex items-center justify-between p-5 bg-white/5 border border-[#FBDB8C]/10 rounded-2xl group hover:bg-white/10 transition-all duration-300",
  contributionName: "text-sm font-bold text-white tracking-widest uppercase",
  contributionAmount: "text-lg font-serif font-black text-[#FBDB8C] drop-shadow-[0_0_8px_rgba(251,219,140,0.2)]",

  // Status Colors (for the tiny KYC status text)
  kycValueApproved: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  kycValueSubmitted: "text-blue-400",
  kycValuePending: "text-[#FBDB8C]/60",
  kycValueRejected: "text-red-400",
};
