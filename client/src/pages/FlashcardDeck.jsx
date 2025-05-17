import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getDeck,
  updateCardStats,
  deleteDeck,
} from "../features/flashcards/flashcardSlice";
import { toast } from "react-toastify";

function FlashcardDeck() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { deck, isLoading, isError, message } = useSelector(
    (state) => state.flashcards
  );

  // State for the current flashcard being shown
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  // State to track if the card is flipped to show the answer
  const [isFlipped, setIsFlipped] = useState(false);
  // State for tracking study progress
  const [progress, setProgress] = useState(0);
  // State to track if all cards are completed
  const [isCompleted, setIsCompleted] = useState(false);
  // State to track correct answers
  const [correctCount, setCorrectCount] = useState(0);
  // State to track wrong answers
  const [wrongCount, setWrongCount] = useState(0);
  // State to track if updating card status
  const [isUpdating, setIsUpdating] = useState(false);
  // State to track if delete modal is open
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State to track if deck is being deleted
  const [isDeleting, setIsDeleting] = useState(false);

  const limitedCards = deck?.cards?.slice(0, 10);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isError) {
      toast.error(message);
      return;
    }

    dispatch(getDeck(id));
  }, [user, navigate, id, dispatch, isError, message]);

  useEffect(() => {
    // Update progress based on current card index
    if (deck?.cards?.length) {
      setProgress(Math.floor((currentCardIndex / limitedCards.length) * 100));
    }
  }, [currentCardIndex, deck?.cards?.length]);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (limitedCards && currentCardIndex < limitedCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else if (limitedCards && currentCardIndex === limitedCards.length - 1) {
      // Show completion screen when reaching the end of the deck
      setIsCompleted(true);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const resetDeck = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setProgress(0);
    setIsCompleted(false);
    setCorrectCount(0);
    setWrongCount(0);
  };

  const markCorrect = async () => {
    if (!deck?.cards?.[currentCardIndex]?._id || isUpdating) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updateCardStats({
          deckId: deck._id,
          cardId: limitedCards[currentCardIndex]._id,
          statsData: {
            status: "correct",
            interval: limitedCards[currentCardIndex].interval * 2 || 1,
            easeFactor: Math.min(
              limitedCards[currentCardIndex].easeFactor * 1.1 || 2.5,
              2.5
            ),
            repetitions: (limitedCards[currentCardIndex].repetitions || 0) + 1,
            nextReview: new Date(
              Date.now() +
                (limitedCards[currentCardIndex].interval * 2 || 1) *
                  24 *
                  60 *
                  60 *
                  1000
            ),
          },
        })
      ).unwrap();
      setCorrectCount(correctCount + 1);
      nextCard();
    } catch (error) {
      console.error("Error updating card status:", error);
      toast.error("Failed to update card status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const markIncorrect = async () => {
    if (!deck?.cards?.[currentCardIndex]?._id || isUpdating) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updateCardStats({
          deckId: deck._id,
          cardId: limitedCards[currentCardIndex]._id,
          statsData: {
            status: "incorrect",
            interval: 1,
            easeFactor: Math.max(
              limitedCards[currentCardIndex].easeFactor * 0.85 || 2.5,
              1.3
            ),
            repetitions: 0,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // Review again in 24 hours
          },
        })
      ).unwrap();
      setWrongCount(wrongCount + 1);
      nextCard();
    } catch (error) {
      console.error("Error updating card status:", error);
      toast.error("Failed to update card status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete deck
  const handleDeleteDeck = async () => {
    if (!deck?._id || isDeleting) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteDeck(deck._id)).unwrap();
      toast.success("Deck deleted successfully");
      navigate("/flashcards");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error("Failed to delete deck. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Summary screen after completing all cards
  if (deck?.cards?.length > 0 && limitedCards.length === currentCardIndex + 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/flashcards")}
            className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-custom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Decks
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center text-red-600 hover:text-red-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Delete Deck
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Flashcard Study Complete!
          </h1>

          <div className="flex justify-center space-x-12 mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {correctCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Correct</div>
            </div>

            <div className="text-center">
              <div className="text-5xl font-bold text-red-600 mb-2">
                {wrongCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Wrong</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetDeck}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !deck) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!limitedCards || limitedCards.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No cards found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This deck doesn't have any flashcards yet.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate("/flashcards")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Decks
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete Deck
          </button>
        </div>
      </div>
    );
  }

  // Limit the number of cards to 10

  // Regular flashcard view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/flashcards")}
          className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-custom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Decks
        </button>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Card {currentCardIndex + 1} of {Math.min(limitedCards.length, 10)}
          {limitedCards.length > 10 && (
            <span className="text-xs ml-1">(Limited to 10)</span>
          )}
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center text-red-600 hover:text-red-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Delete Deck
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {deck.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {deck.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-8">
          <div
            className="bg-custom h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Flashcard */}
        <div
          className={`w-full aspect-[3/2] bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm p-8 mb-8 flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isFlipped ? "bg-blue-50 dark:bg-blue-900" : ""
          }`}
          onClick={flipCard}
        >
          <div className="text-center">
            <div className="absolute top-4 right-4 text-xs font-medium text-gray-400">
              {isFlipped ? "Answer" : "Question"}
            </div>
            <p className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white">
              {isFlipped
                ? limitedCards[currentCardIndex].back
                : limitedCards[currentCardIndex].front}
            </p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Click to {isFlipped ? "see question" : "reveal answer"}
            </div>
          </div>
        </div>

        {/* Navigation and feedback buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${
              currentCardIndex === 0
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Previous
          </button>

          {isFlipped && (
            <div className="flex space-x-3">
              <button
                onClick={markIncorrect}
                disabled={isUpdating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${
                  isUpdating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isUpdating ? (
                  <div className="w-5 h-5 mr-1 border-t-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                Incorrect
              </button>

              <button
                onClick={markCorrect}
                disabled={isUpdating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
                  isUpdating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isUpdating ? (
                  <div className="w-5 h-5 mr-1 border-t-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                Correct
              </button>
            </div>
          )}

          <button
            onClick={nextCard}
            disabled={
              (currentCardIndex === Math.min(limitedCards.length, 10) - 1 &&
                !isFlipped) ||
              isUpdating
            }
            className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${
              (currentCardIndex === Math.min(limitedCards.length, 10) - 1 &&
                !isFlipped) ||
              isUpdating
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Delete Flashcard Deck
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete this deck? This action
                      cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDeck}
                  disabled={isDeleting}
                  className={`inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm ${
                    isDeleting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-t-2 border-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Deck"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardDeck;
