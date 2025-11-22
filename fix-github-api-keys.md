# GitHub部署后API密钥配置修复方案

## 问题分析
GitHub Pages是静态网站，用户在本地的API密钥配置无法同步到线上环境。

## 解决方案

### 方案1：用户手动配置（推荐）
在网站上添加更明显的API密钥配置指引：

1. 在网站首页添加醒目的API密钥配置入口
2. 首次访问时显示配置向导
3. 提供"如何获取OpenRouter API密钥"的详细说明

### 方案2：URL参数传递密钥
通过URL参数临时传递API密钥：
```
https://username.github.io/repo?api_key=your_openrouter_key_here
```

### 方案3：环境变量配置（适用于私有部署）
使用GitHub Secrets或环境变量存储API密钥

## 临时修复代码
在index.html中添加以下代码段：

```javascript
// 检查URL参数中的API密钥
function checkUrlApiKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlApiKey = urlParams.get('api_key');

    if (urlApiKey && urlApiKey.startsWith('sk-or-v1-')) {
        console.log('🔑 从URL参数检测到API密钥');
        let storedKeys = JSON.parse(localStorage.getItem('customApiKeys') || '[]');

        if (!storedKeys.includes(urlApiKey)) {
            storedKeys.push(urlApiKey);
            localStorage.setItem('customApiKeys', JSON.stringify(storedKeys));
            updateApiKeyList();
            updateApiKeyStatus();

            // 清理URL，避免密钥暴露在地址栏
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            alert('✅ API密钥已从URL参数自动配置！');
        }
    }
}

// 页面加载时检查
window.addEventListener('DOMContentLoaded', function() {
    checkUrlApiKey();
    // ... 其他初始化代码
});
```

## 使用方法
1. 访问：`https://yourusername.github.io/your-repo?api_key=sk-or-v1-your-actual-key-here`
2. 网站会自动配置并清理URL中的密钥
3. 后续访问无需重复配置

## 安全提醒
- 建议用户获取自己的OpenRouter API密钥
- 不要在公开场合分享包含API密钥的URL
- 建议定期更换API密钥