// Application state and data management
const CONFIG = {
  dataEndpoint: "public/data/posts_processed.json",
  insightsEndpoint: "public/data/insights.json",
  manifestEndpoint: "files/manifest.json",
  themeStorageKey: "app-theme-preference",
  pdfLibraryUrl: "https://esm.run/pdfjs-dist@3.11.174",
  pdfWorkerUrl: "https://esm.run/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
};

// Application state
const appState = {
  posts: [],
  visiblePosts: [],
  fileRegistry: {},
  analysisData: null,
  openPost: null,
  activeThread: null,
  qaHistory: [],
  qaEngine: null,
  qaWebllm: null,
  isGeneratingQA: false,
  pdfLibrary: null,
  insightFilters: {
    assignments: new Set(),
    models: new Set()
  }
};

// DOM element references
const domRefs = {};
let previousFocus = null;

// Initialize DOM references
function initializeDOMReferences() {
  // Navigation
  domRefs.navToggle = document.getElementById("nav-toggle");
  domRefs.sideNav = document.getElementById("side-nav");
  domRefs.navItems = document.querySelectorAll(".nav-item");
  
  // Search
  domRefs.globalSearch = document.getElementById("global-search");
  
  // Filters
  domRefs.filterAssignment = document.getElementById("filter-assignment");
  domRefs.filterModel = document.getElementById("filter-model");
  domRefs.sortOrder = document.getElementById("sort-order");
  domRefs.filterMenuBtn = document.getElementById("filter-menu-btn");
  domRefs.filterMenu = document.getElementById("filter-menu");
  domRefs.filterMenuClose = document.getElementById("filter-menu-close");
  domRefs.filterChips = document.getElementById("filter-chips");
  
  // Pages
  domRefs.pageExplore = document.getElementById("page-explore");
  domRefs.pageCompare = document.getElementById("page-compare");
  domRefs.pageInsights = document.getElementById("page-insights");
  
  // Explore page
  domRefs.evaluationsGrid = document.getElementById("evaluations-grid");
  domRefs.metricTotal = document.getElementById("metric-total");
  domRefs.metricAssignments = document.getElementById("metric-assignments");
  domRefs.metricModels = document.getElementById("metric-models");
  domRefs.metricFiltered = document.getElementById("metric-filtered");
  domRefs.errorBanner = document.getElementById("error-banner");
  
  // Compare page
  domRefs.compareAssignment = document.getElementById("compare-assignment");
  domRefs.compareItem1 = document.getElementById("compare-item-1");
  domRefs.compareItem2 = document.getElementById("compare-item-2");
  domRefs.compareResults = document.getElementById("compare-results");
  
  // Insights page
  domRefs.insightsAssignments = document.getElementById("insights-assignments");
  domRefs.insightsModels = document.getElementById("insights-models");
  domRefs.insightTabs = document.querySelectorAll(".insight-tab");
  
  // Overlay
  domRefs.overlay = document.getElementById("detail-overlay");
  domRefs.overlayBackdrop = document.getElementById("overlay-backdrop");
  domRefs.overlayTitle = document.getElementById("overlay-title");
  domRefs.overlayMeta = document.getElementById("overlay-meta");
  domRefs.overlayBadges = document.getElementById("overlay-badges");
  domRefs.overlayFiles = document.getElementById("overlay-files");
  domRefs.overlayContent = document.getElementById("overlay-content");
  domRefs.overlayClose = document.getElementById("overlay-close");
  
  // QA
  domRefs.qaForm = document.getElementById("qa-form");
  domRefs.qaInput = document.getElementById("qa-input");
  domRefs.qaChat = document.getElementById("qa-chat");
  domRefs.qaStatus = document.getElementById("qa-status");
  
  // Theme & Color
  domRefs.themeToggle = document.getElementById("theme-toggle");
  domRefs.colorPickerBtn = document.getElementById("color-picker-btn");
  domRefs.colorPickerMenu = document.getElementById("color-picker-menu");
}

// Data loading functions
async function fetchPostsData() {
  const response = await fetch(CONFIG.dataEndpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load posts data (${response.status}). Run process_data.py first.`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Posts data must be an array");
  }
  return data;
}

async function fetchFileManifest() {
  try {
    const response = await fetch(CONFIG.manifestEndpoint, { cache: "no-store" });
    if (!response.ok) {
      console.warn(`Manifest not found at ${CONFIG.manifestEndpoint}`);
      return {};
    }
    return await response.json();
  } catch (error) {
    console.warn("Could not load file manifest:", error);
    return {};
  }
}

async function fetchAnalysisData() {
  try {
    const response = await fetch(CONFIG.insightsEndpoint, { cache: "no-store" });
    if (!response.ok) {
      console.warn(`Analysis data not found. Run with --insights flag to generate.`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn("Could not load analysis data:", error);
    return null;
  }
}

// PDF processing
async function loadPDFLibrary() {
  if (appState.pdfLibrary) return appState.pdfLibrary;
  const pdfjs = await import(CONFIG.pdfLibraryUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerUrl;
  appState.pdfLibrary = pdfjs;
  return pdfjs;
}

async function extractPDFText(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const buffer = await response.arrayBuffer();
    const pdfjs = await loadPDFLibrary();
    const document = await pdfjs.getDocument({ data: buffer }).promise;
    let text = "";
    const maxPages = Math.min(document.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await document.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(" ") + "\n";
    }
    return text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

// File utilities
function getPostFiles(post) {
  const threadId = String(post.number);
  const entry = appState.fileRegistry[threadId];
  if (!entry || !entry.files || !entry.files.length) return null;
  return entry.files;
}

function formatPostContent(text, files) {
  let formatted = escapeHTML(text);
  if (files && files.length > 0) {
    formatted = formatted.replace(/\[📎 ([^\]]+)\]/g, (match, filename) => {
      const file = files.find(f => f.original_filename === filename.trim());
      if (file) {
        return `<a href="${escapeAttr(file.saved_as)}" class="file-link" target="_blank" rel="noopener">📎 ${escapeHTML(filename)}</a>`;
      }
      return match;
    });
  }
  formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHTML(url)}</a>`;
  });
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function populateFilterSelect(selectElement, label, values) {
  const options = [
    `<option value="">All ${label}</option>`,
    ...values.map(v => `<option value="${encodeURIComponent(v)}">${escapeHTML(v)}</option>`)
  ];
  selectElement.innerHTML = options.join("");
}

