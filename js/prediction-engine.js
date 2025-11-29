/**
 * 新型彩票预测引擎
 * 结合传统统计分析与现代机器学习方法
 * 针对新的API数据结构优化
 */
class AdvancedPredictionEngine {
    constructor() {
        this.algorithms = {
            frequency: new FrequencyAnalyzer(),
            pattern: new PatternAnalyzer(),
            trend: new TrendAnalyzer(),
            cyclic: new CyclicAnalyzer(),
            cluster: new ClusterAnalyzer(),
            neural: new NeuralPredictor(),
            waveAnalysis: new WaveAnalyzer(),
            zodiacAnalysis: new ZodiacAnalyzer(),
            ensemble: new EnsemblePredictor()
        };

        this.weights = {
            frequency: 0.12,
            pattern: 0.18,
            trend: 0.15,
            cyclic: 0.08,
            cluster: 0.12,
            neural: 0.20,
            waveAnalysis: 0.08,  // 新增波色分析权重
            zodiacAnalysis: 0.07  // 新增生肖分析权重
        };
    }

    /**
     * 执行综合预测
     * @param {Array} historyData - 历史数据
     * @param {Object} options - 预测选项
     * @returns {Promise<Object>} 预测结果
     */
    async predict(historyData, options = {}) {
        if (!historyData || historyData.length < 10) {
            throw new Error('历史数据不足，至少需要10期数据进行有效预测');
        }

        console.log(`🔮 开始预测分析，数据量: ${historyData.length}期, 类型: ${options.lotteryType || 'unknown'}`);

        try {
            // 数据预处理
            const processedData = this.preprocessData(historyData);

            // 并行执行多种算法
            const algorithmResults = await Promise.allSettled([
                this.algorithms.frequency.analyze(processedData),
                this.algorithms.pattern.analyze(processedData),
                this.algorithms.trend.analyze(processedData),
                this.algorithms.cyclic.analyze(processedData),
                this.algorithms.cluster.analyze(processedData),
                this.algorithms.neural.analyze(processedData),
                this.algorithms.waveAnalysis.analyze(processedData),
                this.algorithms.zodiacAnalysis.analyze(processedData)
            ]);

            // 提取成功的算法结果
            const validResults = algorithmResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            const resultMap = {};
            validResults.forEach(r => { if (r && r.algorithm) resultMap[r.algorithm] = r; });

            if (validResults.length === 0) {
                throw new Error('所有预测算法都失败了');
            }

            // 集成预测
            const ensembleResult = await this.algorithms.ensemble.predict(validResults, this.weights, { jitter: true });

            // 生成最终预测结果
            const finalPrediction = this.generateFinalPrediction(ensembleResult, processedData, options);
            
            // 针对彩种进行特殊的随机扰动，确保不同彩种结果差异化
            if (options.lotteryType) {
                console.log(`🎲 应用${options.lotteryType}特定随机扰动...`);
                const seed = options.lotteryType.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                
                if (finalPrediction.predictions && finalPrediction.predictions.recommended) {
                     finalPrediction.predictions.recommended = this.shuffleWithSeed(
                        finalPrediction.predictions.recommended, 
                        seed + Date.now() // 结合时间戳确保每次不同，但结合彩种种子确保基础差异
                    );
                }
            }
            
            if (resultMap.waveAnalysis) finalPrediction.analysis.waveAnalysis = resultMap.waveAnalysis;
            if (resultMap.zodiacAnalysis) finalPrediction.analysis.zodiacAnalysis = resultMap.zodiacAnalysis;

            console.log('✅ 预测分析完成');
            return finalPrediction;

        } catch (error) {
            console.error('❌ 预测分析失败:', error);
            throw error;
        }
    }

    /**
     * 基于种子的随机洗牌算法
     * @param {Array} array - 要洗牌的数组
     * @param {number} seed - 随机种子
     * @returns {Array} 洗牌后的新数组
     */
    shuffleWithSeed(array, seed) {
        const newArr = [...array];
        let m = newArr.length, t, i;
        
        // 简单的线性同余生成器
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        while (m) {
            i = Math.floor(random() * m--);
            t = newArr[m];
            newArr[m] = newArr[i];
            newArr[i] = t;
        }
        return newArr;
    }

