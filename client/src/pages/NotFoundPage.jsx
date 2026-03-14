import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-4 animate-float">🐘</div>
      <h1 className="text-9xl font-bold font-serif text-gs-teal/10 tracking-widest">404</h1>

      <h2 className="text-3xl font-serif font-bold text-gs-navy mt-4">Page Not Found</h2>

      <p className="text-gray-500 mt-2 mb-8 max-w-md font-medium">
        Even Lord Ganesha's wisdom cannot find this page. It may have been moved or does not exist.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="bg-gs-teal hover:bg-[#1A7566] hover:-translate-y-0.5 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg hover:shadow-xl"
      >
        🙏 Return to Temple
      </button>
    </div>
  );
};

export default NotFoundPage;