function buildFilterOptions(posts) {
  const assignments = new Set();
  const models = new Set();
  for (const post of posts) {
    const metrics = post.metrics || {};
    if (metrics.homework_id) assignments.add(metrics.homework_id);
    if (metrics.model_name) models.add(metrics.model_name);
  }
  const sortAlpha = (a, b) => a.localeCompare(b);
  const parseHwNum = (s) => {
    const match = /^HW(\d+)$/i.exec(s);
    return match ? parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
  };
  const sortAssignments = (a, b) => {
    const na = parseHwNum(a);
    const nb = parseHwNum(b);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  };
  populateFilterSelect(domRefs.filterAssignment, "assignments", Array.from(assignments).sort(sortAssignments));
  populateFilterSelect(domRefs.filterModel, "models", Array.from(models).sort(sortAlpha));
}

// Theme management
function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark");
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else if (theme === "dark") {
    document.body.classList.add("theme-dark");
  }
  if (theme === "auto") {
    try {
      localStorage.removeItem(CONFIG.themeStorageKey);
    } catch (e) {}
  } else {
    try {
      localStorage.setItem(CONFIG.themeStorageKey, theme);
    } catch (e) {}
  }
  if (domRefs.themeButtons && domRefs.themeButtons.length) {
    domRefs.themeButtons.forEach(btn => {
      const btnTheme = btn.dataset.theme || "auto";
      const isActive = btnTheme === theme;
      btn.classList.toggle("active", isActive);
    });
  }
}

function initializeTheme() {
  let stored = "auto";
  try {
    const value = localStorage.getItem(CONFIG.themeStorageKey);
    if (value === "light" || value === "dark" || value === "auto") stored = value;
  } catch (e) {
    stored = "auto";
  }
  applyTheme(stored);
}

// Event handlers
function setupEventHandlers() {
  // Navigation
  if (domRefs.navToggle) {
    domRefs.navToggle.addEventListener("click", () => {
      domRefs.sideNav.classList.toggle("open");
    });
  }
  
  if (domRefs.navItems) {
    domRefs.navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) switchPage(page);
      });
    });
  }
  
  // Search
  if (domRefs.globalSearch) {
    domRefs.globalSearch.addEventListener("input", () => applyFiltersAndUpdate());
  }
  
  // Filter menu
  if (domRefs.filterMenuBtn) {
    domRefs.filterMenuBtn.addEventListener("click", () => {
      domRefs.filterMenu.hidden = !domRefs.filterMenu.hidden;
    });
  }
  
  if (domRefs.filterMenuClose) {
    domRefs.filterMenuClose.addEventListener("click", () => {
      domRefs.filterMenu.hidden = true;
    });
  }
  
  // Filters
  const updateFilters = () => {
    updateFilterChips();
    applyFiltersAndUpdate();
  };
  
  if (domRefs.filterAssignment) {
    domRefs.filterAssignment.addEventListener("change", updateFilters);
  }
  if (domRefs.filterModel) {
    domRefs.filterModel.addEventListener("change", updateFilters);
  }
  if (domRefs.sortOrder) {
    domRefs.sortOrder.addEventListener("change", updateFilters);
  }
  
  // Filter chips
  if (domRefs.filterChips) {
    domRefs.filterChips.addEventListener("click", (e) => {
      if (e.target.closest(".chip-close") || e.target.classList.contains("chip-close")) {
        e.preventDefault();
        e.stopPropagation();
        const chip = e.target.closest(".chip");
        if (!chip) return;
        
        const filterType = chip.dataset.filter;
        if (filterType === "assignment") {
          if (domRefs.filterAssignment) domRefs.filterAssignment.value = "";
        } else if (filterType === "model") {
          if (domRefs.filterModel) domRefs.filterModel.value = "";
        }
        
        // Remove the chip from UI immediately
        chip.remove();
        
        // Update filters and re-render
        updateFilters();
      }
    });
  }
  
  // Theme toggle
  if (domRefs.themeToggle) {
    domRefs.themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      if (isDark) {
        document.body.classList.remove("theme-dark");
        try { localStorage.setItem(CONFIG.themeStorageKey, "light"); } catch {}
      } else {
        document.body.classList.add("theme-dark");
        try { localStorage.setItem(CONFIG.themeStorageKey, "dark"); } catch {}
      }
    });
  }
  
  // Color scheme picker
  if (domRefs.colorPickerBtn) {
    domRefs.colorPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      domRefs.colorPickerMenu.hidden = !domRefs.colorPickerMenu.hidden;
    });
    
    document.addEventListener("click", (e) => {
      if (!domRefs.colorPickerMenu.contains(e.target) && !domRefs.colorPickerBtn.contains(e.target)) {
        domRefs.colorPickerMenu.hidden = true;
      }
    });
    
    const schemeOptions = document.querySelectorAll(".color-scheme-option");
    schemeOptions.forEach(option => {
      option.addEventListener("click", () => {
        const scheme = option.dataset.scheme;
        document.body.setAttribute("data-scheme", scheme);
        try { localStorage.setItem("color-scheme", scheme); } catch {}
        domRefs.colorPickerMenu.hidden = true;
      });
    });
  }
  
  // Compare page
  const compareAssignment = document.getElementById("compare-assignment");
  if (compareAssignment) {
    compareAssignment.addEventListener("change", () => {
      updateCompareModelOptions();
      renderComparison();
    });
  }
  
  if (domRefs.compareItem1 && domRefs.compareItem2) {
    [domRefs.compareItem1, domRefs.compareItem2].forEach(select => {
      select.addEventListener("change", renderComparison);
    });
  }
  
  // Insights tabs
  if (domRefs.insightTabs) {
    domRefs.insightTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const type = tab.dataset.insightType;
        domRefs.insightTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const panels = document.querySelectorAll(".insights-panel");
        panels.forEach(p => p.classList.remove("active"));
        if (type === "assignments") {
          domRefs.insightsAssignments.classList.add("active");
        } else {
          domRefs.insightsModels.classList.add("active");
        }
      });
    });
  }
  
  // Evaluations grid
  if (domRefs.evaluationsGrid) {
    domRefs.evaluationsGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".evaluation-card");
      if (card) {
        const index = parseInt(card.dataset.index, 10);
        if (!isNaN(index) && appState.visiblePosts[index]) {
          openOverlay(appState.visiblePosts[index]);
        }
      }
    });
  }
  
  // Overlay
  if (domRefs.overlayClose) {
    domRefs.overlayClose.addEventListener("click", () => closeOverlay());
  }
  
  if (domRefs.overlayBackdrop) {
    domRefs.overlayBackdrop.addEventListener("click", () => closeOverlay());
  }
  
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && domRefs.overlay && !domRefs.overlay.hidden) {
      closeOverlay();
    }
  });
  
  window.addEventListener("open-thread", (e) => {
    const { threadNum } = e.detail;
    const post = appState.posts.find(p => p.number === threadNum);
    if (post) {
      openOverlay(post);
    }
  });
  
  // QA
  if (domRefs.qaForm) {
    domRefs.qaForm.addEventListener("submit", handleQASubmit);
  }
  
  // Also handle Enter key on QA input
  if (domRefs.qaInput) {
    domRefs.qaInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (domRefs.qaForm) {
          domRefs.qaForm.dispatchEvent(new Event("submit"));
        }
      }
    });
  }
}

