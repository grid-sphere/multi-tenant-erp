import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from "../../components/erp/teacher/MainLayout";
import { generateRubric, saveAIContent, getSavedAIContentById, updateSavedAIContent } from '../../services/api';
import ToolActionButtons from '../../components/erp/global/ToolActionButtons';
import AIResultEditor from '../../components/erp/global/AIResultEditor';
import AIWorkspacePreviewSkeleton from '../../components/erp/global/AIWorkspacePreviewSkeleton';
import { useCurriculumData } from '../../hooks/useCurriculumData';
import { useTeacherClasses } from '../../hooks/useTeacherClasses';

const AIToolWorkspaceRubric = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const savedId = queryParams.get('id');

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

  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [totalScore, setTotalScore] = useState(100);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const previewRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [currentSaveId, setCurrentSaveId] = useState(savedId);

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
            setAssignmentDesc(data.data._metadata.topic || '');
          }
          setIsDirty(false);
        })
        .catch(err => {
          console.error("Failed to load saved rubric:", err);
          setError("Failed to load saved rubric. It may have been deleted.");
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
        content_type: 'Rubric',
        data: {
          ...result,
          _metadata: {
            ...result._metadata,
            chapter_name: selectedChapter,
            topic: assignmentDesc
          }
        }
      };

      if (currentSaveId) {
        await updateSavedAIContent(currentSaveId, payload);
        alert("Rubric updated successfully!");
      } else {
        const saved = await saveAIContent(payload);
        setCurrentSaveId(saved.id);
        alert("Rubric saved successfully!");
      }
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save rubric:", err);
      alert("Failed to save Rubric. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!selectedClass || !selectedSubject || !selectedChapter || !assignmentDesc) {
        throw new Error('Please provide class_name, subject, chapter_name and assignment description');
      }

      const payload = {
        class_name: String(selectedClass),
        subject: String(selectedSubject),
        chapter_name: String(selectedChapter),
        assignment_description: String(assignmentDesc),
        total_score: Number(totalScore)
      };
      const data = await generateRubric(payload);
      setResult(data);
      setIsDirty(true);
      setCurrentSaveId(null);
    } catch (err) {
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

  const mockCriteria = [
    {
      criterion_name: "Concept Accuracy & Diagrams",
      weight: 50,
      excellent: "Drawings are exceptionally neat, highly detailed, fully labeled correctly, and represent tissue structures precisely under the microscope.",
      good: "Drawings represent tissue structures correctly with minor label spelling errors or a minor lack of neat details.",
      needs_improvement: "Drawings lack neat details, labels are missing for major tissues, or contain factual representation errors.",
      poor: "Lab drawing contains massive factual errors, represents entirely different tissue, or is incomplete/copied."
    },
    {
      criterion_name: "Data Analysis & Conclusion",
      weight: 50,
      excellent: "Explanations link microscopic observations to cell specialization principles flawlessly; includes high-fidelity reflective analysis.",
      good: "Explanations describe observations correctly but fail to link them to cell specialization principles thoroughly.",
      needs_improvement: "Descriptions are highly basic, repeats raw data without synthesizing conclusions or answering conceptual prompts.",
      poor: "Analysis section is missing, copied from peers, or fails to address basic lab experimental prompts."
    }
  ];

  const currentCriteria = result?.criteria || mockCriteria;
  const currentTitle = result?.assignment_title || "Tissue Lab Report Assignment";
  const currentScore = result?.total_score || totalScore;

  return (
    <MainLayout title="Rubric Generator">
      
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-8">
        
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
          <h2 className="text-lg md:text-3xl font-extrabold font-display tracking-tight text-on-surface mb-1 md:mb-2">Rubric Generator</h2>
          <p className="text-on-surface-variant font-medium font-body text-3xs md:text-base">Create objective, comprehensive grading criteria matrixes for assignments.</p>
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
                      onChange={(e) => changeSubject(e.target.value)}
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
                      onChange={(e) => changeClass(e.target.value)}
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
                    onChange={(e) => setSelectedChapter(e.target.value)}
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
                
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display" htmlFor="assignment-input">Assignment Desc</label>
                    <input id="assignment-input" value={assignmentDesc} onChange={(e)=>setAssignmentDesc(e.target.value)} className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body" placeholder="e.g., Lab report on onion peel cells" type="text" />
                  </div>
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    <label className="text-3xs md:text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider font-display" htmlFor="score-input">Total Score</label>
                    <input id="score-input" value={totalScore} onChange={(e)=>setTotalScore(Number(e.target.value))} className="bg-surface-container-low border-none rounded-md py-2 md:py-3 px-3 md:px-4 text-2xs md:text-sm focus:ring-2 focus:ring-primary/40 outline-none font-body" type="number" min="10" max="100" />
                  </div>
                </div>
                
                {/* Advanced options */}
                <div className="pt-3 md:pt-4 space-y-3 md:space-y-4 border-t border-outline-variant/15">
                  <h4 className="text-3xs md:text-xs font-black text-primary uppercase font-display">Advanced Options</h4>
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs md:text-sm font-medium text-on-surface font-body">Distribute Score Uniformly</span>
                      <input defaultChecked className="rounded text-primary focus:ring-primary h-3 w-3 md:h-4 md:w-4 outline-none cursor-pointer" type="checkbox" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-1 md:mt-2">
                  {error && <p className="text-2xs md:text-sm text-red-600 mb-2 font-body">{error}</p>}
                </div>
                <button onClick={handleGenerate} disabled={loading || curriculumLoading || classes.length === 0 || !selectedClass || !selectedSubject || !selectedChapter} className="w-full py-3 md:py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-md font-bold text-sm md:text-lg shadow-lg flex items-center justify-center gap-2 mt-3 md:mt-4 hover:scale-[0.98] transition-all outline-none border-none cursor-pointer disabled:opacity-60 font-display" type="button">
                  <span className="material-symbols-outlined text-base md:text-xl">auto_awesome</span>
                  {loading ? 'Generating...' : 'Generate Rubric'}
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
                Explicit evaluative rubrics clarify standards, decreasing grading discrepancies and student review requests by <span className="font-bold">50%</span>.
              </p>
            </div>

          </div>

          {/* Output & Preview Column */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            
            {/* Preview Panel */}
            <div className={`bg-surface-container-lowest shadow-sm flex flex-col h-full border border-outline-variant/10 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto w-full' : 'rounded-xl md:rounded-2xl overflow-hidden min-h-[400px] md:min-h-[600px]'}`}>
              <div className="bg-surface-container-high p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary block text-base md:text-xl">rule</span>
                  <span className="font-bold font-display text-on-surface text-sm md:text-base">Rubric Preview</span>
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
                <div className="max-w-3xl mx-auto space-y-6">
                  {loading ? (
                    <AIWorkspacePreviewSkeleton />
                  ) : isEditing && result ? (
                    <AIResultEditor data={result} onChange={(newData) => { setResult(newData); setIsDirty(true); }} />
                  ) : result ? (
                    <>
                      {/* Rubric Matrix Title Card */}
                      <header className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center space-y-2">
                        <h1 className="text-2xl font-extrabold font-display text-on-surface leading-tight">{currentTitle}</h1>
                        <div className="flex justify-center gap-4 text-xs text-on-surface-variant flex-wrap font-display">
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-surface-container-low rounded-md"><span className="material-symbols-outlined text-sm">category</span> {selectedSubject}</span>
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-surface-container-low rounded-md"><span className="material-symbols-outlined text-sm">group</span> Class {selectedClass}</span>
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md"><span className="material-symbols-outlined text-sm">military_tech</span> Max Score: {currentScore}</span>
                        </div>
                      </header>

                      {/* Matrix Table */}
                      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-outline-variant/20">
                        <table className="w-full text-left border-collapse min-w-[800px] text-xs font-body text-on-surface-variant">
                          <thead>
                            <tr className="bg-slate-900 text-white font-display text-xs border-b border-slate-900">
                              <th className="px-4 py-4 font-bold min-w-[150px]">CRITERION & WEIGHT</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-emerald-950 text-emerald-300">EXCELLENT (100%-85%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-blue-950 text-blue-300">GOOD (84%-70%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-amber-950 text-amber-300">NEEDS WORK (69%-50%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-rose-950 text-rose-300">POOR (BELOW 50%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentCriteria.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-5 font-bold text-on-surface align-top space-y-2">
                                  <p className="font-display text-sm">{c.criterion_name}</p>
                                  <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-2xs font-bold font-display uppercase tracking-tight">
                                    Weight: {c.weight}%
                                  </span>
                                </td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-emerald-50/20">{c.excellent}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-blue-50/20">{c.good}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-amber-50/20">{c.needs_improvement}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-rose-50/20">{c.poor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Placeholder Matrix Title Card */}
                      <header className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center space-y-2">
                        <h1 className="text-2xl font-extrabold font-display text-on-surface leading-tight">{currentTitle}</h1>
                        <div className="flex justify-center gap-4 text-xs text-on-surface-variant flex-wrap font-display">
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-surface-container-low rounded-md"><span className="material-symbols-outlined text-sm">category</span> {selectedSubject}</span>
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-surface-container-low rounded-md"><span className="material-symbols-outlined text-sm">group</span> Class {selectedClass}</span>
                          <span className="flex items-center gap-1 font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md"><span className="material-symbols-outlined text-sm">military_tech</span> Max Score: {currentScore}</span>
                        </div>
                      </header>

                      {/* Placeholder Matrix Table */}
                      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-outline-variant/20">
                        <table className="w-full text-left border-collapse min-w-[800px] text-xs font-body text-on-surface-variant">
                          <thead>
                            <tr className="bg-slate-900 text-white font-display text-xs border-b border-slate-900">
                              <th className="px-4 py-4 font-bold min-w-[150px]">CRITERION & WEIGHT</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-emerald-950 text-emerald-300">EXCELLENT (100%-85%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-blue-950 text-blue-300">GOOD (84%-70%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-amber-950 text-amber-300">NEEDS WORK (69%-50%)</th>
                              <th className="px-4 py-4 font-bold min-w-[150px] bg-rose-950 text-rose-300">POOR (BELOW 50%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentCriteria.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-5 font-bold text-on-surface align-top space-y-2">
                                  <p className="font-display text-sm">{c.criterion_name}</p>
                                  <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-2xs font-bold font-display uppercase tracking-tight">
                                    Weight: {c.weight}%
                                  </span>
                                </td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-emerald-50/20">{c.excellent}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-blue-50/20">{c.good}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-amber-50/20">{c.needs_improvement}</td>
                                <td className="px-4 py-5 align-top leading-relaxed text-slate-700 bg-rose-50/20">{c.poor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              {result && !loading && (
                <div className="px-6 pb-6 bg-surface-container-lowest">
                  <ToolActionButtons 
                    onSave={handleSave}
                    isSaving={isSaving}
                    contentData={result} 
                    toolName="Grading Rubric" 
                    exportType="PDF" 
                    contentRef={previewRef}
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

export default AIToolWorkspaceRubric;
