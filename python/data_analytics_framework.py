#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
历史数据分析和模型训练框架
集成多种统计分析和机器学习算法
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Union, Any
from dataclasses import dataclass
import json
import warnings
warnings.filterwarnings('ignore')

# 机器学习库
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif

# 统计分析库
from scipy import stats
from scipy.stats import chi2_contingency, pearsonr, spearmanr
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.stats.diagnostic import acorr_ljungbox

# 深度学习库 (可选)
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow未安装，深度学习功能将被禁用")

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False


@dataclass
class LotteryDraw:
    """数字开奖结果数据结构"""
    period: str
    draw_date: datetime
    numbers: List[int]
    special_number: Optional[int] = None

    def __post_init__(self):
        """数据验证"""
        if len(self.numbers) != 5:
            raise ValueError("号码数量必须为5个")
        if any(n < 1 or n > 35 for n in self.numbers):
            raise ValueError("号码范围必须在1-35之间")
        if len(set(self.numbers)) != len(self.numbers):
            raise ValueError("号码不能重复")


@dataclass
class AnalysisResult:
    """分析结果数据结构"""
    analysis_type: str
    results: Dict[str, Any]
    confidence_level: float
    timestamp: datetime
    interpretation: str


class StatisticalAnalyzer:
    """统计分析器"""

    def __init__(self):
        self.data = None
        self.analysis_cache = {}

    def load_data(self, draws: List[LotteryDraw]) -> pd.DataFrame:
        """加载历史数据"""
        data_list = []
        for draw in draws:
            row = {
                'period': draw.period,
                'draw_date': draw.draw_date,
                'time_index': range(len(draws))[0]  # 时间索引
            }

            # 添加每个号码位置
            for i, num in enumerate(draw.numbers):
                row[f'num_{i+1}'] = num

            # 添加统计特征
            row['sum'] = sum(draw.numbers)
            row['mean'] = np.mean(draw.numbers)
            row['std'] = np.std(draw.numbers)
            row['min'] = min(draw.numbers)
            row['max'] = max(draw.numbers)
            row['range'] = max(draw.numbers) - min(draw.numbers)

            # 奇偶分析
            odd_count = sum(1 for n in draw.numbers if n % 2 == 1)
            even_count = 5 - odd_count
            row['odd_count'] = odd_count
            row['even_count'] = even_count
            row['odd_even_ratio'] = odd_count / even_count if even_count > 0 else float('inf')

            # 大小分析 (以17为界)
            big_count = sum(1 for n in draw.numbers if n > 17)
            small_count = 5 - big_count
            row['big_count'] = big_count
            row['small_count'] = small_count
            row['big_small_ratio'] = big_count / small_count if small_count > 0 else float('inf')

            # 连号分析
            sorted_nums = sorted(draw.numbers)
            consecutive_pairs = sum(1 for i in range(len(sorted_nums)-1)
                                  if sorted_nums[i+1] - sorted_nums[i] == 1)
            row['consecutive_pairs'] = consecutive_pairs

            data_list.append(row)

        self.data = pd.DataFrame(data_list)
        self.data['draw_date'] = pd.to_datetime(self.data['draw_date'])
        self.data.set_index('draw_date', inplace=True)

        return self.data

    def frequency_analysis(self, window_size: int = 50) -> AnalysisResult:
        """频率分布分析"""
        if self.data is None:
            raise ValueError("请先加载数据")

        # 获取所有号码
        all_numbers = []
        for col in ['num_1', 'num_2', 'num_3', 'num_4', 'num_5']:
            all_numbers.extend(self.data[col].tolist())

        # 计算频率
        frequency_counts = pd.Series(all_numbers).value_counts().sort_index()

        # 计算最近window_size期的频率
        recent_data = self.data.tail(window_size)
        recent_numbers = []
        for col in ['num_1', 'num_2', 'num_3', 'num_4', 'num_5']:
            recent_numbers.extend(recent_data[col].tolist())

        recent_frequency = pd.Series(recent_numbers).value_counts().sort_index()

        # 分类热号和冷号
        total_draws = len(self.data)
        expected_frequency = total_draws * 5 / 35  # 期望频率

        hot_threshold = expected_frequency * 1.2
        cold_threshold = expected_frequency * 0.8

        hot_numbers = frequency_counts[frequency_counts > hot_threshold].index.tolist()
        cold_numbers = frequency_counts[frequency_counts < cold_threshold].index.tolist()

        results = {
            'total_frequency': frequency_counts.to_dict(),
            'recent_frequency': recent_frequency.to_dict(),
            'hot_numbers': hot_numbers,
            'cold_numbers': cold_numbers,
            'expected_frequency': expected_frequency,
            'frequency_variance': frequency_counts.var(),
            'frequency_skewness': stats.skew(frequency_counts.values)
        }

        interpretation = self._interpret_frequency_analysis(results)

        return AnalysisResult(
            analysis_type="频率分布分析",
            results=results,
            confidence_level=0.95,
            timestamp=datetime.now(),
            interpretation=interpretation
        )

    def _interpret_frequency_analysis(self, results: Dict) -> str:
        """解释频率分析结果"""
        interpretation = []

        hot_count = len(results['hot_numbers'])
        cold_count = len(results['cold_numbers'])

        interpretation.append(f"发现 {hot_count} 个热号: {results['hot_numbers']}")
        interpretation.append(f"发现 {cold_count} 个冷号: {results['cold_numbers']}")

        if results['frequency_variance'] > results['expected_frequency']:
            interpretation.append("频率分布不均匀，存在明显偏好")
        else:
            interpretation.append("频率分布相对均匀")

        if results['frequency_skewness'] > 0.5:
            interpretation.append("分布右偏，少数号码出现频率较高")
        elif results['frequency_skewness'] < -0.5:
            interpretation.append("分布左偏，多数号码出现频率相近")
        else:
            interpretation.append("分布相对对称")

        return "\n".join(interpretation)

    def missing_value_analysis(self) -> AnalysisResult:
        """遗漏值分析"""
        if self.data is None:
            raise ValueError("请先加载数据")

        missing_analysis = {}

        for number in range(1, 36):
            # 计算每个号码的遗漏期数
            missing_periods = []
            current_missing = 0

            for _, row in self.data.iterrows():
                if number in row[['num_1', 'num_2', 'num_3', 'num_4', 'num_5']].values:
                    if current_missing > 0:
                        missing_periods.append(current_missing)
                    current_missing = 0
                else:
                    current_missing += 1

            if current_missing > 0:  # 当前还在遗漏
                missing_periods.append(current_missing)

            if missing_periods:
                missing_analysis[number] = {
                    'max_missing': max(missing_periods),
                    'avg_missing': np.mean(missing_periods),
                    'current_missing': current_missing,
                    'missing_count': len(missing_periods)
                }

        # 找出当前遗漏期数最长的号码
        current_missing_sorted = sorted(
            [(num, data['current_missing']) for num, data in missing_analysis.items()],
            key=lambda x: x[1],
            reverse=True
        )

        results = {
            'missing_analysis': missing_analysis,
            'top_missing_numbers': current_missing_sorted[:10],
            'average_current_missing': np.mean([data['current_missing'] for data in missing_analysis.values()])
        }

        interpretation = self._interpret_missing_analysis(results)

        return AnalysisResult(
            analysis_type="遗漏值分析",
            results=results,
            confidence_level=0.90,
            timestamp=datetime.now(),
            interpretation=interpretation
        )

    def _interpret_missing_analysis(self, results: Dict) -> str:
        """解释遗漏分析结果"""
        interpretation = []

        top_missing = results['top_missing_numbers'][:5]
        interpretation.append("当前遗漏最长的号码:")
        for num, missing in top_missing:
            interpretation.append(f"  号码 {num}: 遗漏 {missing} 期")

        avg_missing = results['average_current_missing']
        if avg_missing > 10:
            interpretation.append(f"平均遗漏期数较长({avg_missing:.1f}期)，可能存在回补趋势")
        else:
            interpretation.append(f"平均遗漏期数正常({avg_missing:.1f}期)")

        return "\n".join(interpretation)

    def correlation_analysis(self) -> AnalysisResult:
        """相关性分析"""
        if self.data is None:
            raise ValueError("请先加载数据")

        # 号码间的相关性
        correlation_matrix = self.data[['num_1', 'num_2', 'num_3', 'num_4', 'num_5']].corr()

        # 统计特征间的相关性
        feature_cols = ['sum', 'mean', 'std', 'range', 'odd_count', 'even_count',
                       'big_count', 'small_count', 'consecutive_pairs']
        feature_correlation = self.data[feature_cols].corr()

        # 计算号码共现频率
        co_occurrence = {}
        for i in range(1, 36):
            for j in range(i+1, 36):
                co_count = 0
                for _, row in self.data.iterrows():
                    numbers = set(row[['num_1', 'num_2', 'num_3', 'num_4', 'num_5']].values)
                    if i in numbers and j in numbers:
                        co_count += 1
                if co_count > 0:
                    co_occurrence[f"{i}-{j}"] = co_count

        # 找出共现频率最高的号码对
        top_co_occurrence = sorted(co_occurrence.items(), key=lambda x: x[1], reverse=True)[:10]

        results = {
            'number_correlation': correlation_matrix.to_dict(),
            'feature_correlation': feature_correlation.to_dict(),
            'co_occurrence': co_occurrence,
            'top_co_occurrence_pairs': top_co_occurrence
        }

        interpretation = self._interpret_correlation_analysis(results)

        return AnalysisResult(
            analysis_type="相关性分析",
            results=results,
            confidence_level=0.85,
            timestamp=datetime.now(),
            interpretation=interpretation
        )

    def _interpret_correlation_analysis(self, results: Dict) -> str:
        """解释相关性分析结果"""
        interpretation = []

        # 分析号码间相关性
        number_corr = results['number_correlation']
        high_corr_pairs = []
        for i in range(5):
            for j in range(i+1, 5):
                corr_val = number_corr[f'num_{i+1}'][f'num_{j+1}']
                if abs(corr_val) > 0.3:
                    high_corr_pairs.append(f"位置{i+1}与{j+1}: {corr_val:.3f}")

        if high_corr_pairs:
            interpretation.append("发现较高相关性的位置对:")
            interpretation.extend(high_corr_pairs)
        else:
            interpretation.append("各位置号码相关性较低，相对独立")

        # 分析共现频率
        top_pairs = results['top_co_occurrence_pairs'][:3]
        interpretation.append("\n共现频率最高的号码对:")
        for pair, count in top_pairs:
            interpretation.append(f"  {pair}: {count}次")

        return "\n".join(interpretation)

    def time_series_analysis(self, target_feature: str = 'sum') -> AnalysisResult:
        """时间序列分析"""
        if self.data is None:
            raise ValueError("请先加载数据")

        series_data = self.data[target_feature]

        # 季节性分解
        try:
            decomposition = seasonal_decompose(series_data, period=7, extrapolate_trend='freq')

            # ARIMA建模
            model = ARIMA(series_data, order=(1, 1, 1))
            arima_result = model.fit()

            # 预测下一期
            forecast = arima_result.forecast(steps=1)
            forecast_conf_int = arima_result.get_forecast(steps=1).conf_int()

            results = {
                'trend': decomposition.trend.dropna().tolist(),
                'seasonal': decomposition.seasonal.dropna().tolist(),
                'residual': decomposition.resid.dropna().tolist(),
                'arima_model_summary': str(arima_result.summary()),
                'forecast': forecast.iloc[0],
                'forecast_confidence_interval': forecast_conf_int.iloc[0].tolist(),
                'model_aic': arima_result.aic,
                'model_bic': arima_result.bic
            }

        except Exception as e:
            results = {
                'error': str(e),
                'fallback_analysis': {
                    'mean': series_data.mean(),
                    'std': series_data.std(),
                    'trend_direction': 'increasing' if series_data.is_monotonic_increasing else 'decreasing' if series_data.is_monotonic_decreasing else 'stable'
                }
            }

        interpretation = self._interpret_time_series_analysis(results, target_feature)

        return AnalysisResult(
            analysis_type="时间序列分析",
            results=results,
            confidence_level=0.80,
            timestamp=datetime.now(),
            interpretation=interpretation
        )

    def _interpret_time_series_analysis(self, results: Dict, target_feature: str) -> str:
        """解释时间序列分析结果"""
        interpretation = []

        if 'error' in results:
            interpretation.append(f"时间序列建模遇到问题: {results['error']}")
            fallback = results['fallback_analysis']
            interpretation.append(f"基础统计 - 均值: {fallback['mean']:.2f}, 标准差: {fallback['std']:.2f}")
            interpretation.append(f"趋势方向: {fallback['trend_direction']}")
        else:
            interpretation.append(f"下一期{target_feature}预测值: {results['forecast']:.2f}")
            conf_low, conf_high = results['forecast_confidence_interval']
            interpretation.append(f"95%置信区间: [{conf_low:.2f}, {conf_high:.2f}]")
            interpretation.append(f"模型AIC: {results['model_aic']:.2f}, BIC: {results['model_bic']:.2f}")

        return "\n".join(interpretation)


