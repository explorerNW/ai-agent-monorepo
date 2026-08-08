```markdown
# AiMemoryModule

## Overview

`AiMemoryModule` 是一个 TypeScript 类，用于配置和管理 AI 内存模块。它提供了一个异步的根配置方法 `forRootAsync` 和一个配置方法 `configure`。

## Class: AiMemoryModule

### Description

`AiMemoryModule` 类是主模块类，负责初始化和配置 AI 内存相关的服务和功能。

### Methods

#### forRootAsync

##### Description

`forRootAsync` 是一个异步方法，用于异步配置 `AiMemoryModule`。它接受一个选项对象，并返回一个 `ModuleMetadata` 对象，该对象包含模块的配置信息。

##### Parameters

- **options**: `AiMemoryOptions`
- **description**: 配置选项对象。
- **type**: `AiMemoryOptions`

##### Return Value

- **Type**: `Promise<ModuleMetadata>`
- **Description**: 返回一个 Promise，解析为一个包含模块元数据的对象。

##### Business Intent

`forRootAsync` 方法用于异步加载和配置 AI 内存模块，确保在应用程序启动时正确初始化所有必要的服务和资源。

#### configure

##### Description

`configure` 是一个同步方法，用于配置 `AiMemoryModule`。它接受一个选项对象，并根据这些选项进行相应的配置。

##### Parameters

- **options**: `AiMemoryOptions`
- **description**: 配置选项对象。
- **type**: `AiMemoryOptions`

##### Return Value

- **Type**: `void`
- **Description**: 返回 void，不返回任何值。

##### Business Intent

`configure` 方法用于同步配置 `AiMemoryModule`，确保在应用程序启动时正确初始化所有必要的服务和资源。
```
