#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI严谨预测系统主程序
集成所有功能模块的主入口
"""

import sys
import os
import logging
import argparse
from datetime import datetime
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from data_analytics_framework import IntegratedPredictionSystem, LotteryDraw
from auto_strategy_manager import AdaptiveStrategyManager, PredictionResult

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_prediction_system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AIPredictionSystem:
    """AI预测系统主类"""

    def __init__(self, config_file: str = "STRATEGY_CONFIG.json"):
        """初始化系统"""
        self.config_file = config_file
        self.prediction_system = IntegratedPredictionSystem()
        self.strategy_manager = AdaptiveStrategyManager(config_file)

        logger.info("AI严谨预测系统初始化完成")
        self.print_system_info()

    def print_system_info(self):
        """打印系统信息"""
        print("=" * 60)
        print("🤖 AI严谨预测系统")
        print("=" * 60)
        print("📋 系统特性:")
        print("  • 资深数据科学家身份定位")
        print("  • 多算法融合预测")
        print("  • 自动胜率验证和策略切换")
        print("  • 实时性能监控")
        print("  • 全面统计分析")
        print("=" * 60)

    def load_data(self, data_file: str) -> bool:
        """加载历史数据"""
        try:
            logger.info(f"开始加载历史数据: {data_file}")
            data = self.prediction_system.statistical_analyzer.load_data(data_file)

            if data.empty:
                logger.error("数据加载失败或数据为空")
                return False

            logger.info(f"成功加载 {len(data)} 期历史数据")
            print(f"✅ 数据加载成功: {len(data)} 期历史数据")
            return True

        except Exception as e:
            logger.error(f"数据加载失败: {e}")
            print(f"❌ 数据加载失败: {e}")
            return False

    def run_analysis(self) -> dict:
        """运行综合分析"""
        try:
            logger.info("开始执行综合分析")
            print("\n🔍 执行综合分析...")

            analysis_results = self.prediction_system.run_comprehensive_analysis()

            print("✅ 分析完成")

            # 打印分析摘要
            self.print_analysis_summary(analysis_results)

            return analysis_results

        except Exception as e:
            logger.error(f"分析执行失败: {e}")
            print(f"❌ 分析执行失败: {e}")
            return {}

    def print_analysis_summary(self, analysis_results: dict):
        """打印分析摘要"""
        print("\n📊 分析结果摘要:")
        print("-" * 40)

        for name, result in analysis_results.items():
            print(f"• {result.analysis_type}: 置信度 {result.confidence_level:.2%}")

            # 打印关键发现
            if name == 'frequency':
                hot_count = len(result.results.get('hot_numbers', []))
                cold_count = len(result.results.get('cold_numbers', []))
                print(f"  🔥 热号: {hot_count} 个, ❄️ 冷号: {cold_count} 个")

            elif name == 'missing':
                top_missing = result.results.get('top_missing_numbers', [])[:3]
                missing_str = ", ".join([f"{num}({missing}期)" for num, missing in top_missing])
                print(f"  📈 最大遗漏: {missing_str}")

    def train_models(self) -> dict:
        """训练预测模型"""
        try:
            logger.info("开始训练预测模型")
            print("\n🧠 训练预测模型...")

            training_results = self.prediction_system.train_models()

            print("✅ 模型训练完成")

            # 打印训练摘要
            self.print_training_summary(training_results)

            return training_results

        except Exception as e:
            logger.error(f"模型训练失败: {e}")
            print(f"❌ 模型训练失败: {e}")
            return {}

    def print_training_summary(self, training_results: dict):
        """打印训练摘要"""
        print("\n📈 模型训练结果:")
        print("-" * 40)

        classification_results = training_results.get('classification', {})

        for model_name, model_info in classification_results.items():
            mean_score = model_info.get('mean_score', 0)
            cv_scores = model_info.get('cv_scores', [])

            print(f"• {model_name}:")
            print(f"  平均准确率: {mean_score:.2%}")
            print(f"  交叉验证: {[f'{score:.2%}' for score in cv_scores[-3:]]}")

    def generate_predictions(self) -> dict:
        """生成预测结果"""
        try:
            logger.info("开始生成预测")
            print("\n🎯 生成预测结果...")

            predictions = self.prediction_system.generate_predictions()

            print("✅ 预测生成完成")

            # 打印预测结果
            self.print_predictions(predictions)

            return predictions

        except Exception as e:
            logger.error(f"预测生成失败: {e}")
            print(f"❌ 预测生成失败: {e}")
            return {}

    def print_predictions(self, predictions: dict):
        """打印预测结果"""
        print("\n🎲 预测结果:")
        print("=" * 50)

        # 集成预测结果
        ensemble_pred = predictions.get('ensemble_prediction', [])
        if ensemble_pred:
            print(f"🏆 推荐组合: {', '.join(map(str, ensemble_pred))}")

        # 各模型预测
        ml_preds = predictions.get('ml_predictions', {})
        if ml_preds:
            print("\n🤖 各模型预测:")
            for model, numbers in ml_preds.items():
                print(f"  • {model}: {', '.join(map(str, numbers))}")

        # 统计洞察
        insights = predictions.get('statistical_insights', {})
        if insights:
            print("\n📊 统计洞察:")
            hot_numbers = insights.get('hot_numbers', [])
            cold_numbers = insights.get('cold_numbers', [])
            top_missing = insights.get('top_missing', [])

            if hot_numbers:
                print(f"  🔥 热号: {', '.join(map(str, hot_numbers[:5]))}")
            if cold_numbers:
                print(f"  ❄️ 冷号: {', '.join(map(str, cold_numbers[:5]))}")
            if top_missing:
                print(f"  📈 遗漏最长: {', '.join(map(str, top_missing[:3]))}")

        # 置信度
        confidence = predictions.get('confidence_scores', {})
        if confidence:
            print(f"\n📈 置信度评估:")
            for model, score in confidence.items():
                print(f"  • {model}: {score:.2%}")

        print("=" * 50)

    def generate_report(self, output_file: str = None) -> str:
        """生成完整报告"""
        try:
            logger.info("生成分析报告")

            report = self.prediction_system.generate_analysis_report()

            # 添加策略性能报告
            strategy_report = self.strategy_manager.get_strategy_performance_report()
            full_report = report + "\n\n" + strategy_report

            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(full_report)
                print(f"📋 报告已保存到: {output_file}")

            return full_report

        except Exception as e:
            logger.error(f"报告生成失败: {e}")
            print(f"❌ 报告生成失败: {e}")
            return ""

    def save_results(self, output_dir: str = "output"):
        """保存所有结果"""
        try:
            # 创建输出目录
            os.makedirs(output_dir, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # 保存分析结果
            analysis_file = os.path.join(output_dir, f"analysis_results_{timestamp}.json")
            self.prediction_system.save_results(analysis_file)

            # 保存完整报告
            report_file = os.path.join(output_dir, f"analysis_report_{timestamp}.md")
            self.generate_report(report_file)

            # 保存策略性能
            strategy_file = os.path.join(output_dir, f"strategy_performance_{timestamp}.txt")
            with open(strategy_file, 'w', encoding='utf-8') as f:
                f.write(self.strategy_manager.get_strategy_performance_report())

            print(f"💾 所有结果已保存到: {output_dir}")

        except Exception as e:
            logger.error(f"结果保存失败: {e}")
            print(f"❌ 结果保存失败: {e}")

    def run_full_pipeline(self, data_file: str, save_results: bool = True) -> bool:
        """运行完整的预测流程"""
        try:
            print("🚀 开始执行完整预测流程...")

            # 1. 加载数据
            if not self.load_data(data_file):
                return False

            # 2. 运行分析
            analysis_results = self.run_analysis()
            if not analysis_results:
                return False

            # 3. 训练模型
            training_results = self.train_models()
            if not training_results:
                return False

            # 4. 生成预测
            predictions = self.generate_predictions()
            if not predictions:
                return False

            # 5. 生成报告
            self.generate_report()

            # 6. 保存结果
            if save_results:
                self.save_results()

            print("\n🎉 完整预测流程执行成功!")
            return True

        except Exception as e:
            logger.error(f"预测流程执行失败: {e}")
            print(f"❌ 预测流程执行失败: {e}")
            return False

    def validate_prediction(self, predicted_numbers: list, actual_numbers: list) -> bool:
        """验证预测结果"""
        try:
            # 创建预测结果对象
            prediction_result = PredictionResult(
                strategy_name="集成学习策略",
                prediction_date=datetime.now(),
                predicted_numbers=predicted_numbers,
                actual_numbers=actual_numbers,
                probability_score=0.75,  # 默认置信度
                confidence_interval=(0.65, 0.85)
            )

            # 记录到策略管理器
            self.strategy_manager.record_prediction(prediction_result)

            # 计算命中数
            hits = len(set(predicted_numbers) & set(actual_numbers))
            accuracy = hits / len(predicted_numbers)

            print(f"✅ 预测验证完成: 命中 {hits}/{len(predicted_numbers)} 个号码, 准确率 {accuracy:.2%}")

            # 如果准确率低于阈值，输出警告
            if accuracy < 0.40:
                print("⚠️ 预测准确率低于40%，系统将自动调整策略权重")

            return True

        except Exception as e:
            logger.error(f"预测验证失败: {e}")
            print(f"❌ 预测验证失败: {e}")
            return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="AI严谨预测系统")
    parser.add_argument("--data", "-d", required=True, help="历史数据文件路径")
    parser.add_argument("--config", "-c", default="STRATEGY_CONFIG.json", help="配置文件路径")
    parser.add_argument("--output", "-o", default="output", help="输出目录")
    parser.add_argument("--no-save", action="store_true", help="不保存结果到文件")
    parser.add_argument("--validate", nargs=5, type=int, metavar="NUM", help="验证预测结果 (提供5个实际开奖号码)")

    args = parser.parse_args()

    # 检查数据文件是否存在
    if not os.path.exists(args.data):
        print(f"❌ 数据文件不存在: {args.data}")
        return 1

    # 创建系统实例
    system = AIPredictionSystem(args.config)

    # 运行完整流程
    success = system.run_full_pipeline(args.data, not args.no_save)

    if not success:
        return 1

    # 如果提供了验证号码，进行预测验证
    if args.validate:
        actual_numbers = list(args.validate)
        print(f"\n🔍 开始验证预测结果...")
        print(f"实际开奖号码: {', '.join(map(str, actual_numbers))}")

        # 获取最新的预测结果进行验证
        if hasattr(system.prediction_system, '_last_prediction'):
            predicted_numbers = system.prediction_system._last_prediction
            system.validate_prediction(predicted_numbers, actual_numbers)
        else:
            print("⚠️ 未找到可验证的预测结果")

    print("\n👋 感谢使用AI严谨预测系统!")
    return 0


if __name__ == "__main__":
    exit(main())