### 📄 文件元信息

- **文件路径**: `back-end/src/analysis/dto/create-analytics.dto.ts`
- **模块职责**: [定义用户创建分析数据的类型契约，包含字段约束与业务逻辑]
- **关联模块**: [`create-user-dto`, `analytics-api`]

### 📦 API 知识条目

#### CreateAnalyticsDto 成员全限定名

- **语义标签**: [数据格式, JWT认证, Token刷新, 异步处理], [用户身份验证，字段校验，异常捕获]
- **完整签名**: ```typescript  
  export interface CreateAnalyticsDto {  
   userId: string; // 必填：字符串类型，唯一标识符  
   analyticsType?: 'user' | 'system'; // 可选：数据分类枚举值  
   dataFields?: Record<string, any>; // 字段映射配置对象（可空）  
  }

```
- **设计意图**: [定义用户创建分析数据的契约结构，确保类型安全与业务逻辑一致性]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | ✓ | `''` | 用户唯一标识符，必填项用于身份验证 |
| analyticsType | enum | ✗ | `'user'`, `'system'` | 数据分类枚举值（可选） |
| dataFields | object | ✗ | `{}` | 字段映射配置对象（可空），支持动态扩展 |

- **返回值/实例方法**: [无特殊约束]
- **使用约束**: [线程安全，异步处理中调用顺序需明确；异常抛出时捕获 `ValidationError`或自定义错误码]
- **Code Review 检查点**: [1. 是否包含必填字段校验（如 userId）？2. dataFields类型是否符合枚举规范？3. Token刷新逻辑是否正确配置？4. 数据格式是否与预期一致？5. 是否有异常处理机制覆盖业务场景？6. 参数传递顺序与接口契约匹配度]
```