class MLModelTrainer:
    """机器学习模型训练器"""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_columns = []

    def prepare_features(self, data: pd.DataFrame, target_periods: int = 1) -> Tuple[pd.DataFrame, pd.Series]:
        """准备特征和目标变量"""
        features = []
        targets = []

        # 使用滑动窗口创建特征
        window_size = 5

        for i in range(window_size, len(data) - target_periods):
            # 历史特征
            window_data = data.iloc[i-window_size:i]

            feature_dict = {}

            # 号码统计特征
            for col in ['num_1', 'num_2', 'num_3', 'num_4', 'num_5']:
                feature_dict[f'{col}_mean'] = window_data[col].mean()
                feature_dict[f'{col}_std'] = window_data[col].std()
                feature_dict[f'{col}_trend'] = window_data[col].iloc[-1] - window_data[col].iloc[0]

            # 整体统计特征
            feature_dict['sum_mean'] = window_data['sum'].mean()
            feature_dict['sum_std'] = window_data['sum'].std()
            feature_dict['sum_trend'] = window_data['sum'].iloc[-1] - window_data['sum'].iloc[0]

            feature_dict['odd_ratio_avg'] = window_data['odd_count'].mean() / 5
            feature_dict['big_ratio_avg'] = window_data['big_count'].mean() / 5
            feature_dict['consecutive_avg'] = window_data['consecutive_pairs'].mean()

            features.append(feature_dict)

            # 目标变量：下一期的号码
            target_draw = data.iloc[i + target_periods]
            target_numbers = sorted([target_draw[f'num_{j}'] for j in range(1, 6)])

            # 将目标转换为多标签二进制格式
            target_binary = [1 if num in target_numbers else 0 for num in range(1, 36)]
            targets.append(target_binary)

        feature_df = pd.DataFrame(features)
        target_df = pd.DataFrame(targets, columns=[f'target_{num}' for num in range(1, 36)])

        # 处理缺失值
        feature_df.fillna(feature_df.mean(), inplace=True)

        self.feature_columns = feature_df.columns.tolist()

        return feature_df, target_df

    def train_classification_models(self, X: pd.DataFrame, y: pd.DataFrame) -> Dict[str, Any]:
        """训练分类模型"""
        # 特征缩放
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['standard'] = scaler

        models = {}
        cv = TimeSeriesSplit(n_splits=5)

        # 随机森林
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_scores = cross_val_score(rf, X_scaled, y.values.argmax(axis=1), cv=cv, scoring='accuracy')
        rf.fit(X_scaled, y.values.argmax(axis=1))
        models['random_forest'] = {
            'model': rf,
            'cv_scores': rf_scores.tolist(),
            'mean_score': rf_scores.mean(),
            'feature_importance': rf.feature_importances_.tolist()
        }

        # 支持向量机
        svm = SVC(kernel='rbf', probability=True, random_state=42)
        svm_scores = cross_val_score(svm, X_scaled, y.values.argmax(axis=1), cv=cv, scoring='accuracy')
        svm.fit(X_scaled, y.values.argmax(axis=1))
        models['svm'] = {
            'model': svm,
            'cv_scores': svm_scores.tolist(),
            'mean_score': svm_scores.mean()
        }

        # 梯度提升
        gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
        gb_scores = cross_val_score(gb, X_scaled, y.values.argmax(axis=1), cv=cv, scoring='accuracy')
        gb.fit(X_scaled, y.values.argmax(axis=1))
        models['gradient_boosting'] = {
            'model': gb,
            'cv_scores': gb_scores.tolist(),
            'mean_score': gb_scores.mean(),
            'feature_importance': gb.feature_importances_.tolist()
        }

        self.models = models
        return models

    def train_clustering_model(self, X: pd.DataFrame, n_clusters: int = 5) -> Dict[str, Any]:
        """训练聚类模型"""
        # 特征缩放
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # K-means聚类
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(X_scaled)

        # DBSCAN聚类
        dbscan = DBSCAN(eps=0.5, min_samples=5)
        dbscan_labels = dbscan.fit_predict(X_scaled)

        clustering_results = {
            'kmeans': {
                'model': kmeans,
                'labels': cluster_labels.tolist(),
                'n_clusters': len(set(cluster_labels)),
                'inertia': kmeans.inertia_
            },
            'dbscan': {
                'model': dbscan,
                'labels': dbscan_labels.tolist(),
                'n_clusters': len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0),
                'n_noise': list(dbscan_labels).count(-1)
            }
        }

        return clustering_results

    def predict_next_numbers(self, latest_features: pd.DataFrame, top_k: int = 5) -> Dict[str, List[int]]:
        """预测下一期号码"""
        if not self.models:
            raise ValueError("请先训练模型")

        # 特征缩放
        if 'standard' in self.scalers:
            latest_features_scaled = self.scalers['standard'].transform(latest_features)
        else:
            latest_features_scaled = latest_features

        predictions = {}

        # 随机森林预测
        if 'random_forest' in self.models:
            rf_model = self.models['random_forest']['model']
            rf_proba = rf_model.predict_proba(latest_features_scaled)[0]
            rf_top_indices = np.argsort(rf_proba[0])[-top_k:][::-1]
            predictions['random_forest'] = [idx + 1 for idx in rf_top_indices]  # 转换为实际号码

        # SVM预测
        if 'svm' in self.models:
            svm_model = self.models['svm']['model']
            svm_proba = svm_model.predict_proba(latest_features_scaled)[0]
            svm_top_indices = np.argsort(svm_proba[0])[-top_k:][::-1]
            predictions['svm'] = [idx + 1 for idx in svm_top_indices]

        # 梯度提升预测
        if 'gradient_boosting' in self.models:
            gb_model = self.models['gradient_boosting']['model']
            gb_proba = gb_model.predict_proba(latest_features_scaled)[0]
            gb_top_indices = np.argsort(gb_proba[0])[-top_k:][::-1]
            predictions['gradient_boosting'] = [idx + 1 for idx in gb_top_indices]

        return predictions

    def get_feature_importance(self) -> Dict[str, List[float]]:
        """获取特征重要性"""
        importance = {}

        for model_name, model_info in self.models.items():
            if 'feature_importance' in model_info:
                importance[model_name] = dict(zip(
                    self.feature_columns,
                    model_info['feature_importance']
                ))

        return importance


