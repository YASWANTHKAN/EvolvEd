import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PDFUploader from './PDFUploader';

function NoteEditor({ initialContent = '', onContentChange, onPDFSelect }) {
  const [noteContent, setNoteContent] = useState(initialContent);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const handleNoteChange = (e) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    if (onContentChange) onContentChange(newContent);
  };

  const insertMarkdown = (markdownSymbol, multiline = false) => {
    const textarea = document.getElementById('noteContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end);
    
    let newText;
    
    if (multiline) {
      // For multiline elements like lists, code blocks, etc.
      if (selectedText) {
        // If text is selected, wrap each line
        const lines = selectedText.split('\n');
        const modifiedLines = lines.map(line => `${markdownSymbol} ${line}`);
        newText = noteContent.substring(0, start) + modifiedLines.join('\n') + noteContent.substring(end);
      } else {
        // If no text is selected, just insert the markdown symbol
        newText = noteContent.substring(0, start) + `${markdownSymbol} ` + noteContent.substring(end);
      }
    } else {
      // For inline elements like bold, italic, etc.
      if (selectedText) {
        newText = noteContent.substring(0, start) + `${markdownSymbol}${selectedText}${markdownSymbol}` + noteContent.substring(end);
      } else {
        newText = noteContent.substring(0, start) + `${markdownSymbol}place text here${markdownSymbol}` + noteContent.substring(end);
      }
    }
    
    setNoteContent(newText);
    if (onContentChange) onContentChange(newText);
    
    // Set focus back to textarea and update cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        const newCursorPos = multiline 
          ? start + newText.length - noteContent.length 
          : start + markdownSymbol.length + selectedText.length + markdownSymbol.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else {
        const placeholderText = multiline ? '' : 'place text here';
        const newCursorPos = start + markdownSymbol.length + (multiline ? 1 : 0);
        const endPos = newCursorPos + placeholderText.length;
        textarea.setSelectionRange(newCursorPos, endPos);
      }
    }, 0);
  };

  // Simple markdown renderer
  const renderMarkdown = (content) => {
    if (!content) return '';
    
    // Convert headers
    let html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert bold, italic, and code
    html = html
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Convert lists
    html = html
      .replace(/^\s*\n\*\s(.*)/gim, '<ul><li>$1</li></ul>')
      .replace(/^\s*\n-\s(.*)/gim, '<ul><li>$1</li></ul>');
    
    // Fix broken lists
    html = html
      .replace(/<\/ul>\s?<ul>/gim, '')
      .replace(/^\s*\n\d\.\s(.*)/gim, '<ol><li>$1</li></ol>')
      .replace(/<\/ol>\s?<ol>/gim, '');
    
    // Convert paragraphs
    html = html.replace(/^\s*(\n)?(.+)/gim, function(m) {
      return /\<(\/)?(h1|h2|h3|ul|ol|li|blockquote|code)/.test(m) ? m : '<p>' + m + '</p>';
    });
    
    // Convert line breaks
    html = html.replace(/\n/gim, '<br />');
    
    return html;
  };

  return (
    <div className="note-editor">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Toolbar */}
        <div className="px-4 py-2 flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 overflow-x-auto">
          <div className="flex space-x-1 mr-auto">
            <button 
              onClick={() => insertMarkdown('# ')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
              title="Heading 1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <button 
              onClick={() => insertMarkdown('## ')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
              title="Heading 2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <button 
              onClick={() => insertMarkdown('**')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold" 
              title="Bold"
            >
              B
            </button>
            <button 
              onClick={() => insertMarkdown('*')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 italic" 
              title="Italic"
            >
              I
            </button>
            <button 
              onClick={() => insertMarkdown('`')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-mono" 
              title="Code"
            >
              {'</>'}
            </button>
            <button 
              onClick={() => insertMarkdown('- ', true)}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
              title="List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-1.5 rounded ${isPreviewMode ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
            title="Toggle Preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        
        {/* Editor */}
        <div className="w-full">
          {isPreviewMode ? (
            <div 
              className="markdown-preview p-4 min-h-[300px] prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(noteContent) }}
            />
          ) : (
            <textarea
              id="noteContent"
              value={noteContent}
              onChange={handleNoteChange}
              className="w-full min-h-[300px] p-4 border-0 focus:ring-0 focus:outline-none dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 font-mono"
              placeholder="Write your notes here... Use Markdown for formatting."
            />
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Markdown supported</span>
          <span>{noteContent.length} characters</span>
        </div>
      </div>
      
      {onPDFSelect && (
        <div className="mt-4">
          <PDFUploader onPDFSelect={onPDFSelect} />
        </div>
      )}
    </div>
  );
}

NoteEditor.propTypes = {
  initialContent: PropTypes.string,
  onContentChange: PropTypes.func,
  onPDFSelect: PropTypes.func
};

export default NoteEditor;
