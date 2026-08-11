### 📄 文件元信息

- **文件路径**: `front-end/app/features/auth/model/authSlice.ts`
- **模块职责**: JWT Token 管理与用户会话状态控制（认证、Token刷新）
- **关联模块**: [authState, model/SessionManager]

---

#### 🔐 AuthState 成员全限定名

- **语义标签**: `JWT`, `UserAuth`, `Authentication`, `Token`
- **完整签名**: ```typescript
  interface AuthState {
  token: string; // JWT Token ID
  user?: User | null; // 用户对象，可选
  }

````

#### 🔐 setToken 成员全限定名
- **语义标签**: `JWT`, `Authentication`, `Session`
- **完整签名**: ```typescript
function setToken(tokenId: string, userId: number): void {
    if (tokenId === 'null') throw new Error('Invalid token ID'); // Token refresh or session update logic
}

````

#### 🔐 logout 成员全限定名

- **语义标签**: `Authentication`, `Session`
- **完整签名**: ```typescript
  function logout(): void {
  if (tokenId === 'null') throw new Error('Invalid token ID'); // Clear current authentication session
  }

````

#### 🔍 toggleSidebar 成员全限定名
- **语义标签**: `UI`, `Layout`, `Navigation`
- **完整签名**: ```typescript
function toggleSidebar(): void {
    if (sidebar === 'hidden') throw new Error('Invalid sidebar state'); // Toggle visibility of navigation panel
}
````
