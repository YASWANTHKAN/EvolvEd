import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { useState, useEffect } from 'react';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Apply dark mode on theme change
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="transition-transform hover:scale-105">
                  <img className="h-10 w-auto" src="/logo.png" alt="EvolvEd" />
                </Link>
              </div>
              {user && (
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <Link 
                    to="/" 
                    className={`${
                      window.location.pathname === '/' 
                        ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/notes" 
                    className={`${
                      window.location.pathname === '/notes' 
                        ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    AI Notes
                  </Link>
                  <Link 
                    to="/flashcards" 
                    className={`${
                      window.location.pathname === '/flashcards' 
                        ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    Flashcards
                  </Link>
                  <Link 
                    to="/tasks" 
                    className={`${
                      window.location.pathname === '/tasks' 
                        ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    Tasks
                  </Link>
                  <Link
                    to="/paint"
                    className={`${
                        window.location.pathname === '/paint'
                            ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    Take Notes
                  </Link>
                  <Link
                    to="/chatbot"
                    className={`${
                        window.location.pathname === '/chatbot'
                            ? 'text-indigo-600 dark:text-indigo-400 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
                  >
                    AI Chatbot
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center">
              {user && (
                <div className="sm:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                  >
                    <span className="sr-only">Open main menu</span>
                    {!isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              {user ? (
                <div className="ml-4 flex items-center space-x-4">
                  <button 
                    onClick={toggleDarkMode} 
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>
                  <button 
                    onClick={onLogout} 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="ml-4 flex items-center space-x-4">
                  <button 
                    onClick={toggleDarkMode} 
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>
                  <Link 
                    to="/login" 
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {user && (
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
            <div className="fixed inset-0 z-40 bg-gray-800 bg-opacity-75" onClick={toggleMobileMenu}></div>
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto pb-12" 
                style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
              <div className="px-4 pt-5 pb-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <img className="h-8 w-auto" src="/logo.png" alt="EvolvEd" />
                  </div>
                  <button
                    onClick={toggleMobileMenu}
                    className="rounded-md p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-6">
                  <nav className="space-y-2">
                    <Link 
                      to="/" 
                      className={`${
                        window.location.pathname === '/' 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/notes" 
                      className={`${
                        window.location.pathname === '/notes' 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      AI Notes
                    </Link>
                    <Link 
                      to="/flashcards" 
                      className={`${
                        window.location.pathname === '/flashcards' 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      Flashcards
                    </Link>
                    <Link 
                      to="/tasks" 
                      className={`${
                        window.location.pathname === '/tasks' 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      Tasks
                    </Link>
                    <Link
                      to="/paint"
                      className={`${
                        window.location.pathname === '/paint'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      Take Notes
                    </Link>
                    <Link
                      to="/chatbot"
                      className={`${
                        window.location.pathname === '/chatbot'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                      onClick={toggleMobileMenu}
                    >
                      AI Chatbot
                    </Link>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          onLogout();
                          toggleMobileMenu();
                        }} 
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Header; 