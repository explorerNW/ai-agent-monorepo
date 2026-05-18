# Let's Encrypt SSL 证书配置指南

## 📋 概述

本指南帮助你为 `niewang.uunat.com` 域名配置免费的 Let's Encrypt SSL 证书，使 Service Worker 能够正常工作。

**重要提示**：Let's Encrypt 证书只需配置一次，之后由系统自动管理，无需每次部署时重新生成。

## ⚠️ 前置要求

1. **域名 DNS 已正确配置**：`niewang.uunat.com` 必须指向你的服务器 IP
2. **端口 80 和 443 开放**：Let's Encrypt 验证需要访问
3. **Root/Sudo 权限**：脚本需要安装 Certbot 和管理证书

## 🚀 快速开始

### 方法1：使用自动化脚本（推荐）⭐

```bash
# 仅需运行一次！
chmod +x setup-letsencrypt.sh
sudo ./setup-letsencrypt.sh
```

**脚本会自动完成**：

- ✅ 安装 Certbot
- ✅ 申请 Let's Encrypt 证书
- ✅ 配置 Docker Compose
- ✅ 更新 Nginx 配置
- ✅ 设置自动续期（cron job）
- ✅ 重新部署服务

**后续部署**：

```bash
# 之后的所有部署都无需再运行 setup-letsencrypt.sh
# 直接运行即可，脚本会自动检测并使用 Let's Encrypt 证书
./docker.sh deploy
```

### 方法2：手动配置

#### 1. 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y certbot

# CentOS/RHEL
sudo yum install -y epel-release
sudo yum install -y certbot
```

#### 2. 获取证书（仅首次）

```bash
# 停止占用 80 端口的服务
docker-compose stop front-end

# 获取证书（仅首次需要）
sudo certbot certonly --standalone \
  -d niewang.uunat.com \
  --email admin@uunat.com \
  --agree-tos \
  --no-eff-email

# 重启服务
docker-compose start front-end
```

#### 3-5. 配置 Docker、Nginx 并部署

（略，同自动化脚本）

## 🔧 证书管理策略

### 📌 两种证书类型对比

| 特性               | Let's Encrypt      | 自签名证书           |
| ------------------ | ------------------ | -------------------- |
| **适用场景**       | 生产环境           | 开发/测试环境        |
| **信任度**         | ✅ 完全受信任      | ❌ 需手动信任        |
| **Service Worker** | ✅ 完美支持        | ❌ 受限或不支持      |
| **有效期**         | 90天（自动续期）   | 365天（手动更新）    |
| **管理方式**       | 独立脚本（一次性） | docker.sh 集成       |
| **部署频率**       | 仅首次 + 自动续期  | 每次部署可能重新生成 |

### 🎯 证书选择建议

**生产环境**：

```bash
# 步骤1：首次配置（仅运行一次）
sudo ./setup-letsencrypt.sh

# 步骤2：后续部署（自动使用 Let's Encrypt 证书）
./docker.sh deploy  # 自动检测并跳过证书生成
```

**开发环境**：

```bash
# 直接使用 docker.sh，自动生成自签名证书
./docker.sh deploy
```

## 🔄 自动续期机制

Let's Encrypt 证书有效期为 90 天，脚本已自动配置每月检查续期。

### 查看当前 Cron 任务

```bash
crontab -l
```

应该看到类似输出：

```
0 0 1 * * certbot renew --quiet && cd /path/to/project && docker-compose restart front-end
```

### 手动测试续期

```bash
# 测试续期（不会实际续期）
sudo certbot renew --dry-run

# 强制续期（仅当需要时）
sudo certbot renew --force-renewal
```

### 续期后重启服务

```bash
sudo certbot renew
docker-compose restart front-end
```

## ✅ 验证配置

### 1. 检查证书类型

```bash
# 检查是否使用 Let's Encrypt
if [ -f "/etc/letsencrypt/live/niewang.uunat.com/fullchain.pem" ]; then
  echo "✅ Using Let's Encrypt certificate"
else
  echo "ℹ️ Using self-signed certificate"
fi
```

### 2. 检查证书信息

```bash
openssl x509 -in /etc/letsencrypt/live/niewang.uunat.com/fullchain.pem -text -noout
```

### 3. 浏览器验证 Service Worker

```javascript
// 在浏览器控制台执行
if ("serviceWorker" in navigator) {
  console.log("✅ Service Worker supported");

  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("✅ SW registered:", reg.scope);
      console.log("Status:", reg.active ? "active" : "installing");
    })
    .catch((err) => console.error("❌ SW failed:", err));
} else {
  console.error("❌ Service Worker not supported");
}
```

### 4. DevTools 检查

1. 打开 Chrome DevTools (F12)
2. 切换到 **Application** 标签
3. 左侧选择 **Service Workers**
4. 应该看到状态为 **"activated and is running"**

## 🔍 故障排查

### 问题1：部署时仍尝试生成证书

**原因**：未检测到 Let's Encrypt 证书

**解决方案**：

```bash
# 检查证书是否存在
ls -la /etc/letsencrypt/live/niewang.uunat.com/

# 检查 DEPLOY_DOMAIN 环境变量
echo $DEPLOY_DOMAIN

# 重新运行 Let's Encrypt 脚本
sudo ./setup-letsencrypt.sh
```

### 问题2：证书即将过期

```bash
# 查看所有证书
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重启服务
docker-compose restart front-end
```

### 问题3：Service Worker 仍无法注册

参考之前的诊断步骤，确保：

1. ✅ 使用标准端口 443
2. ✅ 清除浏览器缓存
3. ✅ 硬刷新页面（Cmd+Shift+R）

## 📊 监控和维护

### 定期检查证书状态

```bash
# 创建监控脚本
cat > /usr/local/bin/check-ssl.sh << 'EOF'
#!/bin/bash
DOMAIN="niewang.uunat.com"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
  echo "ERROR: Certificate not found!"
  exit 1
fi

EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo "Domain: $DOMAIN"
echo "Expires: $EXPIRY"
echo "Days left: $DAYS_LEFT"

if [ $DAYS_LEFT -lt 30 ]; then
  echo "WARNING: Certificate expires in less than 30 days!"
  exit 1
fi
EOF

chmod +x /usr/local/bin/check-ssl.sh
```

## 🎯 最佳实践总结

### ✅ Do's

1. ✅ **生产环境使用 Let's Encrypt**
2. ✅ **仅首次运行 setup-letsencrypt.sh**
3. ✅ **依赖自动续期机制**
4. ✅ **定期监控证书状态**
5. ✅ **使用标准端口 443**

### ❌ Don'ts

1. ❌ **不要在每次 deploy 时重新申请证书**
2. ❌ **不要在生产环境使用自签名证书**
3. ❌ **不要使用非标准 HTTPS 端口**
4. ❌ **不要手动修改 /etc/letsencrypt 目录**

## 📚 工作流程示意

```
首次部署（生产环境）
├── sudo ./setup-letsencrypt.sh  ← 仅运行一次
│   ├── 安装 Certbot
│   ├── 申请证书
│   ├── 配置 Docker/Nginx
│   └── 设置自动续期
└── ./docker.sh deploy
    └── 自动检测 Let's Encrypt 证书
        └── 跳过证书生成 ✅

后续部署
└── ./docker.sh deploy
    └── 自动检测 Let's Encrypt 证书
        └── 跳过证书生成 ✅

自动续期（每90天）
└── Cron Job 自动执行
    ├── certbot renew
    └── docker-compose restart front-end
```

---

**最后更新**: 2026-05-18  
**维护者**: AI Agent Monorepo Team
