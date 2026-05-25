import { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const createDefaultQuestionTypes = () => [
  { id: crypto.randomUUID(), type: 'Multiple Choice Questions', count: 4, marks: 4 },
  { id: crypto.randomUUID(), type: 'Short Questions', count: 3, marks: 4 },
];

const pageLabels = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back' },
  groups: { title: 'My Groups', subtitle: 'Manage class groups and student cohorts.' },
  assignments: { title: 'Assignment', subtitle: '' },
  create: { title: 'Create Assignment', subtitle: 'Set up a new assignment for your students.' },
  preview: { title: 'Preview Assignment', subtitle: 'Custom question paper preview.' },
  library: { title: 'My Library', subtitle: 'Saved templates and resources.' },
  toolkit: { title: "AI Teacher's Toolkit", subtitle: 'Smart teaching tools.' },
};

const Icon = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    {children}
  </svg>
);

const DashboardIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </Icon>
);

const GroupsIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M11 20c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const AssignmentIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const ToolkitIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <rect x="4" y="8" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 8V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
    <path d="M10 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const LibraryIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 20V7a3 3 0 0 1 3-3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M11 9h5M11 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const BellIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M12 4a4 4 0 0 0-4 4v2.7c0 .7-.2 1.4-.6 2l-1.3 2.1A1 1 0 0 0 7 16h10a1 1 0 0 0 .9-1.5l-1.3-2.1a3.7 3.7 0 0 1-.6-2V8a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const MenuIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const SparkleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" fill="currentColor" />
    <path d="M18.5 4.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="currentColor" />
  </svg>
);

const EditIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M14 34h5l16-16a3.5 3.5 0 0 0-5-5L14 29v5Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 16l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 39h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const UploadIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M18 23V8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 14l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 22v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const AssignmentEmptyIllustration = ({ size = 250 }) => (
  <svg width={size} height={size} viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="125" cy="125" r="72" fill="#ECECEF" />
    <rect x="98" y="72" width="62" height="88" rx="12" fill="#ffffff" />
    <rect x="109" y="82" width="40" height="8" rx="4" fill="#0f1724" />
    <rect x="109" y="97" width="30" height="5" rx="2.5" fill="#B4BBC6" />
    <rect x="109" y="108" width="34" height="5" rx="2.5" fill="#B4BBC6" />
    <rect x="109" y="119" width="30" height="5" rx="2.5" fill="#B4BBC6" />
    <rect x="109" y="130" width="34" height="5" rx="2.5" fill="#B4BBC6" />
    <circle cx="146" cy="128" r="31" fill="#ffffff" stroke="#CFC8E2" strokeWidth="9" />
    <path d="M137 119L155 137M155 119L137 137" stroke="#FF4A4A" strokeWidth="7" strokeLinecap="round" />
    <path d="M170 152L188 170" stroke="#CFC8E2" strokeWidth="9" strokeLinecap="round" />
    <rect x="168" y="86" width="39" height="22" rx="5" fill="#ffffff" />
    <rect x="174" y="94" width="8" height="8" rx="4" fill="#CFC8E2" />
    <rect x="186" y="94" width="16" height="6" rx="3" fill="#B4BBC6" />
    <circle cx="204" cy="146" r="4" fill="#2E7CB7" />
    <path d="M65 114C74 112 80 106 82 97" stroke="#0f1724" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const navItems = [
  { id: 'dashboard', label: 'Home', to: '/', icon: <DashboardIcon /> },
  { id: 'groups', label: 'My Groups', to: '/groups', icon: <GroupsIcon /> },
  { id: 'assignments', label: 'Assignments', to: '/assignments', icon: <AssignmentIcon /> },
  { id: 'toolkit', label: "AI Teacher's Toolkit", to: '/toolkit', icon: <ToolkitIcon /> },
  { id: 'library', label: 'My Library', to: '/library', icon: <LibraryIcon /> },
];

const mobileNavItems = [
  { id: 'dashboard', label: 'Home', to: '/', icon: <DashboardIcon size={16} /> },
  { id: 'assignments', label: 'Assignments', to: '/assignments', icon: <AssignmentIcon size={16} /> },
  { id: 'library', label: 'Library', to: '/library', icon: <LibraryIcon size={16} /> },
  { id: 'toolkit', label: 'AI Toolkit', to: '/toolkit', icon: <ToolkitIcon size={16} /> },
];

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB');
};