// Navigation
function switchPage(page) {
  // Update nav items
  if (domRefs.navItems) {
    domRefs.navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });
  }
  
  // Show/hide pages
  if (domRefs.pageExplore) domRefs.pageExplore.classList.toggle("active", page === "explore");
  if (domRefs.pageCompare) domRefs.pageCompare.classList.toggle("active", page === "compare");
  if (domRefs.pageInsights) domRefs.pageInsights.classList.toggle("active", page === "insights");
  
  if (domRefs.pageExplore) domRefs.pageExplore.hidden = page !== "explore";
  if (domRefs.pageCompare) domRefs.pageCompare.hidden = page !== "compare";
  if (domRefs.pageInsights) domRefs.pageInsights.hidden = page !== "insights";
  
    // Load data for compare page
    if (page === "compare") {
      initializeComparePage();
    }
  
  // Close side nav on mobile
  if (window.innerWidth < 1024) {
    domRefs.sideNav.classList.remove("open");
  }
}

// Filter chips
function updateFilterChips() {
  if (!domRefs.filterChips) return;
  
  const assignmentValue = domRefs.filterAssignment?.value || "";
  const modelValue = domRefs.filterModel?.value || "";
  
  // Update assignment chip
  const assignmentChip = domRefs.filterChips.querySelector('[data-filter="assignment"]');
  if (assignmentValue) {
    if (!assignmentChip) {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.dataset.filter = "assignment";
      chip.innerHTML = `
        <span class="chip-label">Assignment: ${escapeHTML(assignmentValue)}</span>
        <svg class="chip-close" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      domRefs.filterChips.appendChild(chip);
    } else {
      assignmentChip.querySelector(".chip-label").textContent = `Assignment: ${escapeHTML(assignmentValue)}`;
      assignmentChip.hidden = false;
      assignmentChip.style.display = "";
    }
  } else {
    // Remove assignment chip if value is empty
    if (assignmentChip) {
      assignmentChip.remove();
    }
  }
  
  // Update model chip
  const modelChip = domRefs.filterChips.querySelector('[data-filter="model"]');
  if (modelValue) {
    if (!modelChip) {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.dataset.filter = "model";
      chip.innerHTML = `
        <span class="chip-label">Model: ${escapeHTML(modelValue)}</span>
        <svg class="chip-close" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      domRefs.filterChips.appendChild(chip);
    } else {
      modelChip.querySelector(".chip-label").textContent = `Model: ${escapeHTML(modelValue)}`;
      modelChip.hidden = false;
      modelChip.style.display = "";
    }
  } else {
    // Remove model chip if value is empty
    if (modelChip) {
      modelChip.remove();
    }
  }
}

// Comparison
function initializeComparePage() {
  if (!domRefs.compareAssignment) return;
  
  // Populate assignment dropdown
  const assignments = new Set();
  appState.posts.forEach(p => {
    if (p.metrics?.homework_id) assignments.add(p.metrics.homework_id);
  });
  const sortedAssignments = Array.from(assignments).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
  
  const assignmentHTML = '<option value="">Select Assignment...</option>' + sortedAssignments.map(opt => 
    `<option value="${escapeAttr(opt)}">${escapeHTML(opt)}</option>`
  ).join('');
  
  domRefs.compareAssignment.innerHTML = assignmentHTML;
}

function updateCompareModelOptions() {
  if (!domRefs.compareItem1 || !domRefs.compareItem2 || !domRefs.compareAssignment) return;
  
  const selectedAssignment = domRefs.compareAssignment.value;
  if (!selectedAssignment) {
    domRefs.compareItem1.innerHTML = '<option value="">Select Model...</option>';
    domRefs.compareItem2.innerHTML = '<option value="">Select Model...</option>';
    return;
  }
  
  // Get models that have posts for this assignment
  const models = new Set();
  appState.posts.forEach(p => {
    if (p.metrics?.homework_id === selectedAssignment && p.metrics?.model_name) {
      models.add(p.metrics.model_name);
    }
  });
  
  const sortedModels = Array.from(models).sort();
  const optionHTML = '<option value="">Select Model...</option>' + sortedModels.map(opt => 
    `<option value="${escapeAttr(opt)}">${escapeHTML(opt)}</option>`
  ).join('');
  
  domRefs.compareItem1.innerHTML = optionHTML;
  domRefs.compareItem2.innerHTML = optionHTML;
}

