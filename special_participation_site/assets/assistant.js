// AI Assistant Module - Browser-based LLM using WebGPU
// Supports RAG for context-aware responses

import * as searchModule from "./search.js";

// Assistant state
const assistantState = {
  llmEngine: null,
  webllmLib: null,
  loading: false,
  generating: false,
  conversation: [],
  activeModel: null,
  ragActive: false,
  ragReady: false,
  postData: [],
  fileIndex: {}
};

// DOM element cache
const uiElements = {};

function initializeUIReferences() {
  uiElements.window = document.getElementById("assistant-window");
  uiElements.toggleBtn = document.getElementById("assistant-toggle-btn");
  uiElements.dragHandle = document.getElementById("assistant-drag-handle");
  uiElements.body = document.getElementById("assistant-body");
  uiElements.minimize = document.getElementById("assistant-minimize");
  uiElements.close = document.getElementById("assistant-close");
  uiElements.state = document.getElementById("assistant-status");
  uiElements.modelSelect = document.getElementById("assistant-model-select");
  uiElements.messages = document.getElementById("assistant-messages");
  uiElements.loading = document.getElementById("assistant-loading");
  uiElements.loadingMessage = document.getElementById("loading-text");
  uiElements.progressBar = document.getElementById("loading-progress");
  uiElements.form = document.getElementById("assistant-form");
  uiElements.input = document.getElementById("assistant-input");
  uiElements.send = document.getElementById("assistant-send");
  uiElements.ragCheckbox = document.getElementById("assistant-rag-toggle");
  uiElements.ragState = document.getElementById("assistant-rag-status");
  uiElements.ragFilters = document.getElementById("assistant-rag-filters");
  uiElements.ragFilterHw = document.getElementById("assistant-rag-filter-hw");
  uiElements.ragFilterModel = document.getElementById("assistant-rag-filter-model");
  uiElements.clear = document.getElementById("assistant-clear");
}

function setupEventHandlers() {
  if (uiElements.minimize) {
    uiElements.minimize.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAssistant();
    });
  }
  if (uiElements.close) {
    uiElements.close.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAssistant();
    });
  }
  if (uiElements.toggleBtn) {
    uiElements.toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openAssistant();
    });
  }
  if (uiElements.form) {
    uiElements.form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleMessageSubmit(e);
    });
  }
  if (uiElements.modelSelect) {
    uiElements.modelSelect.addEventListener("change", handleModelSelection);
  }
  if (uiElements.ragCheckbox) {
    uiElements.ragCheckbox.addEventListener("change", handleRAGToggle);
  }
  if (uiElements.ragFilterHw) {
    uiElements.ragFilterHw.addEventListener("change", () => {
      if (assistantState.ragReady) {
        // Re-index with filters if RAG is already active
        initializeRAG();
      }
    });
  }
  if (uiElements.ragFilterModel) {
    uiElements.ragFilterModel.addEventListener("change", () => {
      if (assistantState.ragReady) {
        initializeRAG();
      }
    });
  }
  if (uiElements.clear) {
    uiElements.clear.addEventListener("click", (e) => {
      e.stopPropagation();
      resetConversation();
    });
  }
  if (uiElements.input) {
    // Ensure input is not disabled if model is loaded
    uiElements.input.addEventListener("focus", () => {
      if (assistantState.llmEngine && uiElements.input.disabled) {
        uiElements.input.disabled = false;
      }
    });
  }
  setupDragging();
  setupResizing();
  populateRAGFilters();
}