const toDateInputValue = (value) => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const readLegacyQuestionType = (row) => {
  if (typeof row?.type === 'string' && row.type.trim()) return row.type;
  const legacyText = Object.keys(row ?? {})
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => row[key])
    .join('');
  return legacyText || 'Question';
};

const normalizeQuestionType = (row = {}) => ({
  id: row.id || row._id || crypto.randomUUID(),
  type: readLegacyQuestionType(row),
  count: Number(row.count) > 0 ? Number(row.count) : 1,
  marks: Number(row.marks) > 0 ? Number(row.marks) : 1,
});

const normalizeAssignment = (assignment = {}) => {
  const questionTypes = Array.isArray(assignment.questionTypes)
    ? assignment.questionTypes.map(normalizeQuestionType)
    : [];
  const calculatedQuestions = questionTypes.reduce((sum, row) => sum + row.count, 0);
  const calculatedMarks = questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
  const distributedMarks = Array.isArray(assignment.marksDistribution)
    ? assignment.marksDistribution.reduce((sum, mark) => sum + Number(mark || 0), 0)
    : 0;

  return {
    ...assignment,
    _id: assignment._id || crypto.randomUUID(),
    title: assignment.title || 'Untitled Assignment',
    subject: assignment.subject || 'General',
    topic: assignment.topic || 'Assignment Paper',
    description: assignment.description || assignment.additionalInstructions || '',
    documentName: assignment.documentName || '',
    documentPath: assignment.documentPath || '',
    documentMimeType: assignment.documentMimeType || '',
    generatedQuestions: Array.isArray(assignment.generatedQuestions) ? assignment.generatedQuestions : [],
    assignedOn: assignment.assignedOn || formatDate(assignment.createdAt),
    dueDate: formatDate(assignment.dueDate) || assignment.dueDate || '',
    dueDateInput: toDateInputValue(assignment.dueDate),
    questionTypes,
    totalQuestions: Number(assignment.totalQuestions) || Number(assignment.numberOfQuestions) || calculatedQuestions,
    totalMarks: Number(assignment.totalMarks) || distributedMarks || calculatedMarks,
  };
};

const buildAssignmentFromForm = (form, currentTypes) => {
  const title = form.description?.trim().slice(0, 32) || 'New Assignment';
  const description = form.description || '';
  const dueDate = form.dueDate || new Date().toISOString();
  const assignedOn = formatDate(new Date());
  const questionTypes = currentTypes.map(normalizeQuestionType);
  const apiQuestionTypes = questionTypes.map(({ type, count, marks }) => ({ type, count, marks }));
  const totalQuestions = questionTypes.reduce((sum, row) => sum + row.count, 0);
  const totalMarks = questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);

  return {
    title,
    subject: 'General',
    topic: 'Assignment Paper',
    description,
    dueDate: formatDate(dueDate),
    assignedOn,
    questionTypes: apiQuestionTypes,
    totalQuestions,
    totalMarks,
  };
};

const optionLabel = (index) => String.fromCharCode(65 + index);

const groupGeneratedQuestions = (questions = []) =>
  questions.reduce((groups, question) => {
    const key = question.type || 'Questions';
    if (!groups[key]) groups[key] = [];
    groups[key].push(question);
    return groups;
  }, {});

const groupCards = [
  { name: 'Class 5A - English', students: 42, subject: 'English', next: 'Reading comprehension paper' },
  { name: 'Class 8B - Science', students: 38, subject: 'Science', next: 'Electrolysis worksheet' },
  { name: 'Class 10A - Mathematics', students: 45, subject: 'Mathematics', next: 'Algebra revision test' },
  { name: 'Class 6C - Social Studies', students: 36, subject: 'Social Studies', next: 'Map skills assignment' },
];

const toolkitCards = [
  { title: 'Question Paper Generator', text: 'Upload a PDF and create structured MCQ, short answer, diagram, and numerical questions.' },
  { title: 'Answer Key Builder', text: 'Generate answer keys with marks and difficulty labels for faster checking.' },
  { title: 'Bloom Level Planner', text: 'Balance remember, understand, apply, analyze, evaluate, and create questions.' },
  { title: 'Worksheet Formatter', text: 'Turn rough notes into a clean school-ready worksheet format.' },
];

