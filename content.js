// content.js - VERSIÓN MEJORADA
console.log("🔍 Context Companion content script loaded");

function extractReadableText() {
  console.log("Starting intelligent text extraction...");
  
  const contentSelectors = [
    "article", "[role='article']", ".article", ".post", ".story",
    ".entry-content", ".post-content", ".story-content", ".news-content",
    ".article-body", ".post-body", ".story-body", ".news-article",
    "main", ".main", ".content", "#content", "[class*='content']",
    ".news", ".blog", ".editorial", ".report"
  ];
  
  let container = null;
  let contentType = "unknown";
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && calculateContentScore(element) > 0.3) {
      container = element;
      
      if (selector.includes('article') || selector.includes('news')) {
        contentType = "news";
      } else if (selector.includes('blog') || selector.includes('post')) {
        contentType = "blog";
      } else if (selector.includes('story') || selector.includes('editorial')) {
        contentType = "editorial";
      } else {
        contentType = "article";
      }
      console.log(`Found ${contentType} container: ${selector}`);
      break;
    }
  }
  
  if (!container) {
    const bodyText = document.body.textContent || "";
    if (bodyText.length > 1000) {
      if (bodyText.includes('©') || bodyText.includes('All rights reserved')) {
        contentType = "website";
      } else if (bodyText.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        contentType = "news";
      } else {
        contentType = "general";
      }
      container = document.body;
    }
  }
  
  if (!container) {
    console.warn("No suitable container found");
    return { text: "", type: "unknown" };
  }
  
  const cleanContainer = cleanDOM(container.cloneNode(true));
  let text = cleanContainer.textContent || "";
  text = cleanText(text);
  
  console.log(`Extracted ${text.length} characters, type: ${contentType}`);
  return { text, type: contentType };
}

function calculateContentScore(element) {
  const text = element.textContent || "";
  const totalLength = text.length;
  if (totalLength < 100) return 0;
  
  const links = element.querySelectorAll('a');
  let linkTextLength = 0;
  links.forEach(link => linkTextLength += link.textContent?.length || 0);
  const linkDensity = linkTextLength / totalLength;
  
  if (linkDensity > 0.4) return 0;
  
  const paragraphCount = element.querySelectorAll('p').length;
  let score = Math.min(totalLength / 3000, 1) * 0.6;
  score += Math.min(paragraphCount / 5, 1) * 0.4;
  
  return score;
}

function cleanDOM(container) {
  const removeSelectors = [
    "script", "style", "nav", "footer", "header", "aside", "menu",
    ".ad", ".advertisement", ".ads", "[class*='ad']", "[id*='ad']",
    ".social-share", ".share-buttons", ".newsletter", ".related",
    ".comments", ".popular", ".recommended", "iframe", ".video",
    ".hidden", "[aria-hidden='true']", ".sr-only", ".teaser",
    ".widget", ".outbrain", ".newsletter-signup", ".article-meta"
  ];
  
  removeSelectors.forEach(selector => {
    container.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  return container;
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/(Compartir|Guardar|Me gusta|Seguir|Tweet|Comentar).*?\n/gi, '\n')
    .replace(/CONTINUAR LEYENDO|Leer más|Seguir leyendo.*/gi, '')
    .replace(/Newsletter.*?Suscribirse|Boletín.*?inscripción/gi, '')
    .replace(/^[-\s]*$[\r\n]*/gm, '')
    .trim();
}

// Highlight system
function clearHighlights() {
  document.querySelectorAll(".cc-evidence-hi").forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });
}

function highlightEvidence(quotes = []) {
  clearHighlights();
  if (!quotes.length) return 0;
  
  const container = document.querySelector("article") || document.body;
  let count = 0;
  
  quotes.forEach(quote => {
    if (!quote || quote.length < 10) return;
    
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      const normalizedText = text.replace(/\s+/g, ' ');
      const lowerText = normalizedText.toLowerCase();
      const lowerQuote = quote.toLowerCase();
      
      const index = lowerText.indexOf(lowerQuote);
      if (index >= 0) {
        const before = text.substring(0, index);
        const match = text.substring(index, index + quote.length);
        const after = text.substring(index + quote.length);
        
        const highlight = document.createElement("span");
        highlight.className = "cc-evidence-hi";
        highlight.style.cssText = `
          background: linear-gradient(120deg, #ffd700 0%, #ffed4e 100%);
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: bold;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        highlight.textContent = match;
        
        const parent = node.parentNode;
        if (!parent) continue;
        
        parent.insertBefore(document.createTextNode(before), node);
        parent.insertBefore(highlight, node);
        parent.insertBefore(document.createTextNode(after), node);
        parent.removeChild(node);
        
        count++;
        if (count === 1) {
          setTimeout(() => highlight.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
        break;
      }
    }
  });
  
  return count;
}

// Message handler
chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case "capture":
      const result = extractReadableText();
      chrome.runtime.sendMessage({
        type: "pageText",
        href: location.href,
        title: document.title,
        text: result.text,
        contentType: result.type,
        ts: Date.now(),
        success: result.text.length > 100
      });
      break;
      
    case "highlight-evidence":
      const count = highlightEvidence(msg.quotes);
      chrome.runtime.sendMessage({ type: "highlight-done", count });
      break;
      
    case "clear-highlights":
      clearHighlights();
      break;
  }
});

console.log("✅ Content script ready for capture");