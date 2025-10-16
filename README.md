# CloudGramStore

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-blue.svg)](https://core.telegram.org/bots/api)


CloudGramStore 是一个基于 Cloudflare Workers 和 Telegram Bot API 的云文件管理系统，通过创新的方式将 Telegram 作为文件存储后端，实现了无需传统云存储服务的个人云盘解决方案。系统支持 文件上传、下载、重命名、删除、目录管理等功能，适合个人使用。

![login-image](./images/login-image.png)

![manage-image](./images/image.png)

## ✨ 功能特性

- **用户认证**：基于 JWT 的安全认证系统
- **文件管理**：
  - 文件上传（支持拖拽上传和多文件选择）
  - 文件下载、预览
  - 文件重命名和删除
  - 大文件分片处理（突破 Telegram 单文件限制）
  - **文件分享**：生成永久公开下载链接，无需登录即可访问
- **文件夹管理**：
  - 多级文件夹创建和导航
  - 面包屑路径导航
  - 文件夹重命名和删除
- **WebDAV 协议支持**：
  - 标准 WebDAV 协议实现，兼容各种客户端
  - 支持文件夹浏览、创建、删除操作
  - 支持文件上传、下载、删除操作
  - Basic Auth 身份验证
  - 完全兼容 Cloudflare Workers 运行时
- **用户体验**：
  - 拖拽上传、进度反馈
  - 全局加载状态显示
  - 操作结果通知（成功/失败/详情）
  - 响应式美观 UI，适配移动设备
  - 键盘快捷键支持
  - WebDAV 服务状态监控和配置指南

## 🚀 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) (v16 或更高版本)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)
- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
- [Telegram Bot](https://core.telegram.org/bots#how-do-i-create-a-bot) 和
- 一个用于存储文件的 Telegram 群组/频道,把机器人加入到频道并将其作为管理员

### 安装

1. **克隆仓库**

   ```sh
   git clone https://github.com/twj0/cloud-gram-store.git
   cd cloud-gram-store
   ```

2. **安装依赖**

   ```sh
   npm install
   ```

3. **配置环境**

   3.1. 复制示例配置文件并进行编辑：

   ```sh
   cp wrangler.jsonc.example wrangler.jsonc
   ```

   3.2. 编辑 `wrangler.jsonc` 文件，填入以下信息：
   - Telegram Bot Token
   - Telegram Chat ID
   - 管理员用户名和密码
		- 本项目只支持单用户，没有用户注册功能
   - JWT 密钥

4. **初始化数据库**

   ```sh
   npx wrangler d1 create cloud-gram-store-db
   ```

   将生成的数据库 ID 添加到 `wrangler.jsonc` 文件中。

   ```sh
	# 本地执行建表语句
   npx wrangler d1 execute cloud-gram-store-db --file=schema.sql

	# 远端执行建表语句
   npx wrangler d1 execute cloud-gram-store-db --file=schema.sql --remote
   ```

### 本地开发

1. **启动开发服务器**

   ```sh
   npm run dev
   # 或
   npx wrangler dev
   ```

2. **访问前端**

   打开浏览器访问 http://localhost:8787

### 部署到 Cloudflare Workers

```sh
npm run deploy
# 或
npx wrangler deploy
```

## 📂 项目结构

```
├── public/           # 前端静态资源
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript 文件
│   │   └── modules/  # JS 模块
│   │       ├── auth.js        # 认证管理
│   │       ├── fileManager.js # 文件管理
│   │       ├── webdav.js      # WebDAV 管理
│   │       └── ...
│   └── index.html    # 主页面
├── src/              # 后端服务
│   ├── services/     # 核心服务
│   │   ├── auth.js   # 认证服务
│   │   ├── database.js # 数据库服务
│   │   ├── file.js   # 文件服务
│   │   ├── telegram.js # Telegram 服务
│   │   └── webdav.js # WebDAV 协议服务
│   ├── utils/        # 工具函数
│   │   ├── response.js # 响应处理
│   │   └── router.js # 路由处理
│   └── index.js      # 主入口
├── schema.sql        # 数据库结构
├── wrangler.jsonc    # Cloudflare 配置
└── package.json      # 项目依赖
```

## 💡 技术实现

### 核心技术栈

- **前端**：原生 JavaScript、HTML5、CSS3
- **后端**：Cloudflare Workers (JavaScript)
- **数据库**：Cloudflare D1 (SQLite)
- **存储**：Telegram Bot API
- **认证**：JWT (JSON Web Tokens)
- **协议**：WebDAV (RFC 4918)、HTTP/HTTPS

### 创新点

- **Telegram 作为存储后端**：利用 Telegram 的无限存储空间，避免了对传统云存储的依赖
- **文件分片处理**：突破 Telegram 单文件大小限制，支持大文件上传和下载
- **边缘计算**：基于 Cloudflare Workers 的全球分布式部署，提供低延迟访问
- **WebDAV 协议支持**：自研轻量级 WebDAV 实现，完全兼容 Cloudflare Workers 运行时
- **标准化接口**：支持任何 WebDAV 兼容的客户端，提供统一的文件访问体验

## 👥 贡献

欢迎贡献代码、报告问题或提出改进建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 📜 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 📞 联系方式

如需详细开发文档或遇到问题，请联系项目维护者或提交 Issue。

---

## 二次开发说明

遇到并解决了一些问题，具体如下：

### 遇到的问题及解决方案

1.  **静态资源 404**：
    *   **问题**：本地开发时，`/css/antd@5.12.8/dist/reset.css` 文件 404。
    *   **解决方案**：将 `index.html` 中的 CSS 引用从本地路径改回 CDN。

2.  **数据库查询失败**：
    *   **问题**：获取根目录内容时，`DatabaseService.getFoldersByParent` 函数报错。
    *   **解决方案**：修改 `database.js` 文件中的 `getFoldersByParent` 和 `getFilesByFolder` 函数，当 `parentId` 或 `folderId` 为 `null` 时，不使用 `bind` 方法。

3.  **数据库表不存在**：
    *   **问题**：`wrangler dev` 启动后，API 返回 `Error: D1_ERROR: no such table: folders: SQLITE_ERROR`。
    *   **解决方案**：在 `package.json` 中添加 `db:init` 脚本，用于执行 `schema.sql` 文件，初始化数据库。

4.  **Telegram API 上传失败**：
    *   **问题**：在中国大陆环境下，由于网络问题，上传文件到 Telegram 时，API 返回 `internal error`。
    *   **解决方案**：开启 v2ray或者 clash 的 TUN 模式 或者 “虚拟网卡” 等方式，解决网络问题。同时，在 `telegram.js` 的 `uploadChunk` 函数中添加了更详细的错误日志，以便更好地排查问题。

### WebDAV 功能开发记录

#### 开发背景
为了提供更标准化的文件访问方式，决定为 CloudGramStore 添加 WebDAV 协议支持，使用户能够通过任何支持 WebDAV 的客户端访问文件。

#### 技术挑战与解决方案

1. **Node.js 包兼容性问题**：
   - **问题**：原始使用的 `webdav-server@2.6.2` 包依赖 Node.js 原生模块，与 Cloudflare Workers 运行时不兼容
   - **错误**：`Class extends value undefined`、`Could not resolve "node:stream"`
   - **解决方案**：
     - 移除 `webdav-server` 依赖包
     - 自研轻量级 WebDAV 协议实现
     - 使用原生 Web API 替代 Node.js 特定功能

2. **WebDAV 协议实现**：
   - **挑战**：需要实现完整的 WebDAV 协议栈，包括 PROPFIND、MKCOL、PUT、GET、DELETE 等方法
   - **解决方案**：
     - 创建 `CloudflareWebDAVFileSystem` 类处理文件系统抽象
     - 实现 `WebDAVService` 类处理协议逻辑
     - 使用 XML 生成器创建标准 WebDAV 响应

3. **前端集成**：
   - **需求**：在现有界面中添加 WebDAV 状态显示和管理功能
   - **实现**：
     - 添加 WebDAV 按钮和状态模态框
     - 创建 `WebDAVManager` 模块处理前端逻辑
     - 提供连接测试和配置指南功能

#### 实现成果

- ✅ **完整的 WebDAV 协议支持**：实现了核心 WebDAV 方法
- ✅ **Cloudflare Workers 兼容**：零依赖，完全兼容 Workers 运行时
- ✅ **前端集成**：提供直观的状态监控和配置界面
- ✅ **客户端兼容性**：支持各种 WebDAV 客户端
- ✅ **性能优化**：基于 Web Streams API，支持大文件处理

#### 技术细节

**核心文件**：
- `src/services/webdav.js`：WebDAV 协议实现
- `public/js/modules/webdav.js`：前端 WebDAV 管理
- `docs/webdav-development.md`：详细开发文档

**关键技术**：
- Web Streams API 替代 Node.js Streams
- 原生 XML 生成替代第三方库
- Basic Auth 认证集成现有用户系统

## 🌐 WebDAV 功能使用指南

### WebDAV 服务概述

CloudGramStore 现已集成完整的 WebDAV 协议支持，允许您通过标准的 WebDAV 客户端访问和管理存储的文件。

### 访问 WebDAV 服务

1. **获取 WebDAV 地址**：
   - 登录 CloudGramStore Web 界面
   - 点击工具栏中的 "🌐 WebDAV" 按钮
   - 查看 WebDAV 服务状态和连接信息

2. **WebDAV 地址格式**：
   ```
   https://your-domain.workers.dev/webdav/
   ```

3. **认证信息**：
   - 用户名：您的 CloudGramStore 用户名
   - 密码：您的 CloudGramStore 密码
   - 认证方式：Basic Auth

### 客户端配置示例

#### Windows 文件资源管理器
1. 打开文件资源管理器
2. 右键点击"此电脑" → "映射网络驱动器"
3. 选择驱动器号，输入 WebDAV 地址
4. 勾选"使用其他凭据连接"
5. 输入用户名和密码

#### macOS Finder
1. 打开 Finder
2. 按 `Cmd+K` 或选择"前往" → "连接服务器"
3. 输入 WebDAV 地址
4. 输入用户名和密码

#### 第三方客户端
推荐使用以下支持 WebDAV 的客户端：
- **WinSCP** (Windows)
- **Cyberduck** (跨平台)
- **rclone** (命令行工具)
- **FE File Explorer** (移动端)

### 支持的操作

- ✅ 浏览文件和文件夹
- ✅ 创建文件夹
- ✅ 上传文件
- ✅ 下载文件
- ✅ 删除文件和文件夹
- ✅ 重命名操作
- ⚠️ 移动/复制操作（计划中）

### WebDAV 技术实现

#### 核心特性
- **轻量级实现**：自研 WebDAV 协议实现，完全兼容 Cloudflare Workers
- **零依赖**：移除了不兼容的 `webdav-server` 包，使用原生 Web API
- **高性能**：基于 Web Streams API，支持大文件流式处理
- **标准兼容**：遵循 RFC 4918 WebDAV 标准

#### 架构设计
```
WebDAV Client → Cloudflare Workers → WebDAV Service → File System Abstraction → Telegram API
```

### 故障排除

#### 常见问题

1. **连接失败**
   - 检查 WebDAV 地址是否正确
   - 确认用户名和密码正确
   - 检查网络连接

2. **文件上传失败**
   - 检查文件大小限制
   - 确认网络环境可访问 Telegram API
   - 查看服务器日志获取详细错误信息

3. **权限错误**
   - 确认使用正确的认证凭据
   - 检查用户权限设置

#### 调试工具
- 使用 Web 界面的"测试连接"功能
- 查看浏览器开发者工具的网络请求
- 检查 Cloudflare Workers 日志

### 致谢

非常感谢原作者的辛勤付出

---

<p align="center">使用 ❤️ 和 ☕ 构建</p>