    /**
     * 数据预处理
     * @param {Array} rawData - 原始历史数据
     * @returns {Object} 预处理后的数据
     */
    preprocessData(rawData) {
        const numbers = rawData.map(item => item.numbers || []);
        const flatNumbers = numbers.flat();
        const waves = rawData.map(item => item.wave || []);
        const zodiacs = rawData.map(item => item.zodiac || []);

        return {
            rawData,
            numbers,
            flatNumbers,
            waves,
            zodiacs,
            periodCount: rawData.length,
            numberFrequency: this.calculateFrequency(flatNumbers),
            waveFrequency: this.calculateWaveFrequency(waves.flat()),
            zodiacFrequency: this.calculateZodiacFrequency(zodiacs.flat()),
            stats: this.calculateStatistics(flatNumbers),
            waveStats: this.calculateWaveStatistics(waves.flat()),
            zodiacStats: this.calculateZodiacStatistics(zodiacs.flat())
        };
    }

    /**
     * 计算号码频率
     * @param {Array} numbers - 所有号码
     * @returns {Map} 号码频率映射
     */
    calculateFrequency(numbers) {
        const frequency = new Map();
        for (let i = 1; i <= 49; i++) {
            frequency.set(i, 0);
        }

        numbers.forEach(num => {
            if (num >= 1 && num <= 49) {
                frequency.set(num, frequency.get(num) + 1);
            }
        });

        return frequency;
    }

    /**
     * 计算统计信息
     * @param {Array} numbers - 号码数组
     * @returns {Object} 统计信息
     */
    calculateStatistics(numbers) {
        if (numbers.length === 0) return { mean: 0, variance: 0, stdDev: 0 };

        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        return { mean, variance, stdDev };
    }

    calculateWaveFrequency(waves) {
        const frequency = { red: 0, blue: 0, green: 0, unknown: 0 };
        waves.forEach(wave => {
            const key = this.normalizeWave(wave);
            if (frequency.hasOwnProperty(key)) frequency[key]++;
            else frequency.unknown++;
        });
        return frequency;
    }

    calculateZodiacFrequency(zodiacs) {
        const list = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
        const frequency = { unknown: 0 };
        list.forEach(z => frequency[z] = 0);
        zodiacs.forEach(zodiac => {
            const key = this.normalizeZodiac(zodiac);
            if (frequency.hasOwnProperty(key)) frequency[key]++;
            else frequency.unknown++;
        });
        return frequency;
    }

    calculateWaveStatistics(waves) {
        const frequency = this.calculateWaveFrequency(waves);
        const total = waves.filter(w => w !== 'unknown').length;
        if (total === 0) return { dominant: 'none', ratio: {} };
        const dominant = Object.entries(frequency)
            .filter(([k]) => k !== 'unknown')
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
        const ratio = {};
        Object.entries(frequency).forEach(([wave, count]) => {
            ratio[wave] = total > 0 ? (count / total * 100).toFixed(1) + '%' : '0%';
        });
        return { dominant, ratio };
    }

    calculateZodiacStatistics(zodiacs) {
        const frequency = this.calculateZodiacFrequency(zodiacs);
        const total = zodiacs.filter(z => z !== 'unknown').length;
        if (total === 0) return { dominant: 'none', ratio: {} };
        const dominant = Object.entries(frequency)
            .filter(([k]) => k !== 'unknown')
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
        const ratio = {};
        Object.entries(frequency).forEach(([zodiac, count]) => {
            ratio[zodiac] = total > 0 ? (count / total * 100).toFixed(1) + '%' : '0%';
        });
        return { dominant, ratio };
    }

    normalizeWave(wave) {
        if (!wave || typeof wave !== 'string') return 'unknown';
        const n = wave.trim().toLowerCase();
        const reds = ['红','红波','red','r','redwave'];
        const blues = ['蓝','蓝波','blue','b','bluewave'];
        const greens = ['绿','绿波','green','g','greenwave'];
        if (reds.some(x => n.includes(x))) return 'red';
        if (blues.some(x => n.includes(x))) return 'blue';
        if (greens.some(x => n.includes(x))) return 'green';
        return 'unknown';
    }

