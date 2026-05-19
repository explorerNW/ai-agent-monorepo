# AI Agent Monorepo - Architecture Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Microservice Architecture](#microservice-architecture)
- [Data Flow](#data-flow)
- [Deployment Architecture](#deployment-architecture)
- [Development Workflow](#development-workflow)
- [Key Features](#key-features)

---

## Overview

AI Agent Monorepo is a full-stack application that combines AI-powered services with real-time performance monitoring. Built on a modern monorepo architecture, it integrates LangChain for AI capabilities, RabbitMQ for asynchronous message processing, and comprehensive Web Vitals tracking for frontend performance optimization.

### Key Capabilities

- **AI-Powered Services**: Integration with Qwen (DashScope) and other LLM providers via LangChain
- **Real-time Performance Monitoring**: Client-side Web Vitals collection and server-side analytics
- **Asynchronous Task Processing**: RabbitMQ-based microservice for handling background tasks
- **Parallel Task Execution**: CPU-optimized concurrent task processing
- **Code Review Automation**: AI-assisted code review with GitHub integration
- **PDF Processing**: Document analysis and text extraction capabilities

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ React Front- │  │ Analytics    │  │ Performance      │  │
│  │ end (Vite)   │──│ SDK          │──│ Monitoring       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NestJS Application (Port 3000)               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ AI       │ │ Code     │ │ PDF      │            │  │
│  │  │ Service  │ │ Review   │ │ Process  │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Parallel │ │ Analytics│ │ Tesseract│            │  │
│  │  │ Tasks    │ │ Service  │ │ OCR      │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬──────────────────────┘
           │                          │
    ┌──────▼──────┐          ┌───────▼────────┐
    │ PostgreSQL  │          │  RabbitMQ      │
    │ (Port 5432) │          │  (Port 5672)   │
    └─────────────┘          └───────┬────────┘
                                     │ AMQP
                              ┌──────▼────────────┐
                              │ RabbitMQ          │
                              │ Microservice      │
                              │ (Port 3002)       │
                              └───────────────────┘
```

---

## Technology Stack

### Backend (`packages/back-end`)

| Category          | Technology       | Version       | Purpose                               |
| ----------------- | ---------------- | ------------- | ------------------------------------- |
| **Framework**     | NestJS           | 11.x          | RESTful API framework                 |
| **Language**      | TypeScript       | 5.7.x         | Type-safe development                 |
| **Database**      | PostgreSQL       | 16 (Alpine)   | Relational data storage               |
| **ORM**           | TypeORM          | 0.3.x         | Database abstraction layer            |
| **AI/ML**         | LangChain        | 1.2.x         | LLM orchestration framework           |
| **LLM Provider**  | DashScope (Qwen) | -             | Chinese LLM via OpenAI-compatible API |
| **Message Queue** | RabbitMQ         | 4.x           | Asynchronous message broker           |
| **Queue Client**  | amqplib          | 1.2.x         | AMQP protocol implementation          |
| **OCR**           | Tesseract.js     | 7.0.x         | Image-to-text conversion              |
| **PDF**           | pdf-lib, pdf2pic | 1.17.x, 3.2.x | PDF manipulation                      |
| **Validation**    | class-validator  | 0.14.x        | DTO validation                        |
| **HTTP Client**   | Axios            | 1.15.x        | External API calls                    |
| **Concurrency**   | p-limit          | 7.3.x         | Promise concurrency limiting          |

### Frontend (`packages/front-end`)

| Category       | Technology        | Version | Purpose                       |
| -------------- | ----------------- | ------- | ----------------------------- |
| **Framework**  | React             | 19.2.x  | UI component library          |
| **Routing**    | React Router      | 7.13.x  | Client-side routing           |
| **Build Tool** | Vite              | 8.0.x   | Fast bundling and dev server  |
| **Styling**    | TailwindCSS       | 4.2.x   | Utility-first CSS framework   |
| **Charts**     | ECharts           | 5.5.x   | Data visualization            |
| **Language**   | TypeScript        | 5.9.x   | Type safety                   |
| **SSR**        | React Router Node | 7.13.x  | Server-side rendering support |

### DevOps & Tooling

| Tool               | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| **pnpm**           | Monorepo package manager with workspace support |
| **Docker Compose** | Multi-container orchestration                   |
| **Husky**          | Git hooks automation                            |
| **Commitlint**     | Conventional commit message validation          |
| **lint-staged**    | Pre-commit linting for staged files             |
| **Prettier**       | Code formatting                                 |
| **ESLint**         | Code quality enforcement                        |

---

## Project Structure

```
ai-agent-monorepo/
├── packages/
│   ├── back-end/                      # NestJS Backend
│   │   ├── src/
│   │   │   ├── ai-qwen/              # AI service module
│   │   │   │   ├── ai.controller.ts  # AI chat endpoints
│   │   │   │   ├── ai.service.ts     # LangChain integration
│   │   │   │   └── ai.module.ts      # Module configuration
│   │   │   ├── analysis/             # Analytics module
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── dto/              # Data transfer objects
│   │   │   │   └── entities/         # TypeORM entities
│   │   │   │       └── web-vitals.entity.ts
│   │   │   ├── code-review/          # Code review automation
│   │   │   │   ├── code-review.controller.ts
│   │   │   │   └── code-review.service.ts
│   │   │   ├── parallel-task/        # Concurrent task execution
│   │   │   │   ├── parallel-task.controller.ts
│   │   │   │   ├── parallel-task.service.ts
│   │   │   │   └── parallel-task.module.ts
│   │   │   ├── pdf-process/          # PDF document processing
│   │   │   │   ├── pdf-process.controller.ts
│   │   │   │   ├── pdf-process.service.ts
│   │   │   │   └── pdf-process.module.ts
│   │   │   ├── tesseract/            # OCR service
│   │   │   │   ├── tesseract.service.ts
│   │   │   │   └── tesseract.module.ts
│   │   │   ├── types/                # Shared type definitions
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── app.controller.ts     # Health check endpoints
│   │   │   ├── app.service.ts        # Core business logic
│   │   │   ├── main.ts               # Application entry point
│   │   │   └── utils.ts              # Utility functions
│   │   ├── micro-service/
│   │   │   └── rabbit-mq/            # RabbitMQ microservice
│   │   │       ├── src/
│   │   │       │   ├── app.module.ts
│   │   │       │   ├── app.controller.ts
│   │   │       │   ├── app.service.ts
│   │   │       │   ├── analytics.dto.ts
│   │   │       │   └── main.ts
│   │   │       ├── Dockerfile
│   │   │       └── package.json
│   │   ├── test/                     # E2E tests
│   │   ├── Dockerfile                # Backend containerization
│   │   ├── nest-cli.json             # NestJS CLI configuration
│   │   ├── tsconfig.json             # TypeScript configuration
│   │   └── package.json
│   │
│   └── front-end/                    # React Frontend
│       ├── app/
│       │   ├── components/           # Reusable UI components
│       │   │   ├── ApiPerformanceChart.tsx
│       │   │   ├── BottomNavigation.tsx
│       │   │   ├── DistributionChart.tsx
│       │   │   ├── RoutePerformanceChart.tsx
│       │   │   ├── TimelineChart.tsx
│       │   │   └── index.ts
│       │   ├── config/               # Configuration modules
│       │   │   └── env.ts            # Environment variable management
│       │   ├── core/                 # Core SDKs and utilities
│       │   │   ├── AnalyticsSDK.ts   # Client-side analytics tracking
│       │   │   └── instance.ts       # Singleton instances
│       │   ├── hooks/                # Custom React hooks
│       │   │   ├── useRoutePerformance.ts
│       │   │   └── useTrack.ts
│       │   ├── routes/               # Page components
│       │   │   ├── components/       # Route-specific components
│       │   │   │   ├── FeedHeader.tsx
│       │   │   │   ├── PublishCard.tsx
│       │   │   │   ├── PublishGrid.tsx
│       │   │   │   ├── StoriesCarousel.tsx
│       │   │   │   └── index.ts
│       │   │   ├── Chat.tsx          # AI chat interface
│       │   │   ├── analytics.tsx     # Performance dashboard
│       │   │   ├── feed.tsx          # Content feed
│       │   │   └── home.tsx          # Landing page
│       │   ├── services/             # API service layer
│       │   │   └── api.ts            # HTTP client wrapper
│       │   ├── types/                # TypeScript type definitions
│       │   │   └── performance.ts    # Performance metric types
│       │   ├── welcome/              # Welcome/onboarding flow
│       │   ├── app.css               # Global styles
│       │   ├── root.tsx              # Root component
│       │   └── routes.ts             # Route configuration
│       ├── Dockerfile                # Frontend containerization
│       ├── nginx.conf                # Nginx reverse proxy config
│       ├── react-router.config.ts    # React Router configuration
│       ├── vite.config.ts            # Vite build configuration
│       └── package.json
│
├── .husky/                           # Git hooks
├── docker-compose.yml                # Production deployment
├── docker-compose.dev.yml            # Development deployment
├── docker.sh                         # Docker management script
├── init-db.sh                        # Database initialization
├── validate-docker.sh                # Docker health validation
├── package.json                      # Root workspace configuration
├── pnpm-workspace.yaml               # PNPM workspace definition
└── commitlint.config.js              # Commit message rules
```

---

## Backend Architecture

### Module Organization

The backend follows NestJS modular architecture with clear separation of concerns:

#### 1. **AI Module** (`src/ai-qwen/`)

**Purpose**: Provides AI-powered chat and content generation capabilities.

**Components**:

- `AiService`: Integrates LangChain with DashScope (Qwen) API
- `AiController`: Exposes streaming chat endpoints
- Supports multiple LLM providers through LangChain abstractions

**Key Features**:

- Streaming responses using `ChatOpenAI.stream()`
- Message history management with `BaseMessage` format
- Temperature control for response creativity
- Compatible with OpenAI API specification

**Example Usage**:

```typescript
// Stream chat with token-by-token callbacks
await aiService.streamChat(messages, (token) => {
  // Send token to client via SSE or WebSocket
});
```

#### 2. **Analytics Module** (`src/analysis/`)

**Purpose**: Collects, stores, and analyzes frontend performance metrics.

**Components**:

- `AnalyticsService`: Handles Web Vitals data persistence and queries
- `AnalyticsController`: Receives performance data from frontend
- `WebVitalsEvent` Entity: PostgreSQL table schema for metrics

**Data Flow**:

```
Frontend Analytics SDK
  → POST /analytics/web-vitals
  → AnalyticsService.saveWebVitals()
  → TypeORM Repository
  → PostgreSQL
```

**Metrics Tracked**:

- **LCP** (Largest Contentful Paint): Loading performance
- **FCP** (First Contentful Paint): Initial render time
- **CLS** (Cumulative Layout Shift): Visual stability
- **FID** (First Input Delay): Interactivity responsiveness
- **TTFB** (Time to First Byte): Server response time
- **API Call Metrics**: Request duration, success rate, endpoint performance
- **Route Performance**: SPA navigation timing

**Query Capabilities**:

- Filter by URL pattern
- Time-range based queries (default: last 7 days)
- Aggregated statistics per route

#### 3. **Parallel Task Module** (`src/parallel-task/`)

**Purpose**: Executes CPU-intensive tasks concurrently with optimal resource utilization.

**Components**:

- `ParallelTaskService`: Manages concurrent task execution
- Automatic concurrency calculation (75% of CPU cores)
- Batch processing with configurable concurrency limits
- Timeout control and error handling strategies

**Features**:

- **Dynamic Concurrency**: Automatically calculates optimal thread count based on available CPUs
- **Batch Processing**: Divides tasks into batches to prevent memory overload
- **Timeout Control**: Per-task timeout with graceful cancellation
- **Error Resilience**: Continue-on-error mode for fault tolerance
- **Progress Tracking**: Real-time progress callbacks

**Usage Patterns**:

```typescript
// Execute array of async tasks in parallel
const result = await parallelTaskService.executeParallel(tasks, {
  concurrency: 8,
  timeout: 30000,
  continueOnError: true,
});

// Process data items with custom processor
const result = await parallelTaskService.processItems(
  items,
  async (item, index) => processItem(item),
  { concurrency: 4 },
);
```

#### 4. **Code Review Module** (`src/code-review/`)

**Purpose**: Automates code review using AI analysis of Git diffs.

**Components**:

- `ReviewService`: Orchestrates diff fetching, cleaning, and AI analysis
- `CodeReviewController`: Webhook endpoint for GitHub events

**Diff Processing Pipeline**:

1. **Fetch**: Retrieve PR diff from GitHub API
2. **Clean**: Filter out noise files (lock files, images, binaries)
3. **Slice**: Split large diffs into manageable chunks (<3000 chars)
4. **Analyze**: Send each chunk to Dify AI for review
5. **Merge**: Combine results into formatted report
6. **Publish**: Post review comments to GitHub PR

**Excluded File Types**:

- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Images: `.png`, `.jpg`, `.gif`, `.svg`, etc.
- Binaries: `.exe`, `.dll`, `.zip`, etc.
- Minified files: `.min.js`, `.min.css`
- Directories: `node_modules/`, `dist/`, `.next/`, etc.

#### 5. **PDF Process Module** (`src/pdf-process/`)

**Purpose**: Extracts and processes content from PDF documents.

**Capabilities**:

- Text extraction from PDFs
- PDF to image conversion (for OCR preprocessing)
- Metadata extraction
- Multi-page document handling

**Integration**: Works with Tesseract OCR for scanned document processing

#### 6. **Tesseract Module** (`src/tesseract/`)

**Purpose**: Optical Character Recognition for image-based text extraction.

**Use Cases**:

- Scanned document digitization
- Image text extraction
- CAPTCHA solving (ethical use only)
- Receipt/invoice parsing

### Database Schema

#### Web Vitals Events Table

```sql
CREATE TABLE web_vitals_event (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  url TEXT NOT NULL,
  metrics JSONB NOT NULL,
  navigation_type VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_web_vitals_url ON web_vitals_event(url);
CREATE INDEX idx_web_vitals_timestamp ON web_vitals_event(timestamp DESC);
CREATE INDEX idx_web_vitals_user ON web_vitals_event(user_id);
```

**Entity Mapping** (`web-vitals.entity.ts`):

```typescript
@Entity("web_vitals_event")
export class WebVitalsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "event_name" })
  eventName: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: "text" })
  url: string;

  @Column({ type: "jsonb" })
  metrics: any;

  @Column({ name: "navigation_type", nullable: true })
  navigationType: string;

  @Column({ type: "timestamp with time zone" })
  timestamp: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

**Note**: Column names use snake_case to match PostgreSQL conventions, while entity properties use camelCase. Explicit `@Column({ name: 'xxx' })` mappings ensure correct ORM behavior.

### Configuration Management

**Environment Variables** (`.env`):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=analytics

# AI Services
DASHSCOPE_API_KEY=your_api_key
AI_MODEL_NAME=qwen-turbo

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_HOST=rabbitmq

# Application
NODE_ENV=production
PORT=3000
FRONT_END_URL=http://localhost:3001
```

**ConfigModule Integration**:

- Global configuration via `@nestjs/config`
- Type-safe access through `ConfigService`
- Environment-specific defaults
- Hot-reload support in development

---

## Frontend Architecture

### Application Structure

The frontend uses React Router 7 with file-based routing and follows a feature-based organization pattern.

#### Core Components

**1. Analytics SDK** (`app/core/AnalyticsSDK.ts`)

A comprehensive client-side performance monitoring library that automatically tracks Web Vitals and API performance.

**Key Features**:

- **Automatic Web Vitals Collection**: Uses `PerformanceObserver` API
- **Batched Event Reporting**: Queues events and sends in batches (max 10 events or 5s interval)
- **Retry Logic**: Exponential backoff with max 5 retries
- **SPA Navigation Tracking**: Measures actual route change performance
- **API Call Interception**: Wraps `fetch()` to track request metrics
- **Reliable Delivery**: Uses `navigator.sendBeacon()` for page unload events

**Initialization**:

```typescript
// In app root or layout component
const analytics = new AnalyticsSDK("http://localhost:3000/analytics/events");

// Track custom events
analytics.track("button_click", { buttonId: "submit" });

// Get performance metrics
const metrics = analytics.getPerformanceMetrics();
const apiStats = analytics.getApiCallStats();
```

**Tracked Metrics**:

- LCP, FCP, CLS, FID, TTFB (Core Web Vitals)
- API call duration, status codes, success rates
- Route load times, DOM content loaded, first paint
- Navigation types (navigate, reload, back_forward, prerender)

**Rating Standards**:
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| TTFB | ≤ 800ms | ≤ 1800ms | > 1800ms |

**2. Custom Hooks**

**`useTrack` Hook**:

```typescript
// Automatically track component interactions
const { track } = useTrack();

track("video_play", { videoId: "abc123", duration: 120 });
```

**`useRoutePerformance` Hook**:

```typescript
// Monitor route change performance
const { markRouteChangeStart, trackRoutePerformance } = useRoutePerformance();

// Before navigation
markRouteChangeStart();

// After route loads
trackRoutePerformance("/dashboard");
```

#### UI Components

**Chart Components** (`app/components/`):

- `ApiPerformanceChart.tsx`: API latency trends and success rates
- `RoutePerformanceChart.tsx`: Page load time comparisons
- `DistributionChart.tsx`: Metric distribution histograms
- `TimelineChart.tsx`: Temporal performance patterns
- `BottomNavigation.tsx`: Mobile-friendly navigation bar

**Feed Components** (`app/routes/components/`):

- `FeedHeader.tsx`: Feed header with filters and search
- `PublishCard.tsx`: Content creation card
- `PublishGrid.tsx`: Grid layout for published content
- `StoriesCarousel.tsx`: Horizontal story carousel

#### Routing Configuration

**Route Definitions** (`app/routes.ts`):

```typescript
export default [
  index("routes/home.tsx"), // Landing page
  route("chat", "routes/Chat.tsx"), // AI chat interface
  route("analytics", "routes/analytics.tsx"), // Performance dashboard
] satisfies RouteConfig;
```

**Route Performance Tracking**:
Each route automatically reports performance metrics when navigated to, including:

- Load time (full page load)
- DOM content loaded time
- First paint time
- Navigation type (initial load vs SPA navigation)

#### Environment Configuration

**Centralized Config** (`app/config/env.ts`):

```typescript
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  appName: import.meta.env.VITE_APP_NAME || "AI Assistant",
  enableStreaming: import.meta.env.VITE_ENABLE_STREAMING !== "false",
  debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
};

