import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional

from utils.file_reader import read_data_csv

DATASETS_DIR = Path(__file__).resolve().parents[1] / "data" / "datasets"

def _compute_numeric_stats(series: pd.Series) -> Dict[str, Any]:
    """Вычисляет статистику для числовой колонки"""
    # Удаляем пропуски для расчётов
    clean = series.dropna()
    if len(clean) == 0:
        return {
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "histogram": []  # пока пусто
        }
    # Приводим к числовому типу, если ещё не числовой
    numeric = pd.to_numeric(clean, errors='coerce').dropna()
    if len(numeric) == 0:
        return {
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "histogram": []
        }
    return {
        "min": float(numeric.min()),
        "max": float(numeric.max()),
        "mean": float(numeric.mean()),
        "median": float(numeric.median()),
        "histogram": _compute_histogram(numeric)  
    }

def _compute_histogram(series: pd.Series, bins: int = 10) -> List[Dict[str, float]]:
    """Строит гистограмму: список объектов {bucket_start, bucket_end, count}"""
    if series.empty:
        return []
    min_val = series.min()
    max_val = series.max()
    if min_val == max_val:
        # все значения одинаковы
        return [{"bucket_start": min_val, "bucket_end": max_val, "count": len(series)}]
    
    # Используем numpy.histogram
    hist_counts, bin_edges = np.histogram(series, bins=bins)
    result = []
    for i in range(len(hist_counts)):
        result.append({
            "bucket_start": float(bin_edges[i]),
            "bucket_end": float(bin_edges[i+1]),
            "count": int(hist_counts[i])
        })
    return result

def _get_column_type(series: pd.Series) -> str:
    """Определяет, числовая колонка или категориальная"""
    # Пробуем преобразовать в число
    numeric = pd.to_numeric(series, errors='coerce')
    if numeric.notna().any():
        # если хотя бы одно значение успешно преобразовалось, считаем числовой
        return "numeric"
    else:
        return "categorical"

def compute_and_save_stats(dataset_id: str) -> Dict[str, Any]:
    """Загружает data.csv, вычисляет статистику по каждой колонке,
       сохраняет в stats.json и возвращает результат.
    """
    ds_dir = DATASETS_DIR / dataset_id
    if not ds_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found: {ds_dir}")
    
    df = read_data_csv(ds_dir, "data.csv")
    if df.empty:
        raise ValueError("DataFrame is empty")
    
    stats = {}
    for col in df.columns:
        series = df[col]
        col_type = _get_column_type(series)
        base_stats = {
            "count": int(len(series)),
            "unique": int(series.nunique()),
            "nulls": int(series.isna().sum())
        }
        if col_type == "numeric":
            numeric_stats = _compute_numeric_stats(series)
            stats[col] = {
                "type": "numeric",
                **base_stats,
                **numeric_stats
            }
        else:
            value_counts = series.value_counts(dropna=False).head(10)
            total_non_null = len(series.dropna())
            top_values = []
            for val, cnt in value_counts.items():
                percent = (cnt / total_non_null * 100) if total_non_null > 0 else 0
                val_str = "NaN" if pd.isna(val) else str(val)
                top_values.append({
                    "value": val_str,
                    "count": int(cnt),
                    "percent": round(percent, 2)
                })

            stats[col] = {
                "type": "categorical",
                **base_stats,
                "top_values": top_values
            }
    
    stats_path = ds_dir / "stats.json"
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    return stats

def get_stats(dataset_id: str, force_recompute: bool = False) -> Dict[str, Any]:
    """Возвращает статистику: если файл stats.json существует - читает его,
       иначе вычисляет заново.
    """
    ds_dir = DATASETS_DIR / dataset_id
    stats_path = ds_dir / "stats.json"
    if not force_recompute and stats_path.exists():
        with open(stats_path, "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        return compute_and_save_stats(dataset_id)