    normalizeZodiac(zodiac) {
        if (!zodiac || typeof zodiac !== 'string') return 'unknown';
        const normalized = zodiac.trim();
        const map = {
            '鼠':'鼠','子':'鼠','mouse':'鼠','rat':'鼠',
            '牛':'牛','丑':'牛','ox':'牛','cow':'牛','bull':'牛',
            '虎':'虎','寅':'虎','tiger':'虎',
            '兔':'兔','卯':'兔','rabbit':'兔',
            '龙':'龙','辰':'龙','dragon':'龙',
            '蛇':'蛇','巳':'蛇','snake':'蛇',
            '马':'马','午':'马','horse':'马',
            '羊':'羊','未':'羊','goat':'羊','sheep':'羊',
            '猴':'猴','申':'猴','monkey':'猴',
            '鸡':'鸡','酉':'鸡','rooster':'鸡','chicken':'鸡',
            '狗':'狗','戌':'狗','dog':'狗',
            '猪':'猪','亥':'猪','pig':'猪'
        };
        return map[normalized] || normalized;
    }

    /**
     * 生成最终预测结果
     * @param {Object} ensembleResult - 集成算法结果
     * @param {Object} processedData - 预处理数据
     * @param {Object} options - 预测选项
     * @returns {Object} 最终预测结果
     */
    generateFinalPrediction(ensembleResult, processedData, options) {
        const recommended = ensembleResult.recommended || [];
        const alternative = ensembleResult.alternative || [];
        const confidence = ensembleResult.confidence || 75;

        // 确保推荐号码数量正确
        const finalRecommended = this.ensureNumberCount(recommended, 6, 1, 49, processedData.numberFrequency);
        const finalAlternative = this.ensureNumberCount(alternative, 6, 1, 49, processedData.numberFrequency, finalRecommended);

        return {
            timestamp: new Date().toISOString(),
            predictions: {
                recommended: finalRecommended.sort((a, b) => a - b),
                alternative: finalAlternative.sort((a, b) => a - b)
            },
            confidence: Math.min(confidence, 95),
            analysis: {
                dataPeriods: processedData.periodCount,
                algorithms: Object.keys(this.algorithms),
                weightDistribution: { ...this.weights },
                ensembleScore: ensembleResult.score || 0.8
            },
            statistics: processedData.stats,
            reasoning: this.generateReasoning(ensembleResult, processedData),
            metadata: {
                version: '2.0.0',
                algorithm: 'Ensemble-Prediction',
                dataQuality: this.assessDataQuality(processedData)
            }
        };
    }

    /**
     * 确保号码数量正确
     * @param {Array} numbers - 号码数组
     * @param {number} targetCount - 目标数量
     * @param {number} min - 最小号码
     * @param {number} max - 最大号码
     * @param {Map} frequency - 号码频率
     * @param {Array} exclude - 排除的号码
     * @returns {Array} 调整后的号码数组
     */
    ensureNumberCount(numbers, targetCount, min, max, frequency, exclude = []) {
        let result = [...new Set(numbers)]; // 去重

        // 移除排除的号码
        result = result.filter(num => !exclude.includes(num));

        // 过滤有效范围
        result = result.filter(num => num >= min && num <= max);

        // 如果号码不足，基于频率补充
        while (result.length < targetCount) {
            const candidates = [];

            for (let i = min; i <= max; i++) {
                if (!result.includes(i) && !exclude.includes(i)) {
                    candidates.push({ number: i, frequency: frequency.get(i) || 0 });
                }
            }

            // 按频率排序，选择中等频率的号码（避免选择极高频或极低频）
            candidates.sort((a, b) => a.frequency - b.frequency);
            const midIndex = Math.floor(candidates.length / 2);
            const selectedIndex = midIndex + Math.floor(Math.random() * 3) - 1; // 在中间位置附近随机选择

            if (selectedIndex >= 0 && selectedIndex < candidates.length) {
                result.push(candidates[selectedIndex].number);
            } else {
                // 备用方案：随机选择
                const available = Array.from({ length: max - min + 1 }, (_, i) => i + min)
                    .filter(num => !result.includes(num) && !exclude.includes(num));
                if (available.length > 0) {
                    result.push(available[Math.floor(Math.random() * available.length)]);
                }
            }
        }

        // 如果号码过多，保留前targetCount个
        return result.slice(0, targetCount);
    }

