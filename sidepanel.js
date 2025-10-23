// sidepanel.js - VERSIÓN HÍBRIDA INTELIGENTE
console.log("🚀 Context Companion sidepanel inicializado");

// Referencias DOM (COMPLETADAS)
const els = {
  // Toolbar
  btnAnalyze: document.getElementById("btnAnalyze"),
  btnReset: document.getElementById("btnReset"),
  langApp: document.getElementById("langApp"),
  langTo: document.getElementById("langTo"),
  btnHi: document.getElementById("btnHi"),
  status: document.getElementById("status"),
  statusDot: document.querySelector(".status-dot"),
  
  // Metrics
  meter: document.getElementById("meter"),
  bias: document.getElementById("bias"),
  apiSource: document.getElementById("apiSource"),
  
  // Tab Analysis
  scoreValue: document.getElementById("scoreValue"),
  biasLevel: document.getElementById("biasLevel"),
  contentType: document.getElementById("contentType"),
  aiSource: document.getElementById("aiSource"), // Nota: ID duplicado con 'apiSource', pero lo manejamos
  outSummary: document.getElementById("outSummary"),
  summaryApi: document.getElementById("summaryApi"),
  outCredibility: document.getElementById("outCredibility"),
  credibilityApi: document.getElementById("credibilityApi"),

  // Tab Tools
  btnRewrite: document.getElementById("btnRewrite"),
  btnTranslate: document.getElementById("btnTranslate"),
  btnProof: document.getElementById("btnProof"),
  btnWrite: document.getElementById("btnWrite"),
  outRewrite: document.getElementById("outRewrite"),
  rewriteApi: document.getElementById("rewriteApi"),
  outTranslate: document.getElementById("outTranslate"),
  translateApi: document.getElementById("translateApi"),
  outProof: document.getElementById("outProof"),
  proofreadApi: document.getElementById("proofreadApi"),
  outWrite: document.getElementById("outWrite"),
  writeApi: document.getElementById("writeApi"),
  
  // Tab Evidence
  evidenceList: document.getElementById("evidenceList"),
  biasApi: document.getElementById("biasApi"),
  outBiasAnalysis: document.getElementById("outBiasAnalysis")
};

// ====== ESTADO ======
let currentText = "";
let currentEvidence = [];
let isAnalyzing = false;

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', async function() { // <-- AÑADIDO 'async'
  console.log("✅ DOM cargado");
  
  // ESPERAMOS A QUE EL SHIM TERMINE DE INICIALIZARSE
  await window.chromeAIShimPromise; 
  console.log("✅ AI Shim Promise resuelta. Listo.");

  setupEventListeners();
  setupTabs();
  initializeUI();
  updateAIStatus(); // <-- Esta llamada ahora SÍ funcionará
  
  // Solicitar contenido al cargar
  chrome.runtime.sendMessage({ type: "panel-ready" });
});

// ====== CONFIGURACIÓN DE UI ======
function setupEventListeners() {
  // Botón principal de análisis
  els.btnAnalyze.addEventListener('click', analyzeContent);
  els.btnReset.addEventListener('click', resetAnalysis); // <-- AÑADIDO
  
  // Botones de herramientas
  els.btnRewrite.addEventListener('click', () => executeTool('rewrite'));
  els.btnTranslate.addEventListener('click', () => executeTool('translate'));
  els.btnProof.addEventListener('click', () => executeTool('proofread'));
  els.btnWrite.addEventListener('click', () => executeTool('write'));
  
  // Botón de resaltar
  els.btnHi.addEventListener('click', highlightEvidence);
  
  // Selector de idioma (para i18n, aunque no se use)
  els.langApp.addEventListener('change', (e) => {
    if (window.i18n) {
      window.i18n.setLanguage(e.target.value);
    }
  });
}