class IntegratedPredictionSystem:
    """集成预测系统"""

    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.ml_trainer = MLModelTrainer()
        self.analysis_results = {}

    def load_historical_data(self, csv_file: str) -> pd.DataFrame:
        """从CSV文件加载历史数据"""
        try:
            data = pd.read_csv(csv_file)

            # 转换为LotteryDraw对象
            draws = []
            for _, row in data.iterrows():
                draw = LotteryDraw(
                    period=str(row['period']),
                    draw_date=pd.to_datetime(row['draw_date']),
                    numbers=[int(row[f'num_{i}']) for i in range(1, 6)]
                )
                draws.append(draw)

            return self.statistical_analyzer.load_data(draws)

        except Exception as e:
            print(f"加载数据失败: {e}")
            return pd.DataFrame()

    def run_comprehensive_analysis(self) -> Dict[str, AnalysisResult]:
        """运行综合分析"""
        print("开始综合分析...")

        # 频率分析
        print("执行频率分析...")
        self.analysis_results['frequency'] = self.statistical_analyzer.frequency_analysis()

        # 遗漏值分析
        print("执行遗漏值分析...")
        self.analysis_results['missing'] = self.statistical_analyzer.missing_value_analysis()

        # 相关性分析
        print("执行相关性分析...")
        self.analysis_results['correlation'] = self.statistical_analyzer.correlation_analysis()

        # 时间序列分析
        print("执行时间序列分析...")
        self.analysis_results['time_series'] = self.statistical_analyzer.time_series_analysis()

        return self.analysis_results

    def train_models(self) -> Dict[str, Any]:
        """训练预测模型"""
        if self.statistical_analyzer.data is None:
            raise ValueError("请先加载历史数据")

        print("准备特征数据...")
        X, y = self.ml_trainer.prepare_features(self.statistical_analyzer.data)

        print("训练分类模型...")
        classification_results = self.ml_trainer.train_classification_models(X, y)

        print("训练聚类模型...")
        clustering_results = self.ml_trainer.train_clustering_model(X)

        return {
            'classification': classification_results,
            'clustering': clustering_results,
            'feature_importance': self.ml_trainer.get_feature_importance()
        }

    def generate_predictions(self) -> Dict[str, Any]:
        """生成综合预测"""
        if not self.analysis_results or not self.ml_trainer.models:
            raise ValueError("请先进行分析和模型训练")

        # 获取最新特征
        latest_data = self.statistical_analyzer.data.tail(5)
        latest_features = pd.DataFrame([{
            'num_1_mean': latest_data['num_1'].mean(),
            'num_1_std': latest_data['num_1'].std(),
            'num_1_trend': latest_data['num_1'].iloc[-1] - latest_data['num_1'].iloc[0],
            'num_2_mean': latest_data['num_2'].mean(),
            'num_2_std': latest_data['num_2'].std(),
            'num_2_trend': latest_data['num_2'].iloc[-1] - latest_data['num_2'].iloc[0],
            'num_3_mean': latest_data['num_3'].mean(),
            'num_3_std': latest_data['num_3'].std(),
            'num_3_trend': latest_data['num_3'].iloc[-1] - latest_data['num_3'].iloc[0],
            'num_4_mean': latest_data['num_4'].mean(),
            'num_4_std': latest_data['num_4'].std(),
            'num_4_trend': latest_data['num_4'].iloc[-1] - latest_data['num_4'].iloc[0],
            'num_5_mean': latest_data['num_5'].mean(),
            'num_5_std': latest_data['num_5'].std(),
            'num_5_trend': latest_data['num_5'].iloc[-1] - latest_data['num_5'].iloc[0],
            'sum_mean': latest_data['sum'].mean(),
            'sum_std': latest_data['sum'].std(),
            'sum_trend': latest_data['sum'].iloc[-1] - latest_data['sum'].iloc[0],
            'odd_ratio_avg': latest_data['odd_count'].mean() / 5,
            'big_ratio_avg': latest_data['big_count'].mean() / 5,
            'consecutive_avg': latest_data['consecutive_pairs'].mean()
        }])

        # 填充缺失值
        latest_features.fillna(0, inplace=True)

        # 机器学习预测
        ml_predictions = self.ml_trainer.predict_next_numbers(latest_features)

        # 统计分析预测
        frequency_result = self.analysis_results['frequency']
        missing_result = self.analysis_results['missing']

        # 综合预测
        ensemble_prediction = self._ensemble_predictions(
            ml_predictions,
            frequency_result.results,
            missing_result.results
        )

        return {
            'ml_predictions': ml_predictions,
            'statistical_insights': {
                'hot_numbers': frequency_result.results['hot_numbers'],
                'cold_numbers': frequency_result.results['cold_numbers'],
                'top_missing': [num for num, _ in missing_result.results['top_missing_numbers'][:5]]
            },
            'ensemble_prediction': ensemble_prediction,
            'confidence_scores': self._calculate_confidence_scores()
        }

    def _ensemble_predictions(self, ml_preds: Dict, freq_results: Dict, missing_results: Dict) -> List[int]:
        """集成预测结果"""
        # 收集所有候选号码
        candidates = {}

        # 机器学习预测权重
        ml_weight = 0.6
        for model_name, numbers in ml_preds.items():
            for num in numbers:
                candidates[num] = candidates.get(num, 0) + ml_weight

        # 频率分析权重
        freq_weight = 0.2
        for num in freq_results['hot_numbers']:
            candidates[num] = candidates.get(num, 0) + freq_weight

        # 遗漏分析权重
        missing_weight = 0.2
        for num, _ in missing_results['top_missing_numbers'][:5]:
            candidates[num] = candidates.get(num, 0) + missing_weight

        # 选择得分最高的5个号码
        sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        final_numbers = [num for num, score in sorted_candidates[:5]]

        # 确保号码不重复且符合要求
        if len(set(final_numbers)) < 5:
            # 补充号码
            all_numbers = set(range(1, 36))
            used_numbers = set(final_numbers)
            remaining_numbers = sorted(all_numbers - used_numbers)

            while len(final_numbers) < 5 and remaining_numbers:
                final_numbers.append(remaining_numbers.pop(0))

        return sorted(final_numbers[:5])

    def _calculate_confidence_scores(self) -> Dict[str, float]:
        """计算预测置信度"""
        confidence = {}

        # 基于模型性能计算置信度
        for model_name, model_info in self.ml_trainer.models.items():
            confidence[model_name] = model_info['mean_score']

        # 整体置信度
        overall_confidence = np.mean(list(confidence.values())) if confidence else 0.5

        confidence['ensemble'] = overall_confidence

        return confidence

    def generate_analysis_report(self) -> str:
        """生成分析报告"""
        report = []
        report.append("=" * 60)
        report.append("AI数据分析报告")
        report.append("=" * 60)
        report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")

        # 分析结果摘要
        for analysis_type, result in self.analysis_results.items():
            report.append(f"## {result.analysis_type}")
            report.append(f"置信水平: {result.confidence_level:.2%}")
            report.append("分析结果:")
            report.append(result.interpretation)
            report.append("")

        return "\n".join(report)

    def save_results(self, output_file: str = "analysis_results.json") -> None:
        """保存分析结果"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'analysis_results': {
                name: {
                    'type': result.analysis_type,
                    'confidence': result.confidence_level,
                    'results': result.results,
                    'interpretation': result.interpretation
                }
                for name, result in self.analysis_results.items()
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)

        print(f"分析结果已保存到 {output_file}")


def main():
    """主函数示例"""
    # 创建集成预测系统
    system = IntegratedPredictionSystem()

    # 模拟生成一些测试数据
    print("生成测试数据...")
    test_draws = []
    base_date = datetime(2024, 1, 1)

    for i in range(100):
        draw = LotteryDraw(
            period=f"2024{(i+1):03d}",
            draw_date=base_date + timedelta(days=i),
            numbers=sorted(np.random.choice(range(1, 36), 5, replace=False))
        )
        test_draws.append(draw)

    # 加载数据
    data = system.statistical_analyzer.load_data(test_draws)
    print(f"加载了 {len(data)} 期历史数据")

    # 运行综合分析
    analysis_results = system.run_comprehensive_analysis()

    # 训练模型
    training_results = system.train_models()

    # 生成预测
    predictions = system.generate_predictions()

    # 生成报告
    report = system.generate_analysis_report()
    print(report)

    print("\n预测结果:")
    print(f"集成预测: {predictions['ensemble_prediction']}")
    print(f"置信度: {predictions['confidence_scores']}")

    # 保存结果
    system.save_results()


if __name__ == "__main__":
    main()