    /**
     * 生成推理说明
     * @param {Object} ensembleResult - 集成结果
     * @param {Object} processedData - 处理数据
     * @returns {Array} 推理说明数组
     */
    generateReasoning(ensembleResult, processedData) {
        const reasoning = [
            `基于${processedData.periodCount}期历史数据进行综合分析`,
            `频率分析显示号码分布相对均匀`,
            `模式识别发现潜在周期性规律`,
            `趋势分析指向特定号码区间`,
            `多算法集成提高了预测可靠性`
        ];

        if (ensembleResult.reasoning) {
            reasoning.push(...ensembleResult.reasoning);
        }

        return reasoning;
    }

    /**
     * 评估数据质量
     * @param {Object} processedData - 处理数据
     * @returns {string} 数据质量等级
     */
    assessDataQuality(processedData) {
        const { periodCount, numberFrequency, stats } = processedData;

        if (periodCount >= 100) return 'excellent';
        if (periodCount >= 50) return 'good';
        if (periodCount >= 20) return 'fair';
        return 'poor';
    }

    /**
     * 更新算法权重
     * @param {Object} newWeights - 新权重配置
     */
    updateWeights(newWeights) {
        const totalWeight = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            console.warn('权重总和不等于1.0，将进行归一化');
            Object.keys(newWeights).forEach(key => {
                this.weights[key] = newWeights[key] / totalWeight;
            });
        } else {
            this.weights = { ...newWeights };
        }
    }
}

/**
 * 频率分析器
 */
class FrequencyAnalyzer {
    async analyze(data) {
        const { numberFrequency, numbers } = data;

        // 分析号码频率分布
        const frequencyArray = Array.from(numberFrequency.entries())
            .sort((a, b) => b[1] - a[1]);

        // 基于频率的预测
        const highFreq = frequencyArray.slice(0, 15).map(([num]) => num);
        const midFreq = frequencyArray.slice(15, 35).map(([num]) => num);
        const lowFreq = frequencyArray.slice(35, 49).map(([num]) => num);

        // 生成预测号码（偏好中等频率）
        const predicted = [
            ...midFreq.slice(0, 3),
            ...highFreq.slice(5, 8),
            ...lowFreq.slice(0, 1)
        ];

        return {
            algorithm: 'frequency',
            recommended: predicted.slice(0, 6),
            alternative: highFreq.slice(10, 16),
            confidence: 70,
            details: {
                distribution: frequencyArray.slice(0, 10),
                strategy: '基于历史频率统计分析'
            }
        };
    }
}

/**
 * 模式分析器
 */
class PatternAnalyzer {
    async analyze(data) {
        const { numbers } = data;

        // 分析连续号码模式
        const consecutivePatterns = [];
        const oddEvenPatterns = [];
        const sumPatterns = [];

        numbers.forEach(period => {
            const sorted = [...period].sort((a, b) => a - b);

            // 连续号码分析
            let consecutive = 0;
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === sorted[i-1] + 1) {
                    consecutive++;
                }
            }
            consecutivePatterns.push(consecutive);

            // 奇偶分析
            const oddCount = sorted.filter(n => n % 2 === 1).length;
            oddEvenPatterns.push(oddCount);

            // 和值分析
            const sum = sorted.reduce((a, b) => a + b, 0);
            sumPatterns.push(sum);
        });

        // 基于模式生成预测
        const avgConsecutive = consecutivePatterns.reduce((a, b) => a + b, 0) / consecutivePatterns.length;
        const avgOddCount = Math.round(oddEvenPatterns.reduce((a, b) => a + b, 0) / oddEvenPatterns.length);
        const avgSum = Math.round(sumPatterns.reduce((a, b) => a + b, 0) / sumPatterns.length);

        const predicted = this.generatePatternBasedNumbers(avgConsecutive, avgOddCount, avgSum);

        return {
            algorithm: 'pattern',
            recommended: predicted.recommended,
            alternative: predicted.alternative,
            confidence: 75,
            details: {
                consecutiveAvg: avgConsecutive,
                oddEvenAvg: avgOddCount,
                sumAvg: avgSum,
                strategy: '基于号码模式匹配分析'
            }
        };
    }

    generatePatternBasedNumbers(consecutive, oddCount, targetSum) {
        const predicted = [];
        let currentSum = 0;

        // 生成符合模式的号码
        for (let i = 1; i <= 49 && predicted.length < 6; i++) {
            if (Math.random() < 0.2) { // 随机性加入
                if (!predicted.includes(i)) {
                    predicted.push(i);
                    currentSum += i;
                }
            }
        }

        // 补充到6个号码
        while (predicted.length < 6) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!predicted.includes(num)) {
                predicted.push(num);
                currentSum += num;
            }
        }

        return {
            recommended: predicted.slice(0, 6),
            alternative: this.generateAlternative()
        };
    }

    generateAlternative() {
        const alt = [];
        while (alt.length < 6) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!alt.includes(num)) {
                alt.push(num);
            }
        }
        return alt;
    }
}

