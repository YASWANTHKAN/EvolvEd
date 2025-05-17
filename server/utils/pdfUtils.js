const pdf = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Extract text from a PDF buffer
 * @param {Buffer} pdfBuffer - Buffer containing the PDF data
 * @returns {Promise<string>} - Extracted text from the PDF
 */
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    // Parse the PDF buffer
    const data = await pdf(pdfBuffer);
    
    // Return the text content
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Cleans and formats the extracted text
 * @param {string} text - Raw text extracted from PDF
 * @returns {string} - Cleaned and formatted text
 */
const cleanPDFText = (text) => {
  if (!text) return '';
  
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Remove non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
  
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * Download a PDF from a URL and return it as a buffer
 * @param {string} url - URL of the PDF to download
 * @returns {Promise<Buffer>} - Buffer containing the PDF data
 */
const downloadPDF = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
};

/**
 * Extract text from a PDF file at a given path
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text from the PDF
 */
const extractTextFromPDFFile = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read the PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Use the buffer extraction function
    return await extractTextFromPDF(dataBuffer);
  } catch (error) {
    console.error('Error reading PDF file:', error);
    throw new Error(`Failed to read PDF file: ${error.message}`);
  }
};

/**
 * Extract text from a PDF URL
 * @param {string} url - URL of the PDF to extract text from
 * @returns {Promise<string>} - Extracted text from the PDF
 */
const extractTextFromPDFUrl = async (url) => {
  try {
    const pdfBuffer = await downloadPDF(url);
    return await extractTextFromPDF(pdfBuffer);
  } catch (error) {
    console.error('Error extracting text from PDF URL:', error);
    throw new Error(`Failed to extract text from PDF URL: ${error.message}`);
  }
};

/**
 * Save a PDF buffer to a temporary file
 * @param {Buffer} pdfBuffer - Buffer containing the PDF data
 * @returns {Promise<string>} - Path to the saved PDF file
 */
const savePDFToTemp = async (pdfBuffer) => {
  const tempDir = path.join(__dirname, '../temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);
  await writeFileAsync(tempFilePath, pdfBuffer);
  return tempFilePath;
};

/**
 * Clean up temporary PDF file
 * @param {string} filePath - Path to the temporary PDF file
 */
const cleanupTempPDF = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temporary PDF:', error);
  }
};

module.exports = {
  extractTextFromPDF,
  downloadPDF,
  extractTextFromPDFFile,
  extractTextFromPDFUrl,
  savePDFToTemp,
  cleanupTempPDF,
  cleanPDFText
}; 