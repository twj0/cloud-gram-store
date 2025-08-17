// WebDAV 管理模块
// 负责 WebDAV 服务状态检查和管理

export class WebDAVManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.baseUrl = window.location.origin;
        this.webdavUrl = `${this.baseUrl}/webdav/`;
    }

    /**
     * 初始化 WebDAV 管理器
     */
    init() {
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // WebDAV 按钮点击事件
        const webdavBtn = document.getElementById('webdavBtn');
        if (webdavBtn) {
            webdavBtn.addEventListener('click', () => {
                this.showWebDAVModal();
            });
        }

        // 复制 WebDAV URL 按钮
        const copyBtn = document.getElementById('copyWebdavUrl');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyWebDAVUrl();
            });
        }

        // 测试 WebDAV 连接按钮
        const testBtn = document.getElementById('testWebdav');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testWebDAVConnection();
            });
        }
    }

    /**
     * 显示 WebDAV 状态模态框
     */
    async showWebDAVModal() {
        // 显示模态框
        const modal = document.getElementById('webdavModal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // 设置 WebDAV URL
        const urlElement = document.getElementById('webdavUrl');
        if (urlElement) {
            urlElement.textContent = this.webdavUrl;
        }

        // 检查 WebDAV 状态
        await this.checkWebDAVStatus();
    }

    /**
     * 检查 WebDAV 服务状态
     */
    async checkWebDAVStatus() {
        const statusElement = document.getElementById('webdavStatus');
        if (!statusElement) return;

        // 设置检查中状态
        statusElement.textContent = '检查中...';
        statusElement.className = 'status-indicator checking';

        try {
            // 发送 OPTIONS 请求检查 WebDAV 服务
            const response = await fetch(this.webdavUrl, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': `Basic ${btoa('admin:123456')}` // 使用默认凭据测试
                }
            });

            if (response.ok) {
                const allowHeader = response.headers.get('Allow');
                const davHeader = response.headers.get('DAV');
                
                if (allowHeader && allowHeader.includes('PROPFIND')) {
                    statusElement.textContent = '✅ 在线';
                    statusElement.className = 'status-indicator online';
                } else {
                    statusElement.textContent = '⚠️ 部分功能';
                    statusElement.className = 'status-indicator checking';
                }
            } else {
                statusElement.textContent = '❌ 离线';
                statusElement.className = 'status-indicator offline';
            }
        } catch (error) {
            console.error('WebDAV status check failed:', error);
            statusElement.textContent = '❌ 连接失败';
            statusElement.className = 'status-indicator offline';
        }
    }

    /**
     * 复制 WebDAV URL 到剪贴板
     */
    async copyWebDAVUrl() {
        try {
            await navigator.clipboard.writeText(this.webdavUrl);
            this.showNotification('WebDAV 地址已复制到剪贴板', 'success');
        } catch (error) {
            console.error('Failed to copy WebDAV URL:', error);
            
            // 降级方案：选择文本
            const urlElement = document.getElementById('webdavUrl');
            if (urlElement) {
                const range = document.createRange();
                range.selectNode(urlElement);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                
                try {
                    document.execCommand('copy');
                    this.showNotification('WebDAV 地址已复制到剪贴板', 'success');
                } catch (fallbackError) {
                    this.showNotification('复制失败，请手动复制', 'error');
                }
                
                window.getSelection().removeAllRanges();
            }
        }
    }

    /**
     * 测试 WebDAV 连接
     */
    async testWebDAVConnection() {
        const testBtn = document.getElementById('testWebdav');
        if (!testBtn) return;

        // 设置按钮为加载状态
        const originalText = testBtn.textContent;
        testBtn.textContent = '测试中...';
        testBtn.disabled = true;

        try {
            // 测试 PROPFIND 请求
            const response = await fetch(this.webdavUrl, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': `Basic ${btoa('admin:123456')}`,
                    'Depth': '1',
                    'Content-Type': 'application/xml'
                }
            });

            if (response.ok) {
                this.showNotification('✅ WebDAV 连接测试成功！', 'success');
                
                // 更新状态
                const statusElement = document.getElementById('webdavStatus');
                if (statusElement) {
                    statusElement.textContent = '✅ 在线';
                    statusElement.className = 'status-indicator online';
                }
            } else if (response.status === 401) {
                this.showNotification('❌ 认证失败，请检查用户名和密码', 'error');
            } else {
                this.showNotification(`❌ 连接失败 (${response.status})`, 'error');
            }
        } catch (error) {
            console.error('WebDAV connection test failed:', error);
            this.showNotification('❌ 网络连接失败', 'error');
        } finally {
            // 恢复按钮状态
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type} show`;

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }

    /**
     * 获取 WebDAV 使用统计
     */
    async getWebDAVStats() {
        try {
            // 这里可以添加获取 WebDAV 使用统计的逻辑
            // 比如连接次数、传输量等
            return {
                connections: 0,
                lastAccess: null,
                totalTransfer: 0
            };
        } catch (error) {
            console.error('Failed to get WebDAV stats:', error);
            return null;
        }
    }

    /**
     * 生成 WebDAV 配置信息
     */
    generateConfigInfo() {
        return {
            url: this.webdavUrl,
            username: 'admin', // 实际使用时应该从当前用户获取
            protocol: 'WebDAV',
            port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
            encryption: window.location.protocol === 'https:' ? 'SSL/TLS' : 'None'
        };
    }
}