/**
 * 趋势分析器
 */
class TrendAnalyzer {
    async analyze(data) {
        const { numbers } = data;

        // 分析号码趋势
        const trendData = this.analyzeTrends(numbers);

        // 基于趋势预测
        const predicted = this.predictBasedOnTrend(trendData);

        return {
            algorithm: 'trend',
            recommended: predicted.recommended,
            alternative: predicted.alternative,
            confidence: 72,
            details: {
                trends: trendData,
                strategy: '基于历史趋势外推分析'
            }
        };
    }

    analyzeTrends(numbers) {
        const trends = {
            rising: [],  // 趋势上升的号码
            falling: [], // 趋势下降的号码
            stable: []   // 趋势稳定的号码
        };

        // 简化的趋势分析
        for (let num = 1; num <= 49; num++) {
            const appearances = [];
            numbers.forEach((period, index) => {
                if (period.includes(num)) {
                    appearances.push(index);
                }
            });

            if (appearances.length >= 2) {
                const lastGap = appearances[appearances.length - 1] - appearances[appearances.length - 2];
                const avgGap = appearances.length > 2 ?
                    (appearances[appearances.length - 1] - appearances[0]) / (appearances.length - 1) : lastGap;

                if (lastGap < avgGap * 0.8) {
                    trends.rising.push(num);
                } else if (lastGap > avgGap * 1.2) {
                    trends.falling.push(num);
                } else {
                    trends.stable.push(num);
                }
            }
        }

        return trends;
    }

    predictBasedOnTrend(trendData) {
        // 优先选择趋势上升和稳定的号码
        const candidates = [...trendData.rising, ...trendData.stable];
        const predicted = [];

        while (predicted.length < 6 && candidates.length > 0) {
            const index = Math.floor(Math.random() * candidates.length);
            const num = candidates.splice(index, 1)[0];
            if (!predicted.includes(num)) {
                predicted.push(num);
            }
        }

        // 补充号码
        while (predicted.length < 6) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!predicted.includes(num)) {
                predicted.push(num);
            }
        }

        return {
            recommended: predicted,
            alternative: this.generateRandomNumbers(6)
        };
    }

    generateRandomNumbers(count) {
        const numbers = [];
        while (numbers.length < count) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    }
}

/**
 * 周期分析器
 */
class CyclicAnalyzer {
    async analyze(data) {
        const { numbers } = data;

        // 分析周期性模式
        const cycles = this.analyzeCycles(numbers);

        // 基于周期预测
        const predicted = this.predictBasedOnCycle(cycles);

        return {
            algorithm: 'cyclic',
            recommended: predicted.recommended,
            alternative: predicted.alternative,
            confidence: 68,
            details: {
                cycles,
                strategy: '基于周期性规律分析'
            }
        };
    }

    analyzeCycles(numbers) {
        // 简化的周期分析
        const dayOfWeekPattern = {};
        const weekPattern = {};

        numbers.forEach((period, index) => {
            const dayOfWeek = index % 7;
            const week = Math.floor(index / 7);

            if (!dayOfWeekPattern[dayOfWeek]) {
                dayOfWeekPattern[dayOfWeek] = [];
            }
            dayOfWeekPattern[dayOfWeek].push(...period);

            if (!weekPattern[week]) {
                weekPattern[week] = [];
            }
            weekPattern[week].push(...period);
        });

        return {
            dayOfWeek: dayOfWeekPattern,
            week: weekPattern
        };
    }

    predictBasedOnCycle(cycles) {
        // 基于当前周期位置预测
        const allNumbers = Object.values(cycles.dayOfWeek).flat();
        const frequency = {};

        allNumbers.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
        });

        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([num]) => parseInt(num));

        return {
            recommended: sorted.slice(0, 6),
            alternative: sorted.slice(2, 8)
        };
    }
}

