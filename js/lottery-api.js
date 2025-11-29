/**
 * 新型彩票数据API管理器
 * 基于ttc5188.com API接口
 */
class LotteryDataAPI {
    constructor() {
        this.baseURL = 'https://ttc5188.com/api';
        this.cache = null;
        this.cacheTimeout = 0;
    }

    /**
     * 获取最新开奖结果
     * @param {string} lotteryCode - 彩票类型代码
     * @returns {Promise<Object>} 最新开奖数据
     */
    async getCurrentResult(lotteryCode) {
        try {
            const ts = Date.now().toString();
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/current/${lotteryCode}?_ts=${ts}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // 验证新API格式的数据结构
            if (!this.validateCurrentResult(data)) {
                throw new Error('API返回数据格式不正确');
            }

            const formattedData = this.formatCurrentResult(data);

            return formattedData;
        } catch (error) {
            console.error(`获取${lotteryCode}最新结果失败:`, error);
            throw error;
        }
    }

    /**
     * 获取历史开奖结果
     * @param {string} lotteryCode - 彩票类型代码
     * @param {Object} options - 查询参数
     * @returns {Promise<Object>} 历史开奖数据
     */
    async getHistoryResult(lotteryCode, options = {}) {
        const { year = new Date().getFullYear(), page = 1, pageSize = 10 } = options;
        try {
            const params = new URLSearchParams({
                year: year.toString(),
                page: page.toString(),
                pageSize: pageSize.toString(),
                _ts: Date.now().toString()
            });
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/history/${lotteryCode}?${params}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // 验证新API格式的数据结构
            if (!this.validateHistoryResult(data)) {
                throw new Error('API返回历史数据格式不正确');
            }

            const formattedData = this.formatHistoryResult(data);

            return formattedData;
        } catch (error) {
            console.error(`获取${lotteryCode}历史结果失败:`, error);
            throw error;
        }
    }

    /**
     * 批量获取历史数据（用于预测分析）
     * @param {string} lotteryCode - 彩票类型代码
     * @param {number} years - 获取最近几年的数据
     * @returns {Promise<Array>} 完整历史数据
     */
    async getBatchHistoryData(lotteryCode, years = 2) {
        const currentYear = new Date().getFullYear();
        const allData = [];

        for (let i = 0; i < years; i++) {
            const year = currentYear - i;
            try {
                const yearData = await this.getHistoryResult(lotteryCode, { year, pageSize: 100 });
                allData.push(...yearData.data);
            } catch (error) {
                console.warn(`获取${year}年数据失败:`, error.message);
            }
        }

        // 按期号排序
        allData.sort((a, b) => {
            const periodA = parseInt(a.expect.replace(/[^\d]/g, ''));
            const periodB = parseInt(b.expect.replace(/[^\d]/g, ''));
            return periodB - periodA; // 降序排列，最新的在前
        });

        return allData;
    }

    /**
     * 验证最新结果数据格式
     * @param {Object} data - 原始API数据
     * @returns {boolean} 是否有效
     */
    validateCurrentResult(data) {
        return data &&
               typeof data.expect === 'string' &&
               typeof data.open_code === 'string' &&
               typeof data.open_time === 'string';
    }

    /**
     * 验证历史结果数据格式
     * @param {Object} data - 原始API数据
     * @returns {boolean} 是否有效
     */
    validateHistoryResult(data) {
        return data &&
               Array.isArray(data.data) &&
               data.pagination &&
               typeof data.pagination.currentPage === 'number' &&
               typeof data.pagination.pageSize === 'number' &&
               typeof data.pagination.total === 'number' &&
               typeof data.pagination.totalPages === 'number';
    }

    /**
     * 格式化最新结果数据
     * @param {Object} data - 原始API数据
     * @returns {Object} 格式化后的数据
     */
    formatCurrentResult(data) {
        // 新API格式: expect, open_code, open_time, wave, zodiac
        return {
            expect: data.expect,
            numbers: data.open_code ? data.open_code.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [],
            openTime: data.open_time,
            wave: data.wave ? data.wave.split(',').map(w => w.trim()) : [],
            zodiac: data.zodiac ? data.zodiac.split(',').map(z => z.trim()) : [],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 格式化历史结果数据
     * @param {Object} data - 原始API数据
     * @returns {Object} 格式化后的数据
     */
    formatHistoryResult(data) {
        // 新API格式: data数组包含expect, open_code, open_time, wave, zodiac
        const formattedData = data.data.map(item => ({
            expect: item.expect,
            numbers: item.open_code ? item.open_code.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [],
            openTime: item.open_time,
            wave: item.wave ? item.wave.split(',').map(w => w.trim()) : [],
            zodiac: item.zodiac ? item.zodiac.split(',').map(z => z.trim()) : []
        }));

        return {
            data: formattedData,
            pagination: data.pagination || {
                currentPage: 1,
                pageSize: formattedData.length,
                total: formattedData.length,
                totalPages: 1
            }
        };
    }

    /**
     * 获取请求头
     * @returns {Object} 请求头配置
     */
    getHeaders() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Lottery-Prediction-System/2.0',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    /**
     * 带超时的fetch请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<Response>} fetch响应
     */
    async fetchWithTimeout(url, options = {}, timeout = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            throw error;
        }
    }

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @returns {*} 缓存数据或null
     */
    getCache(key) { return null; }

    /**
     * 设置缓存数据
     * @param {string} key - 缓存键
     * @param {*} data - 要缓存的数据
     */
    setCache(key, data) { }

    /**
     * 清除缓存
     * @param {string} pattern - 缓存键模式（可选）
     */
    clearCache(pattern = null) { }

    /**
     * 获取支持的彩票类型
     * @returns {Object} 支持的彩票类型配置
     */
    getSupportedLotteries() {
        return {
            tianTianCai: {
                name: '天天彩',
                description: '每日开奖彩票',
                numberRange: [1, 49],
                numberCount: 6
            },
            macaujc2: {
                name: '澳门六合彩(第二套)',
                description: '澳门六合彩第二套开奖',
                numberRange: [1, 49],
                numberCount: 6
            },
            macaujc: {
                name: '澳门六合彩',
                description: '澳门六合彩开奖',
                numberRange: [1, 49],
                numberCount: 6
            },
            macaujc3: {
                name: '澳门六合彩(第三套)',
                description: '澳门六合彩第三套开奖',
                numberRange: [1, 49],
                numberCount: 6
            },
            hongkong: {
                name: '香港六合彩',
                description: '香港六合彩开奖',
                numberRange: [1, 49],
                numberCount: 6
            }
        };
    }

    /**
     * 验证彩票代码
     * @param {string} lotteryCode - 彩票代码
     * @returns {boolean} 是否有效
     */
    isValidLotteryCode(lotteryCode) {
        const supported = this.getSupportedLotteries();
        return Object.keys(supported).includes(lotteryCode);
    }
}

// 导出API管理器实例
window.LotteryDataAPI = LotteryDataAPI;
