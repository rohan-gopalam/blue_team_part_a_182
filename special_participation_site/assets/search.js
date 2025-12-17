// Semantic Search Module - RAG implementation using WebLLM embeddings
// Supports text and PDF attachment parsing

// Module state
const searchState = {
  embeddingEngine: null,
  webllmLib: null,
  pdfLibrary: null,
  embeddings: [],
  initialized: false,
  indexing: false
};

// Embedding model configuration
const EMBEDDING_MODEL = "snowflake-arctic-embed-m-q0f32-MLC-b4";
const PDFJS_URL = "https://esm.run/pdfjs-dist@3.11.174";
const PDFJS_WORKER_URL = "https://esm.run/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

/**
 * Initialize the embedding engine
 */
export async function initEmbeddingEngine(progressCallback) {
  if (searchState.embeddingEngine) return;

  if (!searchState.webllmLib) {
    progressCallback?.({ text: "Loading WebLLM library...", progress: 0 });
    searchState.webllmLib = await import("https://esm.run/@mlc-ai/web-llm");
  }

  progressCallback?.({ text: `Loading embedding model...`, progress: 0.1 });

  searchState.embeddingEngine = await searchState.webllmLib.CreateMLCEngine(
    EMBEDDING_MODEL,
    {
      initProgressCallback: (report) => {
        progressCallback?.({
          text: report.text || "Loading embedding model...",
          progress: report.progress
        });
      }
    }
  );

  progressCallback?.({ text: "Embedding engine ready", progress: 1 });
}

/**
 * Lazy load PDF.js library
 */
async function loadPDFLibrary() {
  if (searchState.pdfLibrary) return searchState.pdfLibrary;
  const pdfjs = await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  searchState.pdfLibrary = pdfjs;
  return pdfjs;
}

/**
 * Extract text from a PDF ArrayBuffer
 */