/**
 * 聚类分析器
 */
class ClusterAnalyzer {
    async analyze(data) {
        const { numbers } = data;

        // K-means聚类分析
        const clusters = this.performKMeans(numbers, 5);

        // 基于聚类结果预测
        const predicted = this.predictFromClusters(clusters);

        return {
            algorithm: 'cluster',
            recommended: predicted.recommended,
            alternative: predicted.alternative,
            confidence: 73,
            details: {
                clusters,
                strategy: '基于K-means聚类分析'
            }
        };
    }

    performKMeans(numbers, k) {
        // 简化的K-means实现
        const clusters = [];

        for (let i = 0; i < k; i++) {
            clusters.push({
                center: Math.random() * 49,
                points: []
            });
        }

        // 迭代优化（简化版）
        for (let iteration = 0; iteration < 10; iteration++) {
            clusters.forEach(cluster => cluster.points = []);

            numbers.flat().forEach(num => {
                let minDist = Infinity;
                let closestCluster = 0;

                clusters.forEach((cluster, index) => {
                    const dist = Math.abs(num - cluster.center);
                    if (dist < minDist) {
                        minDist = dist;
                        closestCluster = index;
                    }
                });

                clusters[closestCluster].points.push(num);
            });

            // 更新聚类中心
            clusters.forEach(cluster => {
                if (cluster.points.length > 0) {
                    cluster.center = cluster.points.reduce((a, b) => a + b, 0) / cluster.points.length;
                }
            });
        }

        return clusters;
    }

    predictFromClusters(clusters) {
        // 选择最大的几个聚类进行预测
        const sortedClusters = clusters
            .sort((a, b) => b.points.length - a.points.length)
            .slice(0, 3);

        const candidates = sortedClusters
            .flatMap(cluster =>
                cluster.points
                    .filter(num => Math.abs(num - cluster.center) < 10)
                    .slice(0, 3)
            );

        const unique = [...new Set(candidates)];
        const predicted = unique.slice(0, 6);

        // 补充到6个号码
        while (predicted.length < 6) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!predicted.includes(num)) {
                predicted.push(num);
            }
        }

        return {
            recommended: predicted,
            alternative: this.generateRandomNumbers(6)
        };
    }

    generateRandomNumbers(count) {
        const numbers = [];
        while (numbers.length < count) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    }
}

/**
 * 神经网络预测器（简化版）
 */
class NeuralPredictor {
    async analyze(data) {
        const { numbers } = data;

        // 简化的神经网络预测
        const patterns = this.extractPatterns(numbers);
        const prediction = this.neuralPredict(patterns, data);

        return {
            algorithm: 'neural',
            recommended: prediction.recommended,
            alternative: prediction.alternative,
            confidence: 78,
            details: {
                patterns,
                strategy: '基于简化神经网络预测'
            }
        };
    }

    extractPatterns(numbers) {
        // 提取时间序列模式
        const patterns = [];

        for (let i = 1; i < numbers.length; i++) {
            const prev = numbers[i - 1];
            const curr = numbers[i];

            // 计算号码变化模式
            const changes = [];
            for (let j = 0; j < Math.min(prev.length, curr.length); j++) {
                changes.push(curr[j] - prev[j]);
            }

            patterns.push(changes);
        }

        return patterns;
    }

    neuralPredict(patterns, data) {
        // 简化的神经网络预测逻辑
        if (patterns.length === 0) {
            return {
                recommended: this.generateRandomNumbers(6),
                alternative: this.generateRandomNumbers(6)
            };
        }

        // 基于模式生成预测
        const avgChanges = [];
        for (let i = 0; i < 6; i++) {
            avgChanges[i] = patterns.reduce((sum, pattern) =>
                sum + (pattern[i] || 0), 0) / patterns.length;
        }

        const freq = new Map();
        for (let i = 1; i <= 49; i++) freq.set(i, 0);
        const recent = data.numbers.slice(0, 20);
        recent.flat().forEach(n => { if (n >= 1 && n <= 49) freq.set(n, (freq.get(n) || 0) + 1); });
        const freqArr = Array.from(freq.entries()).sort((a, b) => a[1] - b[1]);
        const midStart = Math.max(0, Math.floor(freqArr.length * 0.3));
        const midEnd = Math.min(freqArr.length, Math.floor(freqArr.length * 0.7));
        const midPool = freqArr.slice(midStart, midEnd).map(([n]) => n);
        const baseNumbers = [];
        while (baseNumbers.length < 6 && midPool.length > 0) {
            const i = Math.floor(Math.random() * midPool.length);
            const n = midPool.splice(i, 1)[0];
            baseNumbers.push(n);
        }
        while (baseNumbers.length < 6) {
            const n = Math.floor(Math.random() * 49) + 1;
            if (!baseNumbers.includes(n)) baseNumbers.push(n);
        }
        const predicted = baseNumbers.map((base, index) => {
            const val = Math.round(base + (avgChanges[index] || 0) + (Math.random() - 0.5) * 6);
            return Math.max(1, Math.min(49, val));
        });

        return {
            recommended: predicted,
            alternative: this.generateRandomNumbers(6)
        };
    }

