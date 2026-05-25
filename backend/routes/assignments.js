const express = require('express');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');
const Assignment = require('../models/Assignment');

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads/assignments');
const paperDir = path.resolve(__dirname, '../downloads');

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(paperDir, { recursive: true });

router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'Database is not connected. Please set a valid MONGO_URI and redeploy.',
    });
    return;
  }
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, JPEG, and PNG files are allowed.'));
  },
});

const handleUpload = (req, res, next) => {
  upload.single('document')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    res.status(400).json({ message: error.message || 'Unable to upload file.' });
  });
};

const cleanSentence = (sentence) =>
  sentence
    .replace(/\s+/g, ' ')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .trim();

const optionLabel = (index) => String.fromCharCode(65 + index);

const safeFileName = (value = 'question-paper') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'question-paper';

const readLegacyQuestionType = (row = {}) => {
  if (typeof row.type === 'string' && row.type.trim()) return row.type;
  const legacyText = Object.keys(row)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => row[key])
    .join('');
  return legacyText || 'Question';
};

const normalizeQuestionType = (row = {}) => ({
  type: readLegacyQuestionType(row),
  count: Number(row.count) > 0 ? Number(row.count) : 1,
  marks: Number(row.marks) > 0 ? Number(row.marks) : 1,
});

const toSafeString = (value, fallback = '') => (typeof value === 'string' && value.trim() ? value : fallback);

const normalizeGeneratedQuestion = (row = {}) => ({
  type: toSafeString(row.type, 'Question'),
  question: toSafeString(row.question, 'Question text unavailable.'),
  options: Array.isArray(row.options) ? row.options.filter((option) => typeof option === 'string' && option.trim()) : [],
  answer: toSafeString(row.answer),
  correctOptionIndex: Number.isInteger(row.correctOptionIndex) ? row.correctOptionIndex : 0,
  bloomLevel: toSafeString(row.bloomLevel, 'understand'),
  difficulty: toSafeString(row.difficulty, 'medium'),
  marks: Number(row.marks) > 0 ? Number(row.marks) : 1,
  source: toSafeString(row.source),
});

const normalizeAssignmentResponse = (assignmentDoc = {}) => {
  const assignment = assignmentDoc.toObject ? assignmentDoc.toObject() : assignmentDoc;
  const questionTypes = Array.isArray(assignment.questionTypes)
    ? assignment.questionTypes.map(normalizeQuestionType)
    : [];
  const generatedQuestions = Array.isArray(assignment.generatedQuestions)
    ? assignment.generatedQuestions.map(normalizeGeneratedQuestion)
    : [];
  const calculatedQuestions = questionTypes.reduce((sum, row) => sum + row.count, 0);
  const calculatedMarks = questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);

  return {
    ...assignment,
    title: toSafeString(assignment.title, 'Untitled Assignment'),
    subject: toSafeString(assignment.subject, 'General'),
    topic: toSafeString(assignment.topic, 'Assignment Paper'),
    description: toSafeString(assignment.description),
    documentName: toSafeString(assignment.documentName),
    documentPath: toSafeString(assignment.documentPath),
    documentMimeType: toSafeString(assignment.documentMimeType),
    assignedOn: toSafeString(assignment.assignedOn),
    dueDate: toSafeString(assignment.dueDate),
    questionTypes,
    generatedQuestions,
    totalQuestions: Number(assignment.totalQuestions) > 0 ? Number(assignment.totalQuestions) : calculatedQuestions,
    totalMarks: Number(assignment.totalMarks) > 0 ? Number(assignment.totalMarks) : calculatedMarks,
  };
};

const groupGeneratedQuestions = (questions = []) =>
  questions.reduce((groups, question) => {
    const key = question.type || 'Questions';
    if (!groups[key]) groups[key] = [];
    groups[key].push(question);
    return groups;
  }, {});

