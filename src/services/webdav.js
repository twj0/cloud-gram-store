// 轻量级WebDAV服务实现，兼容Cloudflare Workers
// 移除对webdav-server包的依赖，使用原生Web API

// WebDAV协议常量
const WEBDAV_METHODS = {
    PROPFIND: 'PROPFIND',
    PROPPATCH: 'PROPPATCH',
    MKCOL: 'MKCOL',
    COPY: 'COPY',
    MOVE: 'MOVE',
    LOCK: 'LOCK',
    UNLOCK: 'UNLOCK'
};

// WebDAV状态码
const WEBDAV_STATUS = {
    MULTI_STATUS: 207,
    CREATED: 201,
    NO_CONTENT: 204,
    NOT_FOUND: 404,
    CONFLICT: 409,
    LOCKED: 423,
    FAILED_DEPENDENCY: 424
};

// 轻量级WebDAV文件系统实现
class CloudflareWebDAVFileSystem {
    constructor(db, fileService) {
        this.db = db;
        this.fileService = fileService;
    }

    // 解析路径到文件夹/文件ID
    async resolvePath(path) {
        const parts = path.split('/').filter(p => p && p !== '/');
        let currentParentId = null;
        let entity = null;

        if (parts.length === 0) {
            return { id: null, type: 'folder', entity: { isRoot: true, name: 'Root' } };
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const folders = await this.db.getFoldersByParent(currentParentId);
            const foundFolder = folders.find(f => f.name === part);

            if (foundFolder) {
                currentParentId = foundFolder.id;
                entity = foundFolder;
                if (i === parts.length - 1) {
                    return { id: foundFolder.id, type: 'folder', entity: foundFolder };
                }
            } else {
                const files = await this.db.getFilesByFolder(currentParentId);
                const foundFile = files.find(f => f.name === part);
                if (foundFile && i === parts.length - 1) {
                    return { id: foundFile.id, type: 'file', entity: foundFile };
                }
                return null;
            }
        }
        return null;
    }

    // 获取目录内容
    async getDirectoryContents(parentId) {
        const folders = await this.db.getFoldersByParent(parentId);
        const files = await this.db.getFilesByFolder(parentId);
        return { folders, files };
    }

    // 创建文件夹
    async createDirectory(path) {
        const parts = path.split('/').filter(p => p && p !== '/');
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');

        const parent = await this.resolvePath(parentPath);
        if (!parent || parent.type !== 'folder') {
            throw new Error('Parent directory not found');
        }

        return await this.db.createFolder(name, parent.id);
    }

    // 删除资源
    async deleteResource(path) {
        const resolved = await this.resolvePath(path);
        if (!resolved) {
            throw new Error('Resource not found');
        }

        if (resolved.type === 'folder') {
            await this.db.deleteFolder(resolved.id);
        } else {
            await this.fileService.deleteFile(resolved.id);
        }
    }

    // 生成WebDAV属性XML
    generatePropertiesXML(resource, path) {
        const isFolder = resource.type === 'folder';
        const entity = resource.entity;

        const creationDate = entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString();
        const lastModified = entity.updated_at ? new Date(entity.updated_at).toUTCString() : new Date().toUTCString();

        return `
            <D:response>
                <D:href>${path}</D:href>
                <D:propstat>
                    <D:prop>
                        <D:displayname>${entity.name || 'Root'}</D:displayname>
                        <D:creationdate>${creationDate}</D:creationdate>
                        <D:getlastmodified>${lastModified}</D:getlastmodified>
                        ${isFolder ?
                            '<D:resourcetype><D:collection/></D:resourcetype>' :
                            `<D:resourcetype/>
                             <D:getcontentlength>${entity.size || 0}</D:getcontentlength>
                             <D:getcontenttype>${entity.mime_type || 'application/octet-stream'}</D:getcontenttype>`
                        }
                    </D:prop>
                    <D:status>HTTP/1.1 200 OK</D:status>
                </D:propstat>
            </D:response>
        `;
    }

}

// WebDAV服务主类
export class WebDAVService {
    constructor(db, fileService, authService) {
        this.db = db;
        this.fileService = fileService;
        this.authService = authService;
        this.fs = new CloudflareWebDAVFileSystem(db, fileService);
    }

