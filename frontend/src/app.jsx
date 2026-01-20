import React, { useState } from 'react';
import { Upload, BookOpen, Brain, MessageSquare, CheckSquare, Calendar, Loader2, FileText, Sparkles, X, Send } from 'lucide-react';

export default function SmartStudyBuddy() {
    const [activeTab, setActiveTab] = useState('upload');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [documentContent, setDocumentContent] = useState('');
    const [question, setQuestion] = useState('');
    const [explanation, setExplanation] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [studyPlan, setStudyPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    // API Base URL - Replace with your deployed backend
    const API_BASE = 'http://localhost:8000';

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
            setError('Please upload a PDF or text file');
            return;
        }

        setUploadedFile(file);
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setDocumentContent(data.content);
            setActiveTab('explain');
        } catch (err) {
            setError('Failed to upload file. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async () => {
        if (!question.trim() || !documentContent) {
            setError('Please upload a document and ask a question');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_content: documentContent,
                    question: question,
                }),
            });

            if (!response.ok) throw new Error('Explanation failed');

            const data = await response.json();
            setExplanation(data);
            setChatHistory([...chatHistory, { question, answer: data.explanation }]);
            setQuestion('');
        } catch (err) {
            setError('Failed to get explanation. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!documentContent) {
            setError('Please upload a document first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_content: documentContent,
                    num_questions: 5,
                }),
            });

            if (!response.ok) throw new Error('Quiz generation failed');

            const data = await response.json();
            setQuiz(data);
            setActiveTab('quiz');
        } catch (err) {
            setError('Failed to generate quiz. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStudyPlan = async () => {
        if (!documentContent) {
            setError('Please upload a document first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/study-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_content: documentContent,
                    days_until_exam: 7,
                }),
            });

            if (!response.ok) throw new Error('Study plan generation failed');

            const data = await response.json();
            setStudyPlan(data);
            setActiveTab('plan');
        } catch (err) {
            setError('Failed to generate study plan. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Smart Study Buddy
                                </h1>
                                <p className="text-sm text-gray-600">AI-Powered Learning Assistant</p>
                            </div>
                        </div>
                        {uploadedFile && (
                            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                <FileText className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">{uploadedFile.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-1">
                        {[
                            { id: 'upload', label: 'Upload', icon: Upload },
                            { id: 'explain', label: 'Explain', icon: MessageSquare },
                            { id: 'quiz', label: 'Quiz', icon: CheckSquare },
                            { id: 'plan', label: 'Study Plan', icon: Calendar },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${activeTab === tab.id
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                        <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex p-4 bg-indigo-100 rounded-full mb-4">
                                    <Upload className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Study Material</h2>
                                <p className="text-gray-600">Upload PDF notes, textbooks, or study guides to get started</p>
                            </div>

                            <label className="block">
                                <input
                                    type="file"
                                    accept=".pdf,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={loading}
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                                            <p className="text-gray-600 font-medium">Processing your document...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                                            <p className="text-sm text-gray-500">PDF or TXT files (Max 10MB)</p>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {uploadedFile && !loading && (
                                <div className="mt-6 flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <CheckSquare className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900">Document uploaded successfully!</p>
                                            <p className="text-sm text-green-700">Ready to start learning</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('explain')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Start Learning →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Explain Tab */}
                {activeTab === 'explain' && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Question Input */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                Ask a Question
                            </h2>

                            <div className="space-y-4">
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="What would you like to understand better? e.g., 'Explain photosynthesis in simple terms'"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={!documentContent || loading}
                                />

                                <button
                                    onClick={handleExplain}
                                    disabled={!question.trim() || loading || !documentContent}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Thinking...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Get Explanation
                                        </>
                                    )}
                                </button>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerateQuiz}
                                        disabled={loading || !documentContent}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Generate Quiz
                                    </button>
                                    <button
                                        onClick={handleGenerateStudyPlan}
                                        disabled={loading || !documentContent}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Study Plan
                                    </button>
                                </div>
                            </div>

                            {/* Chat History */}
                            {chatHistory.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-sm">Recent Questions</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {chatHistory.slice(-3).map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                                                <p className="font-medium text-gray-900">Q: {item.question}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Explanation Display */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-600" />
                                AI Explanation
                            </h2>

                            {explanation ? (
                                <div className="prose prose-sm max-w-none">
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{explanation.explanation}</p>
                                    </div>

                                    {explanation.key_concepts && explanation.key_concepts.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-gray-900 mb-2">Key Concepts:</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {explanation.key_concepts.map((concept, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                                        {concept}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {explanation.examples && explanation.examples.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-gray-900 mb-2">Examples:</h3>
                                            <ul className="space-y-2">
                                                {explanation.examples.map((example, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-indigo-600 font-bold">•</span>
                                                        <span className="text-gray-700">{example}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500">Ask a question to get an AI-powered explanation</p>
                                    <p className="text-sm text-gray-400 mt-2">I'll break down complex topics into simple terms</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quiz Tab */}
                {activeTab === 'quiz' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckSquare className="w-6 h-6 text-purple-600" />
                                Practice Quiz
                            </h2>

                            {quiz ? (
                                <div className="space-y-6">
                                    {quiz.questions.map((q, idx) => (
                                        <div key={idx} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                            <p className="font-semibold text-gray-900 mb-4">
                                                {idx + 1}. {q.question}
                                            </p>
                                            <div className="space-y-2">
                                                {q.options.map((option, optIdx) => (
                                                    <button
                                                        key={optIdx}
                                                        className="w-full text-left px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                                                    >
                                                        <span className="font-medium text-gray-700">{String.fromCharCode(65 + optIdx)}.</span> {option}
                                                    </button>
                                                ))}
                                            </div>
                                            <details className="mt-4">
                                                <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                                    Show Answer
                                                </summary>
                                                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <p className="text-sm text-green-800">
                                                        <span className="font-semibold">Answer:</span> {q.correct_answer}
                                                    </p>
                                                    <p className="text-sm text-gray-700 mt-1">{q.explanation}</p>
                                                </div>
                                            </details>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <CheckSquare className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500 mb-4">No quiz generated yet</p>
                                    <button
                                        onClick={handleGenerateQuiz}
                                        disabled={loading || !documentContent}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors font-medium"
                                    >
                                        Generate Quiz
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Study Plan Tab */}
                {activeTab === 'plan' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-green-600" />
                                Your Study Plan
                            </h2>

                            {studyPlan ? (
                                <div className="space-y-4">
                                    {studyPlan.daily_plan.map((day, idx) => (
                                        <div key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                                    {idx + 1}
                                                </span>
                                                {day.day}
                                            </h3>
                                            <ul className="space-y-2 ml-10">
                                                {day.tasks.map((task, taskIdx) => (
                                                    <li key={taskIdx} className="flex items-start gap-2">
                                                        <span className="text-green-600 mt-1">•</span>
                                                        <span className="text-gray-700">{task}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500 mb-4">No study plan generated yet</p>
                                    <button
                                        onClick={handleGenerateStudyPlan}
                                        disabled={loading || !documentContent}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium"
                                    >
                                        Generate Study Plan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-gray-600">
                        Built with Pydantic AI • Powered by AI • Made for Students
                    </p>
                </div>
            </footer>
        </div>
    );
}