function setupDragging() {
  if (!uiElements.window || !uiElements.dragHandle) {
    console.error("Missing window or dragHandle for dragging");
    return;
  }
  
  let isDragging = false;
  let initialX, initialY;
  
  const dragStart = (e) => {
    // Don't drag if clicking on buttons or interactive elements
    const clickedButton = e.target.closest("button");
    const clickedInput = e.target.closest("input");
    const clickedSelect = e.target.closest("select");
    
    if (clickedButton || clickedInput || clickedSelect) {
      return; // Let buttons/inputs handle their own clicks
    }
    
    // Only drag if clicking on the header bar itself
    if (e.target === uiElements.dragHandle || 
        uiElements.dragHandle.contains(e.target) ||
        e.target.closest(".assistant-header-content") ||
        e.target.closest(".assistant-title-row")) {
      
      // Make sure we're not clicking a button
      if (!clickedButton) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        initialX = e.clientX - uiElements.window.offsetLeft;
        initialY = e.clientY - uiElements.window.offsetTop;
        
        uiElements.window.style.cursor = "grabbing";
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", dragEnd);
      }
    }
  };
  
  const drag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const currentX = e.clientX - initialX;
    const currentY = e.clientY - initialY;
    
    const maxX = window.innerWidth - uiElements.window.offsetWidth;
    const maxY = window.innerHeight - uiElements.window.offsetHeight;
    
    const newX = Math.max(0, Math.min(currentX, maxX));
    const newY = Math.max(0, Math.min(currentY, maxY));
    
    uiElements.window.style.left = newX + "px";
    uiElements.window.style.top = newY + "px";
    uiElements.window.style.right = "auto";
    uiElements.window.style.bottom = "auto";
  };
  
  const dragEnd = () => {
    if (isDragging) {
      isDragging = false;
      if (uiElements.window) uiElements.window.style.cursor = "";
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);
    }
  };
  
  uiElements.dragHandle.style.cursor = "grab";
  uiElements.dragHandle.addEventListener("mousedown", dragStart);
}

function setupResizing() {
  if (!uiElements.window) return;
  
  const handles = {
    nw: document.getElementById("assistant-resize-nw"),
    ne: document.getElementById("assistant-resize-ne"),
    sw: document.getElementById("assistant-resize-sw"),
    se: document.getElementById("assistant-resize-se"),
    n: document.getElementById("assistant-resize-n"),
    s: document.getElementById("assistant-resize-s"),
    e: document.getElementById("assistant-resize-e"),
    w: document.getElementById("assistant-resize-w")
  };
  
  let isResizing = false;
  let resizeType = "";
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  
  function startResize(e, type) {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeType = type;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = uiElements.window.offsetWidth;
    startHeight = uiElements.window.offsetHeight;
    startLeft = uiElements.window.offsetLeft;
    startTop = uiElements.window.offsetTop;
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  }
  
  function doResize(e) {
    if (!isResizing) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const minWidth = 320;
    const minHeight = 400;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
    
    // Handle width changes
    if (resizeType.includes("e")) {
      // Resize from right
      newWidth = Math.max(minWidth, Math.min(startWidth + deltaX, maxWidth - startLeft));
    } else if (resizeType.includes("w")) {
      // Resize from left
      const widthChange = -deltaX;
      newWidth = Math.max(minWidth, Math.min(startWidth + widthChange, startLeft + startWidth));
      newLeft = Math.max(0, Math.min(startLeft + deltaX, startLeft + startWidth - minWidth));
    }
    
    // Handle height changes
    if (resizeType.includes("s")) {
      // Resize from bottom
      newHeight = Math.max(minHeight, Math.min(startHeight + deltaY, maxHeight - startTop));
    } else if (resizeType.includes("n")) {
      // Resize from top
      const heightChange = -deltaY;
      newHeight = Math.max(minHeight, Math.min(startHeight + heightChange, startTop + startHeight));
      newTop = Math.max(0, Math.min(startTop + deltaY, startTop + startHeight - minHeight));
    }
    
    // Apply changes
    uiElements.window.style.width = newWidth + "px";
    uiElements.window.style.height = newHeight + "px";
    if (resizeType.includes("w")) {
      uiElements.window.style.left = newLeft + "px";
      uiElements.window.style.right = "auto";
    }
    if (resizeType.includes("n")) {
      uiElements.window.style.top = newTop + "px";
      uiElements.window.style.bottom = "auto";
    }
  }
  
  function stopResize() {
    if (isResizing) {
      isResizing = false;
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    }
  }
  
  // Attach event listeners to all handles
  Object.keys(handles).forEach(type => {
    if (handles[type]) {
      handles[type].addEventListener("mousedown", (e) => startResize(e, type));
    }
  });
}

