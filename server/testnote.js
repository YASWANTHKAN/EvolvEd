require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!');
    
    // Define the Note schema (same as your noteModel.js)
    const noteSchema = mongoose.Schema({
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      title: {
        type: String,
        required: [true, 'Please add a title']
      },
      content: {
        type: String,
        required: [true, 'Please add content']
      },
      tags: {
        type: [String],
        default: []
      },
      images: {
        type: [String],
        default: []
      }
    }, {
      timestamps: true
    });

    const Note = mongoose.model('Note', noteSchema);
    
    // Create a mock ObjectId for testing
    const mockUserId = new mongoose.Types.ObjectId();
    console.log('Using mock user ID:', mockUserId.toString());
    
    // Create a test note
    return Note.create({
      user: mockUserId,
      title: 'Test Note',
      content: 'This is a test note content',
      tags: ['test']
    });
  })
  .then(note => {
    console.log('Test note created successfully:', note);
    return mongoose.connection.close();
  })
  .then(() => console.log('Connection closed.'))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