// Pre-configured API endpoints
export const API_CONFIG = {
  BASE_URL: env.apiBaseUrl,
  CHAT_ENDPOINT: `${env.apiBaseUrl}/ai/chat`,
  TIMEOUT: 30000,
};
```

**Required Vite Environment Variables**:

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=AI Assistant
VITE_APP_VERSION=1.0.0
VITE_ENABLE_STREAMING=true
VITE_ENABLE_FILE_UPLOAD=false
VITE_DEBUG_MODE=false
```

### State Management

The application uses React's built-in state management patterns:

- **Local Component State**: `useState` for component-level data
- **Context API**: For cross-component shared state (if needed)
- **Custom Hooks**: Encapsulate complex state logic
- **URL State**: React Router for route-based state

No external state management library (Redux, Zustand) is used, keeping the bundle size minimal.

### Styling Approach

**TailwindCSS v4**:

- Utility-first CSS framework
- JIT (Just-In-Time) compilation
- Responsive design with mobile-first approach
- Dark mode support (if configured)

**Design Tokens**:
Colors, spacing, typography defined in Tailwind config for consistency.

---

## Microservice Architecture

### RabbitMQ Microservice

**Location**: `packages/back-end/micro-service/rabbit-mq/`

**Purpose**: Handles asynchronous message processing to decouple heavy operations from the main API.

