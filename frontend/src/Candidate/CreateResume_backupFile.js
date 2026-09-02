import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";

// Dynamic imports for PDF generation
let jsPDF, html2canvas;
try {
    const jsPDFModule = require('jspdf');
    jsPDF = jsPDFModule.jsPDF;
    html2canvas = require('html2canvas');
} catch (error) {
    console.warn('PDF generation libraries not available:', error);
}

function CreateResume() {
    
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [resumeData, setResumeData] = useState({
        personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            github: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
    });
    const [message, setMessage] = useState('');
    const [downloadInfo, setDownloadInfo] = useState({
        basicDownloads: 0,
        isPremium: false,
        canDownload: true,
        maxBasicDownloads: 5
    });
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [premiumPlans, setPremiumPlans] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('basic');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const recognitionRef = useRef(null);

    const languages = {
        en: { name: "English", code: "en-US" },
        es: { name: "Spanish", code: "es-ES" },
        fr: { name: "French", code: "fr-FR" },
        de: { name: "German", code: "de-DE" },
        it: { name: "Italian", code: "it-IT" },
        pt: { name: "Portuguese", code: "pt-PT" },
        ru: { name: "Russian", code: "ru-RU" },
        ja: { name: "Japanese", code: "ja-JP" },
        ko: { name: "Korean", code: "ko-KR" },
        zh: { name: "Chinese", code: "zh-CN" },
        hi: { name: "Hindi", code: "hi-IN" },
        ar: { name: "Arabic", code: "ar-SA" }
    };

    const translations = {
        en: {
            steps: [
                { title: "Personal Information", fields: ["fullName", "email", "phone", "address", "linkedin", "github"] },
                { title: "Professional Summary", fields: ["summary"] },
                { title: "Work Experience", fields: ["experience"] },
                { title: "Education", fields: ["education"] },
                { title: "Skills", fields: ["skills"] },
                { title: "Projects", fields: ["projects"] },
                { title: "Certifications", fields: ["certifications"] }
            ],
            questions: {
                fullName: "What is your full name?",
                email: "What is your email address?",
                phone: "What is your phone number?",
                address: "What is your address?",
                linkedin: "What is your LinkedIn profile URL?",
                github: "What is your GitHub profile URL?",
                summary: "Tell me about yourself and your professional background.",
                experience: "Tell me about your work experience. Include company name, position, duration, and key responsibilities.",
                education: "Tell me about your education. Include institution name, degree, field of study, and graduation year.",
                skills: "What are your technical skills and programming languages?",
                projects: "Tell me about your projects. Include project name, description, technologies used, and your role.",
                certifications: "What certifications do you have? Include certification name, issuing organization, and date."
            },
            ui: {
                createResume: "Create Resume with Voice",
                selectLanguage: "Select Language",
                downloadResume: "Download Resume",
                upgradePremium: "Upgrade to Premium",
                startRecording: "Start Recording",
                stopRecording: "Stop Recording",
                saveContinue: "Save & Continue",
                downloadStatus: "Download Status",
                selectTemplate: "Select Template",
                basicTemplate: "Basic Template",
                premiumTemplate: "Premium Template"
            }
        },
        es: {
            steps: [
                { title: "Información Personal", fields: ["fullName", "email", "phone", "address", "linkedin", "github"] },
                { title: "Resumen Profesional", fields: ["summary"] },
                { title: "Experiencia Laboral", fields: ["experience"] },
                { title: "Educación", fields: ["education"] },
                { title: "Habilidades", fields: ["skills"] },
                { title: "Proyectos", fields: ["projects"] },
                { title: "Certificaciones", fields: ["certifications"] }
            ],
            questions: {
                fullName: "¿Cuál es su nombre completo?",
                email: "¿Cuál es su dirección de correo electrónico?",
                phone: "¿Cuál es su número de teléfono?",
                address: "¿Cuál es su dirección?",
                linkedin: "¿Cuál es su URL de perfil de LinkedIn?",
                github: "¿Cuál es su URL de perfil de GitHub?",
                summary: "Cuénteme sobre usted y su experiencia profesional.",
                experience: "Cuénteme sobre su experiencia laboral. Incluya nombre de la empresa, puesto, duración y responsabilidades clave.",
                education: "Cuénteme sobre su educación. Incluya nombre de la institución, título, campo de estudio y año de graduación.",
                skills: "¿Cuáles son sus habilidades técnicas y lenguajes de programación?",
                projects: "Cuénteme sobre sus proyectos. Incluya nombre del proyecto, descripción, tecnologías utilizadas y su rol.",
                certifications: "¿Qué certificaciones tiene? Incluya nombre de la certificación, organización emisora y fecha."
            },
            ui: {
                createResume: "Crear Currículum con Voz",
                selectLanguage: "Seleccionar Idioma",
                downloadResume: "Descargar Currículum",
                upgradePremium: "Actualizar a Premium",
                startRecording: "Iniciar Grabación",
                stopRecording: "Detener Grabación",
                saveContinue: "Guardar y Continuar",
                downloadStatus: "Estado de Descarga",
                selectTemplate: "Seleccionar Plantilla",
                basicTemplate: "Plantilla Básica",
                premiumTemplate: "Plantilla Premium"
            }
        },
        fr: {
            steps: [
                { title: "Informations Personnelles", fields: ["fullName", "email", "phone", "address", "linkedin", "github"] },
                { title: "Résumé Professionnel", fields: ["summary"] },
                { title: "Expérience Professionnelle", fields: ["experience"] },
                { title: "Éducation", fields: ["education"] },
                { title: "Compétences", fields: ["skills"] },
                { title: "Projets", fields: ["projects"] },
                { title: "Certifications", fields: ["certifications"] }
            ],
            questions: {
                fullName: "Quel est votre nom complet?",
                email: "Quelle est votre adresse e-mail?",
                phone: "Quel est votre numéro de téléphone?",
                address: "Quelle est votre adresse?",
                linkedin: "Quelle est votre URL de profil LinkedIn?",
                github: "Quelle est votre URL de profil GitHub?",
                summary: "Parlez-moi de vous et de votre parcours professionnel.",
                experience: "Parlez-moi de votre expérience professionnelle. Incluez le nom de l'entreprise, le poste, la durée et les responsabilités clés.",
                education: "Parlez-moi de votre éducation. Incluez le nom de l'institution, le diplôme, le domaine d'études et l'année d'obtention.",
                skills: "Quelles sont vos compétences techniques et langages de programmation?",
                projects: "Parlez-moi de vos projets. Incluez le nom du projet, la description, les technologies utilisées et votre rôle.",
                certifications: "Quelles certifications avez-vous? Incluez le nom de la certification, l'organisation émettrice et la date."
            },
            ui: {
                createResume: "Créer un CV avec la Voix",
                selectLanguage: "Sélectionner la Langue",
                downloadResume: "Télécharger le CV",
                upgradePremium: "Passer à Premium",
                startRecording: "Commencer l'Enregistrement",
                stopRecording: "Arrêter l'Enregistrement",
                saveContinue: "Sauvegarder et Continuer",
                downloadStatus: "Statut de Téléchargement",
                selectTemplate: "Sélectionner le Modèle",
                basicTemplate: "Modèle de Base",
                premiumTemplate: "Modèle Premium"
            }
        }
    };

    const steps = translations[selectedLanguage]?.steps || translations.en.steps;
    const questions = translations[selectedLanguage]?.questions || translations.en.questions;
    const ui = translations[selectedLanguage]?.ui || translations.en.ui;

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = languages[selectedLanguage]?.code || 'en-US';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setMessage('Speech recognition error. Please try again.');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            setMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        }

        // Fetch download info and premium plans
        fetchDownloadInfo();
        fetchPremiumPlans();
    }, [user, navigate]);

    const fetchDownloadInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await fetch(`${API_BASE_URL}/api/resume/downloads/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setDownloadInfo(data);
            } else {
                // Handle non-ok responses silently for download info
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Error fetching download info:', response.status);
                }
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Error fetching download info:', error);
            }
        }
    };

    const fetchPremiumPlans = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/resume/premium/plans`);
            if (response.ok) {
                const data = await response.json();
                setPremiumPlans(data.plans || []);
            } else {
                // Handle non-ok responses - set empty array as fallback
                setPremiumPlans([]);
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Error fetching premium plans:', response.status);
                }
            }
        } catch (error) {
            setPremiumPlans([]); // Fallback to empty array
            if (process.env.NODE_ENV !== 'production') {
                console.error('Error fetching premium plans:', error);
            }
        }
    };

    // Detect if text contains Hindi characters (Devanagari script)
    const isHindiText = (text) => {
        // Devanagari script range: \u0900-\u097F
        const hindiRegex = /[\u0900-\u097F]/;
        return hindiRegex.test(text);
    };

    // Speak text in Indian accent (supports both English and Hindi)
    const speakInIndianAccent = (text) => {
        if (!window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Detect language and set appropriate locale
        const isHindi = isHindiText(text);
        const targetLang = isHindi ? 'hi-IN' : 'en-IN';
        utterance.lang = targetLang;

        // Try to find appropriate Indian voice
        const voices = window.speechSynthesis.getVoices();
        let indianVoice = null;
        
        if (isHindi) {
            // For Hindi: try to find Hindi-Indian voice
            indianVoice = voices.find(v => 
                v.lang === 'hi-IN' || 
                v.lang.startsWith('hi-IN') ||
                (v.lang.startsWith('hi') && v.name.toLowerCase().includes('india'))
            );
        } else {
            // For English: try to find English-Indian voice
            indianVoice = voices.find(v => 
                v.lang === 'en-IN' || 
                v.lang.startsWith('en-IN')
            );
            
            if (!indianVoice) {
                indianVoice = voices.find(v => 
                    v.name.toLowerCase().includes('india') || 
                    v.name.toLowerCase().includes('indian')
                );
            }
        }

        if (indianVoice) {
            utterance.voice = indianVoice;
        } else {
            // Fallback: use the detected language locale
            utterance.lang = targetLang;
        }

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    };

    // Clean and refine answer text - removes common phrases and extracts only relevant information
    const cleanAnswer = (field, text) => {
        let cleaned = text.toLowerCase().trim();

        // Common phrases to remove from the beginning
        const COMMON_PHRASES = [
            'my name is', 'i am', 'this is', 'name is',
            'my email is', 'email is', 'i have', 'i know',
            'my phone is', 'phone is', 'my address is', 'address is',
            'my linkedin is', 'linkedin is', 'my github is', 'github is',
            'it is', 'it\'s', 'that is', 'that\'s'
        ];

        // Remove common phrases from the beginning
        COMMON_PHRASES.forEach(phrase => {
            if (cleaned.startsWith(phrase)) {
                cleaned = cleaned.replace(phrase, '').trim();
            }
        });

        // Field-specific cleanup
        switch (field) {
            case 'fullName':
                // Remove special characters, keep only letters and spaces
                cleaned = cleaned.replace(/[^a-zA-Z\s]/g, '');
                // Capitalize first letter of each word
                cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
                break;
            case 'email':
                // Replace "at" with @ and "dot" with .
                cleaned = cleaned
                    .replace(/\s(at)\s/gi, '@')
                    .replace(/\s(dot)\s/gi, '.')
                    .replace(/\s/g, '');
                break;
            case 'phone':
                // Keep only digits, +, -, spaces, and parentheses
                cleaned = cleaned.replace(/[^\d+\-\s()]/g, '');
                break;
            case 'skills':
                // Replace "and" with comma, clean up spacing
                cleaned = cleaned
                    .replace(/and/gi, ',')
                    .replace(/\s+/g, ' ')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .join(', ');
                break;
            default:
                // Capitalize first letter
                cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }

        return cleaned.trim();
    };

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setIsListening(true);
            setMessage('');
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const processTranscript = () => {
        const currentField = steps[currentStep].fields[0];
        const currentQuestion = questions[currentField];
        
        if (transcript.trim()) {
            // Clean the transcript before processing - remove common phrases and extract only relevant info
            const cleanedValue = cleanAnswer(currentField, transcript);
            
            if (currentField === 'experience' || currentField === 'education' || 
                currentField === 'skills' || currentField === 'projects' || 
                currentField === 'certifications') {
                // For array fields, add to the array
                setResumeData(prev => ({
                    ...prev,
                    [currentField]: [...prev[currentField], cleanedValue]
                }));
            } else {
                // For single fields, update directly
                setResumeData(prev => ({
                    ...prev,
                    [currentField === 'summary' ? 'summary' : 'personalInfo']: {
                        ...(currentField === 'summary' ? prev : prev.personalInfo),
                        [currentField]: cleanedValue
                    }
                }));
            }
            setTranscript('');
            setMessage('Information saved! Moving to next step...');
            setTimeout(() => {
                setMessage('');
                if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                } else {
                    setMessage('Resume creation completed! You can now download your resume.');
                }
            }, 2000);
        }
    };

    const generateResume = (template = 'basic') => {
        if (template === 'premium') {
            return generatePremiumResume();
        }
        return generateBasicResume();
    };

    const generateBasicResume = () => {
        const { personalInfo, summary, experience, education, skills, projects, certifications } = resumeData;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.fullName} - Resume</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .name {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .title {
            font-size: 18px;
            margin: 10px 0;
            color: #666;
        }
        .contact {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
            font-size: 14px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .item {
            margin-bottom: 15px;
        }
        .item-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .item-details {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .skill-item {
            background-color: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
        }
        ul {
            margin: 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="name">${personalInfo.fullName}</h1>
        <div class="title">Professional Resume</div>
        <div class="contact">
            <div class="contact-item">
                <span>📞</span>
                <span>${personalInfo.phone}</span>
            </div>
            <div class="contact-item">
                <span>✉️</span>
                <span>${personalInfo.email}</span>
            </div>
            <div class="contact-item">
                <span>📍</span>
                <span>${personalInfo.address}</span>
            </div>
            <div class="contact-item">
                <span>💼</span>
                <span>${personalInfo.linkedin}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">About Me</div>
        <p>${summary}</p>
    </div>

    <div class="section">
        <div class="section-title">Work Experience</div>
        ${experience.map(exp => `
            <div class="item">
                <div class="item-title">${exp}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Education</div>
        ${education.map(edu => `
            <div class="item">
                <div class="item-title">${edu}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-grid">
            ${skills.map(skill => `
                <div class="skill-item">${skill}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Projects</div>
        ${projects.map(project => `
            <div class="item">
                <div class="item-title">${project}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Certifications</div>
        ${certifications.map(cert => `
            <div class="item">
                <div class="item-title">${cert}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;
    };

    const generatePremiumResume = () => {
        const { personalInfo, summary, experience, education, skills, projects, certifications } = resumeData;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.fullName} - Professional Resume</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.7;
            margin: 0;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .resume-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .name {
            font-size: 36px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .title {
            font-size: 20px;
            margin: 15px 0;
            opacity: 0.9;
        }
        .contact {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
            font-size: 16px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 22px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .item {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 5px;
        }
        .item-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .skill-item {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 12px 16px;
            border-radius: 25px;
            text-align: center;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
        }
        .premium-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="premium-badge">PREMIUM</div>
        <div class="header">
            <h1 class="name">${personalInfo.fullName}</h1>
            <div class="title">Professional Resume</div>
            <div class="contact">
                <div class="contact-item">
                    <span>📞</span>
                    <span>${personalInfo.phone}</span>
                </div>
                <div class="contact-item">
                    <span>✉️</span>
                    <span>${personalInfo.email}</span>
                </div>
                <div class="contact-item">
                    <span>📍</span>
                    <span>${personalInfo.address}</span>
                </div>
                <div class="contact-item">
                    <span>💼</span>
                    <span>${personalInfo.linkedin}</span>
                </div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">About Me</div>
                <p>${summary}</p>
            </div>

            <div class="section">
                <div class="section-title">Work Experience</div>
                ${experience.map(exp => `
                    <div class="item">
                        <div class="item-title">${exp}</div>
                    </div>
                `).join('')}
            </div>

            <div class="section">
                <div class="section-title">Education</div>
                ${education.map(edu => `
                    <div class="item">
                        <div class="item-title">${edu}</div>
                    </div>
                `).join('')}
            </div>

            <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills-grid">
                    ${skills.map(skill => `
                        <div class="skill-item">${skill}</div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Projects</div>
                ${projects.map(project => `
                    <div class="item">
                        <div class="item-title">${project}</div>
                    </div>
                `).join('')}
            </div>

            <div class="section">
                <div class="section-title">Certifications</div>
                ${certifications.map(cert => `
                    <div class="item">
                        <div class="item-title">${cert}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    const downloadResumeAsPDF = async (template = 'basic') => {
        try {
            // Check if PDF libraries are available
            if (!jsPDF || !html2canvas) {
                setMessage('PDF generation is not available. Please download as HTML instead.');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) return;

            // Check download limits before proceeding
            if (!downloadInfo.canDownload && !downloadInfo.isPremium) {
                setShowPremiumModal(true);
                return;
            }

            // Record the download
            const response = await fetch(`${API_BASE_URL}/api/resume/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template,
                    resumeData
                })
            });

            if (response.ok) {
                // Create a temporary div with the resume content
                const resumeContent = generateResume(template);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = resumeContent;
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0';
                tempDiv.style.width = '210mm'; // A4 width
                tempDiv.style.backgroundColor = 'white';
                tempDiv.style.padding = '20px';
                tempDiv.style.fontFamily = 'Arial, sans-serif';
                document.body.appendChild(tempDiv);

                // Wait a bit for styles to apply
                await new Promise(resolve => setTimeout(resolve, 100));

                // Generate PDF
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: tempDiv.offsetWidth,
                    height: tempDiv.offsetHeight
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;

                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                // Clean up
                document.body.removeChild(tempDiv);

                // Download PDF
                pdf.save(`${resumeData.personalInfo.fullName || 'Resume'}_Resume.pdf`);
                
                setMessage('Resume downloaded as PDF successfully!');
                fetchDownloadInfo(); // Refresh download count
            } else {
                const errorData = await response.json();
                if (errorData.requiresPremium) {
                    setShowPremiumModal(true);
                } else {
                    setMessage('Failed to download resume. Please try again.');
                }
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            setMessage('Failed to generate PDF. Please try downloading as HTML instead.');
        }
    };

    const downloadResume = async (template = 'basic') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Check download limits before proceeding
            if (!downloadInfo.canDownload && !downloadInfo.isPremium) {
                setShowPremiumModal(true);
                return;
            }

            // Record the download
            const response = await fetch(`${API_BASE_URL}/api/resume/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template,
                    resumeData
                })
            });

            if (response.ok) {
                const resumeContent = generateResume(template);
                const blob = new Blob([resumeContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resumeData.personalInfo.fullName || 'Resume'}_Resume.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                setMessage('Resume downloaded successfully!');
                fetchDownloadInfo(); // Refresh download count
            } else {
                const errorData = await response.json();
                if (errorData.requiresPremium) {
                    setShowPremiumModal(true);
                } else {
                    setMessage('Failed to download resume. Please try again.');
                }
            }
        } catch (error) {
            console.error('Download error:', error);
            setMessage('Failed to download resume. Please try again.');
        }
    };

    const subscribeToPremium = async (planId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/resume/premium/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscriptionType: planId,
                    paymentMethod: 'mock' // In real implementation, integrate with payment processor
                })
            });

            if (response.ok) {
                setMessage('Premium subscription activated! You can now download unlimited resumes.');
                setShowPremiumModal(false);
                fetchDownloadInfo();
            } else {
                setMessage('Failed to activate premium subscription. Please try again.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setMessage('Failed to activate premium subscription. Please try again.');
        }
    };

    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <h3>Loading...</h3>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container" style={{padding: '50px', textAlign: 'center'}}>
                <h2>Please login to create resume</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    .voice-animation {
                        animation: pulse 1s infinite;
                    }
                `}
            </style>
            
            {message && (
                <div 
                    className={`alert ${message.includes('successfully') || message.includes('saved') ? 'alert-success' : 'alert-info'}`} 
                    style={{
                        position: 'fixed', 
                        top: '20px', 
                        right: '20px', 
                        zIndex: 9999, 
                        minWidth: '300px',
                        padding: '15px 20px',
                        borderRadius: '5px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        backgroundColor: message.includes('successfully') || message.includes('saved') ? '#d4edda' : '#d1ecf1',
                        color: message.includes('successfully') || message.includes('saved') ? '#155724' : '#0c5460',
                        border: `1px solid ${message.includes('successfully') || message.includes('saved') ? '#c3e6cb' : '#bee5eb'}`
                    }}
                >
                    {message}
                </div>
            )}

            <Header />
            
            <section className="padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">
                        <div className="col-md-3">
                            <div id="leftcol_item">
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
                                            objectFit: 'cover',
                                            border: '3px solid #fff',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                            display: 'block',
                                            flexShrink: 0
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
                            <div className="dashboard_nav_item">
                                <ul>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/');}}>
                                            <i className="login-icon ti-dashboard" /> Home
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/profile');}}>
                                            <i className="login-icon ti-user" /> Edit Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/applied-jobs');}}>
                                            <i className="login-icon ti-clipboard" /> Applied Jobs
                                        </a>
                                    </li>
                                    <li className="active">
                                        <a href="#" onClick={(e) => e.preventDefault()}>
                                            <i className="login-icon ti-file" /> Create Resume
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/change-password');}}>
                                            <i className="login-icon ti-key" /> Change Password
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/chat');}}>
                                            <i className="login-icon ti-comments" /> Chat Inbox
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/wishlist');}}>
                                            <i className="login-icon ti-heart" /> My Wishlist
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                logout();
                                                navigate('/');
                                            }}
                                        >
                                            <i className="login-icon ti-power-off" /> Logout
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="col-md-9">
                            <div className="profile_detail_block">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                                            <h3>Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</h3>
                                            <button 
                                                onClick={() => setShowLanguageModal(true)}
                                                className="btn btn-outline-primary"
                                                style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                                            >
                                                🌐 {languages[selectedLanguage]?.name || 'English'}
                                            </button>
                                        </div>
                                        <div className="progress" style={{marginBottom: '30px'}}>
                                            <div 
                                                className="progress-bar" 
                                                role="progressbar" 
                                                style={{width: `${((currentStep + 1) / steps.length) * 100}%`}}
                                            >
                                                {Math.round(((currentStep + 1) / steps.length) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="voice-interface" style={{
                                            textAlign: 'center',
                                            padding: '40px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '10px',
                                            marginBottom: '30px'
                                        }}>
                                            <h4 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                                <span>{questions[steps[currentStep].fields[0]]}</span>
                                                <button 
                                                    onClick={() => speakInIndianAccent(questions[steps[currentStep].fields[0]])}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        fontSize: '20px',
                                                        cursor: 'pointer',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        transition: 'background-color 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    title="Listen to question in Indian accent"
                                                >
                                                    🔊
                                                </button>
                                            </h4>
                                            
                                            <div style={{marginBottom: '30px'}}>
                                                {isListening ? (
                                                    <div className="voice-animation">
                                                        <div style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            backgroundColor: '#dc3545',
                                                            borderRadius: '50%',
                                                            margin: '0 auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '24px'
                                                        }}>
                                                            🎤
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        backgroundColor: '#007bff',
                                                        borderRadius: '50%',
                                                        margin: '0 auto',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '24px'
                                                    }}>
                                                        🎤
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{marginBottom: '20px'}}>
                                                {isListening ? (
                                                    <button 
                                                        onClick={stopListening}
                                                        className="btn btn-danger"
                                                        style={{marginRight: '10px'}}
                                                    >
                                                        Stop Recording
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={startListening}
                                                        className="btn btn-primary"
                                                        style={{marginRight: '10px'}}
                                                    >
                                                        Start Recording
                                                    </button>
                                                )}
                                                
                                                {transcript && (
                                                    <button 
                                                        onClick={processTranscript}
                                                        className="btn btn-success"
                                                    >
                                                        Save & Continue
                                                    </button>
                                                )}
                                            </div>

                                            {transcript && (
                                                <div style={{
                                                    backgroundColor: 'white',
                                                    padding: '20px',
                                                    borderRadius: '5px',
                                                    border: '1px solid #dee2e6',
                                                    marginTop: '20px'
                                                }}>
                                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
                                                        <h5 style={{margin: 0}}>You said:</h5>
                                                        <button 
                                                            onClick={() => speakInIndianAccent(transcript)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                fontSize: '20px',
                                                                cursor: 'pointer',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                transition: 'background-color 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            title="Listen to answer in Indian accent"
                                                        >
                                                            🔊
                                                        </button>
                                                    </div>
                                                    <p style={{fontStyle: 'italic', margin: 0}}>"{transcript}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {currentStep === steps.length - 1 && (
                                            <div className="text-center">
                                                <div style={{marginBottom: '20px'}}>
                                                    <h5>Download Status</h5>
                                                    <p>
                                                        {downloadInfo.isPremium ? (
                                                            <span className="badge badge-success">Premium Member - Unlimited Downloads</span>
                                                        ) : (
                                                            <span className="badge badge-info">
                                                                Downloads: {downloadInfo.basicDownloads}/{downloadInfo.maxBasicDownloads}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                
                                                <div style={{marginBottom: '20px'}}>
                                                    <label>Select Template:</label>
                                                    <select 
                                                        value={selectedTemplate} 
                                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                                        className="form-control"
                                                        style={{width: '200px', margin: '0 auto'}}
                                                    >
                                                        <option value="basic">Basic Template</option>
                                                        {downloadInfo.isPremium && (
                                                            <option value="premium">Premium Template</option>
                                                        )}
                                                    </select>
                                                </div>

                                                {jsPDF && html2canvas ? (
                                                    <button 
                                                        onClick={() => downloadResumeAsPDF(selectedTemplate)}
                                                        className="btn btn-success btn-lg"
                                                        style={{marginRight: '10px'}}
                                                    >
                                                        📄 Download as PDF
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setMessage('PDF generation is not available. Please use HTML download.')}
                                                        className="btn btn-secondary btn-lg"
                                                        style={{marginRight: '10px'}}
                                                        disabled
                                                    >
                                                        📄 PDF (Not Available)
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => downloadResume(selectedTemplate)}
                                                    className="btn btn-info btn-lg"
                                                    style={{marginRight: '10px'}}
                                                >
                                                    🌐 Download as HTML
                                                </button>
                                                
                                                {!downloadInfo.isPremium && (
                                                    <button 
                                                        onClick={() => setShowPremiumModal(true)}
                                                        className="btn btn-warning btn-lg"
                                                    >
                                                        Upgrade to Premium
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Language Selection Modal */}
            {showLanguageModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{textAlign: 'center', marginBottom: '30px', color: '#2c3e50'}}>
                            {ui.selectLanguage}
                        </h3>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px'}}>
                            {Object.entries(languages).map(([code, lang]) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setSelectedLanguage(code);
                                        setShowLanguageModal(false);
                                        // Reinitialize speech recognition with new language
                                        if (recognitionRef.current) {
                                            recognitionRef.current.lang = lang.code;
                                        }
                                    }}
                                    className={`btn ${selectedLanguage === code ? 'btn-primary' : 'btn-outline-primary'}`}
                                    style={{
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: selectedLanguage === code ? '2px solid #007bff' : '1px solid #dee2e6',
                                        backgroundColor: selectedLanguage === code ? '#007bff' : 'white',
                                        color: selectedLanguage === code ? 'white' : '#007bff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    🌐 {lang.name}
                                </button>
                            ))}
                        </div>

                        <div style={{textAlign: 'center'}}>
                            <button 
                                onClick={() => setShowLanguageModal(false)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Modal */}
            {showPremiumModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '10px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{textAlign: 'center', marginBottom: '30px', color: '#2c3e50'}}>
                            Upgrade to Premium
                        </h3>
                        
                        <div style={{marginBottom: '20px'}}>
                            <h5>Current Status:</h5>
                            <p>Downloads: {downloadInfo.basicDownloads}/{downloadInfo.maxBasicDownloads}</p>
                            <p style={{color: '#e74c3c'}}>You've reached your download limit. Upgrade to premium for unlimited downloads!</p>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h5>Premium Benefits:</h5>
                            <ul>
                                <li>✅ Unlimited resume downloads</li>
                                <li>✅ Premium resume templates</li>
                                <li>✅ Priority support</li>
                                <li>✅ Advanced formatting options</li>
                            </ul>
                        </div>

                        <div style={{display: 'grid', gap: '20px', marginBottom: '30px'}}>
                            {premiumPlans.map(plan => (
                                <div key={plan.id} style={{
                                    border: '2px solid #3498db',
                                    borderRadius: '10px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    backgroundColor: plan.id === 'yearly' ? '#f8f9fa' : 'white'
                                }}>
                                    <h4 style={{color: '#2c3e50'}}>{plan.name}</h4>
                                    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3498db'}}>
                                        ${plan.price}
                                    </div>
                                    <div style={{color: '#666', marginBottom: '15px'}}>{plan.duration}</div>
                                    <ul style={{textAlign: 'left', fontSize: '14px'}}>
                                        {plan.features.map(feature => (
                                            <li key={feature}>{feature}</li>
                                        ))}
                                    </ul>
                                    <button 
                                        onClick={() => subscribeToPremium(plan.id)}
                                        className="btn btn-primary"
                                        style={{marginTop: '15px'}}
                                    >
                                        Choose {plan.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={{textAlign: 'center'}}>
                            <button 
                                onClick={() => setShowPremiumModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CreateResume;
