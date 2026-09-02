import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";
import CandidateSidebar from "./Sidebar";
import {
    FiMic, FiMicOff, FiVolume2, FiTrash2, FiPlus,
    FiChevronRight, FiCheckCircle, FiCircle, FiArrowLeft, FiX,
    FiBold, FiItalic, FiList
} from "react-icons/fi";

let jsPDF, html2canvas;
try { const m = require('jspdf'); jsPDF = m.jsPDF; html2canvas = require('html2canvas'); }
catch (e) { console.warn('PDF libs not available:', e); }

const MIC_SILENCE_TIMEOUT = 2000;
const SESSION_KEY = 'resumeBuilderState';
const REFRESH_MARKER_KEY = 'resumeBuilderRefreshMarker';

const saveToSession = (state) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { }
};
const loadFromSession = () => {
    try { const saved = sessionStorage.getItem(SESSION_KEY); return saved ? JSON.parse(saved) : null; } catch { return null; }
};
const clearSession = () => {
    try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(REFRESH_MARKER_KEY); } catch { }
};

const CAT_OPTIONS = [
    { value: 'technical', label: 'Technical — Software, Engineering, IT' },
    { value: 'non-technical', label: 'Non-Technical — Management, Sales, HR, Finance' },
    { value: 'other', label: 'Other — Creative, Arts, General' },
];
const EXP_OPTIONS = [
    { value: 'fresher', label: 'Fresher — Student or No Work Experience' },
    { value: 'experienced', label: 'Experienced — Working Professional' },
];

const buildSteps = (cat, exp) => {
    const S = (id, title, type) => ({ id, title, type });
    const base = [S('personalInfo', 'Personal Info', 'personal'), S('summary', 'Summary', 'text')];
    const expStep = S('experience', 'Work Experience', 'experience');
    const proj = S('projects', 'Projects', 'projects');
    const skills = cat === 'technical' ? S('skills', 'Technical Skills', 'skills') : S('skills', 'Skills', 'skills');
    const certs = S('certifications', 'Certifications', 'certifications');
    const edu = S('education', 'Education', 'education');
    const lang = cat === 'non-technical' ? S('languages', 'Languages Known', 'languages') : null;

    if (cat === 'technical') {
        // Technical Experienced: personal > summary > skills > experience > projects > certifications
        // Technical Fresher: personal > summary > skills > education > projects > certifications
        if (exp === 'experienced') {
            return [...base, skills, expStep, proj, certs];
        } else {
            return [...base, skills, edu, proj, certs];
        }
    }
    // Non-technical
    const nonTechSteps = exp === 'experienced'
        ? [...base, expStep, edu, skills]
        : [...base, edu, skills];
    return lang ? [...nonTechSteps, lang] : nonTechSteps;
};

const emptyProject = () => ({ name: '', company: '', startDate: '', endDate: '', currentlyWorking: false, description: '', technologies: '' });
const emptyCert = () => ({ name: '', issuer: '', date: '' });
const emptyExp = () => ({ company: '', role: '', startDate: '', endDate: '', currentlyWorking: false, responsibilities: '' });
const emptyEdu = () => ({ institution: '', degree: '', field: '', startYear: '', endYear: '' });
const defaultData = () => ({
    personalInfo: { fullName: '', email: '', phone: '', address: '', linkedin: '', github: '' },
    summary: '', experience: [emptyExp()], education: [emptyEdu()],
    skills: [], projects: [emptyProject()], certifications: [], languages: ''
});

const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const normalizeSpeechChunk = (txt = '') => txt.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/g, '');
const mergeSpokenText = (prevText = '', spokenText = '') => {
    const prev = prevText.trim();
    const spoken = spokenText.trim();
    if (!spoken) return prev;
    if (!prev) return spoken;

    const prevNorm = normalizeSpeechChunk(prev);
    const spokenNorm = normalizeSpeechChunk(spoken);
    if (!spokenNorm) return prev;
    if (prevNorm.endsWith(spokenNorm)) return prev;

    const prevWords = prevNorm.split(' ').filter(Boolean);
    const spokenWords = spokenNorm.split(' ').filter(Boolean);
    const spokenRawWords = spoken.split(/\s+/).filter(Boolean);

    let overlap = 0;
    const maxOverlap = Math.min(prevWords.length, spokenWords.length);
    for (let k = maxOverlap; k > 0; k--) {
        const prevTail = prevWords.slice(prevWords.length - k).join(' ');
        const spokenHead = spokenWords.slice(0, k).join(' ');
        if (prevTail === spokenHead) {
            overlap = k;
            break;
        }
    }

    if (overlap >= spokenRawWords.length) return prev;
    const tail = spokenRawWords.slice(overlap).join(' ');
    return tail ? `${prev} ${tail}` : prev;
};

function RichField({ value, onChange, placeholder, fieldId, activeField, setActiveField }) {
    const editorRef = useRef(null);
    const srRef = useRef(null);
    const silenceRef = useRef(null);
    const finalizedResultIndexesRef = useRef(new Set());
    const lastFinalChunkRef = useRef('');
    const isStartedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const valueRef = useRef(value);
    const [isRec, setIsRec] = useState(false);
    const [interim, setInterim] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { valueRef.current = value; }, [value]);

    const stopMic = useCallback(() => {
        try { srRef.current?.stop(); } catch (_) { }
        setIsRec(false); setInterim('');
        clearTimeout(silenceRef.current);
        isStartedRef.current = false;
    }, []);

    useEffect(() => {
        const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SRC) return;
        const sr = new SRC();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = 'en-IN';

        sr.onstart = () => {
            isStartedRef.current = true;
            finalizedResultIndexesRef.current = new Set();
            lastFinalChunkRef.current = '';
        };
        sr.onresult = (e) => {
            clearTimeout(silenceRef.current);
            let fin = '', inter = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) {
                    if (!finalizedResultIndexesRef.current.has(i)) {
                        const chunk = e.results[i][0].transcript.trim();
                        const normalized = normalizeSpeechChunk(chunk);
                        if (normalized && normalized !== lastFinalChunkRef.current) {
                            fin += chunk + ' ';
                            lastFinalChunkRef.current = normalized;
                        }
                        finalizedResultIndexesRef.current.add(i);
                    }
                } else {
                    inter += e.results[i][0].transcript;
                }
            }
            setInterim(inter);
            if (fin) {
                const plain = stripHtml(valueRef.current);
                const nextChunk = fin.trim();
                if (normalizeSpeechChunk(nextChunk)) {
                    const joined = mergeSpokenText(plain, nextChunk);
                    onChangeRef.current('<p>' + joined + '</p>');
                    setInterim('');
                }
            }
            silenceRef.current = setTimeout(stopMic, MIC_SILENCE_TIMEOUT);
        };
        sr.onerror = stopMic;
        sr.onend = () => { if (isStartedRef.current) stopMic(); };
        srRef.current = sr;
        return () => { stopMic(); };
    }, [fieldId, stopMic]);

    useEffect(() => { if (activeField !== fieldId && isRec) stopMic(); }, [activeField, fieldId, isRec, stopMic]);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const toggleMic = (e) => {
        e.preventDefault(); e.stopPropagation();
        const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SRC) { alert('Voice input requires Chrome or Edge.'); return; }

        if (isRec) {
            stopMic();
            setActiveField('');
        } else {
            setActiveField(fieldId);
            setIsRec(true);
            isStartedRef.current = false;
            finalizedResultIndexesRef.current = new Set();
            lastFinalChunkRef.current = '';
            clearTimeout(silenceRef.current);
            try { srRef.current?.start(); } catch (_) { }
            silenceRef.current = setTimeout(stopMic, MIC_SILENCE_TIMEOUT);
        }
    };

    const handleInput = () => {
        if (editorRef.current) onChangeRef.current(editorRef.current.innerHTML);
    };

    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
    };

    const showPlaceholder = !stripHtml(value) && !isFocused;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ background: '#F8FAFC', border: isRec ? '2px solid #10b981' : '1.5px solid #CBD5E1', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '8px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
                <button type="button" onClick={() => execCommand('bold')} title="Bold" style={toolbarBtnStyle}><FiBold size={14} /></button>
                <button type="button" onClick={() => execCommand('italic')} title="Italic" style={toolbarBtnStyle}><FiItalic size={14} /></button>
                <button type="button" onClick={() => execCommand('underline')} title="Underline" style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}>U</button>
                <div style={{ width: 1, height: 20, background: '#CBD5E1', margin: '0 4px' }} />
                <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List" style={toolbarBtnStyle}><FiList size={14} /></button>
                <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List" style={toolbarBtnStyle}>1.</button>
            </div>

            <div style={{ border: isRec ? '2px solid #10b981' : '1.5px solid #CBD5E1', borderTop: 'none', borderRadius: '0 0 8px 8px', background: isRec ? '#f0fff8' : '#fff', boxShadow: isRec ? '0 0 0 3px rgba(16,185,129,0.12)' : '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.2s', overflow: 'hidden', position: 'relative' }}>
                {showPlaceholder && <div style={{ position: 'absolute', top: 12, left: 12, color: '#94A3B8', pointerEvents: 'none', fontSize: 15, fontFamily: "'Lato',sans-serif", whiteSpace: 'pre-line' }}>{placeholder}</div>}
                <div ref={editorRef} contentEditable onInput={handleInput} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                    style={{ minHeight: 140, padding: 12, fontFamily: "'Lato',sans-serif", fontSize: 15, lineHeight: 1.6, outline: 'none', color: '#1e293b' }} />
            </div>

            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
                <button type="button" onClick={toggleMic} title={isRec ? 'Stop' : 'Start voice input'}
                    style={{ background: isRec ? '#10b981' : '#ECFDF5', border: isRec ? '2px solid #059669' : '1.5px solid #6EE7B7', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: isRec ? 'micPulse 1.2s infinite' : 'none', transition: 'all 0.2s' }}>
                    {isRec ? <FiMicOff size={14} color="#fff" /> : <FiMic size={14} color="#10b981" />}
                </button>
            </div>

            {isRec && <div style={{ marginTop: 4, fontSize: 12, color: '#059669', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}><FiMic size={11} /> {interim || 'Listening…'}</div>}
        </div>
    );
}