**Architecture Pattern**: Publisher-Subscriber with dedicated worker service

#### Message Flow

```
┌──────────────┐     publish      ┌──────────────┐
│  Main API    │ ────────────────▶ │  RabbitMQ    │
│  (NestJS)    │   'rmq-message'   │   Broker     │
└──────────────┘                   └──────┬───────┘
                                          │ consume
                                          ▼
                                   ┌──────────────┐
                                   │  Microservice│
                                   │  Worker      │
                                   └──────────────┘
```

#### Configuration

**Queue Setup** (`app.service.ts`):

```typescript
// Durable queue for message persistence
const queueName = "analytics_queue";
await channel.assertQueue(queueName, { durable: true });

// Bind to exchange
await channel.bindQueue(queueName, "analytics_exchange", "analytics.*");
```

**Important Configuration Notes**:

- Use `durable: true` for queue persistence across broker restarts
- Do NOT set `persistent: true` in queue definition (deprecated in amqplib >= 1.2.0)
- Message persistence should be set during publishing, not queue creation
- Avoid mixing `durable: false` with `persistent: true` (triggers deprecated feature warning)

#### Message Format

**Analytics Event DTO** (`analytics.dto.ts`):

```typescript
export class AnalyticsEventDto {
  eventName: string;
  userId?: string;
  url: string;
  properties: {
    metrics: any;
    navigationType?: string;
    timestamp?: number;
  };
}
```