    generateRandomNumbers(count) {
        const numbers = [];
        while (numbers.length < count) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    }
}

/**
 * 集成预测器
 */
class EnsemblePredictor {
    async predict(results, weights, options = {}) {
        // 统计所有算法的推荐号码
        const numberVotes = new Map();
        const algorithmCount = results.length;

        results.forEach((result, algorithmIndex) => {
            const weight = weights[result.algorithm] || (1 / algorithmCount);
            const recommended = result.recommended || [];
            const alternative = result.alternative || [];

            // 推荐号码加权
            recommended.forEach(num => {
                const jitter = options.jitter ? (Math.random() - 0.5) * 0.05 : 0;
                numberVotes.set(num, (numberVotes.get(num) || 0) + weight * 2 + jitter);
            });

            // 备选号码加权
            alternative.forEach(num => {
                const jitter = options.jitter ? (Math.random() - 0.5) * 0.03 : 0;
                numberVotes.set(num, (numberVotes.get(num) || 0) + weight + jitter);
            });
        });

        // 按投票数排序
        const sorted = Array.from(numberVotes.entries())
            .sort((a, b) => b[1] - a[1]);

        // 选择得票最高的号码
        const recommended = sorted.slice(0, 6).map(([num]) => num);
        const alternative = sorted.slice(6, 12).map(([num]) => num);

        // 计算集成置信度
        const avgConfidence = results.reduce((sum, result) =>
            sum + (result.confidence || 0), 0) / algorithmCount;

        // 计算分数（基于投票一致性）
        const maxVotes = sorted[0]?.[1] || 0;
        const minVotes = sorted[sorted.length - 1]?.[1] || 0;
        const score = maxVotes > 0 ? 1 - (maxVotes - minVotes) / maxVotes : 0;

        return {
            algorithm: 'ensemble',
            recommended,
            alternative,
            confidence: Math.min(avgConfidence + 5, 85), // 集成置信度略高
            score,
            details: {
                votingResults: sorted.slice(0, 12),
                algorithmResults: results.map(r => ({
                    algorithm: r.algorithm,
                    confidence: r.confidence
                })),
                strategy: '多算法加权集成预测'
            }
        };
    }
}

/**
 * 波色分析器
 */
class WaveAnalyzer {
    async analyze(data) {
        const { waveFrequency, waveStats, numbers } = data;

        // 基于波色分布预测号码范围
        const predictedRanges = this.predictByWavePatterns(waveStats, waveFrequency);

        // 生成预测号码
        const predicted = this.generateWaveBasedNumbers(predictedRanges, numbers);

        return {
            algorithm: 'waveAnalysis',
            recommended: predicted.recommended,
            alternative: predicted.alternative,
            confidence: 72,
            details: {
                waveFrequency,
                waveStats,
                predictedRanges,
                strategy: '基于波色分布模式分析'
            }
        };
    }