const toolbarBtnStyle = { background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' };

const NO_MIC_TYPES = ['url', 'email', 'tel', 'month', 'date', 'number', 'file'];

function VoiceInput({ value = '', onChange, placeholder = 'Type or speak…', fieldId, activeField, setActiveField, inputType = 'text', isSkills = false }) {
    const srRef = useRef(null);
    const silenceRef = useRef(null);
    const finalizedResultIndexesRef = useRef(new Set());
    const lastFinalChunkRef = useRef('');
    const lastValueRef = useRef(value);
    const isStartedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const isSkillsRef = useRef(isSkills);
    const [isRec, setIsRec] = useState(false);
    const [interim, setInterim] = useState('');
    const noMic = NO_MIC_TYPES.includes(inputType);

    useEffect(() => { lastValueRef.current = value; }, [value]);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { isSkillsRef.current = isSkills; }, [isSkills]);

    const stopMic = useCallback(() => {
        try { srRef.current?.stop(); } catch (_) { }
        setIsRec(false); setInterim('');
        clearTimeout(silenceRef.current);
        isStartedRef.current = false;
    }, []);

    useEffect(() => {
        if (noMic) return;
        const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SRC) return;
        const sr = new SRC();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = 'en-IN';

        sr.onstart = () => {
            isStartedRef.current = true;
            finalizedResultIndexesRef.current = new Set();
            lastFinalChunkRef.current = '';
        };
        sr.onresult = (e) => {
            clearTimeout(silenceRef.current);
            let fin = '', inter = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) {
                    if (!finalizedResultIndexesRef.current.has(i)) {
                        const chunk = e.results[i][0].transcript.trim();
                        const normalized = normalizeSpeechChunk(chunk);
                        if (normalized && normalized !== lastFinalChunkRef.current) {
                            fin += chunk + ' ';
                            lastFinalChunkRef.current = normalized;
                        }
                        finalizedResultIndexesRef.current.add(i);
                    }
                } else {
                    inter += e.results[i][0].transcript;
                }
            }
            setInterim(inter);
            if (fin) {
                let spoken = fin.trim().replace(/[.؟]+$/, '');
                if (isSkillsRef.current) {
                    spoken = spoken.replace(/\band\b|\bor\b/gi, ',').replace(/;/g, ',');
                    const parts = spoken.split(',').map(s => s.trim()).filter(Boolean);
                    spoken = parts.join(', ');
                }
                const prev = lastValueRef.current.trimEnd();
                const separator = isSkillsRef.current ? (prev ? ', ' : '') : (prev ? ' ' : '');
                const spokenNormalized = normalizeSpeechChunk(spoken);
                if (spokenNormalized) {
                    const newValue = isSkillsRef.current
                        ? (prev + separator + spoken)
                        : mergeSpokenText(prev, spoken);
                    lastValueRef.current = newValue;
                    onChangeRef.current(newValue);
                    setInterim('');
                }
            }
            silenceRef.current = setTimeout(stopMic, MIC_SILENCE_TIMEOUT);
        };
        sr.onerror = stopMic;
        sr.onend = () => { if (isStartedRef.current) stopMic(); };
        srRef.current = sr;
        return () => { stopMic(); };
    }, [fieldId, noMic, stopMic]);

    useEffect(() => { if (activeField !== fieldId && isRec) stopMic(); }, [activeField, fieldId, isRec, stopMic]);

    const toggleMic = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (noMic) return;
        const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SRC) { alert('Voice input requires Chrome or Edge.'); return; }

        if (isRec) {
            stopMic();
            setActiveField('');
        } else {
            lastValueRef.current = value;
            setActiveField(fieldId);
            setIsRec(true);
            isStartedRef.current = false;
            finalizedResultIndexesRef.current = new Set();
            lastFinalChunkRef.current = '';
            clearTimeout(silenceRef.current);
            try { srRef.current?.start(); } catch (_) { }
            silenceRef.current = setTimeout(stopMic, MIC_SILENCE_TIMEOUT);
        }
    };

    const handleChange = (e) => {
        const newVal = e.target.value;
        lastValueRef.current = newVal;
        onChange(newVal);
    };

    const handleClear = (e) => { e.preventDefault(); e.stopPropagation(); onChange(''); lastValueRef.current = ''; setInterim(''); };
    const handleSpeak = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!value.trim() || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(value); u.lang = 'en-IN';
        window.speechSynthesis.speak(u);
    };

    const baseStyle = { width: '100%', fontFamily: "'Lato',sans-serif", fontSize: 15, outline: 'none', color: '#1e293b', borderRadius: 8, border: isRec ? '2px solid #10b981' : '1.5px solid #CBD5E1', background: isRec ? '#f0fff8' : '#fff', boxShadow: isRec ? '0 0 0 3px rgba(16,185,129,0.12)' : '0 1px 2px rgba(0,0,0,0.04)', transition: 'border 0.2s, box-shadow 0.2s', height: 46, lineHeight: '46px', paddingLeft: 14, paddingRight: noMic ? (value ? 68 : 14) : (value ? 104 : 72) };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input
                type={inputType}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                style={baseStyle}
                className="vi-field"
            />
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {value.trim() && <button type="button" onClick={handleSpeak} title="Replay" style={iconBtnSt('#F1F5F9')}><FiVolume2 size={13} color="#64748B" /></button>}
                {value.trim() && <button type="button" onClick={handleClear} title="Clear" style={iconBtnSt('#FEE2E2')}><FiTrash2 size={12} color="#DC2626" /></button>}
                {!noMic && (
                    <button type="button" onClick={toggleMic} title={isRec ? 'Stop' : 'Speak'}
                        style={{ background: isRec ? '#10b981' : '#ECFDF5', border: isRec ? '2px solid #059669' : '1.5px solid #6EE7B7', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: isRec ? 'micPulse 1.2s infinite' : 'none', transition: 'all 0.2s', flexShrink: 0 }}>
                        {isRec ? <FiMicOff size={14} color="#fff" /> : <FiMic size={14} color="#10b981" />}
                    </button>
                )}
            </div>
            {isRec && <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '2px 10px', fontSize: 12, color: '#065F46', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 5 }}>{interim ? interim + '…' : '🎤 Listening…'}</div>}
        </div>
    );
}
const iconBtnSt = (bg) => ({ background: bg, border: 'none', cursor: 'pointer', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' });

function CustomSelect({ value, onChange, options, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const sel = options.find(o => o.value === value);
    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: open ? '2px solid #10b981' : '1.5px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 15, color: sel ? '#1e293b' : '#94A3B8', fontFamily: "'Lato',sans-serif", boxShadow: open ? '0 0 0 3px rgba(16,185,129,0.12)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>
                <span>{sel ? sel.label : placeholder}</span>
                <FiChevronRight size={16} color="#94A3B8" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </div>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 10, border: '1.5px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 200, overflow: 'hidden' }}>
                    {options.map(o => (
                        <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 15, fontFamily: "'Lato',sans-serif", color: o.value === value ? '#065F46' : '#334155', background: o.value === value ? '#ECFDF5' : '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = '#fff'; }}>
                            {o.value === value ? <FiCheckCircle size={14} color="#10b981" /> : <FiCircle size={14} color="#CBD5E1" />}
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MonthRange({ startVal, endVal, onStartChange, onEndChange, currentlyWorking, onCurrentlyWorkingChange, startLabel = 'Start Date', endLabel = 'End Date' }) {
    const inp = { height: 50, lineHeight: '50px', padding: '0 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 16, fontFamily: "'Lato',sans-serif", outline: 'none', background: '#fff', color: '#1e293b', width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer' };
    return (
        <div className="g2">
            <div>
                <label style={FL_ST}>{startLabel}</label>
                <input type="month" value={startVal} onChange={e => onStartChange(e.target.value)} style={inp} className="vi-field month-input" />
            </div>
            <div>
                <label style={FL_ST}>{endLabel}</label>
                {currentlyWorking ? (
                    <div style={{ ...inp, background: '#F0FDF4', border: '1.5px solid #A7F3D0', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center' }}>Currently Working</div>
                ) : (
                    <input type="month" value={endVal} onChange={e => onEndChange(e.target.value)} style={inp} className="vi-field month-input" />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={currentlyWorking} onChange={e => onCurrentlyWorkingChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#10b981' }} />
                    Currently Working Here
                </label>
            </div>
        </div>
    );
}
const FL_ST = { fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, fontFamily: "'Lato',sans-serif", textTransform: 'uppercase', letterSpacing: '0.3px' };

// A4 dimensions: 210mm x 297mm = 794px x 1123px at 96dpi
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/**
 * Paginates resume content inside a container into proper A4-sized page divs.
 * Keeps .item elements together (never splits an item across pages).
 * If a section has multiple items, it splits at item boundaries.
 * Returns the number of pages created.
 */
function paginateResumeDOM(root) {
    const page = root.querySelector('.page');
    if (!page) return 1;

    const cs = getComputedStyle(page);
    const pt = parseFloat(cs.paddingTop) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    const pw = page.getBoundingClientRect().width;
    const A4H = Math.round(pw * (297 / 210));
    const usable = A4H - pt - pb;

    // If content fits in one page, just set fixed height
    const contentH = page.scrollHeight - pt - pb;
    if (contentH <= usable) {
        page.style.height = A4H + 'px';
        page.style.overflow = 'hidden';
        page.style.boxSizing = 'border-box';
        return 1;
    }

    // Extract all element children
    const nodes = [];
    while (page.firstChild) nodes.push(page.removeChild(page.firstChild));

    const wrap = (root.ownerDocument || document).createElement('div');
    wrap.className = 'pages-wrapper';
    page.parentElement.insertBefore(wrap, page);
    page.style.display = 'none';

    const padStr = cs.padding;
    function mkPage() {
        const p = (root.ownerDocument || document).createElement('div');
        p.className = 'a4-page';
        p.style.cssText = `width:${pw}px;height:${A4H}px;padding:${padStr};background:#fff;overflow:hidden;box-sizing:border-box;position:relative;`;
        wrap.appendChild(p);
        return p;
    }

    let cp = mkPage(), used = 0;

    for (const n of nodes) {
        if (n.nodeType !== 1) continue;

        cp.appendChild(n);
        const h = n.offsetHeight;

        if (used > 0 && used + h > usable) {
            // Overflow – try to split sections at item boundaries
            if (n.classList.contains('sec')) {
                const allChildren = Array.from(n.children);
                const secTitle = allChildren.find(c => c.classList.contains('st'));
                const items = allChildren.filter(c => c.classList.contains('item'));

                if (items.length > 1 && secTitle) {
                    cp.removeChild(n);
                    // Create part1 with title
                    const doc = root.ownerDocument || document;
                    const p1 = doc.createElement('div'); p1.className = 'sec';
                    p1.appendChild(secTitle.cloneNode(true));
                    cp.appendChild(p1);
                    let p1h = p1.offsetHeight;

                    if (used + p1h > usable) {
                        // Title doesn't fit – whole section to new page
                        cp.removeChild(p1);
                        cp = mkPage(); used = 0;
                        cp.appendChild(n);
                        used = n.offsetHeight;
                        continue;
                    }

                    // Add items that fit
                    let fitted = 0;
                    for (let i = 0; i < items.length; i++) {
                        const clone = items[i].cloneNode(true);
                        p1.appendChild(clone);
                        if (used + p1.offsetHeight > usable) {
                            p1.removeChild(clone);
                            break;
                        }
                        fitted++;
                    }

                    if (fitted === 0) {
                        cp.removeChild(p1);
                        cp = mkPage(); used = 0;
                        cp.appendChild(n);
                        used = n.offsetHeight;
                        continue;
                    }

                    // Replace clones with real items in p1
                    while (p1.querySelector('.item')) p1.removeChild(p1.querySelector('.item'));
                    for (let i = 0; i < fitted; i++) p1.appendChild(items[i]);
                    used += p1.offsetHeight;

                    // Remaining items on new page
                    if (fitted < items.length) {
                        cp = mkPage(); used = 0;
                        const p2 = doc.createElement('div'); p2.className = 'sec';
                        cp.appendChild(p2);
                        // Add non-item, non-title children first (like sub-header text)
                        allChildren.filter(c => !c.classList.contains('item') && !c.classList.contains('st')).forEach(c => { if (c.parentElement === n) p2.appendChild(c); });
                        for (let i = fitted; i < items.length; i++) p2.appendChild(items[i]);
                        used = p2.offsetHeight;
                    }
                    if (n.parentElement) n.remove();
                    continue;
                }
            }

            // Default: move whole element to new page
            cp.removeChild(n);
            cp = mkPage(); used = 0;
            cp.appendChild(n);
            used = n.offsetHeight;
        } else {
            used += h;
        }
    }

    return wrap.querySelectorAll('.a4-page').length;
}

function ResumePreview({ html, onClose }) {
    const [pageCount, setPageCount] = useState(0);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(15,23,42,0.85)',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                zIndex: 10000, padding: '30px 20px',
                overflowY: 'auto'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }} onClick={e => e.stopPropagation()}>
                {/* Header bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: A4_WIDTH_PX, maxWidth: '95vw',
                    background: 'rgba(255,255,255,0.10)', borderRadius: 10,
                    padding: '10px 18px', backdropFilter: 'blur(8px)'
                }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 800 }}>
                        📄 Resume Preview — A4 {pageCount > 0 ? `(${pageCount} page${pageCount > 1 ? 's' : ''})` : ''}
                    </h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <FiX size={18} color="#fff" />
                    </button>
                </div>

                {/* A4 page(s) rendered in iframe */}
                <iframe
                    srcDoc={html}
                    title="Resume Preview"
                    style={{
                        width: A4_WIDTH_PX,
                        maxWidth: '95vw',
                        border: 'none',
                        display: 'block',
                        minHeight: A4_HEIGHT_PX,
                        background: 'transparent',
                    }}
                    onLoad={(e) => {
                        try {
                            const doc = e.target.contentDocument || e.target.contentWindow.document;
                            // Wait for fonts then paginate
                            const doPaginate = () => {
                                const count = paginateResumeDOM(doc.body);
                                setPageCount(count);
                                // Size iframe to fit all pages + gaps
                                const wrapper = doc.querySelector('.pages-wrapper');
                                if (wrapper) {
                                    e.target.style.height = (wrapper.scrollHeight + 40) + 'px';
                                } else {
                                    e.target.style.height = A4_HEIGHT_PX + 'px';
                                }
                            };
                            if (doc.fonts && doc.fonts.ready) {
                                doc.fonts.ready.then(() => requestAnimationFrame(doPaginate));
                            } else {
                                setTimeout(doPaginate, 300);
                            }
                        } catch (_) {
                            e.target.style.height = A4_HEIGHT_PX + 'px';
                        }
                    }}
                />

                {/* Page guide */}
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>
                    Click outside to close{pageCount > 1 ? ` • ${pageCount} pages` : ''}
                </div>
            </div>
        </div>
    );
}

// ─── Resume HTML Generator ────────────────────────────────────────────────────
const generateResumeHTML = (resumeData, expLevel, category, tmpl = 'basic') => {
    const { personalInfo: pi, summary, experience, education, skills, projects, certifications, languages } = resumeData;
    const isFresher = expLevel === 'fresher';
    const isTech = category === 'technical';
    const accent = tmpl === 'premium' ? '#7c3aed' : '#10b981';
    const fmtMonth = (m) => m ? new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

    // ── Content length analysis ──
    const expTextLen = experience.reduce((s, e) => s + (stripHtml(e.responsibilities || '')).length, 0);
    const projTextLen = projects.reduce((s, p) => s + (stripHtml(p.description || '')).length, 0);
    const totalLen = expTextLen + projTextLen;

    // ── Font sizing logic for single-page fit ──
    let fs = '10.5pt', nameFs = '26pt', stFs = '9pt', itFs = '11pt', bodyFs = '10pt', padding = '36px 44px', secMb = '16px', itemMb = '12px', hdrPb = '14px', hdrMb = '20px', rteGap = '3px', skillGap = '7px', bulletGap = '8px';

    if (totalLen > 2400 || (isTech && !isFresher && experience.length > 2)) {
        fs = '9pt'; nameFs = '22pt'; stFs = '8pt'; itFs = '10pt'; bodyFs = '9pt';
        padding = '24px 32px'; secMb = '10px'; itemMb = '8px'; hdrPb = '10px'; hdrMb = '14px'; rteGap = '2px'; skillGap = '5px'; bulletGap = '5px';
    } else if (totalLen > 1600) {
        fs = '9.5pt'; nameFs = '24pt'; stFs = '8.5pt'; itFs = '10.5pt'; bodyFs = '9.5pt';
        padding = '28px 38px'; secMb = '13px'; itemMb = '10px'; hdrPb = '12px'; hdrMb = '16px'; rteGap = '2px'; skillGap = '6px'; bulletGap = '6px';
    }

    // ── Skill display logic ──
    const isFresherLowContent = isFresher && totalLen < 800;
    const showSkillsVertical = isFresherLowContent;
    const isNonTechFresher = !isTech && isFresher;

    // ── Education: skip for tech experienced if content is very heavy ──
    const skipEdu = isTech && !isFresher && totalLen > 2800;

    // ── Section builders ──
    const secTitle = (t) => `<div class="st">${t}</div>`;

    const eduSection = () => `
<div class="sec">
  ${secTitle(isTech ? 'EDUCATION' : 'EDUCATION')}
  ${education.map(e => `
  <div class="item">
    <div class="ir">
      <span class="it">${e.degree || ''}${e.field ? ' in ' + e.field : ''}</span>
      <span class="id">${e.startYear || ''}${e.endYear ? ' – ' + e.endYear : ''}</span>
    </div>
    <p class="co">${e.institution || ''}</p>
  </div>`).join('')}
</div>`;

    const expSection = () => experience.length ? `
<div class="sec">
  ${secTitle('EXPERIENCE')}
  ${experience.map(e => `
  <div class="item">
    <div class="ir">
      <span class="it">${e.role || ''}${e.company ? ' — ' + e.company : ''}</span>
      <span class="id">${fmtMonth(e.startDate)} – ${e.currentlyWorking ? 'Present' : fmtMonth(e.endDate)}</span>
    </div>
    ${e.responsibilities ? `<div class="rte">${e.responsibilities}</div>` : ''}
  </div>`).join('')}
</div>` : '';

    const projSection = () => projects.length ? `
<div class="sec">
  ${secTitle('PROJECTS')}
  ${projects.map(p => `
  <div class="item">
    <div class="ir">
      <span class="it">${p.name || ''}</span>
      <span class="id">${fmtMonth(p.startDate)}${(p.endDate || p.currentlyWorking) ? ' – ' + (p.currentlyWorking ? 'Present' : fmtMonth(p.endDate)) : ''}</span>
    </div>
    ${p.company ? `<p class="co">${p.company}</p>` : ''}
    ${p.description ? `<div class="rte">${p.description}</div>` : ''}
    ${p.technologies ? `<p class="tc">Tech: ${p.technologies}</p>` : ''}
  </div>`).join('')}
</div>` : '';

    const certSection = () => certifications.length ? `
<div class="sec">
  ${secTitle('CERTIFICATIONS')}
  ${certifications.map(c => `
  <div class="item">
    <span class="it">${c.name || ''}</span>
    <p class="co">${c.issuer || ''}${c.date ? ' · ' + c.date : ''}</p>
  </div>`).join('')}
</div>` : '';

    // ── Skills section — varies by type ──
    const skillsSection = () => {
        if (isTech) {
            // Technical (fresher + experienced): always show as chips
            if (!Array.isArray(skills) || !skills.length) return '';
            return `<div class="sec">${secTitle('TECHNICAL SKILLS')}<div class="sk">${skills.map(s => `<span class="stag">${s}</span>`).join('')}</div></div>`;
        } else {
            // Non-technical: skills is a raw HTML string (like languages)
            if (typeof skills !== 'string' || !stripHtml(skills)) return '';
            return `<div class="sec">${secTitle('SKILLS')}<div class="rte">${skills}</div></div>`;
        }
    };

    // Languages section: wrap in .rte so bullet lists align with other sections
    const langSection = () => languages ? `
<div class="sec">
  ${secTitle('LANGUAGES KNOWN')}
  <div class="rte">${languages}</div>
</div>` : '';

    // ── Layout by user type ──
    let sections = '';

    // ── 1. Technical Experienced ──
    if (isTech && !isFresher) {
        sections = expSection() + projSection() + certSection() + (skipEdu ? '' : eduSection());
    }
    // ── 2. Technical Fresher ──
    else if (isTech && isFresher) {
        sections = skillsSection() + eduSection() + projSection() + certSection();
    }
    // ── 3. Non-Technical Experienced ──
    else if (!isTech && !isFresher) {
        sections = expSection() + eduSection() + skillsSection() + langSection();
    }
    // ── 4. Non-Technical Fresher ──
    else {
        sections = eduSection() + skillsSection() + langSection();
    }

    // ── Header: Tech Experienced uses inline contact row; others use side-by-side ──
    const techExpHeader = () => `
<div class="hdr-te">
  <div class="name">${pi.fullName || ''}</div>
  <div class="ctc-row">
    ${pi.email ? `<a href="mailto:${pi.email}" class="ctc-chip">
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      ${pi.email}
    </a>` : ''}
    ${pi.phone ? `<span class="ctc-chip">
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      ${pi.phone}
    </span>` : ''}
    ${pi.github ? `<a href="${pi.github}" class="ctc-chip">
      <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      GitHub
    </a>` : ''}
    ${pi.linkedin ? `<a href="${pi.linkedin}" class="ctc-chip">
      <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      LinkedIn
    </a>` : ''}
  </div>
</div>`;

    const stdHeader = () => `
<div class="hdr">
  <div>
    <div class="name">${pi.fullName || ''}</div>
  </div>
  <div class="ctc">
    ${pi.email ? `<div class="ctc-item"><svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><a href="mailto:${pi.email}" style="color:inherit;text-decoration:none">${pi.email}</a></div>` : ''}
    ${pi.phone ? `<div class="ctc-item"><svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><span>${pi.phone}</span></div>` : ''}
    ${pi.linkedin ? `<div class="ctc-item"><svg class="icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg><a href="${pi.linkedin}" target="_blank" style="color:inherit;text-decoration:none">LinkedIn</a></div>` : ''}
    ${pi.github ? `<div class="ctc-item"><svg class="icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg><a href="${pi.github}" target="_blank" style="color:inherit;text-decoration:none">GitHub</a></div>` : ''}
  </div>
</div>`;

    const headerHtml = (isTech && !isFresher) ? techExpHeader() : stdHeader();

    const nonTechSkillGap = !isTech ? (isFresherLowContent ? '14px' : '10px') : bulletGap;

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${pi.fullName || 'Resume'}</title>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Lato',sans-serif;background:#fff;color:#1e293b;font-size:${fs};line-height:1.5;margin:0}
.page{width:210mm;padding:${padding};box-sizing:border-box}
.pages-wrapper{display:flex;flex-direction:column;align-items:center;gap:30px;padding:10px 0}
.a4-page{box-shadow:0 2px 20px rgba(0,0,0,0.15);position:relative;}
/* Standard header */
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:${hdrPb};margin-bottom:${hdrMb}}
.hdr .name{font-size:${nameFs};font-weight:900;letter-spacing:-0.5px;color:#0f172a;margin-bottom:4px}
.ctc{display:flex;flex-direction:column;gap:5px;text-align:right;font-size:${bodyFs};color:#475569}
.ctc-item{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.icon{width:13px;height:13px;color:${accent};flex-shrink:0}
/* Tech Experienced header */
.hdr-te{border-bottom:3px solid ${accent};padding-bottom:${hdrPb};margin-bottom:${hdrMb}}
.hdr-te .name{font-size:${nameFs};font-weight:900;letter-spacing:-0.5px;color:#0f172a;margin-bottom:8px}
.ctc-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.ctc-chip{display:inline-flex;align-items:center;gap:5px;font-size:${bodyFs};color:#475569;text-decoration:none;padding:3px 0}
.ctc-chip:hover{color:${accent}}
.ctc-chip svg{color:${accent};flex-shrink:0}
/* Sections */
.sec{margin-bottom:${secMb}}
.st{font-size:${stFs};font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:${accent};border-bottom:2px solid #E2E8F0;padding-bottom:3px;margin-bottom:${itemMb}}
.item{margin-bottom:${itemMb};page-break-inside:avoid}
.ir{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}
.it{font-weight:700;font-size:${itFs};color:#0f172a}
.id{font-size:${bodyFs};color:#64748b;margin-left:8px;white-space:nowrap;font-weight:600}
.co{color:#64748b;font-size:${bodyFs};margin-top:2px;font-weight:600}
.rte{margin-top:${rteGap}}
.rte p{font-size:${bodyFs};color:#475569;margin-bottom:${rteGap};line-height:1.45}
.rte ul,.rte ol{padding-left:16px;font-size:${bodyFs};color:#475569;margin-top:${rteGap}}
.rte li{margin-bottom:${rteGap};line-height:1.45}
.tc{color:${accent};font-weight:700;font-size:${bodyFs};margin-top:3px}
/* Skills */
.sk{display:flex;flex-wrap:wrap;gap:${skillGap}}
.stag{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;padding:4px 11px;font-size:${bodyFs};font-weight:600}
/* Vertical skills (tech fresher low content) */
.sk-v{display:flex;flex-direction:column;gap:${bulletGap}}
.stag-v{font-size:${bodyFs};color:#475569;font-weight:600}
/* Non-tech bullet skills */
.sk-bullets{display:flex;flex-direction:column;gap:${nonTechSkillGap}}
.sk-b{font-size:${bodyFs};color:#475569;line-height:1.5}
/* Non-tech: remove any stray list markers */
.sk-bullets ul,.sk-bullets li{list-style:none;padding:0;margin:0}
/* Watermark/footer */
.footer-watermark{position:absolute;bottom:0;left:0;width:100%;text-align:center;padding-bottom:18px;font-size:10px;color:#888;font-family:'Lato',sans-serif;z-index:10;}
.footer-watermark a{color:#888;text-decoration:underline;}
@page{size:210mm 297mm;margin:0}
@media print{.pages-wrapper{gap:0;padding:0}.a4-page{box-shadow:none;break-after:page}.a4-page:last-child{break-after:auto}.page{padding:${padding}}}
</style>
</head>
<body>
<div class="page">
${headerHtml}
${summary ? `<div class="sec"><div class="st">CAREER OBJECTIVE</div><div class="rte">${summary}</div></div>` : ''}
${sections}
<div class="footer-watermark">
Created with Uptula | <a href="https://uptula.com" target="_blank">www.uptula.com</a>
</div>
</div>
</body></html>`;
};

function CreateResume() {
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();

    const [category, setCategory] = useState('');
    const [expLevel, setExpLevel] = useState('');
    const [setupDone, setSetupDone] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [isResumeCompleted, setIsResumeCompleted] = useState(false);
    const [activeField, setActiveField] = useState('');
    const [resumeData, setResumeData] = useState(defaultData());
    const [personalDraft, setPersonalDraft] = useState({ fullName: '', email: '', phone: '', address: '', linkedin: '', github: '' });
    const [summaryDraft, setSummaryDraft] = useState('');
    const [skillsDraft, setSkillsDraft] = useState('');
    const [languagesDraft, setLanguagesDraft] = useState('');
    const [message, setMessage] = useState('');
    const [downloadInfo, setDownloadInfo] = useState({ basicDownloads: 0, isPremium: false, canDownload: true, maxBasicDownloads: 10 });
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [premiumPlans, setPremiumPlans] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('basic');
    const [showPreview, setShowPreview] = useState(false);

    const steps = React.useMemo(
        () => setupDone ? buildSteps(category, expLevel) : [],
        [category, expLevel, setupDone]
    );
    const currentStepObj = steps[currentStep] || null;
    const currentStepType = currentStepObj?.type || '';
    const progress = steps.length ? Math.round((completedSteps.size / steps.length) * 100) : 0;

    // REFRESH DETECTION
    useEffect(() => {
        const marker = sessionStorage.getItem(REFRESH_MARKER_KEY);
        if (!marker) {
            sessionStorage.setItem(REFRESH_MARKER_KEY, 'active');
        }
        const handleBeforeUnload = () => {
            sessionStorage.removeItem(REFRESH_MARKER_KEY);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // SESSION PERSISTENCE
    useEffect(() => {
        const marker = sessionStorage.getItem(REFRESH_MARKER_KEY);
        if (!marker) {
            clearSession();
            return;
        }
        const savedState = loadFromSession();
        if (savedState) {
            setCategory(savedState.category || '');
            setExpLevel(savedState.expLevel || '');
            setSetupDone(savedState.setupDone || false);
            setCurrentStep(savedState.currentStep || 0);
            setCompletedSteps(new Set(savedState.completedSteps || []));
            setIsResumeCompleted(savedState.isResumeCompleted || false);
            setResumeData(savedState.resumeData || defaultData());
            setPersonalDraft(savedState.personalDraft || { fullName: '', email: '', phone: '', address: '', linkedin: '', github: '' });
            setSummaryDraft(savedState.summaryDraft || '');
            setSkillsDraft(savedState.skillsDraft || '');
            setLanguagesDraft(savedState.languagesDraft || '');
            setSelectedTemplate(savedState.selectedTemplate || 'basic');
        }
    }, []);

    useEffect(() => {
        if (setupDone) {
            saveToSession({ category, expLevel, setupDone, currentStep, completedSteps: Array.from(completedSteps), isResumeCompleted, resumeData, personalDraft, summaryDraft, skillsDraft, languagesDraft, selectedTemplate });
        }
    }, [category, expLevel, setupDone, currentStep, completedSteps, isResumeCompleted, resumeData, personalDraft, summaryDraft, skillsDraft, languagesDraft, selectedTemplate]);

    useEffect(() => {
        if (!user) { navigate('/'); return; }
        fetchDownloadInfo(); fetchPremiumPlans();
    }, [user, navigate]);

    useEffect(() => {
        if (!currentStepType) return;
        if (currentStepType === 'personal') setPersonalDraft({ ...resumeData.personalInfo });
        if (currentStepType === 'text') setSummaryDraft(resumeData.summary || '');
        if (currentStepType === 'skills') setSkillsDraft(
            category === 'non-technical'
                ? (typeof resumeData.skills === 'string' ? resumeData.skills : '')
                : (Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : '')
        );
        if (currentStepType === 'languages') setLanguagesDraft(resumeData.languages || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, setupDone, currentStepType]);

    const fetchDownloadInfo = async () => {
        try {
            const t = localStorage.getItem('token'); if (!t) return;
            const r = await fetch(`${API_BASE_URL}/api/resume/downloads/count`, { headers: { Authorization: `Bearer ${t}` } });
            if (r.ok) { const data = await r.json(); setDownloadInfo(prev => ({ ...prev, ...data })); }
        } catch { }
    };
    const fetchPremiumPlans = async () => {
        try { const r = await fetch(`${API_BASE_URL}/api/resume/premium/plans`); const data = r.ok ? await r.json() : null; setPremiumPlans(data?.plans || []); } catch { setPremiumPlans([]); }
    };

    const advanceStep = useCallback((extra = {}) => {
        setResumeData(prev => ({ ...prev, ...extra }));
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setActiveField('');
        setMessage('Section saved!');
        setTimeout(() => {
            setMessage('');
            if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
            else setIsResumeCompleted(true);
        }, 900);
    }, [currentStep, steps.length]);

    const savePersonal = () => advanceStep({ personalInfo: { ...personalDraft } });
    const saveSummary = () => { if (!stripHtml(summaryDraft)) return; advanceStep({ summary: summaryDraft }); };
    const saveSkills = () => {
        if (category === 'non-technical') {
            // Store as raw HTML string (like languages) to preserve bullet formatting
            advanceStep({ skills: skillsDraft });
        } else {
            const arr = skillsDraft.split(/[,]+/).map(s => s.trim()).filter(Boolean);
            advanceStep({ skills: arr });
        }
    };
    const saveLanguages = () => advanceStep({ languages: languagesDraft });
    const saveStructured = () => advanceStep();

    const mut = (key, idx, field, val) => setResumeData(prev => { const a = [...prev[key]]; a[idx] = { ...a[idx], [field]: val }; return { ...prev, [key]: a }; });
    const addRow = (key, fn) => setResumeData(prev => ({ ...prev, [key]: [...prev[key], fn()] }));
    const delRow = (key, idx) => setResumeData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
    const vid = (...p) => p.join('__');
    const handlePillClick = (idx) => { if (completedSteps.has(idx) || idx === currentStep) setCurrentStep(idx); };
    const handleRefresh = () => { clearSession(); window.location.reload(); };
    const handleBackToResume = () => { setIsResumeCompleted(false); setCurrentStep(completedSteps.size > 0 ? Math.max(...Array.from(completedSteps)) : 0); };

    const generateResume = useCallback((tmpl = 'basic') => {
        return generateResumeHTML(resumeData, expLevel, category, tmpl);
    }, [resumeData, expLevel, category]);

    // ── Download as HTML ──
    const downloadAsHTML = async (tmpl) => {
        try {
            const t = localStorage.getItem('token'); if (!t) return;
            if (!downloadInfo.canDownload && !downloadInfo.isPremium) { setShowPremiumModal(true); return; }
            const r = await fetch(`${API_BASE_URL}/api/resume/download`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: tmpl, resumeData })
            });
            if (r.ok) {
                const html = generateResume(tmpl);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.html`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                setMessage('Resume downloaded!'); fetchDownloadInfo();
                setTimeout(() => { handleRefresh(); }, 1500);
            } else {
                const e = await r.json();
                if (e.requiresPremium) setShowPremiumModal(true); else setMessage('Download failed.');
            }
        } catch (err) {
            console.error('HTML download error:', err);
            setMessage('Download failed.');
        }
    };

    // ── Download as PDF — server-side (real text + clickable links) ──
    // const downloadAsPDF = async (tmpl) => {
    //     try {
    //         const t = localStorage.getItem('token'); if (!t) return;
    //         if (!downloadInfo.canDownload && !downloadInfo.isPremium) { setShowPremiumModal(true); return; }

    //         const htmlStr = generateResume(tmpl);
    //         const r = await fetch(`${API_BASE_URL}/api/resume/pdf`, {
    //             method: 'POST',
    //             headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ template: tmpl, html: htmlStr })
    //         });

    //         if (!r.ok) {
    //             let e = null;
    //             try { e = await r.json(); } catch (_) { }
    //             if (e?.requiresPremium) setShowPremiumModal(true);
    //             else setMessage(e?.message || 'PDF download failed.');
    //             return;
    //         }

    //         const blob = await r.blob();
    //         const url = URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.pdf`;
    //         document.body.appendChild(a);
    //         a.click();
    //         document.body.removeChild(a);
    //         URL.revokeObjectURL(url);
    //         setMessage('PDF downloaded!');
    //         fetchDownloadInfo();
    //         setTimeout(() => { handleRefresh(); }, 1500);
    //     } catch (err) {
    //         console.error('PDF error:', err);
    //         setMessage('PDF download failed.');
    //     }
    // };
    // ─── REPLACE your existing downloadAsPDF function with this ──────────────────
    // Location: inside CreateResume() component in CreateResume.jsx

    const downloadAsPDF = async (tmpl) => {
        try {
            const t = localStorage.getItem('token');
            if (!t) return;

            // Check premium gate first
            if (!downloadInfo.canDownload && !downloadInfo.isPremium) {
                setShowPremiumModal(true);
                return;
            }

            setMessage('Generating your PDF…');

            const htmlStr = generateResume(tmpl);

            const r = await fetch(`${API_BASE_URL}/api/resume/pdf`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${t}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ template: tmpl, html: htmlStr }),
            });

            // ── Handle non-ok HTTP responses ──────────────────────────────────────
            if (!r.ok) {
                let errData = null;
                try { errData = await r.json(); } catch (_) { }

                if (errData?.requiresPremium) {
                    setShowPremiumModal(true);
                    setMessage('');
                } else {
                    setMessage(errData?.message || 'PDF download failed. Please try again.');
                }
                return;
            }

            // ── Check Content-Type to decide what the server actually returned ────
            const contentType = r.headers.get('Content-Type') || '';

            // CASE A: Server returned a real PDF ✅
            if (contentType.includes('application/pdf')) {
                const blob = await r.blob();

                // Safety check: real PDFs start with %PDF bytes
                const arrayBuffer = await blob.arrayBuffer();
                const firstBytes = new Uint8Array(arrayBuffer).slice(0, 4);
                const isPDF = firstBytes[0] === 0x25 && // %
                    firstBytes[1] === 0x50 && // P
                    firstBytes[2] === 0x44 && // D
                    firstBytes[3] === 0x46;   // F

                if (!isPDF) {
                    // Bytes don't look like a PDF — fallback to HTML download
                    console.warn('[PDF] Server returned non-PDF bytes under application/pdf header, falling back to HTML');
                    triggerHTMLFallback(htmlStr, tmpl, t);
                    return;
                }

                const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setMessage('PDF downloaded successfully! ✅');
                fetchDownloadInfo();
                setTimeout(() => { handleRefresh(); }, 1500);
                return;
            }

            // CASE B: Server returned JSON (fallback signal or error)
            if (contentType.includes('application/json') || contentType.includes('text/json')) {
                const data = await r.json();

                if (data?.fallback || data?.suggestHtml) {
                    // Server explicitly told us PDF engine is unavailable
                    // Trigger HTML download instead and inform the user
                    setMessage('');
                    triggerHTMLFallback(htmlStr, tmpl, t, true);
                    return;
                }

                setMessage(data?.message || 'PDF generation failed. Please try again.');
                return;
            }

            // CASE C: Server returned HTML directly (old fallback behaviour) ⚠️
            if (contentType.includes('text/html')) {
                console.warn('[PDF] Server returned HTML instead of PDF — saving as .html');
                const htmlBlob = await r.blob();
                const url = URL.createObjectURL(htmlBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setMessage('⚠️ PDF engine unavailable — downloaded as HTML. Open in Chrome → Ctrl+P → Save as PDF.');
                fetchDownloadInfo();
                return;
            }

            // CASE D: Unknown response
            setMessage('Unexpected server response. Please try the HTML download instead.');

        } catch (err) {
            console.error('[PDF] Download error:', err);
            setMessage('Download failed. Check your connection and try again.');
        }
    };

    // ─── Helper: download resume as HTML (used as PDF fallback) ──────────────────
    const triggerHTMLFallback = async (htmlStr, tmpl, token, showTip = false) => {
        try {
            // Record the download server-side
            await fetch(`${API_BASE_URL}/api/resume/download`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ template: tmpl, resumeData }),
            });
        } catch (_) {
            // Non-critical — don't block the download
        }

        const blob = new Blob([htmlStr], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (showTip) {
            setMessage(
                '📄 Downloaded as HTML. To get a PDF: open the file in Chrome → Ctrl+P (or Cmd+P) → "Save as PDF".'
            );
        } else {
            setMessage('Resume downloaded as HTML ✅');
        }

        fetchDownloadInfo();
        setTimeout(() => { handleRefresh(); }, 2500);
    };

    const subscribeToPremium = async (planId) => {
        try {
            const t = localStorage.getItem('token');
            const r = await fetch(`${API_BASE_URL}/api/resume/premium/subscribe`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionType: planId, paymentMethod: 'mock' })
            });
            if (r.ok) { setMessage('Premium activated!'); setShowPremiumModal(false); fetchDownloadInfo(); }
            else setMessage('Subscription failed.');
        } catch { setMessage('Subscription error.'); }
    };

    const CARD = { background: '#fff', borderRadius: 16, boxShadow: '0 2px 24px rgba(16,185,129,0.09)', padding: 32 };
    const GBTN = (extra = {}) => ({ background: 'linear-gradient(135deg,#10b981,#34d399)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 8, ...extra });
    const OBTN = (c = '#10b981', extra = {}) => ({ background: '#fff', color: c, border: `1.5px solid ${c}`, borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 7, ...extra });
    const DELBTN = { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 5 };
    const ECARD = { background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 22, marginBottom: 18 };
    const ADDROW = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#F0FDF4', border: '1.5px dashed #6EE7B7', borderRadius: 10, padding: '12px 0', cursor: 'pointer', color: '#059669', fontWeight: 700, fontSize: 15, fontFamily: "'Lato',sans-serif" };
    const SECHDR = { fontWeight: 800, color: '#0f172a', fontSize: 21, margin: '0 0 4px' };
    const SECSUB = { color: '#64748b', fontSize: 14, margin: '0 0 22px', fontFamily: "'Lato',sans-serif" };

    if (authLoading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div style={{ textAlign: 'center' }}><div style={{ width: 44, height: 44, border: '4px solid #E0F7EF', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 18px' }} /><p style={{ fontSize: 16, color: '#64748b' }}>Loading…</p></div></div>);
    if (!user) return (<div style={{ padding: 60, textAlign: 'center' }}><h2>Please login to continue</h2><button onClick={() => navigate('/')} style={GBTN({ margin: '20px auto 0', justifyContent: 'center' })}>Go Home</button></div>);

    const Banner = () => (<div style={{ width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 28, boxShadow: '0 4px 20px rgba(16,185,129,0.13)', flexShrink: 0 }}><img src="/assets/img/resume heading.png" alt="Resume Builder" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg,#10b981,#34d399)'; e.target.parentElement.style.height = '100px'; }} /></div>);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet" />
            <style>{`
                *, *::before, *::after { box-sizing: border-box; }
                body, .rs-page { font-family: 'Lato', sans-serif !important; font-size: 15px; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{box-shadow:0 0 0 8px rgba(16,185,129,0)} }
                .vi-field { font-family: 'Lato', sans-serif !important; font-size: 15px !important; }
                .vi-field:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important; outline: none !important; }
                .month-input::-webkit-calendar-picker-indicator { cursor: pointer; font-size: 18px; padding: 4px; }
                input[type="month"] { position: relative; }
                input[type="month"]::-webkit-datetime-edit { font-size: 16px; }
                .pill-btn { border:none; cursor:pointer; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; padding:7px 14px; border-radius:24px; display:inline-flex; align-items:center; gap:5px; transition:all 0.2s; white-space:nowrap; }
                .pill-done { background:#D1FAE5; color:#065F46; } .pill-done:hover { background:#A7F3D0; transform:translateY(-1px); box-shadow:0 2px 8px rgba(16,185,129,0.18); }
                .pill-active { background:#10b981; color:#fff; box-shadow:0 3px 10px rgba(16,185,129,0.3); }
                .pill-todo { background:#F1F5F9; color:#94A3B8; cursor:default; }
                .g2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
                .span2 { grid-column:1 / -1; }
                @media(max-width:700px){ .g2 { grid-template-columns:1fr; } }
                @media (max-width: 991px) {
                    .candidate-dashboard-sidebar { display: none !important; }
                    .candidate-dashboard-main {
                        width: 100% !important;
                        max-width: 100% !important;
                        float: none !important;
                    }
                }
                .voice-hint-bar { background:#ECFDF5; border:1px solid #A7F3D0; border-radius:10px; padding:10px 16px; font-size:13px; color:#065F46; font-weight:600; display:flex; align-items:center; gap:8px; margin-bottom:20px; }
                .entry-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
                .entry-num { font-size:13px; font-weight:800; color:#10b981; letter-spacing:0.5px; text-transform:uppercase; }
            `}</style>

            {message && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: message.includes('saved') || message.includes('download') || message.includes('PDF') || message.includes('Premium') ? '#D1FAE5' : '#DBEAFE', color: '#065F46', padding: '14px 22px', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontWeight: 700, fontSize: 15, minWidth: 280, border: '1px solid #A7F3D0', fontFamily: "'Lato',sans-serif" }}>{message}</div>}

            <Header />
            <section className="rs-page" style={{ paddingTop: 80, paddingBottom: 80, background: '#F8FAFC', minHeight: '80vh' }}>
                <div className="container"><div className="row">
                    <div className="col-md-3 candidate-dashboard-sidebar">
                        {/* <div id="leftcol_item">
                            <div className="user_dashboard_pic" style={{
                                background: 'linear-gradient(to right, #DADADA, #28a745)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '15px',
                                gap: '15px',
                                borderRadius: '10px',
                                boxShadow: '0 1px 7px rgba(0, 0, 0, 0.1)'
                            }}>
                                <img
                                    alt="user photo"
                                    src="/assets/img/user-profile.png"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        objectFit: 'contain',
                                        objectPosition: 'center',
                                        border: '3px solid #fff',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                        display: 'block',
                                        flexShrink: 0,
                                        background: '#fff'
                                    }}
                                    onError={(e) => {
                                        e.target.src = "/assets/img/user-profile.png";
                                    }}
                                />
                                <span style={{
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    flex: 1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {user.fullName}
                                </span>
                            </div>
                        </div>
                        <div className="dashboard_nav_item"><ul>
                            {[['Home', 'ti-dashboard', '/'], ['Edit Profile', 'ti-user', '/profile'], ['Applied Jobs', 'ti-clipboard', '/candidate/applied-jobs'], ['Create Resume', 'ti-file', null, true], ['Change Password', 'ti-key', '/candidate/change-password'], ['Chat Inbox', 'ti-comments', '/candidate/chat'], ['My Wishlist', 'ti-heart', '/candidate/wishlist']].map(([lbl, ico, path, active]) => (
                                <li key={lbl} className={active ? 'active' : ''}><a href="#" onClick={e => { e.preventDefault(); if (path) navigate(path); }}><i className={`login-icon ${ico}`} /> {lbl}</a></li>
                            ))}
                            <li><a href="#" onClick={e => { e.preventDefault(); logout(); navigate('/'); }}><i className="login-icon ti-power-off" /> Logout</a></li>
                        </ul></div> */}
                        <CandidateSidebar activePage="create-resume" />
                    </div>

                    <div className="col-md-9 candidate-dashboard-main">
                        <div style={{ marginTop: 0 }}>
                            <Banner />
                        </div>

                        {!setupDone && (
                            <div style={CARD}>
                                <h2 style={{ fontWeight: 900, textAlign: 'center', color: '#0f172a', fontSize: 26, marginBottom: 6 }}>Build Your Resume</h2>
                                <p style={{ color: '#64748b', textAlign: 'center', fontSize: 15, marginBottom: 30 }}>Select your field and experience level to get a tailored, voice-enabled resume builder.</p>
                                <div style={{ marginBottom: 20 }}><label style={{ ...FL_ST, marginBottom: 8 }}>Resume Category</label><CustomSelect value={category} onChange={setCategory} options={CAT_OPTIONS} placeholder="Select your field…" /></div>
                                <div style={{ marginBottom: 28 }}><label style={{ ...FL_ST, marginBottom: 8 }}>Experience Level</label><CustomSelect value={expLevel} onChange={setExpLevel} options={EXP_OPTIONS} placeholder="Select experience level…" /></div>
                                {category && expLevel && <div style={{ background: '#F0FDF4', border: '1.5px solid #A7F3D0', borderRadius: 10, padding: '12px 18px', marginBottom: 24, fontSize: 14, color: '#065F46', fontWeight: 700 }}>Your flow: {buildSteps(category, expLevel).map(s => s.title).join(' → ')}</div>}
                                <button disabled={!category || !expLevel} onClick={() => { if (category && expLevel) setSetupDone(true); }} style={GBTN({ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 16, opacity: (!category || !expLevel) ? 0.45 : 1 })}><FiChevronRight size={18} /> Start Building My Resume</button>
                            </div>
                        )}

                        {setupDone && !isResumeCompleted && currentStepObj && (
                            <div>
                                <div className="voice-hint-bar"><FiMic size={15} color="#059669" />Click the mic icon on any text field to speak. Mic auto-stops after 5 seconds of silence.</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {steps.map((s, i) => {
                                        const done = completedSteps.has(i), active = i === currentStep;
                                        return (<button key={s.id} className={`pill-btn ${done ? 'pill-done' : active ? 'pill-active' : 'pill-todo'}`} onClick={() => handlePillClick(i)} style={{ cursor: (done || active) ? 'pointer' : 'default' }}>{done ? <FiCheckCircle size={13} /> : <FiCircle size={13} />}{s.title}</button>);
                                    })}
                                </div>
                                <div style={{ height: 7, background: '#E2E8F0', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 4, transition: 'width 0.5s ease' }} /></div>

                                {currentStepObj.type === 'personal' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Personal Information</h3>
                                        <p style={SECSUB}>Fill in your details. Voice input is available on text, phone, and address fields.</p>
                                        <div className="g2" style={{ marginBottom: 22 }}>
                                            <div><label style={FL_ST}>Full Name *</label>
                                                <VoiceInput fieldId={vid('pi', 'fn')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.fullName} onChange={v => setPersonalDraft(p => ({ ...p, fullName: v }))} placeholder="e.g. Rahul Sharma" inputType="text" /></div>
                                            <div><label style={FL_ST}>Email Address *</label>
                                                <VoiceInput fieldId={vid('pi', 'em')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.email} onChange={v => setPersonalDraft(p => ({ ...p, email: v }))} placeholder="e.g. rahul@email.com" inputType="email" /></div>
                                            <div><label style={FL_ST}>Phone Number</label>
                                                <VoiceInput fieldId={vid('pi', 'ph')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.phone} onChange={v => setPersonalDraft(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" inputType="tel" /></div>
                                            <div><label style={FL_ST}>City / Address</label>
                                                <VoiceInput fieldId={vid('pi', 'ad')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.address} onChange={v => setPersonalDraft(p => ({ ...p, address: v }))} placeholder="e.g. Bhubaneswar, Odisha" inputType="text" /></div>
                                            <div><label style={FL_ST}>LinkedIn URL</label>
                                                <VoiceInput fieldId={vid('pi', 'li')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.linkedin} onChange={v => setPersonalDraft(p => ({ ...p, linkedin: v }))} placeholder="linkedin.com/in/yourname" inputType="url" /></div>
                                            <div><label style={FL_ST}>GitHub URL</label>
                                                <VoiceInput fieldId={vid('pi', 'gh')} activeField={activeField} setActiveField={setActiveField} value={personalDraft.github} onChange={v => setPersonalDraft(p => ({ ...p, github: v }))} placeholder="github.com/yourname" inputType="url" /></div>
                                        </div>
                                        <button onClick={savePersonal} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'text' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Career Objective</h3>
                                        <p style={SECSUB}>Use the rich text editor below. Click the mic icon inside to dictate your career objective.</p>
                                        <label style={FL_ST}>Career Objective *</label>
                                        <div style={{ marginBottom: 22 }}>
                                            <RichField fieldId="summary__main" activeField={activeField} setActiveField={setActiveField} value={summaryDraft} onChange={setSummaryDraft} placeholder="Describe your background, skills, and career goals…" />
                                        </div>
                                        <button onClick={saveSummary} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'skills' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>{currentStepObj.title}</h3>
                                        <p style={SECSUB}>
                                            {category === 'non-technical'
                                                ? 'Write your skills. Each skill on a new line or use bullet points.'
                                                : 'Type or speak skills separated by commas. Voice automatically formats spoken "and/or" as commas.'}
                                        </p>
                                        <label style={FL_ST}>
                                            {category === 'non-technical' ? 'Skills (one per line)' : 'Skills (comma-separated)'}
                                        </label>
                                        <div style={{ marginBottom: 16 }}>
                                            {category === 'non-technical' ? (
                                                <RichField
                                                    fieldId="skills__main"
                                                    activeField={activeField}
                                                    setActiveField={setActiveField}
                                                    value={skillsDraft}
                                                    onChange={setSkillsDraft}
                                                    placeholder={`• Leadership\n• Team Management\n• Communication\n• Problem Solving`}
                                                />
                                            ) : (
                                                <VoiceInput
                                                    fieldId="skills__main"
                                                    activeField={activeField}
                                                    setActiveField={setActiveField}
                                                    value={skillsDraft}
                                                    onChange={setSkillsDraft}
                                                    placeholder="e.g. React, Node.js, Python, SQL, Leadership…"
                                                    isSkills
                                                />
                                            )}
                                        </div>
                                        {skillsDraft.trim() && category !== 'non-technical' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                                                {skillsDraft.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                                                    <span key={i} style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>{s}</span>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={saveSkills} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'languages' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Languages Known</h3>
                                        <p style={SECSUB}>List languages you can speak, read, or write. Separate with commas.</p>
                                        <label style={FL_ST}>Languages</label>
                                        <div style={{ marginBottom: 16 }}>
                                            <RichField
                                                fieldId="languages__main"
                                                activeField={activeField}
                                                setActiveField={setActiveField}
                                                value={languagesDraft}
                                                onChange={setLanguagesDraft}
                                                placeholder="e.g. Hindi, English, Bengali…"
                                            />
                                        </div>
                                        {category === 'non-technical' && languagesDraft.trim() && (
                                            <ul style={{ margin: '16px 0 0 0', paddingLeft: 36 }}>
                                                {languagesDraft.split(/\n|\r|\u2028|\u2029/).map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean).map((lang, i) => (
                                                    <li key={i} style={{ fontSize: 15, color: '#1e293b', fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>{lang}</li>
                                                ))}
                                            </ul>
                                        )}
                                        <button onClick={saveLanguages} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'experience' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Work Experience</h3>
                                        <p style={SECSUB}>All positions will appear in your resume. Add as many as needed.</p>
                                        {resumeData.experience.map((exp, idx) => (
                                            <div style={ECARD} key={idx}>
                                                <div className="entry-header">
                                                    <span className="entry-num">Experience #{idx + 1}</span>
                                                    {resumeData.experience.length > 1 && <button onClick={() => delRow('experience', idx)} style={DELBTN}><FiTrash2 size={13} /> Remove</button>}
                                                </div>
                                                <div className="g2" style={{ marginBottom: 16 }}>
                                                    <div><label style={FL_ST}>Job Title / Role *</label>
                                                        <VoiceInput fieldId={vid('ex', idx, 'role')} activeField={activeField} setActiveField={setActiveField} value={exp.role} onChange={v => mut('experience', idx, 'role', v)} placeholder="e.g. Software Engineer" /></div>
                                                    <div><label style={FL_ST}>Company Name *</label>
                                                        <VoiceInput fieldId={vid('ex', idx, 'co')} activeField={activeField} setActiveField={setActiveField} value={exp.company} onChange={v => mut('experience', idx, 'company', v)} placeholder="e.g. Infosys, TCS" /></div>
                                                </div>
                                                <MonthRange
                                                    startVal={exp.startDate} onStartChange={v => mut('experience', idx, 'startDate', v)}
                                                    endVal={exp.endDate} onEndChange={v => mut('experience', idx, 'endDate', v)}
                                                    currentlyWorking={exp.currentlyWorking} onCurrentlyWorkingChange={v => mut('experience', idx, 'currentlyWorking', v)} />
                                                <div style={{ marginTop: 16 }}>
                                                    <label style={FL_ST}>Key Responsibilities & Achievements</label>
                                                    <RichField fieldId={vid('ex', idx, 'resp')} activeField={activeField} setActiveField={setActiveField} value={exp.responsibilities} onChange={v => mut('experience', idx, 'responsibilities', v)} placeholder="Describe your responsibilities and achievements…" />
                                                </div>
                                            </div>
                                        ))}
                                        <button style={ADDROW} onClick={() => addRow('experience', emptyExp)}><FiPlus size={16} /> Add Another Position</button>
                                        <button onClick={saveStructured} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 22 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'projects' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Projects</h3>
                                        <p style={SECSUB}>Add projects with company and duration. Voice mic available on text fields.</p>
                                        {resumeData.projects.map((proj, idx) => (
                                            <div style={ECARD} key={idx}>
                                                <div className="entry-header">
                                                    <span className="entry-num">Project #{idx + 1}</span>
                                                    {resumeData.projects.length > 1 && <button onClick={() => delRow('projects', idx)} style={DELBTN}><FiTrash2 size={13} /> Remove</button>}
                                                </div>
                                                <div className="g2" style={{ marginBottom: 16 }}>
                                                    <div><label style={FL_ST}>Project Name *</label>
                                                        <VoiceInput fieldId={vid('pr', idx, 'nm')} activeField={activeField} setActiveField={setActiveField} value={proj.name} onChange={v => mut('projects', idx, 'name', v)} placeholder="e.g. E-Commerce Platform" /></div>
                                                    <div><label style={FL_ST}>Company / Organization</label>
                                                        <VoiceInput fieldId={vid('pr', idx, 'co')} activeField={activeField} setActiveField={setActiveField} value={proj.company} onChange={v => mut('projects', idx, 'company', v)} placeholder="e.g. Infosys, Freelance" /></div>
                                                    <div className="span2"><label style={FL_ST}>Technologies Used</label>
                                                        <VoiceInput fieldId={vid('pr', idx, 'tc')} activeField={activeField} setActiveField={setActiveField} value={proj.technologies} onChange={v => mut('projects', idx, 'technologies', v)} placeholder="e.g. React, Node.js, MongoDB" /></div>
                                                </div>
                                                <MonthRange
                                                    startVal={proj.startDate} onStartChange={v => mut('projects', idx, 'startDate', v)}
                                                    endVal={proj.endDate} onEndChange={v => mut('projects', idx, 'endDate', v)}
                                                    currentlyWorking={proj.currentlyWorking} onCurrentlyWorkingChange={v => mut('projects', idx, 'currentlyWorking', v)}
                                                    endLabel="End Date" />
                                                <div style={{ marginTop: 16 }}>
                                                    <label style={FL_ST}>Description</label>
                                                    <RichField fieldId={vid('pr', idx, 'ds')} activeField={activeField} setActiveField={setActiveField} value={proj.description} onChange={v => mut('projects', idx, 'description', v)} placeholder="Describe the project, your role and key outcomes…" />
                                                </div>
                                            </div>
                                        ))}
                                        <button style={ADDROW} onClick={() => addRow('projects', emptyProject)}><FiPlus size={16} /> Add Another Project</button>
                                        <button onClick={saveStructured} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 22 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'education' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Education</h3>
                                        <p style={SECSUB}>
                                            {expLevel === 'fresher'
                                                ? '💡 Tip: As a fresher, adding your last two higher qualifications (e.g. 10+2 and Degree/Diploma) makes your resume stronger.'
                                                : 'Add your educational qualifications. Mic available on text fields.'}
                                        </p>
                                        {resumeData.education.map((edu, idx) => (
                                            <div style={ECARD} key={idx}>
                                                <div className="entry-header">
                                                    <span className="entry-num">Education #{idx + 1}</span>
                                                    {resumeData.education.length > 1 && <button onClick={() => delRow('education', idx)} style={DELBTN}><FiTrash2 size={13} /> Remove</button>}
                                                </div>
                                                <div className="g2">
                                                    <div className="span2"><label style={FL_ST}>Institution Name *</label>
                                                        <VoiceInput fieldId={vid('ed', idx, 'in')} activeField={activeField} setActiveField={setActiveField} value={edu.institution} onChange={v => mut('education', idx, 'institution', v)} placeholder="e.g. KIIT University, Bhubaneswar" /></div>
                                                    <div><label style={FL_ST}>Degree / Qualification</label>
                                                        <VoiceInput fieldId={vid('ed', idx, 'dg')} activeField={activeField} setActiveField={setActiveField} value={edu.degree} onChange={v => mut('education', idx, 'degree', v)} placeholder="e.g. B.Tech, MBA" /></div>
                                                    <div><label style={FL_ST}>Field of Study</label>
                                                        <VoiceInput fieldId={vid('ed', idx, 'fd')} activeField={activeField} setActiveField={setActiveField} value={edu.field} onChange={v => mut('education', idx, 'field', v)} placeholder="e.g. Computer Science" /></div>
                                                    <div><label style={FL_ST}>Start Year</label>
                                                        <VoiceInput fieldId={vid('ed', idx, 'sy')} activeField={activeField} setActiveField={setActiveField} value={edu.startYear} onChange={v => mut('education', idx, 'startYear', v)} placeholder="e.g. 2020" inputType="number" /></div>
                                                    <div><label style={FL_ST}>End Year (or Expected)</label>
                                                        <VoiceInput fieldId={vid('ed', idx, 'ey')} activeField={activeField} setActiveField={setActiveField} value={edu.endYear} onChange={v => mut('education', idx, 'endYear', v)} placeholder="e.g. 2024 or Expected 2025" inputType="number" /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <button style={ADDROW} onClick={() => addRow('education', emptyEdu)}><FiPlus size={16} /> Add Another Degree</button>
                                        <button onClick={saveStructured} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 22 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}

                                {currentStepObj.type === 'certifications' && (
                                    <div style={CARD}>
                                        <h3 style={SECHDR}>Certifications</h3>
                                        <p style={SECSUB}>Optional — skip if you have none. Use the mic to speak certification names.</p>
                                        {resumeData.certifications.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 15 }}>No certifications added yet. Click below to add one.</div>
                                        )}
                                        {resumeData.certifications.map((cert, idx) => (
                                            <div style={ECARD} key={idx}>
                                                <div className="entry-header">
                                                    <span className="entry-num">Certificate #{idx + 1}</span>
                                                    <button onClick={() => delRow('certifications', idx)} style={DELBTN}><FiTrash2 size={13} /> Remove</button>
                                                </div>
                                                <div className="g2">
                                                    <div className="span2"><label style={FL_ST}>Certification Name *</label>
                                                        <VoiceInput fieldId={vid('ct', idx, 'nm')} activeField={activeField} setActiveField={setActiveField} value={cert.name} onChange={v => mut('certifications', idx, 'name', v)} placeholder="e.g. AWS Certified Solutions Architect" /></div>
                                                    <div><label style={FL_ST}>Issuing Organization</label>
                                                        <VoiceInput fieldId={vid('ct', idx, 'is')} activeField={activeField} setActiveField={setActiveField} value={cert.issuer} onChange={v => mut('certifications', idx, 'issuer', v)} placeholder="e.g. Amazon Web Services" /></div>
                                                    <div><label style={FL_ST}>Date Obtained</label>
                                                        <VoiceInput fieldId={vid('ct', idx, 'dt')} activeField={activeField} setActiveField={setActiveField} value={cert.date} onChange={v => mut('certifications', idx, 'date', v)} placeholder="e.g. Aug 2024" /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <button style={ADDROW} onClick={() => addRow('certifications', emptyCert)}><FiPlus size={16} /> Add Certificate</button>
                                        <button onClick={saveStructured} style={GBTN({ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 22 })}>Save & Continue <FiChevronRight size={17} /></button>
                                    </div>
                                )}
                            </div>
                        )}

                        {setupDone && isResumeCompleted && (
                            <div style={CARD}>
                                <div style={{ marginBottom: 22 }}><button onClick={handleBackToResume} style={OBTN('#64748b', { fontSize: 14 })}><FiArrowLeft size={16} /> Back to Edit</button></div>
                                <div style={{ textAlign: 'center', paddingBottom: 26 }}><div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div><h2 style={{ fontWeight: 900, color: '#10b981', fontSize: 26, marginBottom: 7 }}>Your Resume is Ready!</h2><p style={{ color: '#64748b', fontSize: 15 }}>Choose a template, preview, and download.</p></div>
                                <div style={{ background: '#F0FDF4', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '15px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div><div style={{ fontWeight: 800, color: '#065F46', fontSize: 16 }}>{downloadInfo.isPremium ? '⭐ Premium Member' : `Downloads used: ${downloadInfo.basicDownloads} / ${downloadInfo.maxBasicDownloads}`}</div><div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{downloadInfo.isPremium ? 'Unlimited downloads & premium templates' : 'Free plan: 10 downloads included'}</div></div>
                                    {!downloadInfo.isPremium && <button onClick={() => setShowPremiumModal(true)} style={GBTN({ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1e293b', fontSize: 14 })}>⭐ Upgrade</button>}
                                </div>
                                <div style={{ marginBottom: 22 }}><label style={{ ...FL_ST, marginBottom: 12 }}>Choose Template</label><div style={{ display: 'flex', gap: 14 }}>{['basic', ...(downloadInfo.isPremium ? ['premium'] : [])].map(t => (<button key={t} onClick={() => setSelectedTemplate(t)} style={{ flex: 1, padding: '15px', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 15, fontFamily: "'Lato',sans-serif", border: selectedTemplate === t ? '2px solid #10b981' : '1.5px solid #E2E8F0', background: selectedTemplate === t ? '#F0FDF4' : '#fff', color: selectedTemplate === t ? '#065F46' : '#94A3B8', transition: 'all 0.2s', boxShadow: selectedTemplate === t ? '0 2px 12px rgba(16,185,129,0.15)' : 'none' }}>{t === 'basic' ? '📄 Basic Template' : '🌟 Premium Template'}</button>))}</div></div>
                                <button onClick={() => setShowPreview(true)} style={GBTN({ width: '100%', justifyContent: 'center', marginBottom: 16 })}>
                                    👁 Preview Resume (A4 Format)
                                </button>
                                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
                                    <button onClick={() => downloadAsPDF(selectedTemplate)} style={GBTN({ flex: 1, justifyContent: 'center', padding: '14px', minWidth: 140, fontSize: 16 })}>📄 Download PDF</button>
                                    <button onClick={() => downloadAsHTML(selectedTemplate)} style={GBTN({ flex: 1, justifyContent: 'center', padding: '14px', minWidth: 140, fontSize: 16, background: '#0ea5e9' })}>🌐 Download HTML</button>
                                </div>
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 18, textAlign: 'center' }}><button onClick={handleRefresh} style={OBTN('#DC2626', { justifyContent: 'center', margin: '0 auto' })}>🔄 Start Fresh</button></div>
                            </div>
                        )}
                    </div>
                </div></div>
            </section>
            <Footer />

            {showPreview && <ResumePreview html={generateResume(selectedTemplate)} onClose={() => setShowPreview(false)} />}

            {showPremiumModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
                    <div style={{ background: '#fff', padding: 40, borderRadius: 20, maxWidth: 520, width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', fontFamily: "'Lato',sans-serif" }}>
                        <h3 style={{ textAlign: 'center', marginBottom: 20, fontSize: 24, fontWeight: 900, color: '#0f172a' }}>⭐ Upgrade to Premium</h3>
                        <div style={{ background: '#FEF9EE', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}><p style={{ color: '#92400E', fontWeight: 700, margin: 0, fontSize: 15 }}>You have used {downloadInfo.basicDownloads} of {downloadInfo.maxBasicDownloads} free downloads.</p></div>
                        <ul style={{ color: '#374151', lineHeight: 2.3, marginBottom: 24, paddingLeft: 22, fontSize: 15 }}><li>✅ Unlimited resume downloads</li><li>✅ Premium templates</li><li>✅ Priority support</li><li>✅ Advanced formatting</li></ul>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            {premiumPlans.map(plan => (
                                <div key={plan.id} style={{ border: '2px solid #10b981', borderRadius: 14, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontWeight: 800, fontSize: 17 }}>{plan.name}</div><div style={{ color: '#64748b', fontSize: 14 }}>{plan.duration}</div></div><div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>${plan.price}</div></div>
                                    <button onClick={() => subscribeToPremium(plan.id)} style={GBTN({ width: '100%', justifyContent: 'center', marginTop: 14 })}>Choose {plan.name}</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center' }}><button onClick={() => setShowPremiumModal(false)} style={OBTN('#64748b', { justifyContent: 'center', margin: '0 auto' })}>Cancel</button></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CreateResume;