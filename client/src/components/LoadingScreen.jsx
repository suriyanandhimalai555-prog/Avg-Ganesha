/**
 * Shared loading state.
 *
 * Three variants:
 *  - `outlet`     (default) — renders inside a page layout that has a header.
 *                              Sizes itself relative to the viewport so the
 *                              loader visually centers in the available area,
 *                              not below the fold.
 *  - `fullscreen`            — fills the entire viewport (use only outside a
 *                              layout, e.g. for an initial app boot screen).
 *  - `inline`                — for embedding inside a table cell or card.
 *                              Provides only vertical padding; the surrounding
 *                              element controls width.
 *
 * Three sizes (`sm` | `md` | `lg`) tune the glyph and label dimensions so the
 * same component can sit inside a dense table row or a hero section.
 */

const CONTAINER = {
  // 12rem ≈ DashboardLayout / AdminLayout header + main padding.
  // Using `calc(100vh - 12rem)` ensures the loader centers in the visible
  // outlet area regardless of which layout is wrapping the route.
  outlet: 'min-h-[calc(100vh-12rem)] md:min-h-[calc(100vh-14rem)]',
  fullscreen: 'min-h-screen',
  inline: 'py-16',
};

const SIZE = {
  sm: {
    img: 'w-10 h-10',
    label: 'text-[10px] tracking-[0.25em]',
    gap: 'gap-3',
    border: 'border',
  },
  md: {
    img: 'w-12 h-12',
    label: 'text-xs tracking-[0.25em]',
    gap: 'gap-3',
    border: 'border',
  },
  lg: {
    img: 'w-16 h-16',
    label: 'text-sm tracking-[0.2em]',
    gap: 'gap-4',
    border: 'border-2',
  },
};

const LoadingScreen = ({
  message = 'Loading...',
  variant = 'outlet',
  size = 'lg',
  className = '',
}) => {
  const c = CONTAINER[variant] || CONTAINER.outlet;
  const s = SIZE[size] || SIZE.lg;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex w-full items-center justify-center ${c} ${className}`}
    >
      <div className={`flex flex-col items-center ${s.gap}`}>
        <img
          src="/Ganesha.jpeg"
          alt=""
          aria-hidden="true"
          className={`${s.img} rounded-full animate-pulse ${s.border} border-[#FBDB8C]/30`}
        />
        <p
          className={`text-[#FBDB8C] font-serif animate-pulse uppercase ${s.label}`}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