// (setupTabs es idéntico y correcto)
function setupTabs() {
  document.querySelectorAll('.tab-header').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      document.querySelectorAll('.tab-header').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

function initializeUI() {
  updateStatus("Listo para analizar", "ready");
  setCredibilityMeter(0, "Sin análisis");
  setBiasIndicator("—", "Sin análisis");
  renderEvidence([]);
  enableHighlightButton(false);
  lockUI(true); // Bloquear UI hasta que el texto esté cargado
}

// VERSIÓN NUEVA (Usa i18n)
function updateStatus(messageKey, state = "processing") {
  // Ahora pasamos una clave (ej. "analyzing") en lugar de un mensaje
  const translatedMessage = window.i18n.t(messageKey); 
  
  if (els.status) els.status.textContent = translatedMessage;
  if (els.statusDot) els.statusDot.className = `status-dot ${state}`;
  console.log(`📢 Estado [${state}]:`, translatedMessage);
}

// Actualiza el indicador GLOBAL
function updateAIStatus() {
  if (window.chromeAIShim && window.chromeAIShim.isNative()) {
    els.apiSource.textContent = "🔒 Chrome";
    els.apiSource.className = "api-indicator api-chrome";
  } else {
    els.apiSource.textContent = "☁️ Cloud";
    els.apiSource.className = "api-indicator api-cloud";
  }
}

// Actualiza los indicadores específicos por TAREA
function updateTaskApiIndicator(task, source) {
  const sourceText = source === 'local' ? '🔒 Chrome' : '☁️ Cloud';
  const sourceClass = source === 'local' ? 'api-chrome' : 'api-cloud';
  
  let el;
  switch(task) {
      case 'summarize': el = els.summaryApi; break;
      case 'bias': 
          el = els.biasApi; 
          if(els.credibilityApi) {
            els.credibilityApi.textContent = sourceText;
            els.credibilityApi.className = `api-indicator ${sourceClass}`;
          }
          break;
      case 'rewrite': el = els.rewriteApi; break;
      case 'translate': el = els.translateApi; break;
      case 'proofread': el = els.proofreadApi; break;
      case 'write': el = els.writeApi; break;
  }
  
  if (el) {
      el.textContent = sourceText;
      el.className = `api-indicator ${sourceClass}`;
  }
}

function setCredibilityMeter(score, reason = "") {
  if (!els.meter || !els.scoreValue) return;
  const numScore = parseInt(score) || 0;
  const color = numScore >= 75 ? "var(--success)" : numScore >= 50 ? "var(--warning)" : "var(--danger)";
  els.meter.innerHTML = `<span class="metric-dot" style="background: ${color}"></span>Credibilidad: ${numScore}/100`;
  els.scoreValue.textContent = `${numScore}/100`;
  if (reason) els.meter.title = reason;
}

function setBiasIndicator(bias, reason = "") {
  if (!els.bias || !els.biasLevel) return;
  const biasLabel = bias.toLowerCase();
  let color = "var(--neutral-bias)";
  if (biasLabel.includes('left') || biasLabel.includes('izquierda')) color = "var(--left-bias)";
  if (biasLabel.includes('right') || biasLabel.includes('derecha')) color = "var(--right-bias)";
  
  els.bias.innerHTML = `<span class="metric-dot" style="background: ${color}"></span>Sesgo: ${bias}`;
  els.biasLevel.textContent = bias;
  if (reason) els.bias.title = reason;
}

function renderEvidence(evidenceList) {
  if (!els.evidenceList) return;
  
  els.evidenceList.innerHTML = "";
  
  if (!evidenceList || evidenceList.length === 0) {
    els.evidenceList.innerHTML = `<div class="evidence-item">No hay evidencias analizadas</div>`;
    return;
  }
  
  evidenceList.slice(0, 5).forEach(evidence => {
    const item = document.createElement("div");
    item.className = "evidence-item";
    item.textContent = evidence.length > 100 ? evidence.substring(0, 100) + "..." : evidence;
    item.title = `Click para resaltar: "${evidence}"`;
    item.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: "highlight-evidence", quotes: [evidence] });
    });
    els.evidenceList.appendChild(item);
  });
}

function enableHighlightButton(enable) {
  if (els.btnHi) {
    els.btnHi.disabled = !enable;
  }
}

function lockUI(locked) {
  isAnalyzing = locked;
  const buttons = ["btnAnalyze", "btnReset", "btnRewrite", "btnTranslate", "btnProof", "btnWrite", "btnHi"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.disabled = locked;
    }
  });
  // Habilitar siempre Reset
  if (els.btnReset) els.btnReset.disabled = false;
  // Habilitar Hi si hay evidencia
  if (currentEvidence.length > 0) els.btnHi.disabled = false;
}

// ====== FUNCIONES PRINCIPALES (LÓGICA HÍBRIDA) ======

