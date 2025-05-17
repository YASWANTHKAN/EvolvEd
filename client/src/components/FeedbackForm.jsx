import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { submitFeedback, reset } from '../features/feedback/feedbackSlice';

function FeedbackForm() {
  const [formData, setFormData] = useState({
    rating: 5,
    category: 'UI/UX',
    comment: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useDispatch();
  const { isSuccess, isError, message, isLoading } = useSelector((state) => state.feedback);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message || 'Failed to submit feedback');
      console.error('Feedback error:', message);
    }

    if (isSuccess) {
      toast.success('Feedback submitted successfully!');
      setFormData({
        rating: 5,
        category: 'UI/UX',
        comment: '',
      });
      setIsOpen(false);
    }

    dispatch(reset());
  }, [isSuccess, isError, message, dispatch]);

  const { rating, category, comment } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    
    console.log('Submitting feedback with token:', user.token ? 'Token exists' : 'No token');
    dispatch(submitFeedback(formData));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Help Us Improve
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150"
        >
          {isOpen ? 'Cancel' : 'Give Feedback'}
        </button>
      </div>
      
      {isOpen ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Overall Rating
            </label>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={parseInt(rating) === star}
                    onChange={onChange}
                    className="sr-only"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-8 w-8 ${
                      parseInt(rating) >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Feedback Category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={onChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="UI/UX">User Interface / Experience</option>
              <option value="Features">Features / Functionality</option>
              <option value="Content">Content / Resources</option>
              <option value="Performance">Speed / Performance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Feedback
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              value={comment}
              onChange={onChange}
              placeholder="Tell us what you think or suggest improvements..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-custom hover:bg-custom-dark text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Your feedback will be exported to our Excel database and helps us improve the application.
          </p>
        </form>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          We value your input! Please share your thoughts and help us make this platform better for everyone.
        </p>
      )}
    </div>
  );
}

export default FeedbackForm; 