import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import FlashcardUploader from "../components/FlashcardUploader";
import { getDecks } from "../features/flashcards/flashcardSlice";
import Timer from '../components/Timer';

function Flashcards() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { decks, isLoading, isError, message } = useSelector(
    (state) => state.flashcards
  );
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [view, setView] = useState("grid"); // grid or list view

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(getDecks());
    }

    if (isError) {
      toast.error(message);
    }
  }, [user, navigate, dispatch, isError, message]);

  const handleTimerComplete = () => {
    toast.success('Study session completed!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading flashcard decks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Flashcard Decks
              </h1>
              <p className="text-indigo-100 text-lg max-w-2xl">
                Create and study flashcards to improve retention and master any subject. Upload PDFs to automatically generate cards.
              </p>
            </div>
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="group bg-white text-indigo-600 rounded-full px-6 py-3 font-medium inline-flex items-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Deck
            </button>
          </div>

          {/* Study Timer and View Toggles */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 md:p-3">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium">Study Timer:</span>
                <div className="px-3 py-1 bg-white/20 rounded-md text-white">
                  <Timer initialMinutes={15} onComplete={handleTimerComplete} />
                </div>
              </div>
              
              <div className="flex ml-auto space-x-2 md:space-x-4 items-center">
                <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-lg ${view === 'grid' 
                      ? 'bg-white/20 text-white' 
                      : 'text-indigo-100 hover:bg-white/10'}`}
                    aria-label="Grid view"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-lg ${view === 'list' 
                      ? 'bg-white/20 text-white' 
                      : 'text-indigo-100 hover:bg-white/10'}`}
                    aria-label="List view"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Decks Section */}
      <div className="px-4 md:px-6">
        <div className={view === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'}>
          {decks.length > 0 ? (
            decks.map((deck) => (
              <div
                key={deck._id}
                className={`group ${view === 'grid' 
                  ? 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200' 
                  : 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 flex'} 
                  transition-all duration-300 relative`
                }
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <div className={view === 'grid' ? 'p-6' : 'p-5 flex-grow'}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {deck.title}
                        </h3>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium ml-2">
                          {deck.cards?.length || 0} cards
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {deck.description || "No description provided."}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {/* Progress indicators */}
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`flex h-2 w-2 rounded-full ${
                                i < (deck.studyCount || 0)
                                  ? "bg-purple-500"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            ></span>
                          ))}
                        </div>
                        <Link
                          to={`/flashcards/${deck._id}`}
                          className="text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                          Study Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 bg-white rounded-xl p-10 shadow-sm text-center">
              <div className="mx-auto w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No flashcard decks found</h3>
              <p className="text-gray-600 mb-6">Create your first deck by clicking the button below</p>
              <button
                onClick={() => setIsUploaderOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium inline-flex items-center shadow-sm hover:shadow transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create New Deck
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Flashcard Uploader Modal */}
      {isUploaderOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create New Flashcard Deck
              </h2>
              <button
                onClick={() => setIsUploaderOpen(false)}
                className="text-white hover:text-indigo-100 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <FlashcardUploader
                onClose={() => {
                  setIsUploaderOpen(false);
                  dispatch(getDecks()); // Refresh decks after upload
                }}
                onPDFSelect={() => {
                  setIsUploaderOpen(false);
                  dispatch(getDecks()); // Refresh decks after upload
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