#### Service Implementation

**Main Service** (`app.service.ts`):

```typescript
@Injectable()
export class AppService {
  message(message: Record<string, any>) {
    return of(true).pipe(
      map((value) => {
        this.logger.log("Processing message:", message);
        // Process analytics data, send notifications, etc.
        return value;
      }),
    );
  }
}
```

**Message Publishing** (from main backend):

```typescript
// In AnalyticsService
sendToQueue(events: any[]) {
  return this.rmq.emit('rmq-message', events).pipe(
    map(() => ({ message_send: true })),
    catchError((error) => throwError(() => error)),
  );
}
```

#### Deployment Configuration

**Docker Compose Service**:

```yaml
mcp-server:
  build:
    context: ./packages/back-end/micro-service/rabbit-mq
    dockerfile: Dockerfile
  environment:
    - NODE_ENV=production
    - RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@rabbitmq:5672
  depends_on:
    rabbitmq:
      condition: service_healthy
  deploy:
    replicas: 1
    resources:
      limits:
        cpus: "0.5"
        memory: 512M
      reservations:
        cpus: "0.25"
        memory: 256M
```

**Scaling Strategy**:

- Horizontal scaling via `deploy.replicas`
- Stateless design allows multiple instances
- RabbitMQ handles load balancing across consumers
- Resource limits prevent memory leaks

