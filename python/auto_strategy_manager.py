#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动策略管理器
实现胜率验证和自动策略切换机制
"""

import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import sqlite3
from abc import ABC, abstractmethod

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('strategy_management.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    """预测结果数据结构"""
    strategy_name: str
    prediction_date: datetime
    predicted_numbers: List[int]
    actual_numbers: Optional[List[int]]
    probability_score: float
    confidence_interval: Tuple[float, float]
    is_correct: Optional[bool] = None

    def validate_prediction(self, actual: List[int], hit_threshold: int = 3) -> bool:
        """验证预测结果是否正确"""
        if self.actual_numbers is None:
            self.actual_numbers = actual
            hits = len(set(self.predicted_numbers) & set(actual))
            self.is_correct = hits >= hit_threshold
        return self.is_correct


@dataclass
class StrategyPerformance:
    """策略性能指标"""
    strategy_name: str
    total_predictions: int
    correct_predictions: int
    accuracy: float
    average_confidence: float
    last_updated: datetime
    recent_accuracy_trend: List[float]
    consecutive_failures: int
    weight: float

    def update_accuracy(self) -> None:
        """更新准确率"""
        if self.total_predictions > 0:
            self.accuracy = self.correct_predictions / self.total_predictions

    def update_trend(self, new_accuracy: float, window_size: int = 10) -> None:
        """更新准确率趋势"""
        self.recent_accuracy_trend.append(new_accuracy)
        if len(self.recent_accuracy_trend) > window_size:
            self.recent_accuracy_trend.pop(0)


class DatabaseManager:
    """数据库管理器"""

    def __init__(self, db_path: str = "strategy_performance.db"):
        self.db_path = db_path
        self._initialize_database()

    def _initialize_database(self) -> None:
        """初始化数据库表"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # 创建预测结果表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    strategy_name TEXT NOT NULL,
                    prediction_date TEXT NOT NULL,
                    predicted_numbers TEXT NOT NULL,
                    actual_numbers TEXT,
                    probability_score REAL,
                    confidence_interval TEXT,
                    is_correct INTEGER
                )
            """)

            # 创建策略性能表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strategy_performance (
                    strategy_name TEXT PRIMARY KEY,
                    total_predictions INTEGER DEFAULT 0,
                    correct_predictions INTEGER DEFAULT 0,
                    accuracy REAL DEFAULT 0.0,
                    average_confidence REAL DEFAULT 0.0,
                    last_updated TEXT,
                    recent_accuracy_trend TEXT,
                    consecutive_failures INTEGER DEFAULT 0,
                    weight REAL DEFAULT 1.0
                )
            """)

            conn.commit()

    def save_prediction(self, prediction: PredictionResult) -> None:
        """保存预测结果"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO predictions
                (strategy_name, prediction_date, predicted_numbers, actual_numbers,
                 probability_score, confidence_interval, is_correct)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                prediction.strategy_name,
                prediction.prediction_date.isoformat(),
                json.dumps(prediction.predicted_numbers),
                json.dumps(prediction.actual_numbers) if prediction.actual_numbers else None,
                prediction.probability_score,
                json.dumps(prediction.confidence_interval),
                int(prediction.is_correct) if prediction.is_correct is not None else None
            ))

            conn.commit()

    def update_strategy_performance(self, performance: StrategyPerformance) -> None:
        """更新策略性能"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR REPLACE INTO strategy_performance
                (strategy_name, total_predictions, correct_predictions, accuracy,
                 average_confidence, last_updated, recent_accuracy_trend,
                 consecutive_failures, weight)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                performance.strategy_name,
                performance.total_predictions,
                performance.correct_predictions,
                performance.accuracy,
                performance.average_confidence,
                performance.last_updated.isoformat(),
                json.dumps(performance.recent_accuracy_trend),
                performance.consecutive_failures,
                performance.weight
            ))

            conn.commit()

    def get_strategy_performance(self, strategy_name: str) -> Optional[StrategyPerformance]:
        """获取策略性能"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM strategy_performance WHERE strategy_name = ?
            """, (strategy_name,))

            row = cursor.fetchone()
            if row:
                return StrategyPerformance(
                    strategy_name=row[0],
                    total_predictions=row[1],
                    correct_predictions=row[2],
                    accuracy=row[3],
                    average_confidence=row[4],
                    last_updated=datetime.fromisoformat(row[5]),
                    recent_accuracy_trend=json.loads(row[6]) if row[6] else [],
                    consecutive_failures=row[7],
                    weight=row[8]
                )
        return None


