import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import NotePage from "./pages/NotePage";
import Flashcards from "./pages/Flashcards";
import FlashcardDeck from "./pages/FlashcardDeck";
import Tasks from "./pages/Tasks";
import PDFStudy from "./pages/PDFStudy";
import PaintPage from "./pages/PaintPage";
import PrivateRoute from "./components/PrivateRoute";
import Chatbot from "./pages/Chatbot";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:id" element={<NotePage />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/flashcards/:id" element={<FlashcardDeck />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/pdfstudy" element={<PDFStudy />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/paint" element={<PaintPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ToastContainer
        theme="colored"
        toastClassName="!bg-gray-800 !text-white"
        progressClassName="!bg-gray-300"
      />
    </Router>
  );
}

export default App;
