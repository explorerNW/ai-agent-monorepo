````markdown
# AiMemoryService

## Overview

The `AiMemoryService` class is a central component responsible for managing short-term and long-term memory in an AI system. It provides methods to initialize the service, build runnable configurations, retrieve historical data, store long-term memories, and extract context from messages.

## Class: AiMemoryService

### Constructor

```typescript
constructor(private readonly config: ConfigService)
```
````

**Parameters:**

- `config`: An instance of `ConfigService` used to fetch configuration settings for the memory service.

**Business Intent:**
The constructor initializes the `AiMemoryService` with a configuration service, which is essential for obtaining necessary settings and configurations required by the service.

### Method: onModuleInit

```typescript
onModuleInit(): void
```

**Parameters:**

- None

**Returns:**

- `void`

**Business Intent:**
This method is called when the module containing `AiMemoryService` is initialized. It sets up any necessary resources or configurations required by the service.

### Method: buildRunnableConfig

```typescript
buildRunnableConfig(): RunnableConfig
```

**Parameters:**

- None

**Returns:**

- A `RunnableConfig` object, which likely contains configuration settings for running tasks or processes within the AI system.

**Business Intent:**
This method constructs and returns a configuration object that is used to run specific tasks or processes. The configuration might include parameters such as timeouts, resource limits, or other relevant settings.

### Method: getShortTermHistory

```typescript
getShortTermHistory(messageId: string): Promise<ChatMessage[]>
```

**Parameters:**

- `messageId`: A string representing the ID of a message for which to retrieve historical data.

**Returns:**

- A promise that resolves to an array of `ChatMessage` objects, representing the short-term history related to the specified message.

**Business Intent:**
This method fetches and returns the short-term memory associated with a specific message. Short-term memory typically includes recent interactions or context relevant to the current conversation.

### Method: getLongTermMemory

```typescript
getLongTermMemory(userId: string): Promise<ChatMessage[]>
```

**Parameters:**

- `userId`: A string representing the ID of a user for which to retrieve long-term memory.

**Returns:**

- A promise that resolves to an array of `ChatMessage` objects, representing the long-term memory associated with the specified user.

**Business Intent:**
This method fetches and returns the long-term memory associated with a specific user. Long-term memory typically includes historical interactions or context over a longer period.

### Method: storeLongTermMemory

```typescript
storeLongTermMemory(userId: string, message: ChatMessage): Promise<void>
```

**Parameters:**

- `userId`: A string representing the ID of the user to whom the memory belongs.
- `message`: A `ChatMessage` object representing the new message or interaction to store in long-term memory.

**Returns:**

- A promise that resolves when the message has been successfully stored in long-term memory.

**Business Intent:**
This method stores a new message or interaction in the user's long-term memory. It is used to maintain a persistent record of historical interactions for each user.

### Method: extractContext

```typescript
extractContext(message: ChatMessage): Promise<ChatContext>
```

**Parameters:**

- `message`: A `ChatMessage` object from which context needs to be extracted.

**Returns:**

- A promise that resolves to a `ChatContext` object, containing relevant contextual information derived from the message.

**Business Intent:**
This method extracts and returns contextual information from a chat message. The context might include entities, intents, or other relevant data that can be used for further processing or analysis.

```

```
