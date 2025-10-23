// i18n.js - VERSIÓN CORREGIDA Y FUNCIONAL
const translations = {
  en: {
    analyze: "Analyze",
    reset: "Reset",
    evidence: "Evidence",
    credibility: "Credibility",
    bias: "Bias",
    neutral: "Neutral",
    summary: "AI Summary",
    tools: "🛠️ Tools",
    rewrite: "Neutral Rewrite",
    translate: "Translate",
    proofread: "Proofread",
    generate: "Generate",
    ready: "Ready to analyze",
    analyzing: "Analyzing content...",
    done: "Analysis complete",
    analysis: "📊 Analysis", // <- Clave añadida
    credibilityAnalysis: "Credibility Analysis" // <- Clave añadida
  },
  es: {
    analyze: "Analizar",
    reset: "Reiniciar",
    evidence: "Evidencia",
    credibility: "Credibilidad", 
    bias: "Sesgo",
    neutral: "Neutral",
    summary: "Resumen IA",
    tools: "🛠️ Herramientas",
    rewrite: "Reescritura Neutral",
    translate: "Traducción",
    proofread: "Corrección",
    generate: "Generar",
    ready: "Listo para analizar",
    analyzing: "Analizando contenido...",
    done: "Análisis completado",
    analysis: "📊 Análisis", // <- Clave añadida
    credibilityAnalysis: "Análisis de Credibilidad" // <- Clave añadida
  },
  fr: {
    analyze: "Analyser",
    reset: "Réinitialiser",
    evidence: "Preuve",
    credibility: "Crédibilité",
    bias: "Biais", 
    neutral: "Neutre",
    summary: "Résumé IA",
    tools: "🛠️ Outils",
    rewrite: "Réécriture Neutre",
    translate: "Traduction",
    proofread: "Correction",
    generate: "Générer",
    ready: "Prêt à analyser",
    analyzing: "Analyse du contenu...",
    done: "Analyse terminée",
    analysis: "📊 Analyse", // <- Clave añadida
    credibilityAnalysis: "Analyse de Crédibilité" // <- Clave añadida
  },
  it: {
    analyze: "Analizzare",
    reset: "Ripristina",
    evidence: "Prova",
    credibility: "Credibilità",
    bias: "Pregiudizio",
    neutral: "Neutrale",
    summary: "Riepilogo AI",
    tools: "🛠️ Strumenti",
    rewrite: "Riscrittura Neutrale", 
    translate: "Traduzione",
    proofread: "Correzione",
    generate: "Generare",
    ready: "Pronto per analizzare",
    analyzing: "Analisi del contenuto...",
    done: "Analisi completata",
    analysis: "📊 Analisi", // <- Clave añadida
    credibilityAnalysis: "Analisi di Credibilità" // <- Clave añadida
  }
};

class I18n {
  constructor() {
    this.currentLang = 'en';
    this.detectLanguage();
    
    // ¡¡ESTA ES LA LÍNEA QUE FALTABA!!
    // Traduce la UI tan pronto como el script se carga.
    // Usamos un pequeño retraso para asegurar que el DOM esté listo.
    document.addEventListener('DOMContentLoaded', () => {
      this.updateUI();
    });
  }

  detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    this.currentLang = ['en', 'es', 'fr', 'it'].includes(browserLang) ? browserLang : 'en';
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      this.updateUI();
    }
  }

  t(key) {
    return translations[this.currentLang]?.[key] || translations.en[key] || key;
  }

  updateUI() {
    // 1. Actualizar todos los textos de la UI
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      // Reemplaza el texto. Si el elemento tiene hijos (como <span>Analyze</span>),
      // buscamos el nodo de texto para reemplazarlo.
      // Esto es más robusto que .textContent para botones con iconos.
      const targetNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (targetNode) {
        targetNode.nodeValue = this.t(key);
      } else {
        element.textContent = this.t(key);
      }
    });
    
    // 2. BONUS: Actualizar el selector <select>
    const langSelector = document.getElementById('langApp');
    if (langSelector) {
      langSelector.value = this.currentLang;
    }
  }
}

// Exponer globalmente
window.i18n = new I18n();