class AdaptiveStrategyManager:
    """自适应策略管理器"""

    def __init__(self, config_path: str = "STRATEGY_CONFIG.json"):
        self.config_path = config_path
        self.config = self._load_config()
        self.db_manager = DatabaseManager()
        self.strategy_performance: Dict[str, StrategyPerformance] = {}
        self._initialize_strategy_performance()

        # 验证阈值
        self.min_accuracy_threshold = self.config["adaptive_mechanism"]["performance_thresholds"]["minimum_accuracy"]
        self.max_weight_drop = self.config["adaptive_mechanism"]["performance_thresholds"]["maximum_weight_drop"]
        self.weight_adjustment_factor = self.config["adaptive_mechanism"]["performance_thresholds"]["weight_adjustment_factor"]
        self.evaluation_window = self.config["adaptive_mechanism"]["performance_thresholds"]["evaluation_window"]

    def _load_config(self) -> dict:
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"配置文件 {self.config_path} 未找到")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"配置文件格式错误: {e}")
            return {}

    def _initialize_strategy_performance(self) -> None:
        """初始化策略性能记录"""
        strategies = self.config.get("prediction_strategies", {})

        for strategy_key, strategy_config in strategies.items():
            if strategy_config.get("enabled", True):
                strategy_name = strategy_config["name"]

                # 从数据库加载已有性能数据
                performance = self.db_manager.get_strategy_performance(strategy_name)

                if performance is None:
                    # 创建新的性能记录
                    performance = StrategyPerformance(
                        strategy_name=strategy_name,
                        total_predictions=0,
                        correct_predictions=0,
                        accuracy=0.0,
                        average_confidence=0.0,
                        last_updated=datetime.now(),
                        recent_accuracy_trend=[],
                        consecutive_failures=0,
                        weight=strategy_config.get("weight", 0.2)
                    )

                self.strategy_performance[strategy_name] = performance
                logger.info(f"初始化策略性能: {strategy_name}, 权重: {performance.weight:.2f}")

    def record_prediction(self, prediction: PredictionResult) -> None:
        """记录预测结果"""
        # 验证预测结果
        if prediction.actual_numbers is not None:
            prediction.validate_prediction(prediction.actual_numbers)

        # 保存到数据库
        self.db_manager.save_prediction(prediction)

        # 更新策略性能
        self._update_strategy_performance(prediction)

        logger.info(f"记录预测结果: {prediction.strategy_name}, 正确: {prediction.is_correct}")

    def _update_strategy_performance(self, prediction: PredictionResult) -> None:
        """更新策略性能指标"""
        strategy_name = prediction.strategy_name
        performance = self.strategy_performance.get(strategy_name)

        if performance is None:
            logger.warning(f"未知策略: {strategy_name}")
            return

        # 更新基本统计
        performance.total_predictions += 1
        if prediction.is_correct:
            performance.correct_predictions += 1
            performance.consecutive_failures = 0
        else:
            performance.consecutive_failures += 1

        # 更新准确率
        performance.update_accuracy()

        # 更新平均置信度
        performance.average_confidence = (
            (performance.average_confidence * (performance.total_predictions - 1) +
             prediction.probability_score) / performance.total_predictions
        )

        # 更新趋势
        performance.update_trend(1.0 if prediction.is_correct else 0.0)

        # 更新时间戳
        performance.last_updated = datetime.now()

        # 保存到数据库
        self.db_manager.update_strategy_performance(performance)

        # 检查是否需要调整策略
        self._evaluate_strategy_adjustment(performance)

    def _evaluate_strategy_adjustment(self, performance: StrategyPerformance) -> None:
        """评估策略调整"""
        adjustment_rules = self.config["adaptive_mechanism"]["weight_adjustment_rules"]

        # 检查连续失败
        consecutive_failure_rule = adjustment_rules["consecutive_failures"]
        if performance.consecutive_failures >= consecutive_failure_rule["threshold"]:
            self._handle_consecutive_failures(performance)
            return

        # 检查性能低于阈值
        if performance.accuracy < self.min_accuracy_threshold:
            self._handle_low_performance(performance, adjustment_rules["performance_below_threshold"])

        # 检查性能高于阈值
        elif performance.accuracy > self.min_accuracy_threshold + 0.1:
            self._handle_high_performance(performance, adjustment_rules["performance_above_threshold"])

    def _handle_consecutive_failures(self, performance: StrategyPerformance) -> None:
        """处理连续失败情况"""
        logger.warning(f"策略 {performance.strategy_name} 连续失败 {performance.consecutive_failures} 次")

        # 临时禁用策略
        original_weight = performance.weight
        performance.weight *= 0.1  # 大幅降低权重

        # 更新配置
        self._update_strategy_weight_in_config(performance.strategy_name, performance.weight)

        logger.info(f"策略 {performance.strategy_name} 权重已临时降低: {original_weight:.3f} -> {performance.weight:.3f}")

    def _handle_low_performance(self, performance: StrategyPerformance, rule: dict) -> None:
        """处理低性能情况"""
        old_weight = performance.weight
        new_weight = max(
            performance.weight * rule["factor"],
            rule["min_weight"]
        )

        # 确保不超过最大权重下降
        if old_weight - new_weight > old_weight * self.max_weight_drop:
            new_weight = old_weight * (1 - self.max_weight_drop)

        performance.weight = new_weight
        self._update_strategy_weight_in_config(performance.strategy_name, performance.weight)

        logger.info(f"策略 {performance.strategy_name} 性能低于阈值，权重调整: {old_weight:.3f} -> {new_weight:.3f}")

    def _handle_high_performance(self, performance: StrategyPerformance, rule: dict) -> None:
        """处理高性能情况"""
        old_weight = performance.weight
        new_weight = min(
            performance.weight * rule["factor"],
            rule["max_weight"]
        )

        performance.weight = new_weight
        self._update_strategy_weight_in_config(performance.strategy_name, performance.weight)

        logger.info(f"策略 {performance.strategy_name} 性能优秀，权重提升: {old_weight:.3f} -> {new_weight:.3f}")

    def _update_strategy_weight_in_config(self, strategy_name: str, new_weight: float) -> None:
        """更新配置文件中的策略权重"""
        strategies = self.config["prediction_strategies"]

        for strategy_key, strategy_config in strategies.items():
            if strategy_config["name"] == strategy_name:
                strategy_config["weight"] = new_weight
                break

        # 保存配置到文件
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")

    def get_current_strategy_weights(self) -> Dict[str, float]:
        """获取当前策略权重"""
        return {
            name: perf.weight
            for name, perf in self.strategy_performance.items()
        }

    def get_strategy_performance_report(self) -> str:
        """生成策略性能报告"""
        report = []
        report.append("=" * 50)
        report.append("策略性能报告")
        report.append("=" * 50)
        report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"最低准确率阈值: {self.min_accuracy_threshold:.2%}")
        report.append("")

        # 按准确率排序
        sorted_strategies = sorted(
            self.strategy_performance.items(),
            key=lambda x: x[1].accuracy,
            reverse=True
        )

        for strategy_name, performance in sorted_strategies:
            status = "✅ 优秀" if performance.accuracy >= self.min_accuracy_threshold + 0.1 else \
                     "⚠️ 一般" if performance.accuracy >= self.min_accuracy_threshold else "❌ 需优化"

            recent_trend = np.mean(performance.recent_accuracy_trend[-5:]) if performance.recent_accuracy_trend else 0

            report.append(f"策略: {strategy_name}")
            report.append(f"  状态: {status}")
            report.append(f"  总预测次数: {performance.total_predictions}")
            report.append(f"  正确预测次数: {performance.correct_predictions}")
            report.append(f"  准确率: {performance.accuracy:.2%}")
            report.append(f"  平均置信度: {performance.average_confidence:.2%}")
            report.append(f"  当前权重: {performance.weight:.3f}")
            report.append(f"  连续失败次数: {performance.consecutive_failures}")
            report.append(f"  近期趋势: {recent_trend:.2%}")
            report.append(f"  最后更新: {performance.last_updated.strftime('%m-%d %H:%M')}")
            report.append("")

        # 总体统计
        total_predictions = sum(p.total_predictions for p in self.strategy_performance.values())
        total_correct = sum(p.correct_predictions for p in self.strategy_performance.values())
        overall_accuracy = total_correct / total_predictions if total_predictions > 0 else 0

        report.append("=" * 50)
        report.append("总体统计")
        report.append("=" * 50)
        report.append(f"总预测次数: {total_predictions}")
        report.append(f"总正确次数: {total_correct}")
        report.append(f"总体准确率: {overall_accuracy:.2%}")
        report.append(f"活跃策略数量: {len(self.strategy_performance)}")

        return "\n".join(report)

    def should_switch_strategy(self, current_strategy: str) -> bool:
        """判断是否应该切换策略"""
        current_performance = self.strategy_performance.get(current_strategy)

        if current_performance is None:
            return True

        # 检查当前策略是否表现不佳
        if current_performance.accuracy < self.min_accuracy_threshold:
            return True

        # 检查是否有更好的策略
        best_strategy = self.get_best_performing_strategy()
        if best_strategy and best_strategy != current_strategy:
            best_performance = self.strategy_performance[best_strategy]
            if best_performance.accuracy > current_performance.accuracy + 0.05:
                return True

        return False

    def get_best_performing_strategy(self) -> Optional[str]:
        """获取表现最好的策略"""
        if not self.strategy_performance:
            return None

        # 过滤出有足够预测次数的策略
        min_predictions = max(10, self.evaluation_window // 2)
        qualified_strategies = {
            name: perf for name, perf in self.strategy_performance.items()
            if perf.total_predictions >= min_predictions
        }

        if not qualified_strategies:
            return None

        # 返回准确率最高的策略
        return max(qualified_strategies.items(), key=lambda x: x[1].accuracy)[0]


def main():
    """主函数示例"""
    # 创建策略管理器
    manager = AdaptiveStrategyManager()

    # 模拟一些预测结果
    test_predictions = [
        PredictionResult(
            strategy_name="频率分析策略",
            prediction_date=datetime.now(),
            predicted_numbers=[1, 5, 12, 23, 30],
            actual_numbers=[2, 5, 13, 23, 31],
            probability_score=0.65,
            confidence_interval=(0.55, 0.75)
        ),
        PredictionResult(
            strategy_name="时间序列策略",
            prediction_date=datetime.now(),
            predicted_numbers=[3, 8, 15, 22, 29],
            actual_numbers=[3, 8, 15, 22, 29],
            probability_score=0.82,
            confidence_interval=(0.75, 0.89)
        )
    ]

    # 记录预测结果
    for prediction in test_predictions:
        manager.record_prediction(prediction)

    # 生成性能报告
    print(manager.get_strategy_performance_report())

    # 获取当前权重
    print("\n当前策略权重:")
    weights = manager.get_current_strategy_weights()
    for strategy, weight in weights.items():
        print(f"  {strategy}: {weight:.3f}")


if __name__ == "__main__":
    main()