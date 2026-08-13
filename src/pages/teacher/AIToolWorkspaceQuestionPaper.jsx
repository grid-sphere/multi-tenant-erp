import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from "../../components/erp/teacher/MainLayout";
import { generateQuestionPaper, saveAIContent, getSavedAIContentById, updateSavedAIContent } from '../../services/api';
import ToolActionButtons from '../../components/erp/global/ToolActionButtons';
import AIResultEditor from '../../components/erp/global/AIResultEditor';
import AIWorkspacePreviewSkeleton from '../../components/erp/global/AIWorkspacePreviewSkeleton';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { useCurriculumData } from '../../hooks/useCurriculumData';
import { useTeacherClasses } from '../../hooks/useTeacherClasses';

const AIToolWorkspaceQuestionPaper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const savedId = queryParams.get('id');

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [currentSaveId, setCurrentSaveId] = useState(savedId);

  const { teacherClasses } = useTeacherClasses();

  const {
    loading: curriculumLoading,
    error: curriculumError,
    classes,
    subjects,
    chapters,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedChapter,
    setSelectedChapter,
    changeClass,
    changeSubject,
    hasSavedContentMissing,
    refetch: refetchCurriculum
  } = useCurriculumData('10', 'Mathematics', '10 - CIRCLES', { allowedClasses: teacherClasses });

  const [totalMarks, setTotalMarks] = useState(50);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const previewRef = useRef(null);

  // Load saved content if ID exists
  useEffect(() => {
    if (savedId) {
      setLoading(true);
      getSavedAIContentById(savedId)
        .then(data => {
          setResult(data.data);
          setSelectedSubject(data.subject || 'Mathematics');
          setSelectedClass(data.class_name || '10');
          if (data.data && data.data._metadata) {
            setSelectedChapter(data.data._metadata.chapter_name || '');
          }
          setIsDirty(false);
        })
        .catch(err => {
          console.error("Failed to load saved content:", err);
          setError("Failed to load saved content. It may have been deleted.");
        })
        .finally(() => setLoading(false));
    }
  }, [savedId, setSelectedClass, setSelectedSubject, setSelectedChapter]);

  // Auto-selection logic for initial curriculum load (non-history mode)
  useEffect(() => {
    if (!savedId && !curriculumLoading && classes.length > 0) {
      if (!selectedClass || !classes.includes(selectedClass)) {
        setSelectedClass(classes[0]);
      }
    }
  }, [classes, curriculumLoading, selectedClass, savedId, setSelectedClass]);

  useEffect(() => {
    if (!savedId && !curriculumLoading && selectedClass && subjects.length > 0) {
      if (!selectedSubject || !subjects.includes(selectedSubject)) {
        setSelectedSubject(subjects[0]);
      }
    }
  }, [subjects, selectedClass, curriculumLoading, selectedSubject, savedId, setSelectedSubject]);

  useEffect(() => {
    if (!savedId && !curriculumLoading && selectedClass && selectedSubject && chapters.length > 0) {
      if (!selectedChapter || !chapters.includes(selectedChapter)) {
        setSelectedChapter(chapters[0]);
      }
    }
  }, [chapters, selectedClass, selectedSubject, curriculumLoading, selectedChapter, savedId, setSelectedChapter]);

  // Handle BeforeUnload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBackNavigation = (e) => {
    e.preventDefault();
    if (isDirty) {
      const confirmExit = window.confirm("You have unsaved changes. Do you want to exit without saving?");
      if (!confirmExit) return;
    }
    navigate('/teacher/ai-tools');
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const payload = {
        class_name: selectedClass,
        subject: selectedSubject,
        content_type: 'QuestionPaper',
        data: {
          ...result,
          _metadata: {
            ...result._metadata,
            chapter_name: selectedChapter
          }
        }
      };

      if (currentSaveId) {
        await updateSavedAIContent(currentSaveId, payload);
        alert("QuestionPaper updated successfully!");
      } else {
        const saved = await saveAIContent(payload);
        setCurrentSaveId(saved.id);
        alert("QuestionPaper saved successfully!");
      }
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save QuestionPaper. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  const [visibleAnswers, setVisibleAnswers] = useState({});

  const toggleAnswer = (idx) => {
    setVisibleAnswers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Called by ToolActionButtons before PDF export
  const setAllAnswersVisible = async (isVisible) => {
    if (!result) return;
    const newVisible = {};
    if (isVisible && result.sections) {
      result.sections.forEach((sec, si) => {
        sec.questions?.forEach((_, qi) => { newVisible[`q_${si}_${qi}`] = true; });
      });
    }
    setVisibleAnswers(newVisible);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!selectedClass || !selectedSubject || !selectedChapter) { throw new Error('Please provide class_name, subject and chapter_name'); }

      const payload = { class_name: String(selectedClass), subject: String(selectedSubject), chapter_name: String(selectedChapter), total_marks: Number(totalMarks) };
      const data = await generateQuestionPaper(payload);
      setResult(data);
      setIsDirty(true);
      setCurrentSaveId(null);
    } catch (err) {
      // Show validation details if available
      const details = err && err.details ? err.details : null;
      if (details) {
        try {
          setError(`${err.message}\n${JSON.stringify(details, null, 2)}`);
        } catch (e) {
          setError(err.message);
        }
      } else {
        setError(err.message || 'Failed to generate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Question Paper Generator">
      
      <div className="max-w-7xl mx-auto w-full px-0 sm:px-4 md:px-8">
        
        {/* Back Button & Breadcrumb */}
        <div className="mb-3 md:mb-6 flex items-center justify-between px-3 sm:px-0">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-1 md:gap-2 text-primary font-semibold text-3xs md:text-sm mb-3 md:mb-6 hover:-translate-x-1 transition-transform w-max font-display outline-none border-none bg-transparent cursor-pointer p-0"
          >
            <span className="material-symbols-outlined text-xs md:text-sm">arrow_back</span>
            Back to AI Tools
          </button>
          <span className="bg-secondary-container text-on-secondary-container px-1.5 md:px-3 py-0.5 md:py-1 rounded-full text-3xs md:text-xs font-bold flex items-center gap-0.5 md:gap-1 font-display">
            <span className="material-symbols-outlined text-2xs md:text-sm">psychology</span>
            AI POWERED
          </span>
        </div>

        {/* Header Section */}
        <div className="mb-4 md:mb-8 px-3 sm:px-0">
          <h2 className="text-lg md:text-3xl font-extrabold font-display tracking-tight text-on-surface mb-1 md:mb-2">Question Paper Generator</h2>
          <p className="text-on-surface-variant font-medium font-body text-3xs md:text-base">Design official, structured term-end examination papers with automated mark weightings.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
          
          {/* Input Configuration Column */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            
            {/* Main Form Card */}
            <div className="bg-surface-container-lowest p-3 md:p-6 rounded-lg md:rounded-2xl shadow-sm border border-outline-variant/10">
              <h3 className="text-sm md:text-lg font-bold font-display mb-2 md:mb-4 flex items-center gap-1.5 md:gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-sm md:text-xl">tune</span>
                Configuration
              </h3>

              {hasSavedContentMissing && (
                <div className="bg-amber-50 border-l-4 border-amber-600 p-3 rounded-r-lg mb-4 text-xs text-amber-900 font-body flex items-start gap-2 shadow-sm" role="status" aria-live="polite">
                  <span className="material-symbols-outlined text-amber-700 text-sm mt-0.5">warning</span>
                  <div>
                    <span className="font-bold">Notice:</span> The original curriculum reference (Class {selectedClass}, Subject {selectedSubject}, Chapter {selectedChapter}) is no longer available in the database. You can review the saved content below, or select an available chapter to regenerate.
                  </div>
                </div>
              )}

              {curriculumLoading && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-800 rounded-md text-xs font-medium font-body mb-3 animate-pulse" role="status" aria-live="polite">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Loading curriculum data...
                </div>
              )}

              {curriculumError && (
                <div className="flex flex-col gap-2 p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-xs font-medium font-body mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>Failed to load curriculum data: {curriculumError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={refetchCurriculum}
                    className="w-max px-2.5 py-1 bg-red-800 text-white font-bold rounded hover:bg-red-900 transition-colors border-none outline-none cursor-pointer self-end"
                  >
                    Retry
                  </button>
                </div>
              )}

              {classes.length === 0 && !curriculumLoading && !curriculumError && (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-medium font-body mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning_amber</span>
                    <span>No curriculum content available. Please upload curriculum data first.</span>
                  </div>
                </div>
              )}

              <form className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display" htmlFor="subject-select">Subject</label>
                    <select
                      id="subject-select"
                      value={selectedSubject}
                      onChange={(e)=>changeSubject(e.target.value)}
                      disabled={curriculumLoading || !selectedClass || classes.length === 0}
                      aria-label="Select Subject"
                      aria-disabled={curriculumLoading || !selectedClass || classes.length === 0}
                      className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body w-full disabled:opacity-50"
                    >
                      {subjects.length === 0 && <option value="">{curriculumLoading ? "Loading..." : "No subjects"}</option>}
                      {subjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display" htmlFor="class-select">Class</label>
                    <select
                      id="class-select"
                      value={selectedClass}
                      onChange={(e)=>changeClass(e.target.value)}
                      disabled={curriculumLoading || classes.length === 0}
                      aria-label="Select Class"
                      aria-disabled={curriculumLoading || classes.length === 0}
                      className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body w-full disabled:opacity-50"
                    >
                      {classes.length === 0 && <option value="">{curriculumLoading ? "Loading..." : "No classes"}</option>}
                      {classes.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1 md:gap-1.5">
                  <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display" htmlFor="chapter-select">Chapter Name</label>
                  <select
                    id="chapter-select"
                    value={selectedChapter}
                    onChange={(e)=>setSelectedChapter(e.target.value)}
                    disabled={curriculumLoading || !selectedClass || !selectedSubject || classes.length === 0}
                    aria-label="Select Chapter Name"
                    aria-disabled={curriculumLoading || !selectedClass || !selectedSubject || classes.length === 0}
                    className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body w-full disabled:opacity-50"
                  >
                    {chapters.length === 0 && <option value="">{curriculumLoading ? "Loading..." : "No chapters"}</option>}
                    {chapters.map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1 md:gap-1.5 mb-3 md:mb-4">
                  <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display">Total Marks</label>
                  <input value={totalMarks} type="number" onChange={(e)=>setTotalMarks(Number(e.target.value))} className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body" min="1" max="100" />
                </div>
                
                {/* Advanced options */}
                <div className="pt-3 md:pt-4 space-y-3 md:space-y-4 border-t border-outline-variant/15">
                  <h4 className="text-3xs md:text-xs font-black text-primary uppercase font-display">Advanced Options</h4>
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs md:text-sm font-medium text-on-surface font-body">Include Candidate Sign Block</span>
                      <input defaultChecked className="rounded text-primary focus:ring-primary h-3 w-3 md:h-4 md:w-4 outline-none cursor-pointer" type="checkbox" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-1 md:mt-2">
                  {error && <p className="text-2xs md:text-sm text-red-600 mb-2 font-body">{error}</p>}
                </div>
                <button onClick={handleGenerate} disabled={loading || curriculumLoading || classes.length === 0 || !selectedClass || !selectedSubject || !selectedChapter} className="w-full py-3 md:py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-md font-bold text-sm md:text-lg shadow-lg flex items-center justify-center gap-2 mt-3 md:mt-4 hover:scale-[0.98] transition-all outline-none border-none cursor-pointer disabled:opacity-60 font-display" type="button">
                  <span className="material-symbols-outlined text-base md:text-xl">auto_awesome</span>
                  {loading ? 'Generating...' : 'Generate Paper'}
                </button>
              </form>
            </div>

            {/* AI Suggestion Panel */}
            <div className="bg-secondary-container/30 p-3 md:p-5 rounded-lg md:rounded-2xl border-l-4 border-secondary">
              <h4 className="text-3xs md:text-sm font-bold text-secondary flex items-center gap-1 md:gap-2 mb-1 md:mb-2 font-display">
                <span className="material-symbols-outlined text-2xs md:text-sm">lightbulb</span>
                Intelligent Tip
              </h4>
              <p className="text-3xs md:text-sm text-on-secondary-container leading-relaxed font-body">
                Official papers split questions into Sections by cognitive complexity (Recall, Application, Synthesis) to map standard national syllabus grading protocols.
              </p>
            </div>

          </div>

          {/* Output & Preview Column */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            
            {/* Preview Panel */}
            <div className={`bg-surface-container-lowest shadow-sm flex flex-col h-full border border-outline-variant/10 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto w-full' : 'rounded-xl md:rounded-2xl overflow-hidden min-h-[400px] md:min-h-[600px]'}`}>
              <div className="bg-surface-container-high p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary block text-base md:text-xl">history_edu</span>
                  <span className="font-bold font-display text-on-surface text-sm md:text-base">Question Paper Preview</span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  {result && (
                    <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 md:p-2 rounded-md transition-colors border-none outline-none cursor-pointer shadow-sm flex items-center ${isEditing ? 'bg-primary text-white' : 'bg-white/80 hover:bg-white text-on-surface-variant'}`}>
                      <span className={`material-symbols-outlined text-xs md:text-sm block ${isEditing ? 'text-white' : 'text-on-surface-variant'}`}>edit</span>
                    </button>
                  )}
                  <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white/80 p-1.5 md:p-2 rounded-md hover:bg-white transition-colors border-none outline-none cursor-pointer shadow-sm flex items-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-xs md:text-sm block">{isFullscreen ? 'close_fullscreen' : 'fullscreen'}</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-neutral-50/50" ref={previewRef}>
                <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 font-serif text-on-surface">
                  {loading ? (
                    <AIWorkspacePreviewSkeleton />
                  ) : isEditing && result ? (
                    <AIResultEditor data={result} onChange={(newData) => { setResult(newData); setIsDirty(true); }} />
                  ) : result ? (
                    <>
                      {/* Examination Paper Header */}
                      <div className="text-center pb-6 border-b-2 border-double border-slate-900 space-y-2">
                        <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-slate-950 leading-tight">{result.exam_title || 'Examination Paper'}</h1>
                        <h2 className="text-sm font-semibold tracking-wide text-slate-700">CLASS: {selectedClass} | SUBJECT: {selectedSubject}</h2>
                        
                        <div className="flex justify-between items-center text-xs font-semibold pt-4 text-slate-600">
                          <span>TIME ALLOWED: {result.duration || '2 Hours'}</span>
                          <span>TOTAL MARKS: {result.total_marks || totalMarks}</span>
                        </div>
                      </div>

                      {/* Candidate Registration fields */}
                      <div className="py-4 border-b border-slate-200 text-xs font-mono text-slate-500 flex justify-between flex-wrap gap-2">
                        <span>CANDIDATE NAME: .............................................................</span>
                        <span>ROLL NO: ....................</span>
                      </div>

                      {/* Sections iteration */}
                      <div className="space-y-8">
                        {result.sections?.map((sec, si) => (
                          <div key={si} className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-1 pt-2">
                              <h3 className="font-bold text-base uppercase tracking-wide text-slate-900 font-display">{sec.section_name}</h3>
                              <span className="text-xs font-bold text-slate-700 font-display">[{sec.total_section_marks} Marks]</span>
                            </div>
                            
                            {sec.instructions && (
                              <p className="text-xs italic text-slate-600 mb-3 leading-relaxed font-body">Instructions: {sec.instructions}</p>
                            )}

                            <div className="space-y-6 font-body">
                              {sec.questions?.map((q, qi) => {
                                const keyId = `q_${si}_${qi}`;
                                return (
                                  <div key={qi} className="space-y-3">
                                    <div className="flex justify-between items-start gap-4 text-sm leading-relaxed text-slate-900">
                                      <div className="flex-1 font-medium flex gap-2">
                                        <span className="font-bold mr-2 text-slate-950 shrink-0">{qi + 1}.</span>
                                        <div className="prose prose-sm max-w-none text-slate-900">
                                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{q.question_text}</ReactMarkdown>
                                        </div>
                                      </div>
                                      <span className="font-bold text-slate-700 text-xs whitespace-nowrap">[{q.marks || 5} M]</span>
                                    </div>

                                    {/* Togglable Answer Keys */}
                                    <div className="flex flex-col gap-1.5 ml-5">
                                      <button 
                                        onClick={() => toggleAnswer(keyId)}
                                        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline outline-none border-none cursor-pointer bg-transparent w-max self-start font-display"
                                      >
                                        <span className="material-symbols-outlined text-xs">
                                          {visibleAnswers[keyId] ? 'visibility_off' : 'visibility'}
                                        </span>
                                        {visibleAnswers[keyId] ? 'Hide Solution' : 'Reveal Answer Key'}
                                      </button>

                                      {visibleAnswers[keyId] && (
                                        <div className="mt-2 p-4 bg-primary/5 rounded-lg border border-primary/10 relative text-xs">
                                          <span className="absolute -top-2.5 left-4 bg-white px-2 text-3xs font-bold text-primary uppercase tracking-wider font-display">Answer Key & Grading Notes</span>
                                          <div className="text-slate-700 leading-relaxed font-sans prose prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{q.answer_key}</ReactMarkdown>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 text-slate-400 italic">No paper generated yet. Configure options and click Generate.</div>
                  )}
                </div>
              </div>

              {/* ACTION BAR COMPONENT */}
              {result && !loading && (
                <div className="px-6 pb-6 bg-surface-container-lowest">
                  <ToolActionButtons 
                    onSave={handleSave}
                    isSaving={isSaving}
                    contentData={result} 
                    toolName="Question Paper" 
                    exportType="PDF" 
                    contentRef={previewRef}
                    requiresAnswerPrompt={true}
                    onToggleAnswers={setAllAnswersVisible}
                  />
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default AIToolWorkspaceQuestionPaper;
