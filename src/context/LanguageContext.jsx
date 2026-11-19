import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const copy = {
  en: {
    academy: "Training Academy", employeePortal: "Employee portal", adminPortal: "Admin portal",
    home: "Home", learning: "Learning", assessment: "Assessment", logout: "Log out",
    needHelp: "Need help?", helpText: "Contact your HR or buddy trainer.",
    welcome: "Welcome back", journey: "Your learning journey", continueLearning: "Continue learning",
    resume: "Resume module", cardsLearned: "Cards learned", modulesCompleted: "Modules completed",
    assessmentScore: "Assessment score", curriculum: "Your curriculum", modules: "Learning modules",
    complete: "complete", cards: "cards", allModules: "All modules", card: "Card", of: "of",
    keyLearning: "Key learning", thinkAnswer: "Think & answer", situation: "Situation",
    showAnswer: "Show answer", remember: "Remember this", previous: "Previous",
    nextCard: "Got it, next card", completeModule: "Complete module", saving: "Saving…",
    locked: "Assessment is locked", completeFirst: "Complete all learning cards before starting your final assessment.",
    finalAssessment: "Final assessment", ready: "Ready to demonstrate your learning?", start: "Start assessment",
    nextQuestion: "Next question", submit: "Submit assessment", result: "Assessment result",
    passed: "Congratulations, you passed", retry: "Keep learning and try again", returnDash: "Return to dashboard"
  },
  hi: {
    academy: "ट्रेनिंग अकादमी", employeePortal: "कर्मचारी पोर्टल", adminPortal: "एडमिन पोर्टल",
    home: "होम", learning: "सीखना", assessment: "परीक्षा", logout: "लॉग आउट",
    needHelp: "मदद चाहिए?", helpText: "HR या अपने बडी ट्रेनर से संपर्क करें।",
    welcome: "वापसी पर स्वागत है", journey: "आपकी सीखने की यात्रा", continueLearning: "सीखना जारी रखें",
    resume: "मॉड्यूल जारी रखें", cardsLearned: "सीखे गए कार्ड", modulesCompleted: "पूरे मॉड्यूल",
    assessmentScore: "परीक्षा स्कोर", curriculum: "आपका पाठ्यक्रम", modules: "लर्निंग मॉड्यूल",
    complete: "पूरा", cards: "कार्ड", allModules: "सभी मॉड्यूल", card: "कार्ड", of: "में से",
    keyLearning: "मुख्य सीख", thinkAnswer: "सोचें और जवाब दें", situation: "स्थिति",
    showAnswer: "जवाब दिखाएँ", remember: "इसे याद रखें", previous: "पिछला",
    nextCard: "समझ गया, अगला कार्ड", completeModule: "मॉड्यूल पूरा करें", saving: "सेव हो रहा है…",
    locked: "परीक्षा अभी लॉक है", completeFirst: "अंतिम परीक्षा शुरू करने से पहले सभी लर्निंग कार्ड पूरे करें।",
    finalAssessment: "अंतिम परीक्षा", ready: "अपनी सीख दिखाने के लिए तैयार हैं?", start: "परीक्षा शुरू करें",
    nextQuestion: "अगला सवाल", submit: "परीक्षा जमा करें", result: "परीक्षा परिणाम",
    passed: "बधाई हो, आप पास हो गए", retry: "सीखते रहें और फिर कोशिश करें", returnDash: "डैशबोर्ड पर जाएँ"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lta-lang") || "en");
  useEffect(() => { localStorage.setItem("lta-lang", lang); document.documentElement.lang = lang === "hi" ? "hi" : "en"; }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: (key) => copy[lang][key] || copy.en[key] || key, pick: (en, hi) => lang === "hi" && hi ? hi : en }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
