/**
 * 新型预测系统用户界面控制器
 * 整合数据API与预测引擎
 */
class PredictionSystemUI {
    constructor() {
        this.api = new LotteryDataAPI();
        this.engine = new AdvancedPredictionEngine();
        this.currentLotteryType = 'hongkong';
        this.currentPeriod = null;
        this.historyData = [];
        this.isPredicting = false;
        this.records = [];
        this.historySignatures = {};

        // 支持的彩票类型
        this.lotteryTypes = {
            hongkong: {
                name: '香港六合彩',
                code: 'hongkong',
                color: '#ff4757',
                icon: '🇭🇰'
            },
            macaujc: {
                name: '澳门六合彩',
                code: 'macaujc',
                color: '#ff6b6b',
                icon: '🇲🇴'
            },
            macaujc2: {
                name: '澳门六合彩(二)',
                code: 'macaujc2',
                color: '#ff8787',
                icon: '🇲🇴'
            },
            macaujc3: {
                name: '澳门六合彩(三)',
                code: 'macaujc3',
                color: '#ffa502',
                icon: '🇲🇴'
            },
            tianTianCai: {
                name: '天天彩',
                code: 'tianTianCai',
                color: '#747d8c',
                icon: '🎰'
            }
        };

        this.init();
    }

    /**
     * 初始化系统
     */
    async init() {
        console.log('🚀 初始化新型预测系统...');

        try {
            // 检查DOM元素
            this.checkDOMElements();

            // 绑定事件监听器
            this.bindEventListeners();

            // 加载当前彩票类型
            await this.loadLotteryType(this.currentLotteryType);

            console.log('✅ 预测系统初始化完成');
        } catch (error) {
            console.error('❌ 系统初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }

    /**
     * 检查DOM元素
     */
    checkDOMElements() {
        const requiredElements = [
            'predictionTabs',
            'currentLotteryInfo',
            'predictionBtn',
            'predictionResult',
            'loadingIndicator',
            'historyDataList',
            'predictionHistoryList'
        ];

        const missing = requiredElements.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            throw new Error(`缺少必要的DOM元素: ${missing.join(', ')}`);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 彩票类型切换
        document.querySelectorAll('[data-lottery-type]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.lotteryType;
                this.switchLotteryType(type);
            });
        });

        // 预测按钮
        const predictionBtn = document.getElementById('predictionBtn');
        if (predictionBtn) {
            predictionBtn.addEventListener('click', () => {
                this.executePrediction();
            });
        }

        // 刷新数据按钮
        document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
            this.refreshData();
        });

        // 历史数据加载
        document.getElementById('loadHistoryBtn')?.addEventListener('click', () => {
            this.loadHistoryData();
        });

        // 清除缓存
        document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
            this.clearCache();
        });
    }

    /**
     * 切换彩票类型
     * @param {string} type - 彩票类型
     */
    async switchLotteryType(type) {
        if (type === this.currentLotteryType || this.isPredicting) return;

        console.log(`🔄 切换到 ${this.lotteryTypes[type]?.name}`);

        // 更新UI状态
        this.updateTabs(type);
        this.showLoading('切换中...');

        try {
            await this.loadLotteryType(type);
            this.hideLoading();
        } catch (error) {
            console.error('切换彩票类型失败:', error);
            this.showError('切换失败，请重试');
            this.hideLoading();
        }
    }

    /**
     * 加载彩票类型数据
     * @param {string} type - 彩票类型
     */
    async loadLotteryType(type) {
        this.currentLotteryType = type;

        // 更新UI
        this.updateLotteryInfo(type);

        // 获取最新开奖结果
        await this.loadLatestResult(type);

        // 获取历史数据
        await this.loadHistoryData(type);

        // 更新预测历史
        this.updatePredictionHistory(type);
    }

    /**
     * 更新标签页状态
     * @param {string} activeType - 当前激活的彩票类型
     */
    updateTabs(activeType) {
        document.querySelectorAll('[data-lottery-type]').forEach(tab => {
            const type = tab.dataset.lotteryType;
            if (type === activeType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    /**
     * 更新彩票信息显示
     * @param {string} type - 彩票类型
     */
    updateLotteryInfo(type) {
        const lotteryInfo = this.lotteryTypes[type];
        const infoElement = document.getElementById('currentLotteryInfo');

        if (lotteryInfo && infoElement) {
            infoElement.innerHTML = `
                <div class="lottery-header">
                    <span class="lottery-icon">${lotteryInfo.icon}</span>
                    <span class="lottery-name">${lotteryInfo.name}</span>
                    <span class="lottery-code">[${lotteryInfo.code}]</span>
                </div>
                <div class="lottery-period">
                    当前期号: <strong id="currentPeriodDisplay">加载中...</strong>
                </div>
                <div class="lottery-status" id="lotteryStatus">
                    <span class="status-dot"></span>
                    <span>数据连接正常</span>
                </div>
            `;
        }
    }

    /**
     * 加载最新开奖结果
     * @param {string} type - 彩票类型
     */
    async loadLatestResult(type) {
        try {
            const latestResult = await this.api.getCurrentResult(type);

            if (latestResult) {
                this.currentPeriod = latestResult.expect;
                this.displayLatestResult(latestResult);

                // 更新当前期号显示
                const periodDisplay = document.getElementById('currentPeriodDisplay');
                if (periodDisplay) {
                    periodDisplay.textContent = latestResult.expect;
                }
            }
        } catch (error) {
            console.warn('获取最新结果失败:', error);
            // 使用备用方案生成期号
            this.generateCurrentPeriod();
        }
    }

    /**
     * 显示最新开奖结果
     * @param {Object} result - 开奖结果
     */
    displayLatestResult(result) {
        const resultContainer = document.getElementById('latestResult');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div class="latest-result-card">
                <h4>最新开奖结果</h4>
                <div class="result-period">期号: ${result.expect}</div>
                <div class="result-numbers">
                    ${result.numbers.map((num, index) => `
                        <div class="result-number ${this.getWaveClass(result.wave[index])} ${this.getZodiacClass(result.zodiac[index])}">
                            <div class="number-display">${num.toString().padStart(2, '0')}</div>
                            ${result.wave[index] ? `<div class="wave-indicator">${this.getWaveIcon(result.wave[index])}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">开奖时间:</span>
                        <span class="detail-value">${result.openTime || '未知'}</span>
                    </div>
                    ${result.wave.length > 0 ? `
                        <div class="detail-item">
                            <span class="detail-label">波色分布:</span>
                            <span class="detail-value wave-distribution">
                                ${this.renderWaveDistribution(result.wave)}
                            </span>
                        </div>
                    ` : ''}
                    ${result.zodiac.length > 0 ? `
                        <div class="detail-item">
                            <span class="detail-label">生肖分布:</span>
                            <span class="detail-value zodiac-distribution">
                                ${this.renderZodiacDistribution(result.zodiac)}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 生成当前期号（备用方案）
     */
    generateCurrentPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        // 简化的期号生成逻辑
        const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        this.currentPeriod = `${year}${dayOfYear.toString().padStart(3, '0')}`;

        const periodDisplay = document.getElementById('currentPeriodDisplay');
        if (periodDisplay) {
            periodDisplay.textContent = this.currentPeriod;
        }
    }

    /**
     * 加载历史数据
     * @param {string} type - 彩票类型
     * @param {Object} options - 加载选项
     */
    async loadHistoryData(type = this.currentLotteryType, options = {}) {
        const { years = 1, page = 1, pageSize = 50 } = options;

        try {
            console.log(`📊 加载 ${type} 历史数据...`);

            // 获取批量历史数据
            const batchData = await this.api.getBatchHistoryData(type, years);
            this.historyData = batchData;

            const sig = this.computeHistorySignature(batchData);
            this.historySignatures[type] = sig;
            console.log(`历史数据签名[${type}]:`, sig);

            this.displayHistoryData(batchData);
            this.updateDataStats(batchData);

            console.log(`✅ 历史数据加载完成，共 ${batchData.length} 期`);
        } catch (error) {
            console.error('加载历史数据失败:', error);
            this.showError('历史数据加载失败，预测精度可能受影响');
        }
    }

    computeHistorySignature(data) {
        if (!data || data.length === 0) return 'empty';
        const top = data.slice(0, 20);
        const expects = top.map(d => d.expect).join('|');
        const nums = top.map(d => (d.numbers || []).join(',')).join('|');
        let h = 0;
        const s = expects + '#' + nums;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return `${top.length}-${h}`;
    }

    /**
     * 显示历史数据
     * @param {Array} data - 历史数据
     */
    displayHistoryData(data) {
        const historyList = document.getElementById('historyDataList');
        if (!historyList) return;

        const displayData = data.slice(0, 20); // 只显示最近20期

        if (displayData.length === 0) {
            historyList.innerHTML = '<div class="no-data">暂无历史数据</div>';
            return;
        }

        historyList.innerHTML = displayData.map((item, index) => `
            <div class="history-item ${index === 0 ? 'latest' : ''}">
                <div class="history-period">${item.expect}</div>
                <div class="history-numbers">
                    ${item.numbers.map(num => `
                        <div class="history-number ${index === 0 ? 'highlight' : ''}">${num.toString().padStart(2, '0')}</div>
                    `).join('')}
                </div>
                <div class="history-time">${item.openTime || '-'}</div>
                ${item.wave.length > 0 ? `<div class="history-wave">${item.wave.join(', ')}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * 更新数据统计
     * @param {Array} data - 历史数据
     */
    updateDataStats(data) {
        const statsElement = document.getElementById('dataStats');
        if (!statsElement || data.length === 0) return;

        const allNumbers = data.flatMap(item => item.numbers);
        const frequency = {};

        for (let i = 1; i <= 49; i++) {
            frequency[i] = 0;
        }

        allNumbers.forEach(num => {
            if (num >= 1 && num <= 49) {
                frequency[num]++;
            }
        });

        const sortedFreq = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        statsElement.innerHTML = `
            <div class="stats-section">
                <h5>数据统计</h5>
                <div class="stat-item">
                    <span>数据期数:</span>
                    <strong>${data.length}</strong>
                </div>
                <div class="stat-item">
                    <span>号码总数:</span>
                    <strong>${allNumbers.length}</strong>
                </div>
                <div class="stat-item">
                    <span>高频号码(前10):</span>
                    <div class="high-freq">
                        ${sortedFreq.map(([num, freq]) =>
                            `<span class="freq-number">${num}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 执行预测
     */
    async executePrediction() {
        if (this.isPredicting) {
            this.showError('预测正在进行中，请稍候...');
            return;
        }

        try {
            await this.loadHistoryData(this.currentLotteryType);
        } catch {}
        if (this.historyData.length < 10) {
            this.showError('历史数据不足，无法进行有效预测');
            return;
        }

        this.isPredicting = true;
        this.showPredictionLoading();

        try {
            console.log('🔮 开始执行预测分析...');

            // 执行预测
            const predictionResult = await this.engine.predict(this.historyData, {
                lotteryType: this.currentLotteryType,
                period: this.currentPeriod
            });

            // 显示预测结果
            this.displayPredictionResult(predictionResult);

            // 保存预测记录
            this.savePredictionRecord(predictionResult);

            console.log('✅ 预测完成');
        } catch (error) {
            console.error('预测失败:', error);
            this.showError('预测失败: ' + error.message);
        } finally {
            this.isPredicting = false;
            this.hidePredictionLoading();
        }
    }

    /**
     * 显示预测加载状态
     */
    showPredictionLoading() {
        const loadingElement = document.getElementById('predictionLoading');
        const btnElement = document.getElementById('predictionBtn');

        if (loadingElement) {
            loadingElement.style.display = 'block';
        }

        if (btnElement) {
            btnElement.disabled = true;
            btnElement.textContent = '预测中...';
        }

        // 显示分析步骤
        this.showAnalysisSteps();
    }

    /**
     * 隐藏预测加载状态
     */
    hidePredictionLoading() {
        const loadingElement = document.getElementById('predictionLoading');
        const btnElement = document.getElementById('predictionBtn');

        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        if (btnElement) {
            btnElement.disabled = false;
            btnElement.textContent = '开始预测';
        }
    }

    /**
     * 显示分析步骤
     */
    showAnalysisSteps() {
        const steps = [
            { id: 'step1', text: '🔍 数据预处理中...', delay: 0 },
            { id: 'step2', text: '📊 频率分析中...', delay: 500 },
            { id: 'step3', text: '🔄 模式识别中...', delay: 1000 },
            { id: 'step4', text: '📈 趋势分析中...', delay: 1500 },
            { id: 'step5', text: '🔁 周期分析中...', delay: 2000 },
            { id: 'step6', text: '🎯 聚类分析中...', delay: 2500 },
            { id: 'step7', text: '🧠 神经网络分析中...', delay: 3000 },
            { id: 'step8', text: '⚡ 集成预测中...', delay: 3500 },
            { id: 'step9', text: '✅ 生成最终预测...', delay: 4000 }
        ];

        const stepsContainer = document.getElementById('analysisSteps');
        if (!stepsContainer) return;

        stepsContainer.innerHTML = '';

        steps.forEach(step => {
            setTimeout(() => {
                const stepElement = document.createElement('div');
                stepElement.id = step.id;
                stepElement.className = 'analysis-step active';
                stepElement.textContent = step.text;
                stepsContainer.appendChild(stepElement);

                setTimeout(() => {
                    stepElement.classList.add('completed');
                }, 400);
            }, step.delay);
        });
    }

    /**
     * 获取波色样式类
     * @param {string} wave - 波色
     * @returns {string} 样式类名
     */
    getWaveClass(wave) {
        if (!wave) return '';

        const normalized = wave.toString().trim().toLowerCase();
        if (normalized.includes('红') || normalized.includes('red')) return 'wave-red';
        if (normalized.includes('蓝') || normalized.includes('blue')) return 'wave-blue';
        if (normalized.includes('绿') || normalized.includes('green')) return 'wave-green';

        return '';
    }

    /**
     * 获取生肖样式类
     * @param {string} zodiac - 生肖
     * @returns {string} 样式类名
     */
    getZodiacClass(zodiac) {
        if (!zodiac) return '';

        const zodiacMap = {
            '鼠': 'zodiac-rat', '子': 'zodiac-rat', 'mouse': 'zodiac-rat',
            '牛': 'zodiac-ox', '丑': 'zodiac-ox', 'ox': 'zodiac-ox',
            '虎': 'zodiac-tiger', '寅': 'zodiac-tiger', 'tiger': 'zodiac-tiger',
            '兔': 'zodiac-rabbit', '卯': 'zodiac-rabbit', 'rabbit': 'zodiac-rabbit',
            '龙': 'zodiac-dragon', '辰': 'zodiac-dragon', 'dragon': 'zodiac-dragon',
            '蛇': 'zodiac-snake', '巳': 'zodiac-snake', 'snake': 'zodiac-snake',
            '马': 'zodiac-horse', '午': 'zodiac-horse', 'horse': 'zodiac-horse',
            '羊': 'zodiac-goat', '未': 'zodiac-goat', 'goat': 'zodiac-goat', 'sheep': 'zodiac-goat',
            '猴': 'zodiac-monkey', '申': 'zodiac-monkey', 'monkey': 'zodiac-monkey',
            '鸡': 'zodiac-rooster', '酉': 'zodiac-rooster', 'rooster': 'zodiac-rooster', 'chicken': 'zodiac-rooster',
            '狗': 'zodiac-dog', '戌': 'zodiac-dog', 'dog': 'zodiac-dog',
            '猪': 'zodiac-pig', '亥': 'zodiac-pig', 'pig': 'zodiac-pig'
        };

        return zodiacMap[zodiac.toString().trim()] || '';
    }

    /**
     * 获取波色图标
     * @param {string} wave - 波色
     * @returns {string} 波色图标
     */
    getWaveIcon(wave) {
        if (!wave) return '';

        const normalized = wave.toString().trim().toLowerCase();
        if (normalized.includes('红') || normalized.includes('red')) return '🔴';
        if (normalized.includes('蓝') || normalized.includes('blue')) return '🔵';
        if (normalized.includes('绿') || normalized.includes('green')) return '🟢';

        return '';
    }

    /**
     * 获取生肖图标
     * @param {string} zodiac - 生肖
     * @returns {string} 生肖图标
     */
    getZodiacIcon(zodiac) {
        if (!zodiac) return '';

        const zodiacIcons = {
            '鼠': '🐭', '子': '🐭', 'mouse': '🐭',
            '牛': '🐮', '丑': '🐮', 'ox': '🐮',
            '虎': '🐯', '寅': '🐯', 'tiger': '🐯',
            '兔': '🐰', '卯': '🐰', 'rabbit': '🐰',
            '龙': '🐲', '辰': '🐲', 'dragon': '🐲',
            '蛇': '🐍', '巳': '🐍', 'snake': '🐍',
            '马': '🐴', '午': '🐴', 'horse': '🐴',
            '羊': '🐑', '未': '🐑', 'goat': '🐑', 'sheep': '🐑',
            '猴': '🐵', '申': '🐵', 'monkey': '🐵',
            '鸡': '🐔', '酉': '🐔', 'rooster': '🐔', 'chicken': '🐔',
            '狗': '🐶', '戌': '🐶', 'dog': '🐶',
            '猪': '🐷', '亥': '🐷', 'pig': '🐷'
        };

        return zodiacIcons[zodiac.toString().trim()] || '';
    }

    /**
     * 渲染波色分布
     * @param {Array} waves - 波色数组
     * @returns {string} HTML字符串
     */
    renderWaveDistribution(waves) {
        if (!waves || waves.length === 0) return '暂无数据';

        const distribution = { red: 0, blue: 0, green: 0, unknown: 0 };
        waves.forEach(wave => {
            const normalized = this.normalizeWave(wave);
            if (distribution.hasOwnProperty(normalized)) {
                distribution[normalized]++;
            }
        });

        const total = waves.filter(w => this.normalizeWave(w) !== 'unknown').length;
        if (total === 0) return '暂无有效数据';

        const items = [];
        Object.entries(distribution)
            .filter(([key]) => key !== 'unknown' && distribution[key] > 0)
            .sort((a, b) => b[1] - a[1])
            .forEach(([wave, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                items.push(`
                    <span class="wave-item wave-${wave}">
                        ${this.getWaveIcon(wave)} ${wave} ${percentage}%
                    </span>
                `);
            });

        return items.join('');
    }

    /**
     * 渲染生肖分布
     * @param {Array} zodiacs - 生肖数组
     * @returns {string} HTML字符串
     */
    renderZodiacDistribution(zodiacs) {
        if (!zodiacs || zodiacs.length === 0) return '暂无数据';

        const distribution = {};
        zodiacs.forEach(zodiac => {
            const normalized = this.normalizeZodiac(zodiac);
            distribution[normalized] = (distribution[normalized] || 0) + 1;
        });

        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        const items = [];

        Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6) // 只显示前6个
            .forEach(([zodiac, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                items.push(`
                    <span class="zodiac-item zodiac-${this.getZodiacClass(zodiac)}">
                        ${this.getZodiacIcon(zodiac)} ${zodiac} ${percentage}%
                    </span>
                `);
            });

        return items.join('');
    }

    /**
     * 标准化波色名称
     * @param {string} wave - 原始波色
     * @returns {string} 标准化波色
     */
    normalizeWave(wave) {
        if (!wave || typeof wave !== 'string') return 'unknown';

        const normalized = wave.trim().toLowerCase();
        if (normalized.includes('红') || normalized.includes('red')) return 'red';
        if (normalized.includes('蓝') || normalized.includes('blue')) return 'blue';
        if (normalized.includes('绿') || normalized.includes('green')) return 'green';

        return 'unknown';
    }

    /**
     * 标准化生肖名称
     * @param {string} zodiac - 原始生肖
     * @returns {string} 标准化生肖
     */
    normalizeZodiac(zodiac) {
        if (!zodiac || typeof zodiac !== 'string') return 'unknown';

        const normalized = zodiac.trim();
        const zodiacMap = {
            '鼠': '鼠', '子': '鼠', 'mouse': '鼠', 'rat': '鼠',
            '牛': '牛', '丑': '牛', 'ox': '牛', 'cow': '牛', 'bull': '牛',
            '虎': '虎', '寅': '虎', 'tiger': '虎',
            '兔': '兔', '卯': '兔', 'rabbit': '兔',
            '龙': '龙', '辰': '龙', 'dragon': '龙',
            '蛇': '蛇', '巳': '蛇', 'snake': '蛇',
            '马': '马', '午': '马', 'horse': '马',
            '羊': '羊', '未': '羊', 'goat': '羊', 'sheep': '羊',
            '猴': '猴', '申': '猴', 'monkey': '猴',
            '鸡': '鸡', '酉': '鸡', 'rooster': '鸡', 'chicken': '鸡',
            '狗': '狗', '戌': '狗', 'dog': '狗',
            '猪': '猪', '亥': '猪', 'pig': '猪'
        };

        return zodiacMap[normalized] || normalized;
    }

    /**
     * 渲染迷你波色分布
     * @param {Object} frequency - 波色频率
     * @returns {string} HTML字符串
     */
    renderMiniWaveDistribution(frequency) {
        const total = Object.values(frequency).reduce((sum, count) => sum + count, 0);
        if (total === 0) return '暂无数据';

        return Object.entries(frequency)
            .filter(([wave]) => wave !== 'unknown' && frequency[wave] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([wave, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                const icon = this.getWaveIcon(wave);
                return `<span class="mini-wave-item wave-${wave}">${icon} ${wave} ${percentage}%</span>`;
            })
            .join('');
    }

    /**
     * 渲染迷你生肖分布
     * @param {Object} frequency - 生肖频率
     * @returns {string} HTML字符串
     */
    renderMiniZodiacDistribution(frequency) {
        const total = Object.values(frequency).reduce((sum, count) => sum + count, 0);
        if (total === 0) return '暂无数据';

        return Object.entries(frequency)
            .filter(([zodiac]) => zodiac !== 'unknown' && frequency[zodiac] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([zodiac, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                const icon = this.getZodiacIcon(zodiac);
                return `<span class="mini-zodiac-item zodiac-${this.getZodiacClass(zodiac)}">${icon} ${zodiac} ${percentage}%</span>`;
            })
            .join('');
    }

    /**
     * 显示预测结果
     * @param {Object} result - 预测结果
     */
    displayPredictionResult(result) {
        const resultContainer = document.getElementById('predictionResult');
        if (!resultContainer) return;

        const { predictions, confidence, analysis, reasoning, metadata } = result;

        resultContainer.innerHTML = `
            <div class="prediction-result-card">
                <div class="result-header">
                    <h4>🎯 预测结果</h4>
                    <div class="confidence-badge">
                        置信度: ${confidence.toFixed(1)}%
                    </div>
                </div>

                <div class="prediction-section">
                    <h5>推荐号码</h5>
                    <div class="prediction-numbers recommended">
                        ${predictions.recommended.map(num => `
                            <div class="prediction-number recommended">${num.toString().padStart(2, '0')}</div>
                        `).join('')}
                    </div>
                </div>

                <div class="prediction-section">
                    <h5>备选号码</h5>
                    <div class="prediction-numbers alternative">
                        ${predictions.alternative.map(num => `
                            <div class="prediction-number alternative">${num.toString().padStart(2, '0')}</div>
                        `).join('')}
                    </div>
                </div>

                <div class="analysis-info">
                    <h5>📊 分析信息</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">数据期数:</span>
                            <span class="value">${analysis.dataPeriods}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">算法数量:</span>
                            <span class="value">${analysis.algorithms.length}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">集成分数:</span>
                            <span class="value">${(analysis.ensembleScore * 100).toFixed(1)}%</span>
                        </div>
                        <div class="info-item">
                            <span class="label">预测时间:</span>
                            <span class="value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                ${analysis.waveAnalysis ? `
                <div class="wave-analysis-info">
                    <h5>🌊 波色分析</h5>
                    <div class="wave-analysis-grid">
                        <div class="info-item">
                            <span class="label">主波色:</span>
                            <span class="value">${analysis.waveAnalysis.details?.waveStats?.dominant || '未知'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">波色分布:</span>
                            <div class="wave-distribution-mini">
                                ${this.renderMiniWaveDistribution(analysis.waveAnalysis.details?.waveFrequency || {})}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${analysis.zodiacAnalysis ? `
                <div class="zodiac-analysis-info">
                    <h5>🐲 生肖分析</h5>
                    <div class="zodiac-analysis-grid">
                        <div class="info-item">
                            <span class="label">主生肖:</span>
                            <span class="value">${analysis.zodiacAnalysis.details?.zodiacStats?.dominant || '未知'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">生肖分布:</span>
                            <div class="zodiac-distribution-mini">
                                ${this.renderMiniZodiacDistribution(analysis.zodiacAnalysis.details?.zodiacFrequency || {})}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="reasoning-info">
                    <h5>🧠 分析推理</h5>
                    <ul class="reasoning-list">
                        ${reasoning.map(reason => `
                            <li>${reason}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="metadata-info">
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="label">系统版本:</span>
                            <span class="value">${metadata.version}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">算法:</span>
                            <span class="value">${metadata.algorithm}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">数据质量:</span>
                            <span class="value">${this.getDataQualityText(metadata.dataQuality)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 显示结果容器
        resultContainer.style.display = 'block';

        // 滚动到结果位置
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * 获取数据质量文本
     * @param {string} quality - 数据质量等级
     * @returns {string} 中文描述
     */
    getDataQualityText(quality) {
        const qualityMap = {
            excellent: '优秀',
            good: '良好',
            fair: '一般',
            poor: '较差'
        };
        return qualityMap[quality] || '未知';
    }

    /**
     * 保存预测记录
     * @param {Object} result - 预测结果
     */
    savePredictionRecord(result) {
        const record = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            lotteryType: this.currentLotteryType,
            lotteryName: this.lotteryTypes[this.currentLotteryType].name,
            period: this.currentPeriod,
            predictions: result.predictions,
            confidence: result.confidence,
            analysis: result.analysis,
            status: 'pending' // pending, correct, wrong
        };

        this.records.unshift(record);

        // 保留最近100条记录
        if (this.records.length > 100) {
            this.records.splice(100);
        }

        this.updatePredictionHistory();
    }

    /**
     * 更新预测历史显示
     */
    updatePredictionHistory() {
        const historyList = document.getElementById('predictionHistoryList');
        if (!historyList) return;

        // 过滤当前彩票类型的记录
        const currentLotteryRecords = this.records.filter(
            record => record.lotteryType === this.currentLotteryType
        ).slice(0, 10);

        if (currentLotteryRecords.length === 0) {
            historyList.innerHTML = '<div class="no-records">暂无预测记录</div>';
            return;
        }

        historyList.innerHTML = currentLotteryRecords.map(record => {
            const date = new Date(record.timestamp);
            const statusClass = record.status;
            const statusText = record.status === 'pending' ? '待开奖' :
                              record.status === 'correct' ? '预测正确' : '预测错误';

            return `
                <div class="prediction-record ${statusClass}">
                    <div class="record-header">
                        <span class="record-period">${record.period}</span>
                        <span class="record-time">${date.toLocaleDateString()}</span>
                        <span class="record-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="record-numbers">
                        ${record.predictions.recommended.map(num => `
                            <span class="record-number">${num.toString().padStart(2, '0')}</span>
                        `).join(' ')}
                    </div>
                    <div class="record-confidence">
                        置信度: ${record.confidence.toFixed(1)}%
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 刷新数据
     */
    async refreshData() {
        if (this.isPredicting) return;

        this.showLoading('刷新数据中...');
        this.api.clearCache();

        try {
            await this.loadLotteryType(this.currentLotteryType);
            this.showSuccess('数据刷新成功');
        } catch (error) {
            console.error('数据刷新失败:', error);
            this.showError('数据刷新失败');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.api.clearCache();
        this.showSuccess('缓存已清除');
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    showLoading(message = '加载中...') {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.textContent = message;
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 显示成功消息
     * @param {string} message - 成功消息
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, info)
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        // 添加到页面
        document.body.appendChild(messageElement);

        // 自动移除
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);

        // 添加样式
        if (!document.getElementById('messageStyles')) {
            const style = document.createElement('style');
            style.id = 'messageStyles';
            style.textContent = `
                .message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 6px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                }
                .message-success {
                    background-color: #10b981;
                }
                .message-error {
                    background-color: #ef4444;
                }
                .message-info {
                    background-color: #3b82f6;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 导出UI控制器
window.PredictionSystemUI = PredictionSystemUI;
