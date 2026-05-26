from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd

from utils.file_reader import DATA_DIR, read_data_csv

DATASETS_DIR = DATA_DIR / "datasets"


def get_heatmap_data(
    dataset_id: str,
    urban_filter: Optional[str] = None,
    gender_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Возвращает данные для хитмапа карты России.

    Args:
        dataset_id: идентификатор датасета
        urban_filter: фильтр по типу населения ('Городское население', 'Сельское население', None)
        gender_filter: фильтр по полу ('Мужчины', 'Женщины', None)

    Returns:
        Словарь с данными регионов и метаданными
    """
    ds_dir = DATASETS_DIR / dataset_id

    if not ds_dir.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_id}")

    df = read_data_csv(ds_dir, "data.csv")

    # Проверяем наличие нужных колонок
    required_columns = ['area', 'value']
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Dataset missing required column: {col}")

    # Значения по умолчанию для фильтров
    default_urban = "Городское и сельское население"
    default_gender = "Оба пола"

    # Определяем значения для фильтрации
    target_urban = urban_filter if urban_filter else default_urban
    target_gender = gender_filter if gender_filter else default_gender

    # Применяем фильтры если соответствующие колонки существуют
    if 'urban' in df.columns:
        df = df[df['urban'] == target_urban]

    if 'gender' in df.columns:
        df = df[df['gender'] == target_gender]

    # Исключаем агрегированные данные (РФ и федеральные округа)
    exclude_keywords = ['Российская Федерация', 'федеральный округ', 'Федеральный округ']
    df = df[~df['area'].str.contains('|'.join(exclude_keywords), case=False, na=False)]

    # Удаляем строки с пустыми значениями
    df = df.dropna(subset=['area', 'value'])

    # Преобразуем value в числовой формат
    df['value'] = pd.to_numeric(df['value'], errors='coerce')
    df = df.dropna(subset=['value'])

    # Группируем по регионам (если осталось несколько строк на регион)
    result_df = df.groupby('area', as_index=False)['value'].sum()

    # Формируем результат
    regions_data = [
        {
            'region': row['area'],
            'value': float(row['value'])
        }
        for _, row in result_df.iterrows()
    ]

    # Находим минимальное и максимальное значение для нормализации цветов
    values = [r['value'] for r in regions_data]
    min_value = min(values) if values else 0
    max_value = max(values) if values else 0

    return {
        'dataset_id': dataset_id,
        'filters': {
            'urban': target_urban,
            'gender': target_gender
        },
        'regions': regions_data,
        'min_value': min_value,
        'max_value': max_value,
        'total_regions': len(regions_data)
    }