async function renderComparison() {
  if (!domRefs.compareResults) return;
  
  const assignment = domRefs.compareAssignment?.value || "";
  const model1 = domRefs.compareItem1?.value || "";
  const model2 = domRefs.compareItem2?.value || "";
  
  if (!assignment || !model1 || !model2) {
    domRefs.compareResults.innerHTML = '<div class="empty-state"><p>Select an assignment and two models to compare</p></div>';
    return;
  }
  
  // Get posts for each model on this specific assignment
  const posts1 = appState.posts.filter(p => 
    p.metrics?.homework_id === assignment && p.metrics?.model_name === model1
  );
  const posts2 = appState.posts.filter(p => 
    p.metrics?.homework_id === assignment && p.metrics?.model_name === model2
  );
  
  if (posts1.length === 0 && posts2.length === 0) {
    domRefs.compareResults.innerHTML = '<div class="empty-state"><p>No evaluations found for these selections</p></div>';
    return;
  }
  
  // Show loading state
  domRefs.compareResults.innerHTML = `
    <div class="compare-loading">
      <div class="loading-spinner"></div>
      <p>Analyzing model performance...</p>
    </div>
  `;
  
  try {
    // Load full thread content for both models
    const threads1 = await Promise.all(posts1.map(p => buildThreadContext(p)));
    const threads2 = await Promise.all(posts2.map(p => buildThreadContext(p)));
    
    // Generate intelligent comparison using LLM
    const comparison = await generateLLMComparison(
      model1, model2, assignment,
      threads1, threads2,
      posts1, posts2
    );
    
    // Display the comparison
    domRefs.compareResults.innerHTML = `
      <div class="compare-analysis">
        <div class="compare-header">
          <h3>Performance Analysis: ${escapeHTML(model1)} vs ${escapeHTML(model2)} on ${escapeHTML(assignment)}</h3>
        </div>
        <div class="compare-content">
          ${comparison}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error generating comparison:", error);
    domRefs.compareResults.innerHTML = `
      <div class="empty-state">
        <p>Error generating comparison: ${escapeHTML(error.message)}</p>
        <p>Please ensure a model is loaded in the AI Assistant tab.</p>
      </div>
    `;
  }
}

async function generateLLMComparison(model1, model2, assignment, threads1, threads2, posts1, posts2) {
  // Use shared LLM engine if available, otherwise try to initialize
  let llmEngine = window.sharedLLMEngine;
  let webllmLib = window.sharedLLMWebllm;
  
  if (!llmEngine) {
    // Try to initialize a lightweight model for comparison
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported. Please load a model in the AI Assistant tab first.");
    }
    
    if (!webllmLib) {
      webllmLib = await import("https://esm.run/@mlc-ai/web-llm");
    }
    
    // Use a small model for quick analysis
    llmEngine = await webllmLib.CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC", {
      initProgressCallback: () => {}
    });
  }
  
  // Build context from threads
  const context1 = threads1.map((t, i) => 
    `=== ${model1} Evaluation ${i + 1} ===\n${t.slice(0, 4000)}`
  ).join("\n\n");
  
  const context2 = threads2.map((t, i) => 
    `=== ${model2} Evaluation ${i + 1} ===\n${t.slice(0, 4000)}`
  ).join("\n\n");
  
  const prompt = `You are analyzing student evaluations comparing two LLM models on the same homework assignment.

MODEL 1: ${model1} on ${assignment}
${context1}

MODEL 2: ${model2} on ${assignment}
${context2}

Analyze and compare these models' performance. Provide a detailed comparison that includes:

1. **Question-by-Question Performance**: For each homework question, identify:
   - Which model got it correct/incorrect
   - Specific errors made by each model
   - Quality of explanations provided

2. **Overall Performance Summary**:
   - Which model performed better overall
   - Strengths of each model
   - Weaknesses of each model

3. **Common Patterns**:
   - Similar errors both models made
   - Types of questions each model struggled with
   - Areas where one model clearly outperformed the other

4. **Specific Examples**: Cite specific instances from the evaluations showing:
   - Correct answers with good reasoning
   - Incorrect answers and why they were wrong
   - Notable differences in approach or quality

Format your response in clear sections with headers. Be specific and reference actual content from the evaluations. Use markdown formatting for readability.`;

  try {
    const messages = [
      {
        role: "system",
        content: "You are an expert at analyzing LLM performance on academic assignments. Provide detailed, specific comparisons based on the evaluation content."
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    let fullResponse = "";
    const asyncGenerator = await llmEngine.chat.completions.create({
      messages: messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.3
    });
    
    for await (const chunk of asyncGenerator) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullResponse += delta;
    }
    
    // Clean up if we created a temporary engine
    if (llmEngine !== window.sharedLLMEngine) {
      try {
        await llmEngine.unload();
      } catch (e) {
        console.warn("Error unloading temp engine:", e);
      }
    }
    
    // Convert markdown to HTML
    return convertMarkdownToHTML(fullResponse);
  } catch (error) {
    // Clean up on error
    if (llmEngine !== window.sharedLLMEngine) {
      try {
        await llmEngine.unload();
      } catch (e) {}
    }
    throw error;
  }
}

function convertMarkdownToHTML(markdown) {
  // Simple markdown to HTML converter
  let html = escapeHTML(markdown);
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (!p.trim()) return '';
    if (p.startsWith('<')) return p; // Already formatted
    return `<p>${p}</p>`;
  }).join('\n');
  
  return html;
}

function handleResultsClick(e) {
  if (!domRefs.resultsContainer) return;
  const card = e.target.closest(".post-card");
  if (!card || !domRefs.resultsContainer.contains(card)) return;
  if (e.target.closest(".post-card-link")) return;
  if (e.target.closest("a")) return;
  if (e.target.closest("details")) return;
  const indexAttr = card.getAttribute("data-index");
  const index = indexAttr ? Number(indexAttr) : NaN;
  if (Number.isNaN(index) || !appState.visiblePosts[index]) return;
  e.preventDefault();
  openModal(appState.visiblePosts[index]);
}

function buildFileHTML(files) {
  if (!files || !files.length) return "";
  const fileLinks = files.map(f => {
    const filename = escapeHTML(f.original_filename);
    const filePath = escapeAttr(f.saved_as);
    const hasTxt = f.transcript;
    const txtPath = hasTxt ? escapeAttr(f.transcript) : "";
    let icon = "📄";
    if (filename.toLowerCase().endsWith(".pdf")) icon = "📄";
    else if (filename.toLowerCase().match(/\.(png|jpg|jpeg)$/)) icon = "🖼️";
    else if (filename.toLowerCase().endsWith(".txt")) icon = "📝";
    let links = `<a href="${filePath}" target="_blank" rel="noopener noreferrer" title="Download ${filename}" class="file-link">${icon} ${filename}</a>`;
    if (hasTxt) {
      links += ` <a href="${txtPath}" target="_blank" rel="noopener noreferrer" class="file-txt-link" title="View transcript">[txt]</a>`;
    }
    return `<span class="file-item">${links}</span>`;
  });
  return `<div class="file-list"><span class="file-label">📎 Files:</span> ${fileLinks.join(" ")}</div>`;
}

function openOverlay(post) {
  if (!domRefs.overlay || !domRefs.overlayTitle) return;
  previousFocus = document.activeElement;
  appState.openPost = post;
  appState.qaHistory = [];
  if (domRefs.qaChat) domRefs.qaChat.innerHTML = "";
  const hasEngine = appState.qaEngine || window.sharedLLMEngine;
  if (domRefs.qaStatus) {
    if (hasEngine) {
      domRefs.qaStatus.textContent = window.sharedLLMEngine ? "Ready (shared)" : "Ready";
      domRefs.qaStatus.className = "qa-status ready";
    } else {
      domRefs.qaStatus.textContent = "Load model in assistant first";
      domRefs.qaStatus.className = "qa-status";
    }
  }
  const metrics = post.metrics || {};
  const hw = metrics.homework_id || "Unknown";
  const model = metrics.model_name || "Unknown";
  const wc = typeof metrics.word_count === "number" ? metrics.word_count : null;
  const created = post.created_at ? new Date(post.created_at) : null;
  const createdStr = created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "";
  const author = post.user?.name || "Unknown";
  const role = post.user?.course_role || "";
  const meta = [];
  if (createdStr) meta.push(escapeHTML(createdStr));
  if (author) meta.push(`by ${escapeHTML(author)}${role ? ` (${escapeHTML(role)})` : ""}`);
  if (post.ed_url) {
    meta.push(`<a href="${escapeAttr(post.ed_url)}" target="_blank" rel="noopener noreferrer">View on Ed</a>`);
  }
  domRefs.overlayTitle.textContent = post.title || "Untitled evaluation";
  domRefs.overlayMeta.innerHTML = meta.join(" • ");
  if (domRefs.overlayBadges) {
    const badgesHTML = [
      `<span class="badge badge-hw">${escapeHTML(hw)}</span>`,
      `<span class="badge badge-model">${escapeHTML(model)}</span>`
    ].join(" ");
    domRefs.overlayBadges.innerHTML = badgesHTML;
  }
  const files = getPostFiles(post);
  if (domRefs.overlayFiles) {
    domRefs.overlayFiles.innerHTML = buildFileHTML(files);
  }
  let bodyText = post.document || "(no body text available)";
  const fileRefs = post.file_refs || [];
  if (fileRefs && fileRefs.length > 0) {
    const sorted = [...fileRefs].sort((a, b) => b.position - a.position);
    for (const ref of sorted) {
      const pos = ref.position;
      if (pos >= 0 && pos <= bodyText.length) {
        const marker = `\n\n[📎 ${ref.filename}]\n\n`;
        bodyText = bodyText.slice(0, pos) + marker + bodyText.slice(pos);
      }
    }
  }
  if (domRefs.overlayContent) {
    domRefs.overlayContent.innerHTML = formatPostContent(bodyText, files);
  }
  domRefs.overlay.hidden = false;
  
  // Re-initialize QA form event handlers in case overlay was recreated
  if (domRefs.qaForm) {
    // Remove existing listener to avoid duplicates
    const newForm = domRefs.qaForm.cloneNode(true);
    domRefs.qaForm.parentNode.replaceChild(newForm, domRefs.qaForm);
    domRefs.qaForm = newForm;
    domRefs.qaInput = document.getElementById("qa-input");
    domRefs.qaForm.addEventListener("submit", handleQASubmit);
    
    // Add Enter key handler
    if (domRefs.qaInput) {
      domRefs.qaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          domRefs.qaForm.dispatchEvent(new Event("submit"));
        }
      });
    }
  }
  
  if (domRefs.overlayClose) domRefs.overlayClose.focus();
}

function closeOverlay() {
  if (!domRefs.overlay) return;
  domRefs.overlay.hidden = true;
  appState.openPost = null;
  appState.qaHistory = [];
  if (domRefs.qaChat) domRefs.qaChat.innerHTML = "";
  if (domRefs.qaStatus) domRefs.qaStatus.textContent = "";
  if (previousFocus && typeof previousFocus.focus === "function") {
    try { previousFocus.focus(); } catch {}
  }
}

async function initializeQAEngine() {
  if (window.sharedLLMEngine) {
    appState.qaEngine = window.sharedLLMEngine;
    appState.qaWebllm = window.sharedLLMWebllm;
    if (domRefs.qaStatus) {
      domRefs.qaStatus.textContent = "Ready (shared)";
      domRefs.qaStatus.className = "qa-status ready";
    }
    return;
  }
  if (appState.qaEngine) return;
  if (!navigator.gpu) {
    if (domRefs.qaStatus) {
      domRefs.qaStatus.textContent = "WebGPU not supported";
      domRefs.qaStatus.className = "qa-status";
    }
    return;
  }
  try {
    if (domRefs.qaStatus) {
      domRefs.qaStatus.textContent = "Loading...";
      domRefs.qaStatus.className = "qa-status";
    }
    if (!appState.qaWebllm) {
      appState.qaWebllm = await import("https://esm.run/@mlc-ai/web-llm");
    }
    const modelId = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
    appState.qaEngine = await appState.qaWebllm.CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        if (domRefs.qaStatus) domRefs.qaStatus.textContent = progress.text || "Loading...";
      }
    });
    if (domRefs.qaStatus) {
      domRefs.qaStatus.textContent = "Ready";
      domRefs.qaStatus.className = "qa-status ready";
    }
  } catch (error) {
    console.error("Failed to init QA engine:", error);
    if (domRefs.qaStatus) {
      domRefs.qaStatus.textContent = "Failed";
      domRefs.qaStatus.className = "qa-status";
    }
  }
}

async function buildThreadContext(post) {
  const parts = [];
  parts.push(`Title: ${post.title || "Untitled"}`);
  const metrics = post.metrics || {};
  if (metrics.homework_id) parts.push(`Homework: ${metrics.homework_id}`);
  if (metrics.model_name) parts.push(`Model evaluated: ${metrics.model_name}`);
  parts.push(`\nThread content:\n${post.document || "(no content)"}`);
  const threadNum = String(post.number);
  const entry = appState.fileRegistry[threadNum];
  if (entry?.files?.length) {
    for (const file of entry.files) {
      if (file.transcript) {
        try {
          const res = await fetch(file.transcript, { cache: "force-cache" });
          if (res.ok) {
            let txt = await res.text();
            if (txt.length > 6000) txt = txt.slice(0, 6000) + "...";
            parts.push(`\nAttached file (${file.original_filename}):\n${txt}`);
            continue;
          }
        } catch {}
      }
      const savedPath = file.saved_as || file.url;
      if (savedPath && savedPath.toLowerCase().endsWith('.pdf')) {
        parts.push(`\n(Reading PDF: ${file.original_filename}...)`);
        const pdfText = await extractPDFText(savedPath);
        if (pdfText && pdfText.length > 50) {
          parts.push(`\nAttached PDF Content (${file.original_filename}):\n${pdfText}`);
        }
      }
    }
  }
  return parts.join("\n");
}

function addQAMessage(role, content, isStreaming = false) {
  const container = domRefs.qaChat || document.getElementById("qa-chat");
  if (!container) return null;
  const div = document.createElement("div");
  div.className = `qa-message qa-message-${role}${isStreaming ? " streaming" : ""}`;
  div.innerHTML = `<div class="message-content"><p>${escapeHTML(content)}</p></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

async function handleQASubmit(e) {
  e.preventDefault();
  const inputEl = domRefs.qaInput || document.getElementById("qa-input");
  const submitEl = document.querySelector("#qa-form button[type='submit']") || document.querySelector(".qa-submit");
  const indicatorEl = domRefs.qaStatus || document.getElementById("qa-status");
  const container = domRefs.qaChat || document.getElementById("qa-chat");
  
  if (!inputEl) return;
  
  const question = inputEl.value.trim();
  const contextPost = appState.activeThread || appState.openPost;
  
  if (!question || appState.isGeneratingQA || !contextPost) return;
  
  if (!appState.qaEngine) {
    await initializeQAEngine();
    if (!appState.qaEngine) return;
  }
  
  addQAMessage("user", question);
  inputEl.value = "";
  appState.isGeneratingQA = true;
  inputEl.disabled = true;
  if (submitEl) submitEl.disabled = true;
  
  if (indicatorEl) {
    indicatorEl.textContent = "Thinking...";
    indicatorEl.className = "qa-status";
  }
  
  const assistantEl = addQAMessage("assistant", "", true);
  
  try {
    const threadContext = await buildThreadContext(contextPost);
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant answering questions about a specific thread from EECS 182 special participation posts. Answer based on the thread content provided. Be concise."
      },
      {
        role: "user",
        content: `Here is the thread content:\n\n${threadContext}\n\n---\n\nQuestion: ${question}\n\nPlease answer based on the thread content above.`
      }
    ];
    let fullResponse = "";
    const asyncGenerator = await appState.qaEngine.chat.completions.create({
      messages,
      stream: true,
      max_tokens: 400,
      temperature: 0.7
    });
    for await (const chunk of asyncGenerator) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullResponse += delta;
      if (assistantEl) {
        const contentEl = assistantEl.querySelector(".message-content p") || assistantEl.querySelector("p");
        if (contentEl) contentEl.textContent = fullResponse;
        if (container) container.scrollTop = container.scrollHeight;
      }
    }
    if (assistantEl) assistantEl.classList.remove("streaming");
  } catch (error) {
    console.error("QA generation error:", error);
    if (assistantEl) {
      const contentEl = assistantEl.querySelector(".message-content p") || assistantEl.querySelector("p");
      if (contentEl) contentEl.textContent = "Sorry, something went wrong.";
    }
    if (assistantEl) assistantEl.classList.remove("streaming");
  } finally {
    appState.isGeneratingQA = false;
    if (inputEl) inputEl.disabled = false;
    if (submitEl) submitEl.disabled = false;
    if (indicatorEl) {
      indicatorEl.textContent = "Ready";
      indicatorEl.className = "qa-status ready";
    }
    if (inputEl) inputEl.focus();
  }
}