const libraryResources = [
  { title: 'CBSE Science Question Paper', type: 'Template', tag: 'Class 8' },
  { title: 'English Grammar Practice Set', type: 'Worksheet', tag: 'Class 5' },
  { title: 'Maths Numerical Problems Bank', type: 'Question Bank', tag: 'Class 10' },
  { title: 'Social Studies Map Skills', type: 'Resource', tag: 'Class 6' },
  { title: 'Electroplating Short Answers', type: 'Answer Key', tag: 'Science' },
  { title: 'Reading Comprehension Rubric', type: 'Rubric', tag: 'English' },
];

function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty-state-card">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [questionTypes, setQuestionTypes] = useState(createDefaultQuestionTypes);
  const [formData, setFormData] = useState({ dueDate: todayInputValue(), description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [downloadedPaper, setDownloadedPaper] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const currentKey = location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/assignments');
        setAssignments(Array.isArray(data) ? data.map(normalizeAssignment) : []);
      } catch (error) {
        console.error(error);
        setNotice('Unable to load assignments. Please check the backend connection.');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const syncMobileState = (event) => setIsMobileView(event.matches);

    setIsMobileView(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileState);
      return () => mediaQuery.removeEventListener('change', syncMobileState);
    }

    mediaQuery.addListener(syncMobileState);
    return () => mediaQuery.removeListener(syncMobileState);
  }, []);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((item) =>
      item.title.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      item.topic.toLowerCase().includes(query)
    );
  }, [assignments, search]);

  const totals = useMemo(() => {
    const totalQuestions = questionTypes.reduce((sum, row) => sum + row.count, 0);
    const totalMarks = questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
    return { totalQuestions, totalMarks };
  }, [questionTypes]);

  const handleQuestionChange = (id, field, value) => {
    setQuestionTypes((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: field === 'type' ? value : Number(value) } : row
      )
    );
  };

  const removeQuestionRow = (id) => {
    setQuestionTypes((current) => current.length > 1 ? current.filter((row) => row.id !== id) : current);
  };

  const addQuestionRow = () => {
    setQuestionTypes((current) => [
      ...current,
      { id: crypto.randomUUID(), type: 'Multiple Choice Questions', count: 4, marks: 4 },
    ]);
  };

  const resetCreateForm = ({ clearSelected = true } = {}) => {
    setFormData({ dueDate: todayInputValue(), description: '' });
    setQuestionTypes(createDefaultQuestionTypes());
    if (clearSelected) setSelected(null);
    setSelectedFile(null);
    setUploadFileName('');
    setUploadProgress(0);
  };

  const createRequestBody = (payload) => {
    if (!selectedFile) return payload;

    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      form.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    form.append('document', selectedFile);
    return form;
  };

  const createUploadConfig = () => (
    selectedFile
      ? {
          onUploadProgress: (event) => {
            if (!event.total) return;
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          },
        }
      : undefined
  );

  const submitAssignment = async (payload) => {
    try {
      setIsSubmitting(true);
      setUploadProgress(selectedFile ? 1 : 0);
      const response = await axios.post('/api/assignments', createRequestBody(payload), createUploadConfig());
      const saved = normalizeAssignment(response.data);
      setAssignments((current) => [saved, ...current]);
      setSelected(saved);
      setNotice('Assignment created successfully.');
      navigate('/preview');
    } catch (error) {
      console.error(error);
      setNotice('Unable to save assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAssignment = async (id, payload) => {
    try {
      setIsSubmitting(true);
      setUploadProgress(selectedFile ? 1 : 0);
      const response = await axios.put(`/api/assignments/${id}`, createRequestBody(payload), createUploadConfig());
      const updated = normalizeAssignment(response.data);
      setAssignments((current) => current.map((a) => (a._id === updated._id ? updated : a)));
      setSelected(updated);
      setNotice('Assignment updated successfully.');
      navigate('/preview');
    } catch (error) {
      console.error(error);
      setNotice('Unable to update assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (assignment = selected ?? assignments[0]) => {
    if (!assignment?._id) {
      setNotice('Create or select an assignment before downloading.');
      return;
    }

    let downloadWindow = null;

    try {
      // Open a blank tab immediately from the user gesture to avoid popup blocking.
      downloadWindow = window.open('', '_blank', 'noopener,noreferrer');
      setIsSubmitting(true);
      const { data } = await axios.post(`/api/assignments/${assignment._id}/download-paper`);
      const resolvedDownloadUrl = new URL(data.downloadUrl, window.location.origin).toString();
      setDownloadedPaper({ ...data, downloadUrl: resolvedDownloadUrl });
      setNotice(data.message || `Question paper successfully created.`);

      if (downloadWindow) {
        downloadWindow.location.href = resolvedDownloadUrl;
      } else {
        window.location.assign(resolvedDownloadUrl);
      }
    } catch (error) {
      if (downloadWindow && !downloadWindow.closed) {
        downloadWindow.close();
      }
      console.error(error);
      setNotice(error?.response?.data?.message || 'Unable to create the question paper PDF. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPdfInBrowser = (paper = downloadedPaper) => {
    if (!paper?.downloadUrl) {
      setNotice('No PDF is available to open yet.');
      return;
    }

    const resolvedDownloadUrl = new URL(paper.downloadUrl, window.location.origin).toString();
    const popup = window.open(resolvedDownloadUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.assign(resolvedDownloadUrl);
    }
  };

  const regenerateQuestions = async () => {
    const target = selected ?? assignments[0];
    if (!target?._id) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(`/api/assignments/${target._id}/regenerate`);
      const regenerated = normalizeAssignment(response.data);
      setSelected(regenerated);
      setAssignments((current) => current.map((assignment) => (
        assignment._id === regenerated._id ? regenerated : assignment
      )));
      setNotice('Questions regenerated from the uploaded PDF.');
    } catch (error) {
      console.error(error);
      setNotice('Unable to regenerate questions from this file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setNotice('Only PDF, JPEG, and PNG files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice('File must be 10MB or smaller.');
      return;
    }
    setSelectedFile(file);
    setUploadFileName(file.name);
    setUploadProgress(0);
    setNotice(`Ready to upload ${file.name}.`);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadFileName(selected?.documentName || '');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNotice('Selected file removed.');
  };

  const startNewAssignment = () => {
    resetCreateForm();
    navigate('/create');
  };

  const deleteAssignment = async (assignment) => {
    if (!assignment?._id || isSubmitting) return;
    const shouldDelete = window.confirm(`Delete "${assignment.title}"? This cannot be undone.`);
    if (!shouldDelete) return;

    try {
      setIsSubmitting(true);
      await axios.delete(`/api/assignments/${assignment._id}`);
      setAssignments((current) => current.filter((item) => item._id !== assignment._id));
      if (selected?._id === assignment._id) setSelected(null);
      setNotice('Assignment deleted successfully.');
    } catch (error) {
      console.error(error);
      setNotice('Unable to delete assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Dashboard = () => {
    const recentAssignments = assignments.slice(0, 4);
    const generatedCount = assignments.reduce((sum, item) => sum + (item.generatedQuestions?.length || 0), 0);
    const activeGroups = groupCards.length;

    return (
      <section className="page-section active">
        <div className="section-header">
          <div>
            <p className="section-label">Home</p>
            <h2>Teaching workspace overview.</h2>
          </div>
          <button className="primary-btn" onClick={startNewAssignment}>Create Assignment</button>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
            <p>Question papers and worksheets created in VedaAI.</p>
          </article>
          <article className="stat-card">
            <span>Active Groups</span>
            <strong>{activeGroups}</strong>
            <p>Class sections ready for assignment planning.</p>
          </article>
          <article className="stat-card">
            <span>AI Questions</span>
            <strong>{generatedCount}</strong>
            <p>Questions generated from uploaded study material.</p>
          </article>
        </div>

        <div className="grid-two-column">
          <article className="content-panel">
            <div className="panel-heading">
              <h3>Recent Assignments</h3>
              <button className="ghost-btn" onClick={() => navigate('/assignments')}>View All</button>
            </div>
            <div className="compact-list">
              {recentAssignments.length ? recentAssignments.map((assignment) => (
                <button key={assignment._id} type="button" className="compact-row" onClick={() => { setSelected(assignment); navigate('/preview'); }}>
                  <span>
                    <strong>{assignment.title}</strong>
                    <small>{assignment.subject} / {assignment.topic}</small>
                  </span>
                  <em>{assignment.totalMarks || 0} marks</em>
                </button>
              )) : (
                <p className="muted-copy">Create an assignment and it will appear here.</p>
              )}
            </div>
          </article>

          <article className="content-panel">
            <div className="panel-heading">
              <h3>Today’s Teaching Plan</h3>
            </div>
            <div className="compact-list">
              <div className="plan-row">
                <span>Review generated papers</span>
                <strong>{Math.min(assignments.length, 3)}</strong>
              </div>
              <div className="plan-row">
                <span>Prepare class groups</span>
                <strong>{activeGroups}</strong>
              </div>
              <div className="plan-row">
                <span>Saved resources available</span>
                <strong>{libraryResources.length}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    );
  };

  const Groups = () => (
    <section className="page-section active">
      <div className="section-header">
        <div>
          <p className="section-label">My Groups</p>
          <h2>Class groups for assignment planning.</h2>
        </div>
        <button className="secondary-btn" onClick={startNewAssignment}>Create Assignment</button>
      </div>
      <div className="card-grid">
        {groupCards.map((group) => (
          <article className="resource-card" key={group.name}>
            <div>
              <span className="resource-type">{group.subject}</span>
              <h3>{group.name}</h3>
              <p>{group.students} students enrolled</p>
            </div>
            <div className="resource-footer">
              <span>Next: {group.next}</span>
              <button className="ghost-btn" onClick={startNewAssignment}>Assign</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const Assignments = () => {
    const hasAssignments = assignments.length > 0;
    const hasActiveSearch = search.trim().length > 0;

    if (!filteredAssignments.length) {
      return (
        <section className="page-section active assignment-empty-view">
          <AssignmentEmptyIllustration />
          <h2>{hasAssignments && hasActiveSearch ? 'No matching assignments' : 'No assignments yet'}</h2>
          <p>
            {hasAssignments && hasActiveSearch
              ? 'Try changing the search term or clear search to view all assignments.'
              : 'Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.'}
          </p>
          {(!hasAssignments || !hasActiveSearch) && (
            <button className="primary-btn assignment-empty-cta" onClick={startNewAssignment}>
              + Create Your First Assignment
            </button>
          )}
        </section>
      );
    }

    return (
      <section className={`page-section active assignment-list-view${isMobileView ? ' mobile' : ' desktop'}`}>
        <div className="top-search-row assignment-search-row">
          <button className="filter-pill" type="button">Filter</button>
          <div className="search-box">
            <input
              type="search"
              placeholder="Search Name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="assignment-list-stack">
          {filteredAssignments.map((assignment) => (
            isMobileView ? (
              <article
                key={assignment._id}
                className="assignment-list-card"
                onClick={() => {
                  setSelected(assignment);
                  navigate('/preview');
                }}
              >
                <div>
                  <h3>{assignment.title || 'Quiz on Electricity'}</h3>
                  <p className="assignment-meta">
                    <strong>Assigned on :</strong> {assignment.assignedOn || formatDate(assignment.createdAt)}
                    <strong>Due :</strong> {assignment.dueDate || '--'}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-btn assignment-more-btn"
                  aria-label={`Delete ${assignment.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteAssignment(assignment);
                  }}
                >
                  ...
                </button>
              </article>
            ) : (
              <article key={assignment._id} className="assignment-list-card desktop-assignment-card">
                <div>
                  <h3>{assignment.title || 'Quiz on Electricity'}</h3>
                  <p className="assignment-meta">
                    <strong>Assigned on :</strong> {assignment.assignedOn || formatDate(assignment.createdAt)}
                    <strong>Due :</strong> {assignment.dueDate || '--'}
                    <strong>Total Marks :</strong> {assignment.totalMarks || 0}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setSelected(assignment);
                      navigate('/preview');
                    }}
                  >
                    Preview
                  </button>
                  <button type="button" className="ghost-btn danger-btn" onClick={() => deleteAssignment(assignment)}>
                    Delete
                  </button>
                </div>
              </article>
            )
          ))}
        </div>
      </section>
    );
  };

  const Create = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const payload = buildAssignmentFromForm(formData, questionTypes);
      if (selected && selected._id) {
        await updateAssignment(selected._id, payload);
      } else {
        await submitAssignment(payload);
      }
      resetCreateForm({ clearSelected: false });
    };

    return (
      <section className="page-section active">
        <div className="section-header create-header">
          <div>
            <p className="section-label">Create Assignment</p>
            <h2>{selected ? 'Update assignment details' : 'Set up a new assignment for your students.'}</h2>
          </div>
          <div className="step-indicator">
            <span className="step active" />
            <span className="step" />
            <span className="step" />
          </div>
        </div>
        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="upload-card">
            <div
              className="upload-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFileSelection(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="upload-icon"><UploadIcon /></span>
              <p>Choose a file or drag & drop it here</p>
              <p className="upload-hint">{uploadFileName || 'JPEG, PNG, or PDF up to 10MB'}</p>
              {selected?.documentPath && !selectedFile && (
                <a className="upload-link" href={selected.documentPath} target="_blank" rel="noreferrer">
                  Open current file
                </a>
              )}
              {selectedFile && (
                <div className="upload-progress" aria-label="Upload progress">
                  <span style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="visually-hidden"
                onChange={(event) => handleFileSelection(event.target.files?.[0])}
              />
              <button type="button" className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
                {uploadFileName ? 'Replace File' : 'Browse Files'}
              </button>
              {uploadFileName && (
                <button type="button" className="ghost-btn" onClick={clearSelectedFile}>
                  Remove File
                </button>
              )}
            </div>
            <p className="upload-note">Upload a text-based PDF to generate questions automatically. Images are saved as references.</p>
          </div>

          <div className="grid-two-column">
            <label>
              Due Date
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="question-list">
            {questionTypes.map((row) => (
              <div className="question-row" key={row.id}>
                <div className="question-row-top">
                  <label>
                    Question Type
                    <select value={row.type} onChange={(e) => handleQuestionChange(row.id, 'type', e.target.value)}>
                      <option>Multiple Choice Questions</option>
                      <option>Short Questions</option>
                      <option>Diagram/Graph-Based Questions</option>
                      <option>Numerical Problems</option>
                    </select>
                  </label>
                  <button type="button" className="remove-row" onClick={() => removeQuestionRow(row.id)} aria-label="Remove question type" disabled={questionTypes.length === 1}>
                    x
                  </button>
                </div>
                <div className="row-controls">
                  <div className="counter" aria-label="Question count">
                    <button type="button" onClick={() => handleQuestionChange(row.id, 'count', Math.max(0, row.count - 1))}>-</button>
                    <span>{row.count}</span>
                    <button type="button" onClick={() => handleQuestionChange(row.id, 'count', row.count + 1)}>+</button>
                  </div>
                  <div className="counter" aria-label="Marks per question">
                    <button type="button" onClick={() => handleQuestionChange(row.id, 'marks', Math.max(0, row.marks - 1))}>-</button>
                    <span>{row.marks}</span>
                    <button type="button" onClick={() => handleQuestionChange(row.id, 'marks', row.marks + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="secondary-btn add-row-btn" onClick={addQuestionRow}>
            + Add Question Type
          </button>

          <div className="totals-row">
            <span>Total Questions: <strong>{totals.totalQuestions}</strong></span>
            <span>Total Marks: <strong>{totals.totalMarks}</strong></span>
          </div>

          <label className="full-width">
            Additional information
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Example: Generate a question paper for a 3 hour exam duration."
              rows="4"
            />
          </label>

          <div className="form-actions spaced">
            <button type="button" className="secondary-btn" onClick={() => navigate('/assignments')}>
              Previous
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading...' : selected ? 'Update Assignment' : 'Next'}
            </button>
          </div>
        </form>
      </section>
    );
  };

  const Preview = () => {
    const selectedPreview = selected ?? assignments[0];
    return (
      <section className="page-section active">
        <div className="section-header preview-header-row">
          <div>
            <p className="section-label">AI Teacher's Toolkit</p>
            <h2>Custom question paper preview.</h2>
          </div>
          <div className="preview-actions">
            {selectedPreview?.documentMimeType === 'application/pdf' && (
              <button className="secondary-btn" onClick={regenerateQuestions} disabled={isSubmitting}>
                {isSubmitting ? 'Regenerating...' : 'Regenerate Questions'}
              </button>
            )}
            <button className="primary-btn download-btn" onClick={() => handleDownload(selectedPreview)} disabled={isSubmitting}>
              {isSubmitting ? 'Creating PDF...' : 'Download as PDF'}
            </button>
            {downloadedPaper && (
              <button type="button" className="secondary-btn download-link" onClick={() => openPdfInBrowser(downloadedPaper)}>
                Open PDF
              </button>
            )}
          </div>
        </div>
        <article className="preview-panel">
          <div className="preview-top-card">
            <div>
              <p>Here are customized question paper recommendations for your class.</p>
              {downloadedPaper?.savedPath && (
                <p className="download-location">Saved at: {downloadedPaper.savedPath}</p>
              )}
            </div>
            {downloadedPaper ? (
              <button type="button" className="secondary-btn download-link" onClick={() => openPdfInBrowser(downloadedPaper)}>
                Open PDF
              </button>
            ) : (
              <button className="secondary-btn" onClick={() => handleDownload(selectedPreview)} disabled={isSubmitting}>
                {isSubmitting ? 'Creating PDF...' : 'Download as PDF'}
              </button>
            )}
          </div>
          <div className="paper-card">
            <div className="paper-title-block">
              <h3>Delhi Public School, Sector-4, Bokaro</h3>
              <p>{`Subject: ${selectedPreview?.subject ?? 'English'}`}</p>
              <p>Class: 5th</p>
            </div>
            <div className="paper-card-header">
              <div className="paper-details">
                <p>Time Allowed: <span>{selectedPreview ? `${selectedPreview.questionTypes?.length * 10} minutes` : '45 minutes'}</span></p>
              </div>
              <div className="paper-details">
                <p>Maximum Marks: <span>{selectedPreview?.totalMarks ?? 20}</span></p>
              </div>
            </div>
            <div className="paper-intro">
              <p>All questions are compulsory unless stated otherwise.</p>
              <div className="student-fields">
                <span>Name: ____________________</span>
                <span>Roll Number: ______________</span>
                <span>Class: 5th Section: ________</span>
              </div>
            </div>
            <div className="paper-section">
              <h4>Section A</h4>
              <p>
                {selectedPreview?.generatedQuestions?.length
                  ? 'Questions generated from the uploaded PDF.'
                  : 'Attempt all questions. Each question carries a fixed number of marks.'}
              </p>
              {selectedPreview?.generatedQuestions?.length
                ? Object.entries(groupGeneratedQuestions(selectedPreview.generatedQuestions)).map(([type, items]) => (
                    <div className="question-section" key={type}>
                      <h5>{type}</h5>
                      <ol>
                        {items.map((item, index) => (
                          <li key={item._id || `${item.type}-${index}`}>
                            <p>
                              <span className="question-meta">[{item.difficulty || 'medium'}]</span>{' '}
                              {item.question} [{item.marks} Marks]
                            </p>
                            {item.options?.length > 0 && (
                              <ol className="mcq-options" type="A">
                                {item.options.map((option, optionIndex) => (
                                  <li key={`${item._id || index}-option-${optionIndex}`}>{option}</li>
                                ))}
                              </ol>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))
                : (
                  <ol>
                    {((selectedPreview?.questionTypes?.length ? selectedPreview.questionTypes : createDefaultQuestionTypes()).map(normalizeQuestionType)).flatMap((row) =>
                      Array.from({ length: Math.min(3, row.count) }, (_, idx) => (
                        <li key={`${row.id}-${idx}`}>{`${row.type} question ${idx + 1}`}</li>
                      ))
                    )}
                  </ol>
                )}
            </div>
            <p className="paper-end">End of Question Paper</p>
            <div className="paper-answer-key">
              <h4>Answer Key</h4>
              <ol>
                {selectedPreview?.generatedQuestions?.length
                  ? selectedPreview.generatedQuestions.map((item, index) => (
                      <li key={`answer-${item._id || index}`}>
                        <strong>{item.type}:</strong>{' '}
                        {item.options?.length > 0
                          ? `${optionLabel(item.correctOptionIndex || 0)}. ${item.answer || item.source}`
                          : item.answer || item.source}
                      </li>
                    ))
                  : (
                    <>
                      <li>Sample answer for the first question.</li>
                      <li>Sample answer for the second question.</li>
                      <li>Sample answer for the third question.</li>
                    </>
                  )}
              </ol>
            </div>
          </div>
        </article>
      </section>
    );
  };

  const Toolkit = () => (
    <section className="page-section active">
      <div className="section-header">
        <div>
          <p className="section-label">AI Teacher's Toolkit</p>
          <h2>Tools for creating classroom-ready material.</h2>
        </div>
        <button className="primary-btn" onClick={startNewAssignment}>Generate Paper</button>
      </div>
      <div className="card-grid">
        {toolkitCards.map((tool) => (
          <article className="resource-card toolkit-card" key={tool.title}>
            <div className="tool-icon"><ToolkitIcon /></div>
            <div>
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
            </div>
            <button className="secondary-btn" onClick={startNewAssignment}>Use Tool</button>
          </article>
        ))}
      </div>
    </section>
  );

  const Library = () => (
    <section className="page-section active">
      <div className="section-header">
        <div>
          <p className="section-label">My Library</p>
          <h2>Saved templates, papers, and teaching resources.</h2>
        </div>
        <button className="secondary-btn" onClick={() => navigate('/assignments')}>Open Assignments</button>
      </div>
      <div className="library-grid">
        {libraryResources.map((resource) => (
          <article className="resource-card" key={resource.title}>
            <div>
              <span className="resource-type">{resource.type}</span>
              <h3>{resource.title}</h3>
              <p>{resource.tag}</p>
            </div>
            <div className="resource-footer">
              <span>Ready to reuse</span>
              <button className="ghost-btn" onClick={startNewAssignment}>Use</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const showMobileSubheader = isMobileView && currentKey !== 'dashboard' && !(currentKey === 'assignments' && assignments.length === 0);
  const showMobileFab = isMobileView && ['dashboard', 'groups', 'assignments', 'library'].includes(currentKey);
  const mobileHeaderLabels = {
    dashboard: 'Dashboard',
    groups: 'My Groups',
    assignments: assignments.length ? 'Assignments' : '',
    create: 'Create Assignment',
    preview: 'Preview',
    library: 'Library',
    toolkit: 'AI Toolkit',
  };
  const mobileHeaderTitle = mobileHeaderLabels[currentKey] || (pageLabels[currentKey]?.title ?? 'Dashboard');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">V</span>
            <div>
              <p className="brand-name">VedaAI</p>
              <p className="brand-tag">Assignment Studio</p>
            </div>
          </div>
          <button className="primary-btn sidebar-action" onClick={startNewAssignment}>
            <span className="icon" aria-hidden><SparkleIcon /></span>
            Create Assignment
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.id} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'library' && <span className="nav-badge">32</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar">D</div>
          <div>
            <p className="profile-name">Delhi Public School</p>
            <p className="profile-subtitle">Bokaro Steel City</p>
          </div>
        </div>
      </aside>

      <main className={`main-content route-${currentKey}`}>
        <header className="mobile-topbar">
          <div className="mobile-brand">
            <span className="brand-mark">V</span>
            <p className="brand-name">VedaAI</p>
          </div>
          <div className="mobile-top-actions">
            <button className="icon-btn top-alert-btn" type="button" aria-label="Notifications">
              <BellIcon />
            </button>
            <span className="mobile-user-dot" aria-hidden>JD</span>
            <button className="icon-btn mobile-menu-btn" type="button" aria-label="Open menu">
              <MenuIcon />
            </button>
          </div>
        </header>
        <header className={`mobile-subheader${showMobileSubheader ? '' : ' hidden'}`}>
          <button className="icon-btn" type="button" onClick={() => navigate('/assignments')} aria-label="Back to assignments">
            &lt;
          </button>
          <h2>{mobileHeaderTitle}</h2>
          <span />
        </header>
        <header className="topbar">
          <div className="topbar-left">
            <button className={`icon-btn ${currentKey === 'dashboard' ? 'hidden' : ''}`} type="button" onClick={() => navigate('/assignments')} aria-label="Back to assignments">
              &lt;
            </button>
            <div>
              <h1>{pageLabels[currentKey]?.title ?? 'Dashboard'}</h1>
              <p>{pageLabels[currentKey]?.subtitle ?? ''}</p>
            </div>
          </div>
          <div className="topbar-right">
            {notice && <p className="status-message">{notice}</p>}
            <button className="icon-btn top-alert-btn" type="button" aria-label="Notifications">!</button>
            <div className="user-chip" title="User profile">
              <span className="user-avatar">JD</span>
              <span className="user-name">John Doe</span>
              <span className="user-caret">v</span>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/create" element={<Create />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/toolkit" element={<Toolkit />} />
          <Route path="/library" element={<Library />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <nav className="mobile-bottom-nav">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => {
                const activeByFlow = item.id === 'assignments' && ['assignments', 'create', 'preview'].includes(currentKey);
                return `mobile-nav-link${isActive || activeByFlow ? ' active' : ''}`;
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {showMobileFab && (
          <button className="mobile-fab" type="button" onClick={startNewAssignment} aria-label="Create assignment">
            +
          </button>
        )}
      </main>
    </div>
  );
}

