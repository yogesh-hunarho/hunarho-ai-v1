"use client";

import { useState, useRef } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// Helper to render text with mixed Markdown/LaTeX logic (simplified for $...$)
const RenderMathText = ({ text }: { text: string }) => {
  if (!text) return null;
  // split by $...$ for inline math
  const parts = text.split('$'); 
  return (
    <span>
      {parts.map((part, i) => {
        // Even indices are text, odd are math (assuming correctly closed $$)
        if (i % 2 === 0) {
            return <span key={i}>{part}</span>;
        } else {
            return <InlineMath key={i} math={part} />;
        }
      })}
    </span>
  );
};


export default function AptitudeTestPage() {
  const [step, setStep] = useState<"CONFIG" | "TEST" | "RESULT" | "HISTORY_LIST" | "HISTORY_DETAILS">("CONFIG");
  const [loading, setLoading] = useState(false);
  
  // Config Data
  const APTITUDE_CATEGORIES: Record<string, string[]> = {
    "Quantitative Aptitude": [
      "Algebra", "Geometry", "Trigonometry", "Profit and Loss", "Percentage", 
      "Time and Work", "Time Speed Distance", "Number System", "Averages", "Ratio and Proportion"
    ],
    "Logical Reasoning": [
      "Blood Relations", "Coding-Decoding", "Direction Sense", "Seating Arrangement", 
      "Syllogism", "Number Series", "Analogies", "Puzzles"
    ],
    "Verbal Ability": [
      "Reading Comprehension", "Sentence Correction", "Synonyms & Antonyms", 
      "Grammar", "Vocabulary", "Para Jumbles"
    ],
    "Data Interpretation": [
      "Bar Graphs", "Pie Charts", "Line Charts", "Tables"
    ]
  };

  // Config State
  const [userId, setUserId] = useState("");
  const [testMode, setTestMode] = useState<"Specific" | "Mixed">("Specific");
  const [category, setCategory] = useState("Quantitative Aptitude");
  const [subCategory, setSubCategory] = useState("Algebra");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);

  // Test State
  const [testId, setTestId] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [score, setScore] = useState<number | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  // Buffer State (to prevent double fetching)
  const fetchingIndices = useRef<Set<number>>(new Set());

  const handleStart = async () => {
    if (!userId) { alert("Enter User ID"); return; }
    setLoading(true);
    
    // If Mixed, send "Mixed" as category
    const finalCategory = testMode === "Mixed" ? "Mixed" : category;
    const finalSubCategory = testMode === "Mixed" ? "Mixed" : subCategory;

    try {
      const res = await fetch("/api/aptitude/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, category: finalCategory, subCategory: finalSubCategory, difficulty, questionCount }),
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      setTestId(data.testId);
      setQuestions(data.questions); // Should contain Q1 and Q2
      setStep("TEST");
    } catch (e) {
      console.error(e);
      alert("Failed to start test");
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async (triggerIndex: number, isCorrect: boolean) => {
    const nextIndex = triggerIndex + 2; // Q(n) triggers Q(n+2)
    
    if (nextIndex >= questionCount) return; // Don't fetch beyond limit
    if (fetchingIndices.current.has(nextIndex)) return; // Already fetching
    
    fetchingIndices.current.add(nextIndex);
    console.log(`fetching Q${nextIndex + 1} based on Q${triggerIndex + 1} (Correct: ${isCorrect})`);

    try {
       const previousQ = questions[triggerIndex];
       
       const res = await fetch("/api/aptitude/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            subCategory,
            currentDifficulty: previousQ.difficulty, // Current Q determines context
            previousQuestion: previousQ,
            isCorrect,
            previousQuestions: questions.filter(q => q && q.question).map(q => ({ question: q.question })) // Send simplified history
          })
       });
       
       const newQuestion = await res.json();
       
       setQuestions(prev => {
         const newQs = [...prev];
         newQs[nextIndex] = newQuestion;
         return newQs;
       });

    } catch (e) {
      console.error("Background fetch failed", e);
    }
  };

  const handleAnswer = (option: string) => {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return; 

    // Normalize correct answer
    const correctVal = currentQ.answer || currentQ.correctAnswer;
    const isCorrect = option === correctVal;
    
    // Create the final answer object
    const finalAnswer = { ...currentQ, userAnswer: option, isCorrect };

    // Update state
    setUserAnswers(prev => ({ ...prev, [currentQIndex]: finalAnswer }));

    // Trigger buffered fetch
    fetchNextQuestion(currentQIndex, isCorrect);

    if (currentQIndex + 1 < questionCount) {
        setCurrentQIndex(currentQIndex + 1);
    } else {
        // Last question: Pass the final answer directly to ensure it counts
        handleSubmit(finalAnswer);
    }
  };

  const handleSubmit = async (lastAnswer?: any) => {
    setLoading(true);
    
    // Merge state with the last answer if provided (handles the async state update issue)
    const currentAnswers = { ...userAnswers };
    if (lastAnswer) {
        // Ensure the last answer is added/overwritten correctly
        currentAnswers[questionCount - 1] = lastAnswer; 
    }
    
    const questionsPayload = Object.values(currentAnswers);

    try {
        const res = await fetch("/api/aptitude/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, uniqueId: testId, questions: questionsPayload })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert(`Evaluation Error: ${data.error}`);
            return;
        }

        setScore(data.score);
        setStep("RESULT");
    } catch (e) {
        console.error(e);
        alert("Evaluation failed due to network or server error.");
    } finally {
        setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    if (!userId) { alert("Enter User ID first"); return; }
    setLoading(true);
    try {
        const res = await fetch(`/api/aptitude/history?userId=${userId}`);
        const data = await res.json();
        setHistoryList(data);
        setStep("HISTORY_LIST");
    } catch (e) {
        alert("Failed to fetch history");
    } finally {
        setLoading(false);
    }
  };

  const handleViewDetails = async (uniqueId: string) => {
    setLoading(true);
    try {
        const res = await fetch(`/api/aptitude/history/${uniqueId}`);
        const data = await res.json();
        setSelectedHistory(data);
        setStep("HISTORY_DETAILS");
    } catch (e) {
        alert("Failed to fetch details");
    } finally {
        setLoading(false);
    }
  };

  if (step === "CONFIG") {
    return (
      <div className="p-8 max-w-lg mx-auto font-sans">
        <h1 className="text-2xl font-bold mb-4">Aptitude Test Config</h1>
        <div className="space-y-4">
            <input className="block w-full border p-2 rounded text-white bg-slate-800" placeholder="User ID (Existing in DB)" value={userId} onChange={e => setUserId(e.target.value)} />
            
            {/* Test Mode Toggle */}
            <div className="flex gap-4 mb-4">
                <button 
                    onClick={() => setTestMode("Specific")}
                    className={`flex-1 py-2 rounded ${testMode === "Specific" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
                >
                    Specific Category
                </button>
                <button 
                    onClick={() => setTestMode("Mixed")}
                    className={`flex-1 py-2 rounded ${testMode === "Mixed" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"}`}
                >
                    Mixed / Random
                </button>
            </div>

            {testMode === "Specific" && (
                <div className="grid grid-cols-2 gap-4">
                    <select 
                        className="block w-full border p-2 rounded text-white bg-slate-800" 
                        value={category} 
                        onChange={e => {
                            const newCat = e.target.value;
                            setCategory(newCat);
                            setSubCategory(APTITUDE_CATEGORIES[newCat][0]);
                        }}
                    >
                        {Object.keys(APTITUDE_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select 
                        className="block w-full border p-2 rounded text-white bg-slate-800" 
                        value={subCategory} 
                        onChange={e => setSubCategory(e.target.value)}
                    >
                        {APTITUDE_CATEGORIES[category].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            )}
            <select className="block w-full border p-2 rounded text-white bg-slate-800" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
            </select>
            <select className="block w-full border p-2 rounded text-white bg-slate-800" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
            </select>
            
            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleStart} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {loading ? "Starting..." : "Start Test"}
                </button>
                <button onClick={handleViewHistory} disabled={loading} className="bg-gray-600 text-white px-4 py-2 rounded">
                    View History
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (step === "TEST") {
    const currentQ = questions[currentQIndex];
    if (!currentQ) {
        return <div className="p-10 text-center">Loading next question...</div>;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto font-sans">
            <div className="flex justify-between mb-4">
                <span className="font-bold">Q{currentQIndex + 1} of {questionCount}</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-black uppercase">{currentQ.difficulty}</span>
            </div>
            
            {/* {currentQ.hint && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Hint</p>
                    <p>{currentQ.hint}</p>
                </div>
            )} */}

            <h2 className="text-xl mb-6"><RenderMathText text={currentQ.question} /></h2>
            
            <div className="space-y-2">
                {currentQ.options?.map((opt: string, i: number) => (
                    <button 
                        key={i} 
                        onClick={() => handleAnswer(opt)}
                        className="w-full text-left p-3 border rounded hover:bg-gray-50 text-white"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  if (step === "RESULT") {
      return (
        <div className="p-8 max-w-lg mx-auto text-center font-sans">
            <h1 className="text-3xl font-bold mb-4">Test Completed</h1>
            <div className="text-6xl font-bold text-green-600 mb-6">{score?.toFixed(1)}%</div>
            <div className="flex gap-4 justify-center">
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Take Another Test
                </button>
                <button onClick={handleViewHistory} className="bg-gray-600 text-white px-4 py-2 rounded">
                    View History
                </button>
            </div>
        </div>
      );
  }

  if (step === "HISTORY_LIST") {
      return (
        <div className="p-8 max-w-2xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-4">Test History</h1>
            <button onClick={() => setStep("CONFIG")} className="mb-4 text-blue-500 underline">Back to Config</button>
            
            <div className="space-y-2">
                {historyList.map(h => (
                    <div key={h.id} className="border p-4 rounded flex justify-between items-center bg-gray-800 text-white">
                        <div>
                            <div className="font-bold">{h.category} - {h.subCategory}</div>
                            <div className="text-sm text-gray-400">{new Date(h.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-lg">{h.score}%</div>
                             <button onClick={() => handleViewDetails(h.uniqueId)} className="text-blue-400 text-sm underline">View Details</button>
                        </div>
                    </div>
                ))}
                {historyList.length === 0 && <div>No history found.</div>}
            </div>
        </div>
      );
  }

  if (step === "HISTORY_DETAILS") {
      return (
        <div className="p-8 max-w-3xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-4">Test Details</h1>
            <button onClick={() => setStep("HISTORY_LIST")} className="mb-4 text-blue-500 underline">Back to List</button>

            <div className="space-y-6">
                {selectedHistory?.questions?.map((q: any, i: number) => (
                    <div key={q.id} className={`border p-4 rounded ${q.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">Q{i + 1} ({q.difficulty})</span>
                            <span className={q.isCorrect ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                {q.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                        <p className="mb-4"><RenderMathText text={q.questionText} /></p>
                        
                        {/* Options Display */}
                        <div className="space-y-2 mb-4">
                            {Array.isArray(q.options) && q.options.map((opt: string, optIndex: number) => {
                                const isSelected = q.userAnswer === opt;
                                const isCorrectOpt = q.correctAnswer === opt;
                                
                                let bgClass = "bg-gray-700 border-gray-600";
                                if (isCorrectOpt) bgClass = "bg-green-900/50 border-green-500 text-green-200";
                                else if (isSelected && !isCorrectOpt) bgClass = "bg-red-900/50 border-red-500 text-red-200";

                                return (
                                    <div key={optIndex} className={`p-3 border rounded ${bgClass}`}>
                                        <RenderMathText text={opt} /> 
                                        {isCorrectOpt && <span className="ml-2 text-xs font-bold text-green-400">(Correct)</span>}
                                        {isSelected && !isCorrectOpt && <span className="ml-2 text-xs font-bold text-red-400">(Your Answer)</span>}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-sm text-gray-400 space-y-1">
                            <div>Your Answer: <span className={q.isCorrect ? "text-green-400" : "text-red-400"}><RenderMathText text={q.userAnswer} /></span></div>
                            {/* {q.explanation && <div>Explanation: <span className="text-white">{q.explanation}</span></div>} */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  return null;
}