function applyFiltersAndUpdate() {
  const hwVal = decodeURIComponent(domRefs.filterAssignment?.value || "");
  const modelVal = decodeURIComponent(domRefs.filterModel?.value || "");
  const search = (domRefs.globalSearch?.value || "").toLowerCase().trim();
  const sortOrder = domRefs.sortOrder?.value || "newest";
  let results = appState.posts.filter(post => {
    const metrics = post.metrics || {};
    if (hwVal && metrics.homework_id !== hwVal) return false;
    if (modelVal && metrics.model_name !== modelVal) return false;
    if (search) {
      const haystack = `${post.title || ""}\n${post.document || ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  results = sortResults(results, sortOrder);
  appState.visiblePosts = results;
  renderMetrics();
  renderEvaluations();
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sortResults(list, order) {
  const arr = list.slice();
  if (order === "homework") {
    arr.sort((a, b) => {
      const hwA = a.metrics?.homework_id || "";
      const hwB = b.metrics?.homework_id || "";
      const numA = hwA.match(/\d+/);
      const numB = hwB.match(/\d+/);
      if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10);
      return hwA.localeCompare(hwB);
    });
  } else if (order === "model") {
    arr.sort((a, b) => {
      const modelA = a.metrics?.model_name || "";
      const modelB = b.metrics?.model_name || "";
      return modelA.localeCompare(modelB);
    });
  } else if (order === "oldest") {
    arr.sort((a, b) => {
      const da = parseDate(a.created_at);
      const db = parseDate(b.created_at);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  } else {
    arr.sort((a, b) => {
      const da = parseDate(a.created_at);
      const db = parseDate(b.created_at);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db - da;
    });
  }
  return arr;
}

function renderMetrics() {
  const total = appState.posts.length;
  const shown = appState.visiblePosts.length;
  
  if (domRefs.metricTotal) domRefs.metricTotal.textContent = total;
  if (domRefs.metricFiltered) domRefs.metricFiltered.textContent = shown;
  
  const allHw = new Set();
  const allModels = new Set();
  for (const post of appState.posts) {
    const metrics = post.metrics || {};
    if (metrics.homework_id) allHw.add(metrics.homework_id);
    if (metrics.model_name) allModels.add(metrics.model_name);
  }
  
  if (domRefs.metricAssignments) domRefs.metricAssignments.textContent = allHw.size;
  if (domRefs.metricModels) domRefs.metricModels.textContent = allModels.size;
}

function renderEvaluations() {
  if (!domRefs.evaluationsGrid) return;
  if (!appState.visiblePosts.length) {
    domRefs.evaluationsGrid.innerHTML = '<div class="empty-state"><p>No evaluations match the current filters.</p><p style="margin-top: var(--space-2); color: var(--text-tertiary); font-size: 0.875rem;">Try adjusting your filters or search terms.</p></div>';
    return;
  }
  const items = appState.visiblePosts.map((post, index) => renderEvaluationCard(post, index));
  domRefs.evaluationsGrid.innerHTML = items.join("\n");
}

function setupCardReveal() {
  if (!domRefs.resultsContainer || typeof IntersectionObserver === "undefined") return;
  const cards = Array.from(domRefs.resultsContainer.querySelectorAll(".post-card"));
  if (!cards.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    }
  }, { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0 });
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
    observer.observe(card);
  });
}

function renderEvaluationCard(post, index) {
  const metrics = post.metrics || {};
  const hw = metrics.homework_id || "Unknown";
  const model = metrics.model_name || "Unknown";
  const wc = typeof metrics.word_count === "number" ? metrics.word_count : null;
  const created = post.created_at ? new Date(post.created_at) : null;
  const createdStr = created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "";
  const author = post.user?.name || "Unknown";
  const role = post.user?.course_role || "";
  const badges = [
    `<span class="badge badge-hw">${escapeHTML(hw)}</span>`,
    `<span class="badge badge-model">${escapeHTML(model)}</span>`
  ];
  const stats = [];
  if (wc != null) stats.push(`${wc} words`);
  if (typeof post.view_count === "number") stats.push(`${post.view_count} views`);
  if (typeof post.reply_count === "number") stats.push(`${post.reply_count} replies`);
  const title = escapeHTML(post.title || "Untitled evaluation");
  return `
<div class="evaluation-card" data-index="${index}">
  <h3 class="eval-title">${title}</h3>
  <div class="eval-meta">
    <span>${createdStr}</span>
    <span>•</span>
    <span>${escapeHTML(author)}${role ? ` (${escapeHTML(role)})` : ""}</span>
  </div>
  <div class="eval-badges">${badges.join(" ")}</div>
  <div class="eval-stats">${stats.map(escapeHTML).join(" • ")}</div>
  <a href="?thread=${post.number}" class="eval-link">Open Full View</a>
</div>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, "&quot;");
}

function formatInsightText(text) {
  let formatted = escapeHTML(text || "");
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function formatInsightMarkdown(text) {
  if (!text) return '';
  
  // Convert markdown-style formatting to HTML
  let html = escapeHTML(text);
  
  // Bold text (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Headers (## Header)
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  
  // Bullet points (- item or • item)
  html = html.replace(/^[\-\•] (.+)$/gim, '<li>$1</li>');
  
  // Wrap consecutive list items in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return '<ul>' + match.replace(/\n/g, '') + '</ul>';
  });
  
  // Paragraphs (double newline)
  html = html.split('\n\n').map(para => {
    para = para.trim();
    if (!para) return '';
    // Don't wrap if it's already a tag
    if (para.startsWith('<')) return para;
    return '<p>' + para + '</p>';
  }).join('\n');
  
  // Single newlines become <br>
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

async function renderAssignmentInsights() {
  if (!domRefs.insightsAssignments) return;
  
  // Import static insights data
  const { insightsData } = await import('./insights_data.js');
  const homeworkData = insightsData.homework;
  
  let hwIds = Object.keys(homeworkData).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
  
  if (hwIds.length === 0) {
    domRefs.insightsAssignments.innerHTML = '<div class="empty-state"><p>No assignment insights available.</p></div>';
    return;
  }
  
  const items = hwIds.map(hwId => {
    const data = homeworkData[hwId];
    const formattedContent = formatInsightMarkdown(data.content);
    return `
      <div class="insight-item">
        <h3 class="insight-item-title">${escapeHTML(hwId)} <span class="insight-count">(${data.count} evaluations)</span></h3>
        <div class="insight-item-content">${formattedContent}</div>
      </div>
    `;
  }).join('');
  domRefs.insightsAssignments.innerHTML = items;
}

async function renderModelInsights() {
  if (!domRefs.insightsModels) return;
  
  // Import static insights data
  const { insightsData } = await import('./insights_data.js');
  const modelData = insightsData.models;
  
  const modelNames = Object.keys(modelData).sort();
  if (modelNames.length === 0) {
    domRefs.insightsModels.innerHTML = '<div class="empty-state"><p>No model insights available.</p></div>';
    return;
  }
  
  const items = modelNames.map(model => {
    const data = modelData[model];
    const formattedContent = formatInsightMarkdown(data.content);
    return `
      <div class="insight-item">
        <h3 class="insight-item-title">${escapeHTML(model)} <span class="insight-count">(${data.count} evaluation${data.count !== 1 ? 's' : ''})</span></h3>
        <div class="insight-item-content">${formattedContent}</div>
      </div>
    `;
  }).join('');
  domRefs.insightsModels.innerHTML = items;
}

function renderFullPageThread(post) {
  appState.activeThread = post;
  appState.openPost = null;
  const metrics = post.metrics || {};
  const files = getPostFiles(post);
  let pdfUrl = null;
  if (files) {
    const pdf = files.find(f => 
      (f.transcript && f.transcript.endsWith('.pdf')) || 
      (f.url && f.url.endsWith('.pdf')) ||
      (f.saved_as && f.saved_as.endsWith('.pdf'))
    );
    if (pdf) pdfUrl = pdf.saved_as;
  }
  const themeClass = document.body.classList.contains('theme-dark') ? 'theme-dark' : 
                     document.body.classList.contains('theme-light') ? 'theme-light' : '';
  const html = `
    <style>
      .fullpage-view {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: var(--surface-elevated);
        display: flex;
        font-family: var(--font-family);
        color: var(--text-primary);
      }
      .fullpage-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-right: 1px solid var(--border-default);
        overflow: hidden;
      }
      .fullpage-header {
        padding: var(--spacing-xl);
        border-bottom: 1px solid var(--border-default);
        background: var(--surface-base);
      }
      .fullpage-back {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--text-tertiary);
        text-decoration: none;
        margin-bottom: var(--spacing-md);
        font-size: 0.875rem;
      }
      .fullpage-back:hover {
        color: var(--primary);
      }
      .fullpage-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: var(--spacing-sm) 0;
        color: var(--text-primary);
      }
      .fullpage-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-xl);
        background: var(--surface-elevated);
      }
      .fullpage-body {
        background: var(--surface-base);
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        border: 1px solid var(--border-default);
        margin-bottom: var(--spacing-xl);
        line-height: 1.6;
        color: var(--text-secondary);
      }
      .fullpage-pdf-container {
        height: 800px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        background: var(--surface-base);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .fullpage-pdf-iframe {
        width: 100%;
        flex: 1;
        border: none;
        background: var(--surface-subtle);
      }
    </style>
    <div class="fullpage-view">
      <div class="fullpage-main">
        <div class="fullpage-header">
          <a href="?" class="fullpage-back">← Back to Dashboard</a>
          <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-4);">
            <span class="post-tag post-tag-hw">${escapeHTML(metrics.homework_id || 'HW')}</span>
            <span class="post-tag post-tag-model">${escapeHTML(metrics.model_name || 'Model')}</span>
          </div>
          <h1 class="fullpage-title">${escapeHTML(post.title)}</h1>
          <div class="modal-meta">
            <span>${escapeHTML(post.user?.name || 'Unknown')}</span>
            <span>•</span>
            <a href="${post.ed_url}" target="_blank">View on Ed</a>
          </div>
        </div>
        <div class="fullpage-content">
          <div class="fullpage-body">
            ${formatPostContent(post.document, files)}
          </div>
          ${pdfUrl ? `
            <div class="fullpage-pdf-container">
              <iframe src="${pdfUrl}" class="fullpage-pdf-iframe"></iframe>
            </div>
          ` : `
            <div class="empty-state">No PDF attachment found.</div>
          `}
        </div>
      </div>
    </div>
  `;
  document.body.innerHTML = html;
  if (themeClass) {
    document.body.classList.add(themeClass);
  }
}

// Initialization
async function initialize() {
  initializeDOMReferences();
  initializeTheme();
  initializeColorScheme();
  setupEventHandlers();
  try {
    const [posts, manifest, insights] = await Promise.all([
      fetchPostsData(),
      fetchFileManifest(),
      fetchAnalysisData()
    ]);
    appState.posts = posts;
    appState.fileRegistry = manifest;
    appState.analysisData = insights;
    
    // Expose to window for assistant.js
    window.appState = appState;
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('thread');
    if (threadId) {
      const post = posts.find(p => String(p.number) === threadId);
      if (post) {
        openOverlay(post);
        return;
      }
    }
    buildFilterOptions(posts);
    switchPage("explore");
    applyFiltersAndUpdate();
    renderAssignmentInsights();
    renderModelInsights();
  } catch (error) {
    console.error(error);
    if (domRefs.errorBanner) {
      domRefs.errorBanner.textContent = error.message || String(error);
      domRefs.errorBanner.hidden = false;
    }
  }
}

function initializeColorScheme() {
  try {
    const scheme = localStorage.getItem("color-scheme") || "ocean";
    if (scheme) {
      document.body.setAttribute("data-scheme", scheme);
    }
  } catch (e) {}
}

window.addEventListener("DOMContentLoaded", initialize);