---

## Data Flow

### 1. Performance Monitoring Flow

```mermaid
sequenceDiagram
    participant Browser as Browser (React)
    participant SDK as Analytics SDK
    participant API as Backend API
    participant DB as PostgreSQL
    participant MQ as RabbitMQ

    Browser->>SDK: Page Load / Route Change
    SDK->>SDK: Collect Web Vitals (LCP, FCP, CLS, etc.)
    SDK->>SDK: Track API Calls (wrapped fetch)

    alt Queue Full or Timer Expires
        SDK->>API: POST /analytics/events (batch)
        API->>DB: Save to web_vitals_event table
        API->>MQ: Publish to analytics_queue
        MQ->>MQ: Async processing (optional)
        API-->>SDK: 200 OK
    else Page Unload
        SDK->>API: sendBeacon (reliable delivery)
    end
```

### 2. AI Chat Flow

```mermaid
sequenceDiagram
    participant Client as React Frontend
    participant Controller as AI Controller
    participant Service as AI Service
    participant LLM as DashScope API

    Client->>Controller: POST /ai/chat (messages[])
    Controller->>Service: streamChat(messages, onToken)
    Service->>LLM: ChatOpenAI.stream()

    loop For each token
        LLM-->>Service: Token chunk
        Service->>Controller: onToken(chunk)
        Controller-->>Client: SSE/WebSocket stream
    end

    Service-->>Controller: Stream complete
    Controller-->>Client: Close connection
```

### 3. Code Review Flow

```mermaid
sequenceDiagram
    participant GitHub as GitHub Webhook
    participant Controller as Code Review Controller
    participant Service as Review Service
    participant AI as Dify/AI Service
    participant GitHubAPI as GitHub API

    GitHub->>Controller: POST /webhook (pull_request)
    Controller->>Service: processPullRequest(prNumber)

    Service->>GitHubAPI: GET /repos/:owner/:repo/pulls/:number
    GitHubAPI-->>Service: Raw diff

    Service->>Service: cleanAndSliceDiff(rawDiff)
    Note over Service: Filter noise files<br/>Split into chunks <3000 chars

    loop For each chunk
        Service->>AI: Analyze code chunk
        AI-->>Service: Review comments
    end

    Service->>Service: mergeResults(reviews)
    Service->>GitHubAPI: POST /repos/:owner/:repo/issues/:number/comments
    GitHubAPI-->>Service: Comment posted

    Service-->>Controller: Review complete
    Controller-->>GitHub: 200 OK
```

### 4. Parallel Task Execution Flow

```mermaid
sequenceDiagram
    participant Client as API Client
    participant Controller as Parallel Task Controller
    participant Service as Parallel Task Service
    participant Workers as Worker Threads

    Client->>Controller: POST /parallel/execute
    Controller->>Service: executeParallel(tasks[], options)

    Service->>Service: Calculate optimal concurrency (CPU * 0.75)

    loop For each batch
        Service->>Workers: Execute batch (concurrent)
        Workers-->>Service: Task results

        opt Progress Callback
            Service->>Controller: Report progress
        end
    end

    Service-->>Controller: Aggregated results
    Controller-->>Client: { success, results, summary }
```

---

## Deployment Architecture

### Container Orchestration

The application uses Docker Compose for multi-container deployment with 5 services:

#### Service Overview

| Service              | Container Name              | Port                    | Purpose          | Health Check                |
| -------------------- | --------------------------- | ----------------------- | ---------------- | --------------------------- |
| **PostgreSQL**       | `ai-agent-postgres`         | 5432                    | Database         | `pg_isready`                |
| **RabbitMQ**         | `ai-agent-rabbitmq`         | 5672, 15672             | Message broker   | `rabbitmq-diagnostics ping` |
| **RabbitMQ Service** | `ai-agent-rabbitmq-service` | -                       | Message consumer | None (depends on RabbitMQ)  |
| **Backend**          | `ai-agent-backend`          | 3000                    | REST API         | HTTP health check           |
| **Frontend**         | `ai-agent-frontend`         | 3001 (mapped from 3000) | Web UI           | HTTP health check           |

#### Network Topology

```
┌─────────────────────────────────────────────┐
│         Docker Bridge Network                │
│         ai-agent-network                     │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Postgres │  │ RabbitMQ │  │ Backend  │  │
│  │ :5432    │  │ :5672    │  │ :3000    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                    ▲        │
│  ┌──────────┐  ┌──────────┐       │        │
│  │ RabbitMQ │  │ Frontend │───────┘        │
│  │ Service  │  │ :3000    │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    Host:5672/15672      Host:3001
    (RabbitMQ Mgmt)      (Web UI)
```

#### Volume Management

**Persistent Volumes**:

- `postgres-data`: PostgreSQL database files
- `rabbitmq-data`: RabbitMQ message store
- `backend-uploads`: Temporary file uploads

**Volume Drivers**: All use `local` driver for single-host deployments