const extractPdfText = async (file) => {
  if (!file || file.mimetype !== 'application/pdf') return '';
  try {
    const dataBuffer = await fsPromises.readFile(file.path);
    const parser = new PDFParse({ data: dataBuffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || '';
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error('PDF text extraction failed for uploaded file:', error.message);
    return '';
  }
};

const extractPdfTextFromPath = async (documentPath) => {
  if (!documentPath) return '';
  const relativePath = documentPath.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(__dirname, '../uploads', relativePath);
  const uploadsRoot = path.resolve(__dirname, '../uploads');

  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) return '';
  try {
    const dataBuffer = await fsPromises.readFile(absolutePath);
    const parser = new PDFParse({ data: dataBuffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || '';
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error('PDF text extraction failed from saved path:', error.message);
    return '';
  }
};

const getSentences = (text) =>
  text
    .replace(/\r/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSentence)
    .filter((sentence) => sentence.length > 35 && sentence.length < 260)
    .filter((sentence, index, list) => list.indexOf(sentence) === index);

const createQuestionText = (type, source, index) => {
  const normalizedType = type.toLowerCase();
  const trimmedSource = source.replace(/[.!?]+$/, '');

  if (normalizedType.includes('multiple')) {
    return `Which option best explains this idea from the document: "${trimmedSource}"?`;
  }

  if (normalizedType.includes('diagram') || normalizedType.includes('graph')) {
    return `Draw or label a diagram that represents this idea: "${trimmedSource}".`;
  }

  if (normalizedType.includes('numerical')) {
    return `Create and solve a numerical problem using the concept described here: "${trimmedSource}".`;
  }

  return `Explain the following concept in your own words: "${trimmedSource}".`;
};

const createAnswerText = (type, source) => {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes('multiple')) {
    return source;
  }

  if (normalizedType.includes('diagram') || normalizedType.includes('graph')) {
    return `The diagram should clearly represent: ${source}`;
  }

  if (normalizedType.includes('numerical')) {
    return `A valid response should define values from the concept, show steps, and conclude using: ${source}`;
  }

  return source;
};

const createOptions = (type, source, sentences, questionIndex) => {
  if (!type.toLowerCase().includes('multiple')) return [];

  const distractors = sentences
    .filter((sentence) => sentence !== source)
    .slice(questionIndex, questionIndex + 3);

  const fallbackDistractors = [
    'It is unrelated to the main topic.',
    'It describes an opposite process.',
    'It only refers to memorizing definitions.',
  ];

  return [
    source,
    ...distractors,
    ...fallbackDistractors,
  ].slice(0, 4);
};

const getBloomLevel = (type) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('multiple')) return 'remember';
  if (normalizedType.includes('numerical')) return 'apply';
  if (normalizedType.includes('diagram') || normalizedType.includes('graph')) return 'analyze';
  return 'understand';
};

const getDifficulty = (type, marks) => {
  if (marks >= 5) return 'hard';
  if (type.toLowerCase().includes('multiple')) return 'easy';
  return 'medium';
};

const generateQuestionsFromText = (text, questionTypes = []) => {
  const sentences = getSentences(text);
  if (sentences.length === 0) return [];

  const requestedTypes = questionTypes.length > 0
    ? questionTypes
    : [{ type: 'Short Questions', count: 5, marks: 1 }];

  const questions = [];
  requestedTypes.forEach((row) => {
    const count = Math.max(1, Number(row.count) || 1);
    const marks = Math.max(1, Number(row.marks) || 1);

    for (let index = 0; index < count; index += 1) {
      const source = sentences[questions.length % sentences.length];
      const type = row.type || 'Question';
      questions.push({
        type,
        question: createQuestionText(type, source, questions.length),
        options: createOptions(type, source, sentences, questions.length),
        answer: createAnswerText(type, source),
        correctOptionIndex: 0,
        bloomLevel: getBloomLevel(type),
        difficulty: getDifficulty(type, marks),
        marks,
        source,
      });
    }
  });

  return questions;
};