function toggleAssistant() {
  if (uiElements.body) {
    const isHidden = uiElements.body.hidden;
    uiElements.body.hidden = !isHidden;
    if (!isHidden) {
      uiElements.window.classList.add("minimized");
    } else {
      uiElements.window.classList.remove("minimized");
      if (uiElements.input) uiElements.input.focus();
    }
  }
}

function closeAssistant() {
  if (uiElements.window) {
    uiElements.window.classList.add("hidden");
    uiElements.window.style.display = "none";
  }
  if (uiElements.toggleBtn) {
    uiElements.toggleBtn.hidden = false;
    uiElements.toggleBtn.style.display = "flex";
  }
}

function openAssistant() {
  if (uiElements.window) {
    uiElements.window.classList.remove("hidden");
    uiElements.window.classList.remove("minimized");
    uiElements.window.style.display = "flex";
  }
  if (uiElements.body) {
    uiElements.body.hidden = false;
    uiElements.body.style.display = "flex";
  }
  if (uiElements.toggleBtn) {
    uiElements.toggleBtn.hidden = true;
    uiElements.toggleBtn.style.display = "none";
  }
  if (uiElements.input) {
    setTimeout(() => uiElements.input.focus(), 100);
  }
}

async function initializeLLMEngine() {
  const selectedModel = uiElements.modelSelect?.value;
  if (!selectedModel) {
    if (uiElements.state) uiElements.state.textContent = "Select a model to start";
    return;
  }

  assistantState.loading = true;
  if (uiElements.loading) uiElements.loading.hidden = false;
  if (uiElements.state) {
    uiElements.state.textContent = "Initializing...";
    uiElements.state.className = "assistant-status-text";
  }

  try {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported. Please use Chrome 113+ or Edge 113+.");
    }

    if (!assistantState.webllmLib) {
      if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = "Loading WebLLM library...";
      assistantState.webllmLib = await import("https://esm.run/@mlc-ai/web-llm");
    }

    assistantState.activeModel = selectedModel;
    if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = `Loading ${getModelName(selectedModel)}...`;

    assistantState.llmEngine = await assistantState.webllmLib.CreateMLCEngine(selectedModel, {
      initProgressCallback: (progress) => {
        const percent = Math.round(progress.progress * 100);
        if (uiElements.progressBar) uiElements.progressBar.style.width = `${percent}%`;
        if (progress.text && uiElements.loadingMessage) {
          uiElements.loadingMessage.textContent = progress.text;
        }
      }
    });

    if (uiElements.loading) uiElements.loading.hidden = true;
    if (uiElements.state) {
      uiElements.state.textContent = "Ready";
      uiElements.state.className = "assistant-status-text";
    }
    if (uiElements.input) {
      uiElements.input.disabled = false;
      uiElements.input.removeAttribute("disabled");
    }
    if (uiElements.send) {
      uiElements.send.disabled = false;
      uiElements.send.removeAttribute("disabled");
    }
    if (uiElements.input) {
      setTimeout(() => {
        if (uiElements.input) uiElements.input.focus();
      }, 100);
    }

    assistantState.conversation = [
      {
        role: "system",
        content: `You are a helpful AI assistant integrated into a web app that explores EECS 182 "special participation A" posts where students evaluated LLMs on homework problems. Be concise and helpful. If asked about the posts, explain that users can filter and search them in the main interface.`
      }
    ];

    window.sharedLLMEngine = assistantState.llmEngine;
    window.sharedLLMWebllm = assistantState.webllmLib;
  } catch (error) {
    console.error("Failed to initialize WebLLM:", error);
    if (uiElements.loading) uiElements.loading.hidden = true;
    if (uiElements.state) {
      uiElements.state.textContent = "Error loading model";
      uiElements.state.className = "assistant-status-text";
    }
    addAssistantMessage("assistant", `Sorry, I couldn't load the model. ${error.message || "Please try a different browser or model."}`);
  } finally {
    assistantState.loading = false;
  }
}