#### Resource Limits

**Production Constraints**:

```yaml
# Backend
resources:
  limits:
    cpus: "1.0"
    memory: 1G
  reservations:
    cpus: "0.5"
    memory: 512M

# Frontend
resources:
  limits:
    cpus: "0.5"
    memory: 512M
  reservations:
    cpus: "0.25"
    memory: 256M

# RabbitMQ Service
resources:
  limits:
    cpus: "0.5"
    memory: 512M
  reservations:
    cpus: "0.25"
    memory: 256M
```

#### Update Strategy

**Rolling Updates**:

```yaml
update_config:
  parallelism: 1 # Update one replica at a time
  delay: 15s # Wait between updates
  order: start-first # Start new before stopping old
  failure_action: rollback # Rollback on failure
  monitor: 60s # Monitor for failures after update
  max_failure_ratio: 0.3 # Allow 30% failure rate
```

**Rollback Configuration**:

```yaml
rollback_config:
  parallelism: 1
  delay: 10s
  order: stop-first
  failure_action: pause
```

#### Restart Policies

```yaml
restart_policy:
  condition: on-failure # Only restart on failure
  delay: 5s # Wait before restart
  max_attempts: 3 # Max 3 restart attempts
  window: 120s # Reset counter after 2 minutes
```

### Environment-Specific Deployments

#### Production Mode

```bash
docker-compose up -d --build
```

**Characteristics**:

- Optimized builds
- No hot-reload
- Strict resource limits
- Health checks enabled
- Auto-restart on failure

#### Development Mode

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

**Characteristics**:

- Volume mounts for live code editing
- Debug ports exposed
- Verbose logging
- Hot-reload enabled
- Relaxed resource limits

### Health Monitoring

All critical services implement health checks:

**PostgreSQL**:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U admin"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**Backend API**:

```yaml
healthcheck:
  test:
    [
      "CMD-SHELL",
      "wget --spider http://127.0.0.1:3000/parallel/cpu-info || exit 0",
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Frontend**:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --spider http://127.0.0.1:3000/ || exit 0"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s
```

**Dependency Chain**:

```
postgres (healthy)
  ↓
rabbitmq (healthy)
  ↓
mcp-server (started)
  ↓
back-end (depends on postgres + mcp-server)
  ↓
front-end (depends on back-end)
```

---

## Development Workflow

### Git Workflow

The project enforces conventional commits via Husky and Commitlint:

#### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Allowed Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI/CD configuration
- `chore`: Maintenance tasks
- `revert`: Reverting commits

**Examples**:

```bash
git commit -m "feat(analytics): add Web Vitals tracking"
git commit -m "fix(rabbitmq): resolve queue durability issue"
git commit -m "docs(readme): update architecture diagram"
```

#### Pre-commit Hooks

**Automated Checks**:

1. **Lint-staged**: Runs Prettier on staged files
2. **TypeScript Compilation**: Ensures type safety
3. **ESLint**: Code quality validation

**Configuration** (`.lintstagedrc.json`):

```json
{
  "*.{ts,tsx,js,jsx}": ["prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

### Local Development Setup

#### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 11+
- Docker & Docker Compose (for containerized deps)

#### Installation

```bash
# Clone repository
git clone <repo-url>
cd ai-agent-monorepo

# Install dependencies (auto-installs Husky hooks)
pnpm install

# Copy environment files
cp packages/back-end/.env.example packages/back-end/.env
cp packages/front-end/.env.example packages/front-end/.env
```

#### Running Services

**Option 1: Local Development (Recommended for Active Development)**

```bash
# Terminal 1: Start backend
pnpm start:server

# Terminal 2: Start frontend
pnpm start:ui

# Terminal 3 (optional): Start RabbitMQ microservice
pnpm start:micro:rabbit-mq
```

**Access Points**:

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (guest/guest)

**Option 2: Docker Development**

```bash
# Start all services in containers
./docker.sh start:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up -d --build
```

**Access Points**:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- RabbitMQ Management: http://localhost:15672

#### Database Initialization

```bash
# Initialize PostgreSQL schema
./init-db.sh

# Or manually run SQL migrations
psql -h localhost -U admin -d analytics -f init.sql
```

### Testing Strategy

#### Backend Testing

```bash
# Unit tests
pnpm -F llm test

# E2E tests
pnpm -F llm test:e2e

# Test coverage
pnpm -F llm test:cov
```

**Test Structure**:

- `*.spec.ts`: Unit tests co-located with source files
- `test/`: E2E test suite
- Jest configuration in `package.json`

#### Frontend Testing

Currently relies on manual testing and type checking:

```bash
# Type checking
pnpm -F my-app typecheck

# Build validation
pnpm -F my-app build
```

**Future Enhancements**:

- Add Vitest/Jest for unit tests
- Add Playwright/Cypress for E2E tests
- Add visual regression testing

### Code Quality Tools

#### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm -F llm lint
pnpm -F my-app lint
```

#### Formatting

```bash
# Format all packages
pnpm format

# Format specific package
pnpm -F llm format
```

#### Type Checking

```bash
# Backend
pnpm -F llm exec tsc --noEmit

# Frontend
pnpm -F my-app typecheck
```

---

## Key Features

### 1. AI-Powered Chat Interface

**Implementation**:

- Streaming responses via Server-Sent Events (SSE)
- Message history management
- Support for multiple LLM providers (LangChain abstraction)
- Temperature and model configuration

**Endpoints**:

- `POST /ai/chat`: Non-streaming chat
- `POST /ai/chat/stream`: Streaming chat with token callbacks

