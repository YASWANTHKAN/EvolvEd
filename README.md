# Evolved AI-Personalized Learning Platform

An AI-powered learning assistant that helps students manage their study materials, create notes, generate flashcards, and track their progress.

## Features

- **AI Notes**: Create, edit, and organize your notes with AI assistance
- **PDF Summarization**: Automatically summarize PDF documents using Mistral-7B AI
- **Flashcards**: Create and study flashcards with spaced repetition
- **Tasks & To-Do**: Manage your study schedule and track your progress
- **Study Timer**: Track your study sessions and maintain focus

## PDF Summarization with Mistral-7B

This application includes a powerful PDF summarization feature that uses the Mistral-7B-Instruct-v0.3 Large Language Model to generate concise summaries of your PDF documents.

### How to Use PDF Summarization

1. **Navigate to Notes**: Go to the Notes section of the application.
2. **Create a New Note**: Click on "Create New Note".
3. **Upload a PDF**: Use the upload area to select a PDF file from your computer.
4. **Click "Summarize with AI"**: Once your PDF is uploaded, click the "Summarize with AI" button.
5. **Configure Summarization Options**:
   - **Summary Length**: Choose between short (1-2 paragraphs), medium (3-5 paragraphs), or long (comprehensive).
   - **Summary Style**: Choose between concise, detailed, or bullet points.
   - **Focus Area**: Choose between general overview, key concepts, or technical details.
6. **Generate Summary**: Click the "Generate Summary" button to start the summarization process.
7. **Review and Edit**: The generated summary will be added to your note content. You can review and edit it as needed.
8. **Save Note**: Click "Save Note" to save your note with the PDF and generated summary.

### Setup Mistral-7B for Local Summarization

For the full PDF summarization experience, you'll need to set up Mistral-7B locally:

1. **Install Required Packages**:
   ```bash
   npm install
   ```

2. **Download the Mistral-7B Model**:
   ```bash
   mkdir -p ~/mistral_models/7B-Instruct-v0.3
   python -c "from huggingface_hub import snapshot_download; from pathlib import Path; mistral_models_path = Path.home().joinpath('mistral_models', '7B-Instruct-v0.3'); mistral_models_path.mkdir(parents=True, exist_ok=True); snapshot_download(repo_id='mistralai/Mistral-7B-Instruct-v0.3', allow_patterns=['params.json', 'consolidated.safetensors', 'tokenizer.model.v3'], local_dir=mistral_models_path)"
   ```

3. **Verify Installation**:
   The model files should be located in `~/mistral_models/7B-Instruct-v0.3/`.

4. **Start the Application**:
   ```bash
   npm run dev
   ```

If the Mistral model is not found or cannot be loaded, the application will fall back to a simulation mode that provides example summaries.

## Development

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB
- Supabase account (for PDF storage)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/AI-Personalized-Learning.git
   ```

2. Install dependencies
   ```bash
   npm run setup
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.

# EvolvEd - AI-Powered Learning Assistant

EvolvEd is a comprehensive MERN (MongoDB, Express, React, Node.js) stack application designed to enhance the learning experience with AI-powered features. It includes flashcards, notes, and task management to help students organize and optimize their study sessions.

## Features

- **User Authentication**: Secure login and registration system
- **AI Notes**: Create, edit and organize your study notes with AI assistance
- **Flashcards**: Create and study flashcards with spaced repetition
- **Tasks & To-Do**: Manage your study schedule and track your progress
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, Redux, TailwindCSS, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI API

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or higher)
- MongoDB account (for database)
- OpenAI API key (for AI features)

## Installation

1. Clone the repository
   ```
   git clone https://github.com/lakshmip04/EvolvEd-main.git
   cd EvolvEd-main
   ```

2. Install dependencies for backend and frontend
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server
   ```
   npm run dev
   ```

This will start both the backend server and the React frontend concurrently. The application will be available at http://localhost:3000.

## Project Structure

```
EvolvEd/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── app/            # Redux store
│       ├── components/     # Reusable components
│       ├── features/       # Redux slices
│       └── pages/          # Page components
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   └── routes/             # API routes
├── .env                    # Environment variables
└── package.json            # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/me` - Get current user profile

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Flashcards
- `GET /api/flashcards` - Get all flashcard decks
- `POST /api/flashcards` - Create a new deck
- `GET /api/flashcards/:id` - Get a specific deck
- `PUT /api/flashcards/:id` - Update a deck
- `DELETE /api/flashcards/:id` - Delete a deck
- `POST /api/flashcards/:id/cards` - Add a card to a deck
- `PUT /api/flashcards/:id/cards/:cardId` - Update a specific card
- `DELETE /api/flashcards/:id/cards/:cardId` - Delete a specific card

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## 🤝 Author

Built by **Yaswanth Kancharla** 

Feel free to ⭐ the repo and contribute!

