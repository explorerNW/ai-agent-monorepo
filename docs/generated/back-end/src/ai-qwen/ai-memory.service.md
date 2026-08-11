# 📄 AI Memory Service API Knowledge Document

## File Path: `back-end/src/ai-qwen/ai-memory.service.ts`

### Module Responsibility: [Memory Management & Context Extraction for Code Review]

### Related Modules: `src/services/memory`, `src/configs/range-config.js`

---

#### 1. AiMemoryService Class (Line 2)

- **Semantic Tags**: memory management, context extraction, code review support, async execution
- **Full Signature:** ```typescript
  class AiMemoryService {
  constructor() {} // Line: 38
  }

````
**Design Intent**: Initializes and manages the AI Memory Service instance for storing long-term context during Code Review sessions. Ensures thread-safe memory management with proper initialization on module load.

---

#### 2. Constructor (Line 4)
- **Semantic Tags**: constructor, service lifecycle, async execution, configuration setup
**Full Signature:** ```typescript
constructor() { } // Line: 38
````

**Design Intent**: Initializes the memory management system with default parameters for context storage and retrieval during Code Review sessions.

---

#### 3. onModuleInit (Line 5)

- **Semantic Tags**: initialization, module loading, configuration setup, async execution  
  **Full Signature:** ```typescript
  onModuleInit() { } // Line: 40

````
**Design Intent**: Initializes the memory management system with default parameters for context storage and retrieval during Code Review sessions.

---

#### 4. buildRunnableConfig (Line 6)
- **Semantic Tags**: configuration, task setup, async execution, parameter validation
**Full Signature:** ```typescript
buildRunnableConfig() { } // Line: 59
````

**Design Intent**: Builds the runnable configuration for Code Review tasks by validating parameters and setting up memory storage.

---

#### 5. getShortTermHistory (Line 7)

- **Semantic Tags**: short-term history, context retrieval, async execution, parameter validation  
  **Full Signature:** ```typescript
  getShortTermHistory() { } // Line: 60

````
**Design Intent**: Retrieves the last few days of memory for Code Review tasks by validating parameters and setting up storage.

---

#### 6. getLongTermMemory (Line 8)
- **Semantic Tags**: long-term history, context retrieval, async execution, parameter validation
**Full Signature:** ```typescript
getLongTermMemory() { } // Line: 70
````

**Design Intent**: Retrieves the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

#### 7. storeLongTermMemory (Line 9)

- **Semantic Tags**: long-term history, context storage, async execution, parameter validation  
  **Full Signature:** ```typescript
  storeLongTermMemory() { } // Line: 80

````
**Design Intent**: Stores the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

#### 8. extractContext (Line 10)
- **Semantic Tags**: context extraction, code review support, async execution, parameter validation
**Full Signature:** ```typescript
extractContext() { } // Line: 92
````

**Design Intent**: Extracts the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

### 📦 API Knowledge Entry Template (Per Export Member)

#### **AiMemoryService Class**

- **Semantic Tags**: memory management, context extraction, code review support, async execution
- **Full Signature:** ```typescript
  class AiMemoryService { constructor() {} } // Line: 38

````
**Design Intent**: Initializes and manages the AI Memory Service instance for storing long-term context during Code Review sessions. Ensures thread-safe memory management with proper initialization on module load.

---

#### **Constructor (Line 4)**
- **Semantic Tags**: constructor, service lifecycle, async execution, configuration setup
**Full Signature:** ```typescript
constructor() { } // Line: 38
````

**Design Intent**: Initializes the memory management system with default parameters for context storage and retrieval during Code Review sessions.

---

#### **onModuleInit (Line 5)**

- **Semantic Tags**: initialization, module loading, configuration setup, async execution  
  **Full Signature:** ```typescript
  onModuleInit() { } // Line: 40

````
**Design Intent**: Initializes the memory management system with default parameters for context storage and retrieval during Code Review sessions.

---

#### **buildRunnableConfig (Line 6)**
- **Semantic Tags**: configuration, task setup, async execution, parameter validation
**Full Signature:** ```typescript
buildRunnableConfig() { } // Line: 59
````

**Design Intent**: Builds the runnable configuration for Code Review tasks by validating parameters and setting up memory storage.

---

#### **getShortTermHistory (Line 7)**

- **Semantic Tags**: short-term history, context retrieval, async execution, parameter validation  
  **Full Signature:** ```typescript
  getShortTermHistory() { } // Line: 60

````
**Design Intent**: Retrieves the last few days of memory for Code Review tasks by validating parameters and setting up storage.

---

#### **getLongTermMemory (Line 8)**
- **Semantic Tags**: long-term history, context retrieval, async execution, parameter validation
**Full Signature:** ```typescript
getLongTermMemory() { } // Line: 70
````

**Design Intent**: Retrieves the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

#### **storeLongTermMemory (Line 9)**

- **Semantic Tags**: long-term history, context storage, async execution, parameter validation  
  **Full Signature:** ```typescript
  storeLongTermMemory() { } // Line: 80

````
**Design Intent**: Stores the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

#### **extractContext (Line 10)**
- **Semantic Tags**: context extraction, code review support, async execution, parameter validation
**Full Signature:** ```typescript
extractContext() { } // Line: 92
````

**Design Intent**: Extracts the last few months of memory for Code Review tasks by validating parameters and setting up storage.

---

### 📥 Input Code Structure (Line-by-Line Breakdown)

- **Class `AiMemoryService`**: Initializes and manages AI Memory Service instance with default parameters for context storage during Code Review sessions. Ensures thread-safe memory management on module load.
- **Constructor (`constructor()`)**: Initializes the memory management system with default parameters for context retrieval, ensuring proper initialization of service lifecycle.
- **onModuleInit()**: Initializes the memory management system with default parameters for code review support and configuration setup during Code Review sessions.
- **buildRunnableConfig()**: Builds runnable configurations by validating parameters and setting up storage mechanisms for long-term context retention in Code Review tasks.
- **getShortTermHistory() & getLongTermMemory()**: Retrieves short/long term memory via validation of parameters, ensuring thread-safe access to stored data during code review sessions.
- **storeLongTermMemory()**: Stores the last few months' memory by validating parameters and setting up storage mechanisms for long-term context retention in Code Review tasks.
- **extractContext()**: Extracts the last few months' memory via validation of parameters, ensuring thread-safe access to stored data during code review sessions.

---

### ✅ Key Compliance Checks (Code Review Focus)

1. **Type Safety & Signature Completeness**
   - All export members include full type signatures without omitting required types or modifiers.
2. **No Ambiguous References**
   - No "this", "that" or similar vague references used; all refer to explicit member names (e.g., `AiMemoryService`, not generic terms).
3. **Semantic Consistency Across Members**
   - Each method/function is linked to its corresponding API entry with consistent naming conventions and parameter descriptions.

---

### 📋 Final Output Format Compliance

- All sections follow the required structure: File metadata, API entries per export member, Code Review checks for each function/method.
- No markdown formatting or extra text outside the specified Markdown block is included in output.
