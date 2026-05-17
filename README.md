# 秘鲁中华三民联校志愿者管理系统

面向赴秘鲁中华三民联校志愿者的 Web 管理平台，支持**编年式（按届）档案**、工作打卡与文件、生活住宿与报修、请假审批，以及管理员统一处理申请。

## 功能概览

| 模块 | 志愿者 | 管理员 |
|------|--------|--------|
| **工作** | 上班/下班打卡、上传工作文件 | 查看各志愿者文件 |
| **生活** | 登记公寓地址/照片/前台电话、家具报修、请假（精确到分钟） | 审批报修与请假、填写批注、记录处理用时 |
| **个人信息** | 生日、任期、护照号、派出院校、任教学校、西语名 | 按届查看历届志愿者完整档案 |
| **账号** | 自助注册（选择届别） | 默认管理员账号（见下方） |

历届志愿者数据**不会删除**，新届注册时选择对应年份即可实现编年式管理。

## 本地运行

### 1. 安装 Node.js

从 [https://nodejs.org](https://nodejs.org) 安装 **LTS 版本**（需包含 npm）。安装后重新打开终端。

### 2. 安装依赖并初始化数据库

在项目目录 `志愿者管理` 下执行：

```bash
npm install
npx prisma db push
npm run db:seed
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 默认管理员

首次 `db:seed` 后可用（可在 `.env` 中修改）：

- 邮箱：`admin@sanmin.edu.pe`
- 密码：`Admin@2025!`

**部署到公网后请立即修改密码。**

## 部署到公网（获得固定网址）

推荐使用 **Vercel**（免费套餐即可），步骤简述：

1. 将本项目文件夹上传到 **GitHub** 私有或公开仓库。
2. 登录 [https://vercel.com](https://vercel.com)，导入该仓库。
3. 在 Vercel 项目 **Settings → Environment Variables** 中配置：
   - `DATABASE_URL` — 生产环境请改用 [Turso](https://turso.tech) 或 [PlanetScale](https://planetscale.com) 等在线 SQLite/PostgreSQL（见下方说明）
   - `JWT_SECRET` — 随机长字符串（至少 32 位）
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
4. 部署完成后会得到形如 `https://xxx.vercel.app` 的网址，可绑定自定义域名。

### 关于数据库与文件上传

- **本地开发**：使用 SQLite 文件 `dev.db`，上传文件保存在 `uploads/` 目录。
- **Vercel 无持久磁盘**：生产环境需将 `DATABASE_URL` 改为托管数据库；文件上传建议后续升级为 **Vercel Blob** 或 **S3**。当前版本在 Vercel 上适合先验证功能，正式长期使用请迁移数据库与对象存储（可在此基础上继续升级）。

将 `prisma/schema.prisma` 中 `provider` 改为 `postgresql` 并更换 `DATABASE_URL` 后，执行 `npx prisma db push` 即可迁移到 PostgreSQL。

## 日常维护与升级

```bash
git pull          # 拉取你或开发者推送的更新
npm install       # 安装新依赖
npx prisma db push  # 同步数据库结构变更
npm run build     # 本地验证构建
```

修改界面或接口后重新部署 Vercel 即可；**不要删除生产数据库**，历届档案会保留。

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS
- Prisma + SQLite
- JWT Cookie 会话

## 目录结构

```
src/app/          页面与 API
src/components/   界面组件
prisma/           数据库模型与种子数据
uploads/          本地上传文件（自动生成）
```

如有新需求（邮件通知、导出 Excel、多管理员等），可在现有结构上继续扩展。