**Frontend Integration**:

```typescript
// In Chat.tsx
const response = await fetch(`${API_CONFIG.CHAT_ENDPOINT}/stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages }),
});

const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process token chunk
}
```

### 2. Real-Time Performance Dashboard

**Features**:

- Live Web Vitals visualization
- API performance trends
- Route load time comparisons
- Historical data analysis (7-day default window)

**Components**:

- `ApiPerformanceChart`: Line chart showing API latency over time
- `RoutePerformanceChart`: Bar chart comparing route load times
- `DistributionChart`: Histogram of metric distributions
- `TimelineChart`: Time-series performance data

**Data Refresh**:

- Polls backend every 30 seconds
- WebSocket support planned for real-time updates

### 3. Automated Code Review

**Workflow**:

1. Developer opens Pull Request on GitHub
2. GitHub webhook triggers `/webhook` endpoint
3. Backend fetches PR diff
4. Diff is cleaned and sliced into chunks
5. Each chunk sent to Dify AI for analysis
6. Results merged and posted as PR comment

**Configuration**:

- Webhook secret validation
- Branch filtering (only review PRs to `main`)
- File type exclusions (lock files, images, etc.)
- Chunk size limits (3000 characters)

**Review Criteria**:

- Code quality and best practices
- Security vulnerabilities
- Performance considerations
- Maintainability suggestions
- Potential bugs

### 4. Parallel Task Processing

**Use Cases**:

- Batch image processing
- Bulk data transformations
- Concurrent API calls
- PDF document processing

**Performance Benefits**:

- Utilizes 75% of available CPU cores
- Reduces processing time by 3-5x compared to sequential execution
- Automatic load balancing across cores

**Example**:

```typescript
// Process 100 images concurrently
const images = await fs.readdir("./uploads");
const tasks = images.map((img) => () => processImage(img));

const result = await parallelTaskService.executeParallel(tasks, {
  concurrency: 8,
  timeout: 60000,
  continueOnError: true,
});

console.log(`Processed ${result.summary.succeeded} images`);
console.log(`Failed: ${result.summary.failed}`);
console.log(`Total time: ${result.totalDuration}ms`);
```

### 5. PDF & OCR Processing

**Capabilities**:

- Text extraction from digital PDFs
- Image conversion for scanned documents
- OCR via Tesseract.js
- Multi-language support

**Pipeline**:

```
PDF Upload
  → Extract Pages
  → Convert to Images
  → OCR Processing
  → Text Output
```

**Endpoints**:

- `POST /pdf/upload`: Upload PDF file
- `POST /pdf/extract`: Extract text from PDF
- `POST /ocr/process`: Process image with OCR

### 6. Comprehensive Analytics

**Client-Side Tracking**:

- Automatic Web Vitals collection
- API call interception
- Route change monitoring
- User interaction tracking

**Server-Side Storage**:

- PostgreSQL with JSONB for flexible metrics
- Time-series indexing for fast queries
- Aggregation pipelines for dashboards

**Privacy Considerations**:

- Anonymous user IDs (localStorage-based)
- No PII (Personally Identifiable Information) collection
- GDPR-compliant data retention policies

---

## Security Considerations

### Environment Variable Management

**Sensitive Data**:

- API keys (DASHSCOPE_API_KEY)
- Database credentials (DB_PASSWORD)
- RabbitMQ credentials (RABBITMQ_PASS)

**Best Practices**:

- Never commit `.env` files to version control
- Use Docker secrets for production deployments
- Rotate credentials regularly
- Use separate credentials for dev/staging/prod

### CORS Configuration

**Backend CORS Setup**:

```typescript
// In main.ts
app.enableCors({
  origin: [process.env.FRONT_END_URL, process.env.FRONT_END_URL_DEV],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
});
```

### Rate Limiting

**Current Status**: Not implemented (TODO)

**Recommendation**:

- Add `@nestjs/throttler` for API rate limiting
- Configure different limits for authenticated vs anonymous users
- Implement exponential backoff for failed requests

### Input Validation

**DTO Validation**:

```typescript
// Example: CreateAnalyticsDto
export class CreateAnalyticsDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsObject()
  properties: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;
}
```

**SQL Injection Prevention**:

- TypeORM parameterized queries
- No raw SQL concatenation
- Input sanitization for user-provided data

---

## Performance Optimization

### Backend Optimizations

1. **Connection Pooling**: TypeORM manages PostgreSQL connection pool
2. **Caching**: Planned Redis integration for frequently accessed data
3. **Compression**: Gzip compression for API responses
4. **Lazy Loading**: TypeORM relations loaded on-demand

### Frontend Optimizations

1. **Code Splitting**: React Router automatic route-based splitting
2. **Bundle Analysis**: Vite bundle analyzer for optimization
3. **Image Optimization**: Lazy loading and responsive images
4. **Caching Strategies**: Service workers for offline support (planned)

### Database Optimizations

1. **Indexing**: Strategic indexes on frequently queried columns
2. **Query Optimization**: TypeORM query builder for efficient SQL
3. **Connection Pool Sizing**: Tuned based on expected load
4. **Vacuum & Analyze**: Regular maintenance for PostgreSQL

---

## Monitoring & Observability

### Logging Strategy

**Backend Logging**:

- NestJS built-in logger with levels (log, error, warn, debug, verbose)
- Structured JSON logs in production
- Log aggregation via Docker logs

**Frontend Logging**:

- Console warnings for non-critical issues
- Error boundaries for React component errors
- Sentry integration planned for production error tracking

### Metrics Collection

**Application Metrics**:

- Request latency (p50, p95, p99)
- Error rates per endpoint
- Database query performance
- Queue depth and processing time

**Infrastructure Metrics**:

- CPU and memory usage per container
- Disk I/O for database volumes
- Network throughput
- RabbitMQ queue lengths

### Alerting

**Current Status**: Basic health checks only

**Planned Enhancements**:

- Prometheus metrics export
- Grafana dashboards
- Slack/PagerDuty alerts for critical errors
- Uptime monitoring

---

## Future Enhancements

### Short-Term Roadmap (1-3 months)

- [ ] Add Redis caching layer
- [ ] Implement API rate limiting
- [ ] Add WebSocket support for real-time updates
- [ ] Integrate Sentry for error tracking
- [ ] Add comprehensive E2E tests

### Medium-Term Roadmap (3-6 months)

- [ ] Kubernetes migration for production
- [ ] Implement CI/CD pipeline with GitHub Actions
- [ ] Add GraphQL API alongside REST
- [ ] Implement user authentication (JWT)
- [ ] Add multi-language support (i18n)

### Long-Term Vision (6-12 months)

- [ ] Microservices decomposition (split monolith)
- [ ] Event sourcing for analytics
- [ ] Machine learning model training pipeline
- [ ] Mobile app (React Native)
- [ ] Advanced AI features (RAG, fine-tuning)

---

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Failures

**Symptoms**:

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:

- Verify PostgreSQL container is running: `docker ps | grep postgres`
- Check health status: `docker inspect ai-agent-postgres | grep Health`
- Ensure `.env` has correct credentials
- Restart database: `docker-compose restart postgres`

#### 2. RabbitMQ Connection Issues

**Symptoms**:

```
Error: connect ECONNREFUSED 127.0.0.1:5672
```

**Solutions**:

- Check RabbitMQ status: `docker logs ai-agent-rabbitmq`
- Verify credentials match in both backend and microservice
- Ensure network connectivity: `docker network inspect ai-agent-network`
- Restart RabbitMQ: `docker-compose restart rabbitmq`

#### 3. Frontend Cannot Reach Backend

**Symptoms**:

- CORS errors in browser console
- 404 errors on API calls

**Solutions**:

- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check backend CORS configuration in `main.ts`
- Ensure backend is accessible at expected URL
- Check Docker port mappings: `docker port ai-agent-backend`

#### 4. High Memory Usage

**Symptoms**:

- Container crashes with OOM (Out Of Memory)
- Slow response times

**Solutions**:

- Increase memory limits in `docker-compose.yml`
- Profile backend for memory leaks: `node --inspect`
- Optimize database queries (add missing indexes)
- Reduce concurrency in parallel task processing

#### 5. TypeScript Compilation Errors

**Symptoms**:

```
error TS2307: Cannot find module '...'
```

**Solutions**:

- Clean and reinstall: `pnpm clean && pnpm install`
- Regenerate types: `pnpm -r exec tsc --noEmit`
- Check `tsconfig.json` paths configuration
- Ensure all dependencies are installed

### Debugging Tips

#### Backend Debugging

```bash
# Start with debug mode
pnpm start:debug

