# Major Feature 4: AI/NLP Corporate Transcript Parsing & Sentiment

Integrating Google Gemini LLM API to perform NLP classification and forensic financial document analysis.

---

## 📋 Feature 4 Tasks Checklist

### 🤖 Task 1: Tier 3 AI Auto-Categorization
- [ ] Integrate Google Gemini SDK (`google-genai`) into the backend classification pipeline.
- [ ] Write prompt engineering schemas to classify complex bank statement descriptions.
- [ ] Auto-cache successful Gemini classification results into Tier 2 user rules for self-improving performance.

### 📝 Task 2: Corporate Transcript Parsing
- [ ] Build upload / text-ingestion UI for corporate 10-Q earnings transcripts and press releases.
- [ ] Prompt Gemini large-context window to extract executive sentiment shifts, revenue guidance changes, and risk metrics.
- [ ] Perform Quarter-over-Quarter diffing to highlight material changes in corporate language.

### 📡 Task 3: Alternative Data Sentiment Pipeline
- [ ] Scrape non-traditional community discussion text (e.g., Reddit, public investor forums).
- [ ] Compute a custom sentiment index score for watchlist equities.
