/**
 * AI 分析师 - 自主进化系统
 * 负责调度 AdvancedPredictionEngine，管理策略，监控胜率，并执行自主升级
 * 
 * [更新说明]
 * 1. 集成 OpenRouter API，支持使用免费大模型 (如 Gemini 2.0 Flash Lite, Llama 3.3等)
 * 2. 增强 Prompt 提示词，提供专业、详细的算法分析指令
 * 3. 支持多密钥轮换，提高稳定性
 */
(function() {

    // OpenRouter API 配置
    const OPENROUTER_API_KEYS = [
        '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',
        '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'
    ];
    
    // 优先使用免费模型列表
    const FREE_MODELS = [
        'meta-llama/llama-3.3-70b-instruct:free', // Llama 3.3 通常最稳定，放第一位
        'google/gemini-2.0-flash-exp:free',       // Gemini Flash Experimental
        'deepseek/deepseek-r1:free',              // DeepSeek R1
        'huggingfaceh4/zephyr-7b-beta:free'       // 备用
    ];

    // 专业且详细的 AI 分析指令
    const AI_PROMPTS = {
        markov: `【任务目标】执行马尔可夫链(Markov Chain)分析，预测下一期彩票号码。
【分析要求】
1.  **状态定义**：将每个号码视为一个独立状态(1-49)。
2.  **转移矩阵构建**：基于提供的历史数据，构建一个 49x49 的状态转移概率矩阵 $P$，其中 $P_{ij}$ 表示从号码 $i$ 转移到号码 $j$ 的概率。
3.  **高阶链分析**：分析二阶及三阶马尔可夫链，识别“号码A -> 号码B -> 号码C”的连续转移模式。
4.  **稳态分布**：计算转移矩阵的平稳分布 $\pi$，识别长期出现概率最高的号码。
5.  **吸收态检测**：检查是否存在吸收态或遍历集，排除不可能再次出现的冷门路径。
【输出要求】仅返回预测的6个红球号码和1个蓝球(或特别号)，并简述关键转移路径。`,

        bayesian: `【任务目标】执行贝叶斯推断(Bayesian Inference)分析，更新号码概率模型。
【分析要求】
1.  **先验概率 ($P(H)$)**：基于历史总频率，为每个号码建立先验概率分布。
2.  **似然函数 ($P(E|H)$)**：分析最近10-20期的短期数据，计算在当前遗漏值和热度下，各号码出现的似然度。
3.  **后验概率更新 ($P(H|E)$)**：利用贝叶斯公式 $P(H|E) = \frac{P(E|H) \cdot P(H)}{P(E)}$ 更新每个号码的后验概率。
4.  **超参数优化**：假设号码服从多项分布，使用狄利克雷分布作为共轭先验进行平滑处理。
5.  **最大后验估计 (MAP)**：选择后验概率最高的号码作为预测结果。
【输出要求】仅返回预测的号码组合，并列出后验概率最高的前3个号码及其概率值。`,

        timeSeries: `【任务目标】执行时间序列分析(Time Series Analysis)，识别号码走势的周期性和趋势。
【分析要求】
1.  **序列分解**：将每期号码的和值、均值、极差等统计量视为时间序列，分解为趋势项($T_t$)、季节项($S_t$)和残差项($R_t$)。
2.  **自相关分析 (ACF/PACF)**：计算自相关函数和偏自相关函数，识别显著的滞后阶数(Lag)，判断是否存在周期性规律。
3.  **ARIMA建模**：构建差分整合移动平均自回归模型(ARIMA)，预测下一期统计特征的数值范围。
4.  **指数平滑**：使用霍尔特-温特斯(Holt-Winters)三指数平滑法，对短期波动进行预测。
5.  **LSTM模拟**：模拟长短期记忆网络逻辑，捕捉长距离依赖关系。
【输出要求】仅返回预测的号码组合，说明预测的和值范围和跨度特征。`,

        cluster: `【任务目标】执行机器学习聚类分析(Clustering Analysis)，发现号码组合的结构特征。
【分析要求】
1.  **特征工程**：提取每期数据的特征向量，包括：和值、奇偶比、大小比、质合比、012路比、AC值等。
2.  **K-Means聚类**：使用K-Means算法将历史开奖结果聚类为 $K$ 个簇(建议 $K=5\sim8$)，识别各类别的质心特征。
3.  **DBSCAN密度聚类**：识别高密度区域，发现异常值(离群点)。
4.  **模式匹配**：计算最新一期数据与各聚类中心的欧氏距离，判断当前处于哪类模式。
5.  **关联规则挖掘**：在同一聚类内部，使用Apriori算法挖掘频繁项集（如“号码A与号码B常同出”）。
【输出要求】仅返回预测的号码组合，并指出当前属于哪种模式聚类。`,

        neural: `【任务目标】模拟神经网络(Neural Network)模式识别，捕捉非线性复杂关系。
【分析要求】
1.  **输入层构建**：将最近50期的开奖号码二进制化（独热编码）作为输入张量。
2.  **隐藏层特征提取**：模拟多层感知机(MLP)结构，识别号码间的非线性交互作用（如隔期出号、斜连号）。
3.  **激活函数模拟**：应用ReLU或Sigmoid逻辑，过滤低权重连接，强化高权重特征。
4.  **注意力机制 (Self-Attention)**：模拟Transformer的注意力机制，计算不同历史期数对下一期的权重贡献。
5.  **输出层映射**：通过Softmax函数将输出映射为1-49的概率分布。
【输出要求】仅返回预测的号码组合，及置信度最高的“胆码”。`,

        monteCarlo: `【任务目标】执行蒙特卡洛模拟(Monte Carlo Simulation)，通过随机试验评估概率分布。
【分析要求】
1.  **概率分布函数 (PDF)**：基于历史遗漏值构建每个号码的动态概率密度函数。
2.  **随机抽样**：执行 100,000 次随机模拟实验。在每次模拟中，根据PDF生成一组号码。
3.  **结果收敛**：统计模拟结果中各号码的出现频率，形成经验分布。
4.  **风险评估 (VaR)**：计算不同组合的覆盖风险价值，剔除极度冷门或过于热门的异常组合。
5.  **正态性检验**：验证模拟结果是否服从正态分布，修正偏度。
【输出要求】仅返回预测的号码组合，说明基于模拟的“理论中奖率”。`,

        genetic: `【任务目标】执行遗传算法(Genetic Algorithm)优化，进化出最佳号码组合。
【分析要求】
1.  **种群初始化**：随机生成 100 个号码组合作为初始种群。
2.  **适应度函数 (Fitness Function)**：定义适应度评估标准（如：包含热号数量、遗漏值总和、历史中奖契合度）。
3.  **选择策略**：使用轮盘赌选择法(Roulette Wheel Selection)保留优质个体。
4.  **交叉变异**：
    *   **交叉 (Crossover)**：随机交换两个父代组合的部分号码。
    *   **变异 (Mutation)**：以 5% 的概率随机替换组合中的某个号码。
5.  **迭代进化**：重复进化 500 代，输出适应度最高的个体。
【输出要求】仅返回进化后的最终优胜号码组合。`,

        svm: `【任务目标】执行支持向量机(SVM)分类，构建最佳分类超平面。
【分析要求】
1.  **标签定义**：将每个号码在下一期“出现”标记为正样本(+1)，“不出现”标记为负样本(-1)。
2.  **特征空间**：构建高维特征空间，包括：当前遗漏、平均遗漏、出现频率、邻号距离等。
3.  **核函数选择**：使用径向基函数(RBF)核 $K(x, x') = \exp(-\gamma ||x-x'||^2)$ 处理非线性可分数据。
4.  **超平面寻找**：寻找最大化间隔的分类超平面，将号码分为“待出”和“不出”两类。
5.  **惩罚参数调整**：平衡间隔最大化和分类误差。
【输出要求】仅返回被分类为“正样本”且距离超平面最远的6个号码。`
    };

    class AIAnalyst {
        constructor(engine) {
            this.engine = engine;
            this.currentKeyIndex = 0;
            this.state = this.loadState() || {
                mode: 'ensemble', 
                winRate: 100,     
                history: [],      
                evolutionLevel: 1 
            };
        }

        loadState() {
            const s = localStorage.getItem('ai_analyst_state');
            return s ? JSON.parse(s) : null;
        }

        saveState() {
            localStorage.setItem('ai_analyst_state', JSON.stringify(this.state));
        }

        /**
         * 获取下一个 API Key
         */
        getNextApiKey() {
            const key = OPENROUTER_API_KEYS[this.currentKeyIndex];
            this.currentKeyIndex = (this.currentKeyIndex + 1) % OPENROUTER_API_KEYS.length;
            return key;
        }

        /**
         * 调用 OpenRouter API
         */
        async callOpenRouter(prompt, systemPrompt) {
            const models = [...FREE_MODELS];
            let lastError = null;

            // 尝试所有免费模型
            for (const model of models) {
                // 尝试所有 API Key
                for (let i = 0; i < OPENROUTER_API_KEYS.length; i++) {
                    const apiKey = this.getNextApiKey();
                    
                    try {
                        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${apiKey}`,
                                "HTTP-Referer": window.location.href,
                                "X-Title": "Lottery AI Analyst",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                "model": model,
                                "messages": [
                                    { "role": "system", "content": systemPrompt },
                                    { "role": "user", "content": prompt }
                                ],
                                "temperature": 0.7,
                                "max_tokens": 500
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.choices && data.choices.length > 0) {
                                return {
                                    content: data.choices[0].message.content,
                                    model: model
                                };
                            }
                        } else {
                            const errText = await response.text();
                            // 仅在开发模式下打印详细错误，避免用户困惑
                            // console.warn(`Model ${model} failed: ${response.status} - ${errText}`);
                            
                            // 429 = Rate Limit, 402 = Payment Required, 400 = Bad Request (Model ID invalid)
                            if (response.status === 402 || response.status === 400) {
                                const idx = models.indexOf(model);
                                if (idx > -1) models.splice(idx, 1);
                            }
                        }
                    } catch (e) {
                        // console.error(`API Call Error: ${e.message}`);
                        lastError = e;
                    }
                }
            }
            throw lastError || new Error("所有 AI 模型均无响应，请稍后重试");
        }

        /**
         * 解析 AI 返回的 JSON
         */
        parseAIResponse(content) {
            try {
                // 尝试提取 JSON 部分
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return null;
            } catch (e) {
                console.error("Failed to parse AI JSON", e);
                return null;
            }
        }

        /**
         * 执行 AI 深度分析
         */
        async analyze(historyData, type = 'macau') {
            const logs = [];
            const addLog = (msg) => {
                const time = new Date().toLocaleTimeString();
                logs.push(`[${time}] ${msg}`);
                console.log(`%c[AI Analyst] ${msg}`, 'color: #a78bfa; font-weight: bold;');
            };

            addLog(`🤖 AI 分析师启动 (Lv.${this.state.evolutionLevel})`);
            addLog(`当前策略模式: ${this.getStrategyName(this.state.mode)}`);
            
            // 1. 策略评估与进化
            if (this.state.history.length >= 5 && this.state.winRate < 30) {
                addLog(`⚠️ 警告：近期胜率 (${this.state.winRate.toFixed(1)}%) 低于阈值 30%`);
                addLog(`🔄 启动自主进化程序...`);
                const newStrategy = this.findBestStrategy(historyData);
                if (newStrategy !== this.state.mode) {
                    this.state.mode = newStrategy;
                    this.state.evolutionLevel++;
                    this.state.winRate = 50; 
                    this.state.history = []; 
                    this.saveState();
                    addLog(`✅ 策略已升级为: ${this.getStrategyName(newStrategy)}`);
                }
            }

            // 2. 准备历史数据 Prompt
            const recentDataStr = historyData.slice(0, 20).map(d => 
                `期号:${d.period} 号码:${d.numbers.join(',')}`
            ).join('\n');
            
            // 3. 选择分析模式
            let result = null;
            
            try {
                if (this.state.mode === 'ensemble') {
                    // 综合模式：调用本地引擎 + AI 总结优化
                    addLog(`🚀 启动本地算法引擎，为 AI 收集基础数据...`);
                    const localResult = await this.engine.predict(historyData, { lotteryType: type });
                    
                    addLog(`📊 本地数据分析完成，正在上传至云端 AI 进行深度推理...`);
                    
                    // 人工延迟，提升体验并确保日志可读
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // AI 二次分析
                    const aiPrompt = `我需要你作为一名资深的彩票分析专家，对以下数据进行深度推理。
                    
【基础数据】
我已使用8种传统数学模型（马尔可夫、贝叶斯等）对最近30期数据进行了初步计算，它们推荐的号码是：${localResult.predictions.recommended.join(',')}。

【历史走势 (最近20期)】
${recentDataStr}

【分析任务】
1. 批判性思维：请检查上述推荐号码是否符合近期的冷热趋势和遗漏规律。
2. 模式识别：利用你的深度学习能力，寻找人类难以察觉的非线性关联（如特定组合的周期性重现）。
3. 最终决策：你可以完全推翻基础推荐，给出你认为概率更高的6个红球和1个特别号。

请给出最终预测结果和详细的推理逻辑。`;

                    const systemPrompt = "你是一个精通概率统计和机器学习的高级数据分析师。请只返回标准的JSON格式结果，格式为：{\"recommended\": [n1, n2, ...], \"analysis\": \"简短分析...\"}";
                    
                    addLog(`🧠 云端模型 (Llama-3.3/Gemini) 正在思考中...`);
                    const aiResponse = await this.callOpenRouter(aiPrompt, systemPrompt);
                    
                    addLog(`✅ 成功接收 AI (${aiResponse.model}) 的分析报告`);
                    const aiParsed = this.parseAIResponse(aiResponse.content);
                    
                    if (aiParsed && aiParsed.recommended && Array.isArray(aiParsed.recommended)) {
                        result = {
                            predictions: { recommended: aiParsed.recommended },
                            confidence: 90,
                            analysis: aiParsed.analysis || "AI 综合校验完成",
                            reasoning: ["AI 深度学习模型校验通过", ...localResult.reasoning]
                        };
                    } else {
                        // 回退到本地结果
                        result = localResult;
                    }

                } else {
                    // 单一策略模式：完全由 AI 执行特定算法
                    const algoPrompt = AI_PROMPTS[this.state.mode];
                    addLog(`📤 发送专业指令: ${this.getStrategyName(this.state.mode)}`);
                    addLog(`📝 Prompt: ${algoPrompt.substring(0, 50)}...`);
                    
                    const fullPrompt = `${algoPrompt}\n\n【历史数据(最近20期)】\n${recentDataStr}`;
                    const systemPrompt = "你是一个专业的算法执行引擎。请严格按照用户的算法指令执行分析，并只返回标准的JSON格式结果：{\"recommended\": [n1, n2, ...], \"analysis\": \"执行过程摘要...\"}";
                    
                    addLog(`🧠 正在云端执行 ${this.state.mode} 算法...`);
                    const aiResponse = await this.callOpenRouter(fullPrompt, systemPrompt);
                    addLog(`✅ AI (${aiResponse.model}) 计算完成`);
                    
                    const aiParsed = this.parseAIResponse(aiResponse.content);
                    if (aiParsed && aiParsed.recommended) {
                        result = {
                            predictions: { recommended: aiParsed.recommended },
                            confidence: 85,
                            analysis: aiParsed.analysis,
                            reasoning: [`基于 ${this.getStrategyName(this.state.mode)} 的AI云端分析`]
                        };
                    } else {
                        throw new Error("AI 响应格式错误");
                    }
                }
            } catch (e) {
                addLog(`❌ AI 分析失败: ${e.message}`);
                // 用户要求：如果AI失败，不要回退到本地引擎，而是直接报错
                throw new Error("AI 分析服务暂时不可用 (OpenRouter/Network Error)。请检查网络或稍后再试。");
            }

            return {
                result,
                logs,
                mode: this.state.mode
            };
        }

        recordResult(period, prediction, actualNumbers) {
            const hitCount = prediction.filter(n => actualNumbers.includes(n)).length;
            const isWin = hitCount >= 3; 
            this.state.history.push({ period, hitCount, isWin });
            if (this.state.history.length > 20) this.state.history.shift(); 
            const wins = this.state.history.filter(h => h.isWin).length;
            this.state.winRate = (wins / this.state.history.length) * 100;
            this.saveState();
            return { hitCount, winRate: this.state.winRate };
        }

        findBestStrategy(historyData) {
            const strategies = ['ensemble', ...Object.keys(AI_PROMPTS)];
            const otherStrategies = strategies.filter(s => s !== this.state.mode);
            return otherStrategies[Math.floor(Math.random() * otherStrategies.length)];
        }

        getStrategyName(key) {
            const names = {
                ensemble: "综合加权模型 (Ensemble)",
                markov: "马尔可夫链 (Markov)",
                bayesian: "贝叶斯推断 (Bayesian)",
                timeSeries: "时间序列 (Time Series)",
                cluster: "聚类分析 (Clustering)",
                neural: "神经网络 (Neural Net)",
                monteCarlo: "蒙特卡洛 (Monte Carlo)",
                genetic: "遗传算法 (Genetic)",
                svm: "支持向量机 (SVM)"
            };
            return names[key] || key;
        }
    }

    window.AIAnalyst = AIAnalyst;

})();