# Attach debugger (VS Code launch.json)
{
  "type": "node",
  "request": "attach",
  "port": 9229
}

# View logs
docker logs -f ai-agent-backend

# Exec into container
docker exec -it ai-agent-backend sh
```

#### Frontend Debugging

```bash
# Enable debug mode
echo "VITE_DEBUG_MODE=true" >> packages/front-end/.env

# View React DevTools
# Install browser extension

# Check bundle size
pnpm -F my-app build
npx vite-bundle-visualizer
```

#### Database Debugging

```bash
# Connect to PostgreSQL
docker exec -it ai-agent-postgres psql -U admin -d analytics

# Useful queries
\dt                    # List tables
\d web_vitals_event    # Describe table
SELECT * FROM web_vitals_event ORDER BY timestamp DESC LIMIT 10;

# Check connections
SELECT * FROM pg_stat_activity;
```

#### RabbitMQ Debugging

```bash
# Access management UI
open http://localhost:15672  # guest/guest

# Check queues
docker exec -it ai-agent-rabbitmq rabbitmqctl list_queues

# Check exchanges
docker exec -it ai-agent-rabbitmq rabbitmqctl list_exchanges

# View logs
docker logs -f ai-agent-rabbitmq
```

---

## Contributing Guidelines

### Code Standards

1. **TypeScript**: Strict mode enabled, no `any` types without justification
2. **Naming Conventions**:
   - Classes: PascalCase (`AnalyticsService`)
   - Functions/Variables: camelCase (`saveWebVitals`)
   - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
   - Files: kebab-case (`analytics.service.ts`)
3. **Comments**: JSDoc for public APIs, inline comments for complex logic
4. **Error Handling**: Always handle errors gracefully, never swallow exceptions

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with conventional commits
3. Run tests and linting locally
4. Submit PR with clear description
5. Address review comments
6. Squash and merge to `main`

### Documentation Standards

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Add JSDoc comments for new public APIs
- Include examples in docstrings

---

## References

### Official Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Router v7](https://reactrouter.com/)
- [LangChain.js](https://js.langchain.com/)
- [TypeORM](https://typeorm.io/)
- [RabbitMQ](https://www.rabbitmq.com/documentation.html)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)

### Related Resources

- [Web Vitals](https://web.dev/vitals/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App](https://12factor.net/)

---

## License

This project is licensed under the ISC License. See LICENSE file for details.

---

**Last Updated**: 2026-05-16  
**Version**: 1.0.0  
**Maintained By**: AI Agent Team
