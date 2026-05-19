import os
import json
import csv
import chardet
from pathlib import Path
from typing import List, Dict, Any
from utils.file_reader import DATA_DIR, INDEX_PATH   

DATASETS_DIR = DATA_DIR / "datasets"

def detect_encoding(filepath: Path) -> str:
    """Определяет кодировку файла с помощью chardet."""
    with open(filepath, 'rb') as f:
        raw = f.read()
        result = chardet.detect(raw)
        encoding = result.get('encoding', 'utf-8')
        if encoding.lower() == 'utf-8' and raw.startswith(b'\xef\xbb\xbf'):
            encoding = 'utf-8-sig'
        return encoding

def count_csv_rows(filepath: Path) -> int:
    """Быстрый подсчёт количества строк в CSV (без учёта заголовка)."""
    if not filepath.exists():
        return 0
    encoding = detect_encoding(filepath)
    with open(filepath, 'r', encoding=encoding) as f:
        total_lines = sum(1 for _ in f)
    return max(0, total_lines - 1)

def get_file_size_kb(filepath: Path) -> float:
    """Возвращает размер файла в килобайтах с округлением до 2 знаков."""
    if not filepath.exists():
        return 0.0
    size_bytes = os.path.getsize(filepath)
    return round(size_bytes / 1024, 2)

def normalize_date(date_str: str) -> str:
    """Преобразует дату из формата YYYYMMDD в YYYY-MM-DD. Если формат не соответствует, возвращает как есть."""
    if not date_str:
        return ""
    cleaned = date_str.strip()
    if len(cleaned) == 8 and cleaned.isdigit():
        return f"{cleaned[:4]}-{cleaned[4:6]}-{cleaned[6:8]}"
    return cleaned

def read_meta_csv(meta_path: Path) -> Dict[str, str]:
    """Читает meta.csv и возвращает словарь {property: value}."""
    meta = {}
    if not meta_path.exists():
        return meta
    encoding = detect_encoding(meta_path)
    with open(meta_path, 'r', encoding=encoding) as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if len(row) >= 2:
                meta[row[0].strip()] = row[1].strip()
    return meta

def build_index() -> List[Dict[str, Any]]:
    """Сканирует папку datasets, собирает информацию и сохраняет в JSON."""
    datasets = []
    if not DATASETS_DIR.exists():
        print(f"Directory {DATASETS_DIR} does not exist. Creating empty index.")
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        return []

    for ds_dir in DATASETS_DIR.iterdir():
        if not ds_dir.is_dir():
            continue
        ds_id = ds_dir.name
        meta_path = ds_dir / "meta.csv"
        data_path = ds_dir / "data.csv"

        if not meta_path.exists() or not data_path.exists():
            print(f"Skipping {ds_id}: missing meta.csv or data.csv")
            continue

        meta = read_meta_csv(meta_path)

        rows = count_csv_rows(data_path)
        size_kb = get_file_size_kb(data_path)

        datasets.append({
            "id": ds_id,
            "title": meta.get("title", ds_id),
            "description": meta.get("description", ""),
            "modified": normalize_date(meta.get("modified", "")),
            "valid": normalize_date(meta.get("valid", "")),       # добавлено поле
            "publishername": meta.get("publishername"),
            "rows_count": rows,
            "file_size_kb": size_kb,
            "format": meta.get("format"),
            "created": normalize_date(meta.get("created", "")),
            "subject": meta.get("subject"),
        })

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(datasets, f, ensure_ascii=False, indent=2)

    print(f"Index saved to {INDEX_PATH} with {len(datasets)} datasets.")
    return datasets

if __name__ == "__main__":
    build_index()