    // 验证Basic Auth
    async authenticate(request) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return null;
        }

        try {
            console.log('[WebDAV Auth] Received Authorization header:', authHeader);
            const base64Credentials = authHeader.substring(6);
            const credentials = atob(base64Credentials);
            console.log('[WebDAV Auth] Decoded credentials string:', credentials);
            
            const [username, password] = credentials.split(':');

            // --- 调试日志开始 ---
            // 警告：这些日志会暴露敏感信息，调试结束后请务必移除！
            console.log(`[WebDAV Auth] Username from client: "${username}"`);
            console.log(`[WebDAV Auth] Password from client: "${password}"`);
            
            // 从 authService 获取环境变量中的期望值
            const expectedUsername = this.authService.adminUsername;
            const expectedPassword = this.authService.adminPassword;
            console.log(`[WebDAV Auth] Expected username from env: "${expectedUsername}"`);
            console.log(`[WebDAV Auth] Expected password from env: "${expectedPassword}"`);
            // --- 调试日志结束 ---

            const loginResult = await this.authService.login(username, password);
            return loginResult.success ? loginResult : null;
        } catch (error) {
            console.error('WebDAV authentication error:', error);
            return null;
        }
    }
    // 处理PROPFIND请求
    async handlePropfind(request, path) {
        console.log(`[WebDAV] PROPFIND for path: ${path}`);

        const depth = request.headers.get('Depth') || '1';
        const resolved = await this.fs.resolvePath(path);

        if (!resolved) {
            return new Response('Not Found', { status: 404 });
        }

        let responseXML = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">`;

        // 添加当前资源的属性
        responseXML += this.fs.generatePropertiesXML(resolved, path);

        // 如果是文件夹且depth > 0，添加子资源
        if (resolved.type === 'folder' && depth !== '0') {
            const contents = await this.fs.getDirectoryContents(resolved.id);

            for (const folder of contents.folders) {
                const childPath = path.endsWith('/') ? `${path}${folder.name}/` : `${path}/${folder.name}/`;
                responseXML += this.fs.generatePropertiesXML(
                    { type: 'folder', entity: folder },
                    childPath
                );
            }

            for (const file of contents.files) {
                const childPath = path.endsWith('/') ? `${path}${file.name}` : `${path}/${file.name}`;
                responseXML += this.fs.generatePropertiesXML(
                    { type: 'file', entity: file },
                    childPath
                );
            }
        }

        responseXML += '</D:multistatus>';

        return new Response(responseXML, {
            status: WEBDAV_STATUS.MULTI_STATUS,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'DAV': '1, 2'
            }
        });
    }
    // 处理MKCOL请求（创建文件夹）
    async handleMkcol(request, path) {
        console.log(`[WebDAV] MKCOL for path: ${path}`);

        try {
            await this.fs.createDirectory(path);
            return new Response(null, { status: WEBDAV_STATUS.CREATED });
        } catch (error) {
            console.error('MKCOL error:', error);
            return new Response('Conflict', { status: WEBDAV_STATUS.CONFLICT });
        }
    }

    // 处理DELETE请求
    async handleDelete(request, path) {
        console.log(`[WebDAV] DELETE for path: ${path}`);

        try {
            await this.fs.deleteResource(path);
            return new Response(null, { status: WEBDAV_STATUS.NO_CONTENT });
        } catch (error) {
            console.error('DELETE error:', error);
            return new Response('Not Found', { status: WEBDAV_STATUS.NOT_FOUND });
        }
    }

    // 处理GET请求（下载文件）
    async handleGet(request, path) {
        console.log(`[WebDAV] GET for path: ${path}`);

        const resolved = await this.fs.resolvePath(path);
        if (!resolved || resolved.type !== 'file') {
            return new Response('Not Found', { status: 404 });
        }

        try {
            const fileData = await this.fileService.downloadFile(resolved.id);
            if (!fileData) {
                return new Response('Not Found', { status: 404 });
            }

            return new Response(fileData.data, {
                headers: {
                    'Content-Type': fileData.mimeType || 'application/octet-stream',
                    'Content-Length': fileData.size?.toString() || '0',
                    'Last-Modified': new Date(resolved.entity.updated_at || resolved.entity.created_at).toUTCString()
                }
            });
        } catch (error) {
            console.error('GET error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    // 处理PUT请求（上传文件）
    async handlePut(request, path) {
        console.log(`[WebDAV] PUT for path: ${path}`);

        const parts = path.split('/').filter(p => p && p !== '/');
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');

        const parent = await this.fs.resolvePath(parentPath);
        if (!parent || parent.type !== 'folder') {
            return new Response('Parent directory not found', { status: WEBDAV_STATUS.CONFLICT });
        }

        try {
            // 将请求体转换为File对象
            const arrayBuffer = await request.arrayBuffer();
            const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

            // 创建一个模拟的File对象
            const file = {
                name: fileName,
                size: arrayBuffer.byteLength,
                type: contentType,
                arrayBuffer: () => Promise.resolve(arrayBuffer)
            };

            const result = await this.fileService.uploadFile(file, parent.id);

            return new Response('', {
                status: WEBDAV_STATUS.CREATED,
                headers: {
                    'Location': path
                }
            });
        } catch (error) {
            console.error('PUT error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
    // 处理OPTIONS请求
    async handleOptions(request, path) {
        return new Response('', {
            status: 200,
            headers: {
                'Allow': 'OPTIONS, GET, HEAD, POST, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE',
                'DAV': '1, 2',
                'MS-Author-Via': 'DAV'
            }
        });
    }

    // 主要的请求处理方法
    async handle(request) {
        const url = new URL(request.url);
        const path = decodeURIComponent(url.pathname.replace('/webdav', '') || '/');
        const method = request.method;

        console.log(`[WebDAV] ${method} ${path}`);

        // 身份验证
        const auth = await this.authenticate(request);
        if (!auth) {
            return new Response('Authorization required', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Cloud Gram Store WebDAV"',
                    'Content-Type': 'text/plain'
                }
            });
        }

        try {
            switch (method) {
                case 'OPTIONS':
                    return await this.handleOptions(request, path);

                case 'PROPFIND':
                    return await this.handlePropfind(request, path);

                case 'GET':
                case 'HEAD':
                    return await this.handleGet(request, path);

                case 'PUT':
                    return await this.handlePut(request, path);

                case 'DELETE':
                    return await this.handleDelete(request, path);

                case 'MKCOL':
                    return await this.handleMkcol(request, path);

                case 'MOVE':
                case 'COPY':
                    return new Response('Method not implemented', { status: 501 });

                default:
                    return new Response('Method not allowed', { status: 405 });
            }
        } catch (error) {
            console.error(`[WebDAV] Error handling ${method} ${path}:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
}


