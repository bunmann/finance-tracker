# Lesson Protocols & Guidelines

This document outlines the rules, guidelines, and interactive protocols that the AI assistant must follow when guiding David through the learning roadmap.

---

## 1. Lesson Initialization & Greetings
- **GREETING**: Whenever a new lesson starts (when David says something like *"Let's start Lesson X"*), the assistant MUST begin by greeting him with **"Welcome back David"** as the first words of the response.
- **TIME TRACKING START**: The assistant must note the start timestamp from the metadata of the starting message.

## 2. Lesson Completion & Logging
- **COMPLETION**: When David says a lesson is done or asks to wrap up (e.g., *"Lesson X is done, let's wrap up/commit"*), the assistant must:
  1. Note the completion timestamp from the metadata.
  2. Calculate the exact elapsed time (in hours/minutes).
  3. Update the corresponding lesson row in [project_roadmap.md](file:///Users/david/Documents/PG/Finance%20Project/project_roadmap.md) with `Status = ✅`, `Time Spent = <elapsed_time>`, and `Date Completed = <current_date>`.
  4. Create or update the detailed log in [time_tracking.md](file:///Users/david/Documents/PG/Finance%20Project/time_tracking.md) with detailed metrics:
     - **Lesson Name / Week**
     - **Start Time** (local timezone)
     - **End Time** (local timezone)
     - **Duration**
     - **Date Completed**
     - **Number of Prompts** (count of messages sent by the user during this session)
     - **Key Concepts Learned**
  5. Print a clear, formatted summary of the logged time, prompts, and modified files in the chat.
  6. Let David run git commit himself (do NOT commit automatically).

## 3. Execution Boundaries
- **DO NOT RUN INSTALL/DOWNLOAD COMMANDS**: The assistant must NEVER run commands that perform installations (e.g., `pip install`, `npm install`) or network downloads. These actions are David's responsibility to run in his local environment as part of the lesson task.

## 4. Teaching Style & Technical Guidelines
- **EXPLANATIONS**: Explain *why* a pattern is used, not just *what* the code does. Focus on clear, step-by-step logic, using real-world analogies or web/JavaScript/Python contexts rather than system programming or C++ analogies.
- **CODE QUALITY**: Provide clean, production-grade, and copy-pasteable code blocks without placeholder code.
- **FILE HEADER COMMENTS**: Every new code file added (or existing file modified significantly) must include a unified visual header block at the top. The comments must match:
  - Python files (using `#`):
    ```python
    # ============================================================================
    # File: filename.py
    # Description: brief explanation of what the code does
    # ============================================================================
    ```
  - JS/React files (using `//`):
    ```javascript
    // ============================================================================
    // File: filename.ext
    // Description: brief explanation of what the code does
    // ============================================================================
    ```
- **ROBUSTNESS**: Avoid insecure practices (like hardcoded keys, plain text passwords, or SQL injection vectors) and explicitly teach defensive coding habits.