async function handleModelSelection() {
  const newModel = uiElements.modelSelect?.value;
  if (!newModel) {
    if (uiElements.state) uiElements.state.textContent = "Select a model to start";
    return;
  }
  
  if (newModel === assistantState.activeModel) return;

  if (assistantState.llmEngine) {
    try {
      await assistantState.llmEngine.unload();
    } catch (e) {
      console.warn("Error unloading previous model:", e);
    }
    assistantState.llmEngine = null;
  }

  assistantState.activeModel = null;
  assistantState.conversation = [];
  
  if (uiElements.messages) {
    uiElements.messages.innerHTML = `
      <div class="assistant-message assistant-message-bot">
        <div class="message-content"><p>Loading ${getModelName(newModel)}...</p></div>
      </div>
    `;
  }

  if (uiElements.input) {
    uiElements.input.disabled = true;
  }
  if (uiElements.send) {
    uiElements.send.disabled = true;
  }

  try {
    await initializeLLMEngine();
  } catch (error) {
    console.error("Error in handleModelSelection:", error);
    if (uiElements.messages) {
      addAssistantMessage("assistant", `Failed to load model: ${error.message}`);
    }
  }
}

async function handleRAGToggle() {
  assistantState.ragActive = uiElements.ragCheckbox.checked;
  updateRAGStatus();

  if (assistantState.ragActive) {
    if (uiElements.ragFilters) {
      uiElements.ragFilters.hidden = false;
    }
    if (!assistantState.ragReady) {
      await initializeRAG();
    }
  } else {
    if (uiElements.ragFilters) {
      uiElements.ragFilters.hidden = true;
    }
  }
}