async function extractPDFText(data) {
  try {
    const pdfjs = await loadPDFLibrary();
    const doc = await pdfjs.getDocument({ data }).promise;
    let fullText = "";
    const maxPages = Math.min(doc.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText;
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return "";
  }
}

/**
 * Generate embedding for a single text
 */
async function embedText(text) {
  if (!searchState.embeddingEngine) {
    throw new Error("Embedding engine not initialized");
  }
  const formattedText = `[CLS] ${text} [SEP]`;
  const reply = await searchState.embeddingEngine.embeddings.create({
    input: [formattedText]
  });
  return reply.data[0].embedding;
}

/**
 * Generate embedding for a query (with query prefix)
 */
async function embedQuery(query) {
  if (!searchState.embeddingEngine) {
    throw new Error("Embedding engine not initialized");
  }
  const queryPrefix = "Represent this sentence for searching relevant passages: ";
  const formattedQuery = `[CLS] ${queryPrefix}${query} [SEP]`;
  const reply = await searchState.embeddingEngine.embeddings.create({
    input: [formattedQuery]
  });
  return reply.data[0].embedding;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build the thread content string for embedding
 */
async function buildThreadText(post, filesManifest, fetchFileContent) {
  const parts = [];
  if (post.title) {
    parts.push(`Title: ${post.title}`);
  }
  const metrics = post.metrics || {};
  if (metrics.homework_id) {
    parts.push(`Homework: ${metrics.homework_id}`);
  }
  if (metrics.model_name) {
    parts.push(`Model: ${metrics.model_name}`);
  }
  if (metrics.primary_focus) {
    parts.push(`Focus: ${metrics.primary_focus}`);
  }
  if (post.document) {
    parts.push(`\nContent:\n${post.document}`);
  }
  const threadNum = String(post.number);
  const entry = filesManifest[threadNum];
  if (entry?.files?.length) {
    for (const file of entry.files) {
      const filePath = file.transcript || file.url;
      if (filePath) {
        if (filePath.match(/\.(jpg|jpeg|png|gif|mp4|mov)$/i)) continue;
        try {
          const content = await fetchFileContent(filePath);
          if (content && content.length > 50) {
            parts.push(`\nAttached File (${file.original_filename}):\n${content}`);
          }
        } catch (error) {
          console.warn(`Failed to load file for thread ${threadNum}:`, error);
        }
      }
    }
  }
  return parts.join("\n");
}

/**
 * Index all threads for semantic search
 */
export async function indexThreads(posts, filesManifest, progressCallback) {
  if (!searchState.embeddingEngine) {
    throw new Error("Embedding engine not initialized. Call initEmbeddingEngine first.");
  }

  if (searchState.indexing) {
    console.warn("Already indexing threads");
    return;
  }

  searchState.indexing = true;
  searchState.embeddings = [];

  const fetchFileContent = async (path) => {
    try {
      const res = await fetch(path, { cache: "force-cache" });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      const isPdf = path.toLowerCase().endsWith(".pdf") || contentType.includes("pdf");
      let text = "";
      if (isPdf) {
        const buffer = await res.arrayBuffer();
        text = await extractPDFText(buffer);
      } else {
        text = await res.text();
      }
      return text.length > 8000 ? text.slice(0, 8000) + "..." : text;
    } catch (e) {
      return null;
    }
  };

  const total = posts.length;
  const batchSize = 4;

  for (let i = 0; i < total; i += batchSize) {
    const batch = posts.slice(i, Math.min(i + batchSize, total));
    const textsPromises = batch.map(post =>
      buildThreadText(post, filesManifest, fetchFileContent)
    );
    const texts = await Promise.all(textsPromises);
    const formattedTexts = texts.map(t => {
      const truncated = t.length > 4000 ? t.slice(0, 4000) + "..." : t;
      return `[CLS] ${truncated} [SEP]`;
    });
    const reply = await searchState.embeddingEngine.embeddings.create({
      input: formattedTexts
    });
    for (let j = 0; j < batch.length; j++) {
      searchState.embeddings.push({
        threadNum: batch[j].number,
        postId: batch[j].id,
        title: batch[j].title,
        edUrl: batch[j].ed_url,
        embedding: reply.data[j].embedding,
        text: texts[j],
        metrics: batch[j].metrics
      });
    }
    const progress = Math.min((i + batch.length) / total, 1);
    progressCallback?.({
      text: `Indexing threads... ${i + batch.length}/${total}`,
      progress
    });
  }

  searchState.indexing = false;
  searchState.initialized = true;
  progressCallback?.({
    text: `Indexed ${total} threads`,
    progress: 1
  });
}

/**
 * Search for relevant threads given a query
 */
export async function searchThreads(query, topK = 3) {
  if (!searchState.initialized || searchState.embeddings.length === 0) {
    console.warn("Search index not initialized or empty");
    return [];
  }

  const queryEmbedding = await embedQuery(query);
  const scores = searchState.embeddings.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding)
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}

/**
 * Format retrieved threads as context for the LLM
 */
export function formatContext(results) {
  if (!results.length) {
    return "";
  }
  const contextParts = results.map((r, i) => {
    const hw = r.metrics?.homework_id || "Unknown";
    const model = r.metrics?.model_name || "Unknown";
    return `=== THREAD ${i + 1} ===
Title: "${r.title}"
Homework: ${hw}
Model Evaluated: ${model}
Relevance Score: ${(r.score * 100).toFixed(1)}%

Content:
${r.text.slice(0, 3000)}${r.text.length > 3000 ? "\n[... content truncated ...]" : ""}`;
  });
  return `CRITICAL: You MUST answer the user's question using ONLY the information from these threads. These are real student evaluations from EECS 182 special participation posts.

${contextParts.join("\n\n")}

IMPORTANT INSTRUCTIONS:
- Answer the question based EXCLUSIVELY on the thread content above
- Cite specific examples from the threads (mention homework numbers, model names, specific findings)
- If the threads don't contain enough information, say "Based on the available threads, [answer what you can], but more information would be needed for a complete answer"
- DO NOT give generic advice or say you don't have access - you have the threads above
- Be specific and reference the actual content from the threads`;
}

/**
 * Check if search is initialized and ready
 */
export function isReady() {
  return searchState.initialized && searchState.embeddings.length > 0;
}

/**
 * Get the number of indexed threads
 */
export function getIndexedCount() {
  return searchState.embeddings.length;
}

/**
 * Clear the search index
 */
export function clearIndex() {
  searchState.embeddings = [];
  searchState.initialized = false;
}

/**
 * Unload the embedding engine to free memory
 */
export async function unloadEmbeddingEngine() {
  if (searchState.embeddingEngine) {
    await searchState.embeddingEngine.unload();
    searchState.embeddingEngine = null;
  }
  clearIndex();
}

