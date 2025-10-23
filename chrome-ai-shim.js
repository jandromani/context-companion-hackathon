// chrome-ai-shim.js - VERSIÓN CORREGIDA (v3)
class ChromeAIShim {
  constructor() {
    this.available = false;
    this.native = false; 
    this.apis = {};
    this.workerUrl = "https://cc-gemini-proxy.alejandrobgn.workers.dev/";
    
    // 1. CREA LOS SHIMS (FALLBACK) INMEDIATAMENTE
    // De esta forma, las funciones (como isNative) existen SIEMPRE.
    console.log("🔄 Creando AI Shim (Cloudflare Worker por defecto)");
    this.createShims();
    this.available = true; // Está "disponible" (como fallback)
  }

  // 2. HACEMOS QUE INIT SEA LLAMADO DESDE FUERA
  async init() {
    // Esta función AHORA intentará "actualizar" los shims a Nano si existe
    if ((typeof chrome !== 'undefined' && chrome.ai) || (typeof window !== 'undefined' && window.ai)) {
      this.available = true;
      this.native = true; 
      this.apis = (typeof chrome !== 'undefined' && chrome.ai) ? chrome.ai : window.ai;
      console.log("✅ AI Shim actualizado a NANO (On-Device)");
      return true;
    }
    
    console.log("ℹ️ AI Shim se mantiene en modo Cloudflare Worker");
    return true; // Sigue estando disponible (modo worker)
  }
  
  // 3. MOVEMOS isNative FUERA DE INIT
  isNative() {
    return this.native;
  }

  createShims() {
    // (Esta función es idéntica a la anterior, la pongo por completitud)
    this.apis = {
      summarizer: {
        create: async () => ({
          summarize: async (options) => {
            const text = typeof options === 'string' ? options : options?.text;
            const result = await this.callWorker('summarize', { text });
            return { summary: result };
          }
        })
      },

      translator: {
        create: async (options = {}) => ({
          translate: async (options) => {
            const text = typeof options === 'string' ? options : options?.text;
            const result = await this.callWorker('translate', { 
              text, 
              langTo: options.targetLanguage || 'en' 
            });
            return { translation: result };
          }
        })
      },

      proofreader: {
        create: async (options = {}) => ({
          proofread: async (options) => {
            const text = typeof options === 'string' ? options : options?.text;
            const result = await this.callWorker('proofread', { 
              text,
              langTo: options?.language || 'en'
            });
            return { text: result };
          }
        })
      },

      rewriter: {
        create: async () => ({
          rewrite: async (options) => {
            const text = typeof options === 'string' ? options : options?.text;
            const result = await this.callWorker('rewrite', { text });
            return { text: result };
          }
        })
      },

      writer: {
        create: async () => ({
          write: async (options) => {
            const result = await this.callWorker('write', { 
              text: options?.context 
            });
            return { text: result };
          }
        })
      },

      prompt: {
        create: async () => ({
          prompt: async (promptText) => {
            // "prompt" nativo lo mapeamos a "bias" en nuestro worker
            const result = await this.callWorker('bias', { text: promptText });
            return result;
          }
        })
      },

      languageModel: {
        create: async () => ({
          generate: async (options) => {
            const result = await this.callWorker('bias', { text: options?.prompt });
            return { text: result };
          }
        })
      }
    };
  }

  async callWorker(task, body) {
    console.log(`📤 Enviando a worker: ${task}`, { 
      textLength: body.text?.length,
      langTo: body.langTo 
    });

    try {
      const payload = {
        task: task,
        text: body.text ? String(body.text).slice(0, 8000) : "", // Aumentado límite
        langTo: body.langTo || "en",
        langFrom: body.langFrom || "auto"
      };

      if (!payload.text || payload.text.length < 10) {
        throw new Error("Texto muy corto para procesar");
      }

      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📥 Respuesta del worker: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || "Error del worker");
      }

      console.log(`✅ Worker ${task} exitoso`);
      return data.result;

    } catch (error) {
      console.error(`❌ Fallo en worker (${task}):`, error.message);
      return this.getFallbackResponse(task, body.text);
    }
  }

  getFallbackResponse(task, text) {
    // (Esta función es idéntica a la anterior, la pongo por completitud)
    const shortText = text ? String(text).slice(0, 200) + "..." : "[sin texto]";
    
    const fallbacks = {
      summarize: `📋 **Resumen (Modo Offline):**\n${shortText}\n\n*Nota: Servicio AI temporalmente no disponible*`,
      bias: JSON.stringify({
        label: "neutral",
        confidence: 50,
        evidence: ["Análisis no disponible - modo offline"],
        credibility: { 
          score: 60, 
          reasons: ["Servicio AI temporalmente no disponible"] 
        }
      }),
      translate: `🌍 **Traducción (Modo Offline):**\n${shortText}\n\n*Nota: Servicio de traducción no disponible*`,
      rewrite: `✏️ **Texto Neutral (Modo Offline):**\n${shortText}\n\n*Nota: Servicio de reescritura no disponible*`,
      proofread: `🔍 **Texto Corregido (Modo Offline):**\n${shortText}\n\n*Nota: Servicio de corrección no disponible*`,
      write: `📝 **Contenido Generado (Modo Offline):**\n\nHEADLINE: Servicio AI no disponible\nTL;DR: El servicio de generación de contenido está temporalmente offline\nTWEET: Servicio AI no disponible temporalmente. Por favor, intenta más tarde.`
    };

    return fallbacks[task] || "Servicio no disponible (modo offline)";
  }

  isAvailable() {
    return this.available;
  }

  getAPIs() {
    return this.apis;
  }
}

// 4. CREA LA INSTANCIA, PERO NO LA ASIGNA A window TODAVÍA
const tempShim = new ChromeAIShim();

// 5. ASIGNA UNA PROMESA A window, que se resolverá cuando init() termine.
window.chromeAIShimPromise = new Promise(async (resolve) => {
  await tempShim.init(); // Espera a que termine la detección (Nano o Cloud)
  window.chromeAIShim = tempShim; // Asigna la instancia ya inicializada
  resolve(window.chromeAIShim);
});