const parseAssignmentBody = async (body, file) => {
  const parsed = { ...body };
  parsed.title = toSafeString(parsed.title, 'New Assignment');
  parsed.subject = toSafeString(parsed.subject, 'General');
  parsed.topic = toSafeString(parsed.topic, 'Assignment Paper');
  parsed.description = toSafeString(parsed.description);

  if (typeof parsed.questionTypes === 'string') {
    try {
      parsed.questionTypes = JSON.parse(parsed.questionTypes);
    } catch (error) {
      parsed.questionTypes = [];
    }
  }

  if (Array.isArray(parsed.questionTypes)) {
    parsed.questionTypes = parsed.questionTypes.map(normalizeQuestionType);
  } else {
    parsed.questionTypes = [];
  }

  if (typeof parsed.totalQuestions === 'string') {
    parsed.totalQuestions = Number(parsed.totalQuestions);
  }

  if (typeof parsed.totalMarks === 'string') {
    parsed.totalMarks = Number(parsed.totalMarks);
  }

  if (!Number.isFinite(parsed.totalQuestions) || parsed.totalQuestions < 0) {
    parsed.totalQuestions = parsed.questionTypes.reduce((sum, row) => sum + row.count, 0);
  }

  if (!Number.isFinite(parsed.totalMarks) || parsed.totalMarks < 0) {
    parsed.totalMarks = parsed.questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
  }

  if (file) {
    parsed.documentName = file.originalname;
    parsed.documentPath = `/uploads/assignments/${file.filename}`;
    parsed.documentMimeType = file.mimetype;

    if (file.mimetype === 'application/pdf') {
      const pdfText = await extractPdfText(file);
      parsed.generatedQuestions = generateQuestionsFromText(pdfText, parsed.questionTypes);
    }
  }

  return parsed;
};

const deleteUploadedFile = (documentPath) => {
  if (!documentPath) return;
  const relativePath = documentPath.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(__dirname, '../uploads', relativePath);
  const uploadsRoot = path.resolve(__dirname, '../uploads');

  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) return;
  fs.rm(absolutePath, { force: true }, () => {});
};

const buildFallbackQuestions = (assignment) => {
  const rows = assignment.questionTypes?.length
    ? assignment.questionTypes.map(normalizeQuestionType)
    : [{ type: 'Short Questions', count: 3, marks: 1 }];

  return rows.flatMap((row) =>
    Array.from({ length: Math.min(3, row.count) }, (_, index) => ({
      type: row.type,
      question: `${row.type} question ${index + 1}`,
      options: [],
      answer: 'Sample answer.',
      difficulty: 'medium',
      marks: row.marks,
    }))
  );
};

const addPdfText = (doc, text, options = {}) => {
  doc.font(options.font || 'Helvetica');
  doc.fontSize(options.size || 10);
  doc.text(text, {
    align: options.align || 'left',
    continued: false,
    indent: options.indent || 0,
    width: options.width,
  });
  if (options.moveDown !== 0) {
    doc.moveDown(options.moveDown || 0.4);
  }
};

const createQuestionPaperPdf = (assignment, filePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const stream = fs.createWriteStream(filePath);
    const generatedQuestions = Array.isArray(assignment.generatedQuestions) ? assignment.generatedQuestions : [];
    const questions = generatedQuestions.length ? generatedQuestions : buildFallbackQuestions(assignment);
    const groupedQuestions = groupGeneratedQuestions(questions);
    const questionTypes = assignment.questionTypes?.length ? assignment.questionTypes : [];
    const timeAllowed = questionTypes.length ? `${questionTypes.length * 10} minutes` : '45 minutes';

    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    addPdfText(doc, 'Delhi Public School, Sector-4, Bokaro', { font: 'Helvetica-Bold', size: 16, align: 'center', moveDown: 0.5 });
    addPdfText(doc, `Subject: ${assignment.subject || 'English'}`, { font: 'Helvetica-Bold', size: 11, align: 'center', moveDown: 0.2 });
    addPdfText(doc, 'Class: 5th', { font: 'Helvetica-Bold', size: 11, align: 'center', moveDown: 1.4 });
    addPdfText(doc, `Time Allowed: ${timeAllowed}`, { font: 'Helvetica-Bold', size: 10 });
    addPdfText(doc, `Maximum Marks: ${assignment.totalMarks || 20}`, { font: 'Helvetica-Bold', size: 10, moveDown: 1 });
    addPdfText(doc, 'All questions are compulsory unless stated otherwise.', { size: 10, moveDown: 1 });
    addPdfText(doc, 'Name: ____________________', { size: 10, moveDown: 0.2 });
    addPdfText(doc, 'Roll Number: ______________', { size: 10, moveDown: 0.2 });
    addPdfText(doc, 'Class: 5th Section: ________', { size: 10, moveDown: 1.2 });
    addPdfText(doc, 'Section A', { font: 'Helvetica-Bold', size: 12, align: 'center', moveDown: 1 });

    Object.entries(groupedQuestions).forEach(([type, items]) => {
      addPdfText(doc, type, { font: 'Helvetica-Bold', size: 10, moveDown: 0.5 });
      items.forEach((item, index) => {
        addPdfText(doc, `${index + 1}. [${item.difficulty || 'medium'}] ${item.question} [${item.marks || 1} Marks]`, { size: 10, moveDown: 0.25 });
        if (item.options?.length) {
          item.options.forEach((option, optionIndex) => {
            addPdfText(doc, `${optionLabel(optionIndex)}. ${option}`, { size: 9, indent: 18, moveDown: 0.15 });
          });
        }
        doc.moveDown(0.35);
      });
    });

    addPdfText(doc, 'End of Question Paper', { font: 'Helvetica-Bold', size: 10, moveDown: 1 });
    addPdfText(doc, 'Answer Key', { font: 'Helvetica-Bold', size: 12, align: 'center', moveDown: 0.8 });

    questions.forEach((item, index) => {
      const answer = item.options?.length
        ? `${optionLabel(item.correctOptionIndex || 0)}. ${item.answer || item.source || 'Sample answer.'}`
        : item.answer || item.source || 'Sample answer.';
      addPdfText(doc, `${index + 1}. ${item.type}: ${answer}`, { size: 9, moveDown: 0.2 });
    });

    doc.end();
  });

