import React, { createContext, use, useActionState, useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';

// 1. 定义 Zod 校验规则
const userSchema = z.object({
  username: z.string().min(3, '用户名至少需要 3 个字符'),
  email: z.email('请输入有效的邮箱地址'),
});

// 定义表单状态类型
type FormState =
  | { success: true; errors: null }
  | { success: false; errors: Record<string, unknown> | { _form: string[] } }
  | null;

const ThemeContext = createContext('');

// 2. 模拟异步提交函数（Server Action）
/**
 * 创建用户表单提交逻辑
 * @param previousState 上一次的状态
 * @param formData 表单数据
 * @returns 提交结果
 */
async function createUserAction(previousState: FormState, formData: FormData): Promise<FormState> {
  const data = {
    username: formData.get('username'),
    email: formData.get('email'),
  };

  const result = userSchema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: z.treeifyError(result.error) };
  }

  // 模拟网络请求延迟
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 模拟随机失败（用于测试乐观更新自动回滚）
  if (Math.random() > 0.7) {
    return { success: false, errors: { _form: ['服务器繁忙，请稍后再试'] } };
  }

  return { success: true, errors: null };
}

const Text = (props: { content: { text: string } }) => {
  const { content } = props;
  // 模拟一次高耗时的计算
  const start = Date.now();
  /* eslint-disable no-empty */
  while (Date.now() - start < 100) {}

  console.log('Text 重新执行了！');
  return <span>{content.text}</span>;
};

// 3. 自定义提交按钮（利用 useFormStatus 获取父级表单状态）
/**
 * 提交按钮组件
 * 根据表单状态和主题显示不同的样式和文本
 */
function SubmitButton() {
  // 获取表单提交状态
  const { pending } = useFormStatus();
  // 获取当前主题
  const theme = use(ThemeContext);
  return (
    <button
      type="submit" // 按钮类型为提交
      disabled={pending} // 根据表单状态禁用按钮
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" // 按钮基础样式
      style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}
    >
      <Text content={{ text: pending ? '提交中...' : '创建用户' }} />
      <Text content={{ text: 'dark' }} />
    </button>
  );
}

// 4. 主组件
export default function UserManagement() {
  // 真实的用户列表状态
  const [users, setUsers] = useState([
    { id: 1, username: 'alice', email: 'alice@example.com', pending: false },
  ]);

  // 核心：useOptimistic 处理乐观状态
  // 当有异步操作挂起时，将带有 pending 标记的新用户插入列表头部
  const [optimisticUsers, addOptimisticUser] = useOptimistic(
    users,
    (currentState, newUser: { id: number; username: string; email: string; pending?: boolean }) => [
      { ...newUser, pending: true },
      ...currentState,
    ],
  );

  // 使用 useActionState 管理表单提交
  const [state, formAction] = useActionState(createUserAction, null);

  // 包装表单提交逻辑：在提交前触发乐观更新
  async function handleFormAction(formData: FormData) {
    const username = formData.get('username')?.toString() as string;
    const email = formData.get('email')?.toString() as string;

    // 1. 立即在 UI 上乐观地添加新用户
    addOptimisticUser({ id: Date.now(), username, email });

    // 2. 执行真实的异步表单提交（useActionState 会自动处理 pending 和错误）
    await formAction(formData);

    // 3. 如果真实请求成功，将数据同步到真实的 users 状态中
    // 注意：在实际 Server Action 中，成功后通常会刷新服务端数据
    if (!state?.errors) {
      setUsers((prev) => [
        { id: Date.now(), username: String(username), email: String(email), pending: false },
        ...prev,
      ]);
    }
  }

  const [theme, setTheme] = useState('dark');

  return (
    <ThemeContext value={theme}>
      <div className="max-w-md mx-auto space-y-6 p-4 text-white bg-black">
        <button
          className="text-white"
          onClick={() =>
            setTheme((value) => {
              return value === 'dark' ? 'light' : 'dark';
            })
          }
        >
          切换主题
        </button>
        <h2 className="text-xl font-bold">用户管理面板</h2>

        {/* 表单区域 */}
        <form action={handleFormAction} className="space-y-4 border p-4 rounded">
          {(state?.errors as { _form: [] })?._form && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {(state?.errors as { _form: string[] })._form[0]}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="w-full border rounded p-2"
            />
            {(state?.errors as { properties?: { username?: { errors: string[] } } })?.properties
              ?.username && (
              <p className="text-red-500 text-sm">
                {
                  (state?.errors as { properties?: { username?: { errors: string[] } } })
                    ?.properties?.username?.errors?.[0]
                }
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              邮箱
            </label>
            <input id="email" name="email" type="email" className="w-full border rounded p-2" />
            {(state?.errors as { properties?: { email?: { errors: string[] } } })?.properties
              ?.email && (
              <p className="text-red-500 text-sm">
                {
                  (state?.errors as { properties?: { email?: { errors: string[] } } })?.properties
                    ?.email?.errors?.[0]
                }
              </p>
            )}
          </div>

          <SubmitButton />
        </form>

        {/* 列表渲染区域：渲染的是乐观状态 optimisticUsers */}
        <div className="space-y-2">
          <h3 className="font-semibold">用户列表</h3>
          {optimisticUsers.map((user) => (
            <div
              key={user.id}
              className={`p-3 border rounded flex justify-between items-center transition-opacity ${
                user.pending ? 'opacity-50 bg-gray-50' : ''
              }`}
            >
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              {/* 如果处于乐观更新状态，显示提示 */}
              {user.pending && <span className="text-xs text-blue-500">创建中...</span>}
            </div>
          ))}
        </div>
      </div>
    </ThemeContext>
  );
}