function populateRAGFilters() {
  if (!uiElements.ragFilterHw || !uiElements.ragFilterModel) return;
  
  // Get posts data from window or fetch
  const posts = window.appState?.posts || [];
  
  const assignments = new Set();
  const models = new Set();
  
  posts.forEach(p => {
    if (p.metrics?.homework_id) assignments.add(p.metrics.homework_id);
    if (p.metrics?.model_name) models.add(p.metrics.model_name);
  });
  
  const sortedAssignments = Array.from(assignments).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
  
  const sortedModels = Array.from(models).sort();
  
  uiElements.ragFilterHw.innerHTML = '<option value="">All Assignments</option>' + 
    sortedAssignments.map(a => `<option value="${escapeAttr(a)}">${escapeHTML(a)}</option>`).join('');
  
  uiElements.ragFilterModel.innerHTML = '<option value="">All Models</option>' + 
    sortedModels.map(m => `<option value="${escapeAttr(m)}">${escapeHTML(m)}</option>`).join('');
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

function resetConversation() {
  assistantState.conversation = [
    {
      role: "system",
      content: `You are a helpful AI assistant integrated into a web app that explores EECS 182 "special participation A" posts where students evaluated LLMs on homework problems. Be concise and helpful. If asked about the posts, explain that users can filter and search them in the main interface.`
    }
  ];

  uiElements.messages.innerHTML = `
    <div class="assistant-message assistant-message-bot">
      <div class="message-content"><p>Conversation cleared. How can I help you?</p></div>
    </div>
  `;
}

function updateRAGStatus() {
  if (!uiElements.ragState) return;

  if (!assistantState.ragActive) {
    uiElements.ragState.textContent = "RAG disabled";
    uiElements.ragState.className = "assistant-rag-state";
  } else if (assistantState.ragReady) {
    uiElements.ragState.textContent = `RAG ready (${searchModule.getIndexedCount()} threads)`;
    uiElements.ragState.className = "assistant-rag-state ready";
  } else {
    uiElements.ragState.textContent = "RAG not indexed";
    uiElements.ragState.className = "assistant-rag-state";
  }
}

async function loadPostData() {
  if (assistantState.postData.length > 0) return;

  try {
    const [postsRes, manifestRes] = await Promise.all([
      fetch("public/data/posts_processed.json", { cache: "no-store" }),
      fetch("files/manifest.json", { cache: "no-store" })
    ]);

    if (postsRes.ok) {
      assistantState.postData = await postsRes.json();
    }
    if (manifestRes.ok) {
      assistantState.fileIndex = await manifestRes.json();
    }
  } catch (error) {
    console.error("Failed to load posts data:", error);
  }
}

async function initializeRAG() {
  if (!assistantState.ragActive) return;

  // Always clear existing index when re-initializing (including when filters change)
  if (assistantState.ragReady) {
    searchModule.clearIndex();
    assistantState.ragReady = false;
  }

  if (!uiElements.loading) return;
  uiElements.loading.hidden = false;
  if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = "Initializing RAG...";
  if (uiElements.progressBar) uiElements.progressBar.style.width = "0%";

  try {
    if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = "Loading thread data...";
    await loadPostData();

    if (assistantState.postData.length === 0) {
      throw new Error("No posts data available");
    }

    // Apply RAG filters - ONLY index threads that match the filters
    let filteredPosts = assistantState.postData;
    const hwFilter = uiElements.ragFilterHw?.value || "";
    const modelFilter = uiElements.ragFilterModel?.value || "";
    
    if (hwFilter || modelFilter) {
      filteredPosts = assistantState.postData.filter(p => {
        const metrics = p.metrics || {};
        // Must match homework filter if set
        if (hwFilter && metrics.homework_id !== hwFilter) return false;
        // Must match model filter if set
        if (modelFilter && metrics.model_name !== modelFilter) return false;
        return true;
      });
      
      if (filteredPosts.length === 0) {
        throw new Error(`No threads match the selected filters (HW: ${hwFilter || "Any"}, Model: ${modelFilter || "Any"})`);
      }
      
      if (uiElements.loadingMessage) {
        uiElements.loadingMessage.textContent = `Indexing ${filteredPosts.length} filtered thread${filteredPosts.length !== 1 ? 's' : ''}...`;
      }
    } else {
      if (uiElements.loadingMessage) {
        uiElements.loadingMessage.textContent = `Indexing ${assistantState.postData.length} threads...`;
      }
    }

    // Initialize embedding engine (only if not already initialized)
    await searchModule.initEmbeddingEngine((progress) => {
      if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = progress.text || "Loading embedding model...";
      if (uiElements.progressBar) uiElements.progressBar.style.width = `${Math.round(progress.progress * 50)}%`;
    });

    // Index ONLY the filtered posts - this ensures search only searches filtered threads
    await searchModule.indexThreads(filteredPosts, assistantState.fileIndex, (progress) => {
      if (uiElements.loadingMessage) uiElements.loadingMessage.textContent = progress.text || "Indexing...";
      if (uiElements.progressBar) uiElements.progressBar.style.width = `${50 + Math.round(progress.progress * 50)}%`;
    });

    assistantState.ragReady = true;
    updateRAGStatus();

    const count = searchModule.getIndexedCount();
    const filterInfo = (hwFilter || modelFilter) 
      ? ` (filtered: ${hwFilter ? `HW ${hwFilter}` : ""}${hwFilter && modelFilter ? ", " : ""}${modelFilter ? modelFilter : ""})`
      : "";
    addAssistantMessage("assistant", `RAG initialized! I can now search through ${count} thread${count !== 1 ? 's' : ''}${filterInfo} to find relevant context for your questions.`);
  } catch (error) {
    console.error("Failed to initialize RAG:", error);
    addAssistantMessage("assistant", `Failed to initialize RAG: ${error.message}. Falling back to standard chat.`);
    assistantState.ragActive = false;
    assistantState.ragReady = false;
    if (uiElements.ragCheckbox) uiElements.ragCheckbox.checked = false;
    updateRAGStatus();
  } finally {
    if (uiElements.loading) uiElements.loading.hidden = true;
  }
}

async function handleMessageSubmit(e) {
  if (e) e.preventDefault();

  if (!uiElements.input) {
    console.error("Input element not found");
    return;
  }

  const userMessage = uiElements.input.value.trim();
  if (!userMessage || assistantState.generating || !assistantState.llmEngine) {
    if (!assistantState.llmEngine) {
      addAssistantMessage("assistant", "Please select a model from the dropdown above to start chatting.");
    }
    return;
  }

  addAssistantMessage("user", userMessage);
  uiElements.input.value = "";

  assistantState.generating = true;
  if (uiElements.input) uiElements.input.disabled = true;
  if (uiElements.send) uiElements.send.disabled = true;

  const assistantEl = addAssistantMessage("assistant", "", true);

  try {
    let contextMessage = "";

    let ragResults = [];
    if (assistantState.ragActive && assistantState.ragReady) {
      uiElements.state.textContent = "Searching threads...";
      ragResults = await searchModule.searchThreads(userMessage, 3);

      if (ragResults.length > 0) {
        contextMessage = searchModule.formatContext(ragResults);
        const threadList = ragResults
          .map(r => `"${r.title}" (${(r.score * 100).toFixed(0)}%)`)
          .join(", ");
        console.log("RAG retrieved threads:", threadList);
      }
    }

    uiElements.state.textContent = "Thinking...";

    const messagesForRequest = [...assistantState.conversation];

    if (contextMessage) {
      // Use a stronger system message when RAG is active
      messagesForRequest[0] = {
        role: "system",
        content: `You are an expert assistant analyzing EECS 182 special participation posts. You have access to detailed student evaluations of LLMs on homework problems. When given thread content, you MUST use it to answer questions. Be specific, cite examples, and reference actual findings from the threads.`
      };
      messagesForRequest.push({
        role: "user",
        content: `${contextMessage}\n\n\nUSER QUESTION: ${userMessage}\n\nAnswer the question above using the thread content provided. Be specific and cite examples.`
      });
    } else {
      messagesForRequest.push({ role: "user", content: userMessage });
    }

    assistantState.conversation.push({ role: "user", content: userMessage });

    let fullResponse = "";

    const asyncGenerator = await assistantState.llmEngine.chat.completions.create({
      messages: messagesForRequest,
      stream: true,
      max_tokens: 512,
      temperature: 0.7
    });

    for await (const chunk of asyncGenerator) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullResponse += delta;
      const contentEl = assistantEl.querySelector(".message-content p");
      if (contentEl) contentEl.textContent = fullResponse;
      scrollToBottom();
    }

    assistantEl.classList.remove("streaming");

    if (ragResults.length > 0) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "rag-sources";
      sourcesDiv.innerHTML = `
        <span class="rag-sources-label">Sources:</span>
        ${ragResults
          .map(r => {
            const hw = r.metrics?.homework_id || "";
            const score = (r.score * 100).toFixed(0);
            const badge = hw ? `<span class="rag-source-badge">${escapeHTML(hw)}</span>` : "";
            const link = `<a href="#" class="rag-source-link" data-thread-num="${r.threadNum}">${escapeHTML(r.title)}</a>`;
            return `<div class="rag-source-item">${badge}${link}<span class="rag-source-score">${score}%</span></div>`;
          })
          .join("")}
      `;

      sourcesDiv.querySelectorAll(".rag-source-link").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const threadNum = parseInt(link.dataset.threadNum, 10);
          window.dispatchEvent(new CustomEvent("open-thread", { detail: { threadNum } }));
        });
      });

      assistantEl.appendChild(sourcesDiv);
      scrollToBottom();
    }

    assistantState.conversation.push({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Generation error:", error);
    const contentEl = assistantEl.querySelector(".message-content p");
    if (contentEl) contentEl.textContent = "Sorry, something went wrong. Please try again.";
    assistantEl.classList.remove("streaming");
  } finally {
    assistantState.generating = false;
    if (uiElements.input) {
      uiElements.input.disabled = false;
      uiElements.input.removeAttribute("disabled");
    }
    if (uiElements.send) {
      uiElements.send.disabled = false;
      uiElements.send.removeAttribute("disabled");
    }
    if (uiElements.state) {
      uiElements.state.textContent = "Ready";
    }
    if (uiElements.input) {
      setTimeout(() => uiElements.input.focus(), 100);
    }
  }
}