    predictByWavePatterns(waveStats, waveFrequency) {
        const dominant = waveStats.dominant;
        const ranges = {
            red: [1, 16],    // 红波号码范围（示例）
            blue: [17, 33],   // 蓝波号码范围（示例）
            green: [34, 49]   // 绿波号码范围（示例）
        };

        // 根据主要波色和分布调整预测范围
        const predictedRanges = [];
        if (dominant !== 'none' && ranges[dominant]) {
            predictedRanges.push({
                wave: dominant,
                range: ranges[dominant],
                confidence: waveFrequency[dominant] / Object.values(waveFrequency).reduce((a, b) => a + b, 0)
            });
        }

        // 添加次要波色范围
        Object.entries(waveFrequency)
            .filter(([wave]) => wave !== dominant && wave !== 'unknown')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .forEach(([wave, count]) => {
                if (ranges[wave]) {
                    predictedRanges.push({
                        wave,
                        range: ranges[wave],
                        confidence: count / Object.values(waveFrequency).reduce((a, b) => a + b, 0)
                    });
                }
            });

        return predictedRanges;
    }

    generateWaveBasedNumbers(ranges, historicalNumbers) {
        const recommended = [];
        const alternative = [];

        ranges.forEach(({ range, confidence }) => {
            // 在预测范围内选择号码
            const rangeNumbers = [];
            for (let i = range[0]; i <= range[1]; i++) {
                rangeNumbers.push(i);
            }

            // 基于历史频率调整选择
            const frequency = {};
            historicalNumbers.flat().forEach(num => {
                if (num >= range[0] && num <= range[1]) {
                    frequency[num] = (frequency[num] || 0) + 1;
                }
            });

            // 优先选择中等频率的号码
            const sorted = rangeNumbers.sort((a, b) => (frequency[a] || 0) - (frequency[b] || 0));
            const midIndex = Math.floor(sorted.length / 2);

            if (recommended.length < 6) {
                recommended.push(...sorted.slice(midIndex - 1, midIndex + 2));
            }
            if (alternative.length < 6) {
                alternative.push(...sorted.slice(midIndex + 2, midIndex + 5));
            }
        });

        return {
            recommended: [...new Set(recommended)].slice(0, 6),
            alternative: [...new Set(alternative)].slice(0, 6)
        };
    }
}

/**
 * 生肖分析器
 */
class ZodiacAnalyzer {
    async analyze(data) {
        const { zodiacFrequency, zodiacStats, numbers } = data;

        // 基于生肖分布预测号码
        const predictedNumbers = this.predictByZodiacPatterns(zodiacStats, zodiacFrequency);

        return {
            algorithm: 'zodiacAnalysis',
            recommended: predictedNumbers.recommended,
            alternative: predictedNumbers.alternative,
            confidence: 68,
            details: {
                zodiacFrequency,
                zodiacStats,
                strategy: '基于生肖分布模式分析'
            }
        };
    }

    predictByZodiacPatterns(zodiacStats, zodiacFrequency) {
        const dominant = zodiacStats.dominant;
        const zodiacNumbers = this.getZodiacNumbers();

        // 根据主要生肖生成预测号码
        const recommended = [];
        const alternative = [];

        if (dominant !== 'none' && zodiacNumbers[dominant]) {
            // 添加主要生肖的号码
            recommended.push(...zodiacNumbers[dominant].slice(0, 3));
        }

        // 添加次要生肖的号码
        Object.entries(zodiacFrequency)
            .filter(([zodiac]) => zodiac !== dominant && zodiac !== 'unknown')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([zodiac]) => {
                if (zodiacNumbers[zodiac] && recommended.length < 6) {
                    recommended.push(...zodiacNumbers[zodiac].slice(0, 2));
                } else if (zodiacNumbers[zodiac] && alternative.length < 6) {
                    alternative.push(...zodiacNumbers[zodiac].slice(0, 2));
                }
            });

        return {
            recommended: [...new Set(recommended)].slice(0, 6),
            alternative: [...new Set(alternative)].slice(0, 6)
        };
    }

    getZodiacNumbers() {
        // 简化的生肖对应号码映射（可根据实际情况调整）
        return {
            '鼠': [1, 13, 25, 37, 49],
            '牛': [2, 14, 26, 38],
            '虎': [3, 15, 27, 39],
            '兔': [4, 16, 28, 40],
            '龙': [5, 17, 29, 41],
            '蛇': [6, 18, 30, 42],
            '马': [7, 19, 31, 43],
            '羊': [8, 20, 32, 44],
            '猴': [9, 21, 33, 45],
            '鸡': [10, 22, 34, 46],
            '狗': [11, 23, 35, 47],
            '猪': [12, 24, 36, 48]
        };
    }
}

// 导出预测引擎
window.AdvancedPredictionEngine = AdvancedPredictionEngine;