async function analyzeContent() {
  if (isAnalyzing || !currentText || currentText.length < 50) {
    updateStatus("❌ No hay suficiente texto", "error");
    return;
  }

  lockUI(true);
  updateStatus("🔍 Analizando...", "processing");
  
  try {
    const textToAnalyze = currentText.slice(0, 8000); // Usar más texto para el análisis
    
    // Ejecutar análisis en paralelo
    const [summaryResult, biasResult] = await Promise.all([
      callAI('summarize', textToAnalyze.slice(0, 4000)), // Nano-first
      callAI('bias', textToAnalyze) // Cloud-only
    ]);

    processAnalysisResults(summaryResult, biasResult);
    updateStatus("✅ Análisis completado", "ready");
    
  } catch (error) {
    console.error("Error en análisis:", error);
    updateStatus("❌ Error en el análisis", "error");
    els.outSummary.textContent = "No se pudo generar el análisis. Intenta nuevamente.";
  } finally {
    lockUI(false);
  }
}

async function executeTool(tool) {
  if (isAnalyzing || !currentText) {
    updateStatus("❌ No hay texto para procesar", "error");
    return;
  }

  lockUI(true);
  updateStatus(`🛠️ Ejecutando ${tool}...`, "processing");
  
  try {
    const result = await callAI(tool, currentText.slice(0, 3000));
    
    // Actualizar UI según la herramienta
    switch (tool) {
      case 'rewrite':
        els.outRewrite.textContent = result || "No se pudo reescribir";
        break;
      case 'translate':
        els.outTranslate.textContent = result || "No se pudo traducir";
        break;
      case 'proofread':
        els.outProof.textContent = result || "No se pudo corregir";
        break;
      case 'write':
        els.outWrite.textContent = result || "No se pudo generar contenido";
        break;
    }
    
    updateStatus("✅ Herramienta completada", "ready");
  } catch (error) {
    console.error(`Error en ${tool}:`, error);
    updateStatus(`❌ Error en ${tool}`, "error");
  } finally {
    lockUI(false);
  }
}

/**
 * Esta es la función clave.
 * Enruta las tareas a Nano (local) o al Worker (cloud)
 */
async function callAI(task, text) {
  console.log(`🤖 Llamando AI: ${task}`, { length: text.length });
  
  if (!window.chromeAIShim) throw new Error("AI Shim no disponible");

  const isNative = window.chromeAIShim.isNative();
  const apis = window.chromeAIShim.getAPIs();
  const worker = window.chromeAIShim; // Usamos el shim para llamar al worker
  const langTo = els.langTo.value || 'en';

  // --- TAREAS COMPLEJAS (SIEMPRE AL WORKER) ---
  // Estas tareas requieren los prompts avanzados del worker
  if (task === 'bias' || task === 'write') {
    console.log(`🧠 Tarea compleja [${task}], forzando Worker Cloud.`);
    updateTaskApiIndicator(task, 'cloud');
    return await worker.callWorker(task, { text, langTo });
  }

  // --- TAREAS SIMPLES (NANO-FIRST, WORKER-FALLBACK) ---
  let source = 'local';
  
  if (isNative) {
    try {
      console.log(`⚡ Intentando [${task}] con Nano (On-Device)`);
      switch (task) {
        case 'summarize':
          const summarizer = await apis.summarizer.create();
          const summary = await summarizer.summarize({ text });
          updateTaskApiIndicator(task, 'local');
          return summary.summary;
        
        case 'translate':
          const translator = await apis.translator.create({ targetLanguage: langTo });
          const translation = await translator.translate(text);
          updateTaskApiIndicator(task, 'local');
          return translation.translation;
        
        case 'rewrite':
          const rewriter = await apis.rewriter.create();
          const rewritten = await rewriter.rewrite({ text });
          updateTaskApiIndicator(task, 'local');
          return rewritten.text;
        
        case 'proofread':
          const proofreader = await apis.proofreader.create({ language: langTo });
          const proofed = await proofreader.proofread({ text });
          updateTaskApiIndicator(task, 'local');
          return proofed.text;
        
        default:
          throw new Error(`Tarea [${task}] no soportada nativamente`);
      }
    } catch (error) {
      console.warn(`⚠️ Fallo de Nano en [${task}], usando fallback de Worker:`, error.message);
      source = 'cloud'; // Fallback a cloud
    }
  } else {
    source = 'cloud'; // No es nativo, así que debe usar cloud
  }

  // --- FALLBACK (WORKER) ---
  if (source === 'cloud') {
    console.log(`☁️ Usando Worker Cloud para [${task}]`);
    updateTaskApiIndicator(task, 'cloud');
    // El shim se encarga de llamar al worker si no es nativo
    // pero aquí lo forzamos para el fallback
    return await worker.callWorker(task, { text, langTo });
  }
}