function addAssistantMessage(role, content, isStreaming = false) {
  const div = document.createElement("div");
  div.className = `assistant-message assistant-message-${role}${isStreaming ? " streaming" : ""}`;
  div.innerHTML = `<div class="message-content"><p>${escapeHTML(content)}</p></div>`;
  uiElements.messages.appendChild(div);
  scrollToBottom();
  return div;
}

function scrollToBottom() {
  uiElements.messages.scrollTop = uiElements.messages.scrollHeight;
}

function getModelName(modelId) {
  const names = {
    "Llama-3.2-1B-Instruct-q4f16_1-MLC": "Llama 3.2 1B",
    "Llama-3.2-3B-Instruct-q4f16_1-MLC": "Llama 3.2 3B",
    "SmolLM2-1.7B-Instruct-q4f16_1-MLC": "SmolLM2 1.7B",
    "Qwen2.5-1.5B-Instruct-q4f16_1-MLC": "Qwen 2.5 1.5B"
  };
  return names[modelId] || modelId;
}

function initialize() {
  initializeUIReferences();
  
  // Verify critical elements exist
  if (!uiElements.window) {
    console.error("Assistant window not found");
    return;
  }
  if (!uiElements.input) {
    console.error("Assistant input not found");
  }
  if (!uiElements.form) {
    console.error("Assistant form not found");
  }
  
  // Ensure window is visible by default
  if (uiElements.window) {
    uiElements.window.classList.remove("hidden");
    uiElements.window.style.display = "flex";
  }
  if (uiElements.body) {
    uiElements.body.hidden = false;
    uiElements.body.style.display = "flex";
  }
  if (uiElements.toggleBtn) {
    uiElements.toggleBtn.hidden = true;
    uiElements.toggleBtn.style.display = "none";
  }
  
  setupEventHandlers();

  if (!navigator.gpu) {
    if (uiElements.state) {
      uiElements.state.textContent = "WebGPU not supported";
      uiElements.state.className = "assistant-status-text";
    }
  } else {
    if (uiElements.state) {
      uiElements.state.textContent = "Select a model to start";
    }
  }

  updateRAGStatus();
  
  // Ensure input is enabled if it should be
  if (uiElements.input && assistantState.llmEngine) {
    uiElements.input.disabled = false;
    uiElements.input.removeAttribute("disabled");
    if (uiElements.send) {
      uiElements.send.disabled = false;
      uiElements.send.removeAttribute("disabled");
    }
  }
  
  // Wait for app state to be available, then populate filters
  if (window.appState && window.appState.posts) {
    populateRAGFilters();
  } else {
    // Try again after a short delay
    setTimeout(() => {
      if (window.appState && window.appState.posts) {
        populateRAGFilters();
      }
    }, 1000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