router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments.map(normalizeAssignmentResponse));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assignments.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.json(normalizeAssignmentResponse(assignment));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assignment.' });
  }
});

router.post('/:id/regenerate', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    if (assignment.documentMimeType !== 'application/pdf') {
      return res.status(400).json({ message: 'Only uploaded PDFs can generate questions.' });
    }

    const pdfText = await extractPdfTextFromPath(assignment.documentPath);
    const generatedQuestions = generateQuestionsFromText(pdfText, assignment.questionTypes);
    assignment.generatedQuestions = generatedQuestions;
    const saved = await assignment.save();
    res.json(normalizeAssignmentResponse(saved));
  } catch (error) {
    res.status(400).json({ message: 'Unable to regenerate questions.', error: error.message });
  }
});

router.post('/:id/download-paper', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const filename = `${safeFileName(assignment.title || assignment.topic)}-${assignment._id}.pdf`;
    const filePath = path.join(paperDir, filename);
    await createQuestionPaperPdf(assignment, filePath);

    res.json({
      filename,
      downloadUrl: `/downloads/${filename}`,
      savedPath: filePath,
      message: `Question paper successfully created.`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create question paper PDF.', error: error.message });
  }
});

router.post('/', handleUpload, async (req, res) => {
  try {
    const assignment = new Assignment(await parseAssignmentBody(req.body, req.file));
    const saved = await assignment.save();
    res.status(201).json(normalizeAssignmentResponse(saved));
  } catch (error) {
    deleteUploadedFile(req.file ? `/uploads/assignments/${req.file.filename}` : '');
    res.status(400).json({ message: 'Unable to save assignment.', error: error.message });
  }
});

router.put('/:id', handleUpload, async (req, res) => {
  try {
    const existing = await Assignment.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Assignment not found.' });

    const updateData = await parseAssignmentBody(req.body, req.file);

    // If no new file was uploaded, but there's an existing PDF document,
    // let's automatically regenerate questions using the updated questionTypes!
    if (!req.file && existing.documentPath && existing.documentMimeType === 'application/pdf') {
      const pdfText = await extractPdfTextFromPath(existing.documentPath);
      updateData.generatedQuestions = generateQuestionsFromText(pdfText, updateData.questionTypes || existing.questionTypes);
    }

    const updated = await Assignment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (req.file && existing.documentPath) {
      deleteUploadedFile(existing.documentPath);
    }
    res.json(normalizeAssignmentResponse(updated));
  } catch (error) {
    deleteUploadedFile(req.file ? `/uploads/assignments/${req.file.filename}` : '');
    res.status(400).json({ message: 'Unable to update assignment.', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Assignment not found.' });
    deleteUploadedFile(deleted.documentPath);
    res.json({ message: 'Assignment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete assignment.' });
  }
});

module.exports = router;