function processAnalysisResults(summary, bias) {
  // Procesar resumen
  els.outSummary.textContent = summary || "No se pudo generar resumen";
  
  // Procesar análisis de sesgo (que siempre viene del worker)
  try {
    const biasData = typeof bias === 'string' ? JSON.parse(bias) : bias;
    
    if (biasData && typeof biasData === 'object') {
      setBiasIndicator(biasData.label || "neutral", biasData.analysis || "Análisis completado");
      setCredibilityMeter(biasData.credibility?.score || 60, (biasData.credibility?.reasons || []).join('\n'));
      
      els.outBiasAnalysis.textContent = biasData.analysis || "—";
      els.outCredibility.textContent = (biasData.credibility?.reasons || ["—"]).join('\n• ');
      
      currentEvidence = Array.isArray(biasData.evidence) ? biasData.evidence : [biasData.analysis];
      renderEvidence(currentEvidence);
      enableHighlightButton(currentEvidence.length > 0);
    } else {
      throw new Error("Respuesta de 'bias' no es un JSON válido");
    }
  } catch (error) {
    console.error("Error procesando análisis de sesgo:", error, bias);
    // Fallback completo
    setBiasIndicator("neutral", "Error en análisis");
    setCredibilityMeter(50, "Error en procesamiento");
    els.outBiasAnalysis.textContent = "Error al procesar la respuesta del análisis de sesgo.";
    els.outCredibility.textContent = "Error al procesar la credibilidad.";
    currentEvidence = [];
    renderEvidence(currentEvidence);
    enableHighlightButton(false);
  }
}

function highlightEvidence() {
  if (!currentEvidence || currentEvidence.length === 0) {
    updateStatus("❌ No hay evidencias", "error");
    return;
  }
  
  chrome.runtime.sendMessage({ 
    type: "highlight-evidence", 
    quotes: currentEvidence.slice(0, 3) 
  });
  updateStatus("🎯 Evidencias resaltadas", "ready");
}

function resetAnalysis() {
  currentText = "";
  currentEvidence = [];
  isAnalyzing = false;
  
  // Reset UI
  els.outSummary.textContent = "Click 'Analyze' para generar resumen...";
  els.outRewrite.textContent = "—";
  els.outTranslate.textContent = "—";
  els.outProof.textContent = "—";
  els.outWrite.textContent = "—";
  els.outBiasAnalysis.textContent = "—";
  els.outCredibility.textContent = "—";
  
  els.meter.innerHTML = '<span class="metric-dot"></span>Credibilidad: —';
  els.bias.innerHTML = '<span class="metric-dot"></span>Sesgo: —';
  els.scoreValue.textContent = "—";
  els.biasLevel.textContent = "—";
  els.contentType.textContent = "—";
  els.aiSource.textContent = "—"; // El ID duplicado
  
  renderEvidence([]);
  enableHighlightButton(false); // CORREGIDO: Nombre de función
  updateStatus("Listo para analizar", "ready");
  lockUI(true); // Bloquear hasta que llegue nuevo texto
  
  // Pedir texto de nuevo
  chrome.runtime.sendMessage({ type: "panel-ready" });
}

// ====== MANEJO DE MENSAJES ======
chrome.runtime.onMessage.addListener((message) => {
  console.log("📨 Mensaje recibido en sidepanel:", message.type);
  
  switch (message.type) {
    case "pageText":
      if (message.text && message.text.length > 100) {
        currentText = message.text;
        els.contentType.textContent = message.contentType || "article";
        updateStatus(`✅ Texto capturado (${message.text.length} chars)`, "ready");
        lockUI(false); // Desbloquear UI
        
        // Auto-analizar
        if (message.text.length > 500) {
          setTimeout(() => analyzeContent(), 500);
        }
      } else {
        updateStatus("❌ No se pudo capturar texto", "error");
        lockUI(true);
      }
      break;

    case "highlight-done":
      updateStatus(`🎯 ${message.count} evidencias resaltadas`, "ready");
      break;
  }
});

console.log("✅ Sidepanel híbrido completamente inicializado");