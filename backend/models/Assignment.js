const mongoose = require('mongoose');

const questionTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  marks: { type: Number, required: true, default: 0 },
});

const generatedQuestionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  answer: { type: String, default: '' },
  correctOptionIndex: { type: Number, default: 0 },
  bloomLevel: { type: String, default: 'understand' },
  difficulty: { type: String, default: 'medium' },
  marks: { type: Number, default: 1 },
  source: { type: String, default: '' },
});

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, default: 'General' },
    topic: { type: String, default: 'Assignment Paper' },
    description: { type: String, default: '' },
    documentName: { type: String, default: '' },
    documentPath: { type: String, default: '' },
    documentMimeType: { type: String, default: '' },
    assignedOn: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    questionTypes: { type: [questionTypeSchema], default: [] },
    generatedQuestions: { type: [generatedQuestionSchema], default: [] },
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
