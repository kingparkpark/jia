# 🎯 AI智能数字预测系统

基于DeepSeek V3.1模型的香港和澳门数字智能预测网站

## ✨ 功能特色

- 🤖 **AI智能预测** - 使用OpenRouter DeepSeek V3.1模型进行号码预测
- 📊 **统计学分析** - 基于历史数据的统计学算法
- 🎨 **现代化UI** - 响应式设计，支持移动端
- 🔮 **实时预测** - 一键获取AI预测结果
- 📱 **移动友好** - 完美适配各种设备屏幕
- 🎭 **生肖显示** - 支持生肖emoji展示

## 🚀 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-lottery-prediction.git
   cd ai-lottery-prediction
   ```

2. **本地运行**
   ```bash
   # 使用Python启动本地服务器
   python -m http.server 8000
   
   # 或使用Node.js
   npx serve .
   ```

3. **访问网站**
   打开浏览器访问 `http://localhost:8000`

## 🎮 使用方法

1. 打开网站并登录（密码：makabaka）
2. 在数字信息区域找到"🤖 AI智能预测"部分
3. 选择要预测的数字类型（香港数字或澳门数字）
4. 点击"🔮 开始AI预测"按钮
5. 等待AI分析完成，查看预测结果

### 🔐 配置 OpenRouter API Key（必需）

由于浏览器直连需要密钥，且密钥不可硬编码在前端，已在页面中提供轻量密钥配置入口：

1. 打开网站后，按下 `⚙️ 配置AI密钥`（或在控制台执行：`window.OPENROUTER_API_KEY = 'YOUR_KEY'`）
2. 将从 OpenRouter 获取的 Key 粘贴保存（推荐使用可在浏览器使用的可公开/可限制域名的 Key）
3. 刷新页面，再次点击预测按钮

如果你不想在浏览器保存密钥，建议改为后端代理方式：将密钥保存在服务器端，通过自建 API 转发到 OpenRouter（前端只调用你的后端）。

提示：当前实现会优先从 `localStorage.OPENROUTER_API_KEY` 读取，其次读取 `window.OPENROUTER_API_KEY`，最后才使用代码中的默认值（默认留空）。

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **AI模型**: OpenRouter DeepSeek V3.1
- **数据库**: Firebase Realtime Database
- **样式**: 现代CSS Grid/Flexbox布局
- **动画**: CSS3 Animations & Transitions

## 📊 预测算法

本系统采用多层次预测算法：

1. **统计学分析**
   - 号码出现频率统计
   - 冷热号码分布分析
   - 奇偶数比例计算
   - 连号出现概率评估

2. **AI智能预测**
   - 使用DeepSeek V3.1模型
   - 基于历史数据训练
   - 多维度特征分析
   - 置信度评估

3. **备用算法**
   - 当API不可用时启用
   - 基于统计学的随机生成
   - 确保预测结果的合理性

## 🎨 界面预览

- 🌈 渐变色彩设计
- 💫 流畅动画效果
- 📱 响应式布局
- 🎭 生肖emoji显示
- 🔮 预测结果可视化

## ⚠️ 免责声明

**重要提醒：**
- 本项目仅供学习和娱乐目的
- 预测结果基于统计学分析，不构成投注建议
- 数字具有随机性，请理性对待
- 不承担任何因使用本系统而产生的损失

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 📧 Email: ai@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/ai-lottery-prediction/issues)

---

⭐ 如果这个项目对您有帮助，请给个星星支持一下！
