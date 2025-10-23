// background.js - VERSIÓN SIMPLIFICADA Y CONFIABLE
console.log("✅ Context Companion background inicializado");

// Manejar instalación
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔧 Extensión instalada/actualizada");
});

// Click en el icono
chrome.action.onClicked.addListener((tab) => {
  console.log("🖱️ Icono clickeado");
  openSidePanel(tab.id);
});

// Abrir side panel
async function openSidePanel(tabId) {
  try {
    await chrome.sidePanel.open({ tabId });
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
    console.log("✅ Side panel abierto");
  } catch (error) {
    console.error("❌ Error abriendo side panel:", error);
  }
}

// Manejar mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Mensaje background:", request.type);
  
  switch (request.type) {
    case "panel-ready":
      handlePanelReady();
      break;
      
    case "highlight-evidence":
    case "clear-highlights":
      forwardToContentScript(request);
      break;
  }
  
  return true;
});

async function handlePanelReady() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await injectContentScript(tab.id);
    }
  } catch (error) {
    console.error("Error en panel-ready:", error);
  }
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    
    // Esperar a que el content script esté listo
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { type: "capture" });
    }, 500);
    
  } catch (error) {
    console.error("❌ Error inyectando content script:", error);
  }
}

function forwardToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}

console.log("✅ Background script listo");