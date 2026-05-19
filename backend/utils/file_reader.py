import pandas as pd
from pathlib import Path
from typing import Optional, List
import chardet


DATA_DIR = (Path(__file__).resolve().parents[1] / "data")
INDEX_PATH = DATA_DIR / "datasets_index.json"

# Читаем list.csv — список доступных датасетов
def read_list_csv(path: Optional[str] = None) -> pd.DataFrame:
    p = Path(path) if path else DATA_DIR / "list.csv"
    return pd.read_csv(p, dtype=str)


# Читаем meta.csv
def read_meta_csv(dataset_dir: Path) -> pd.DataFrame:
    p = dataset_dir / "meta.csv"
    return pd.read_csv(p, dtype=str)


# Читаем structure.csv
def read_structure_csv(dataset_dir: Path) -> pd.DataFrame:
    p = dataset_dir / "structure.csv"
    # Читаем все поля как строки, чтобы не получать float NaN
    df = pd.read_csv(p, dtype=str, keep_default_na=False)
    # Обрежем пробелы в названиях колонок и уберём возможный BOM
    df.columns = df.columns.str.strip().str.replace('\ufeff', '')
    # Заменяем пустые строки на пустую строку (у нас уже dtype=str, но на всякий случай)
    df = df.fillna("").astype(str)
    return df




# Читаем data.csv — стабильный вариант для файлов Росстата
def read_data_csv(
    dataset_dir: Path,
    data_filename: str = "data.csv",
    usecols: Optional[List[str]] = None,
) -> pd.DataFrame:

    p = dataset_dir / data_filename

    # 1. Определяем кодировку файла
    with open(p, "rb") as f:
        raw = f.read()

    det = chardet.detect(raw)
    enc = det["encoding"] or "utf-8"
    print("Detected CSV encoding:", enc)

    # 2. Читаем CSV в найденной кодировке
    df = pd.read_csv(
        p,
        encoding=enc,
        sep=None,
        engine="python",
        dtype=str,
        usecols=usecols,
    )

    # 3. Чистим пустые строки
    df = df.fillna("")
    df = df[df.apply(lambda row: row.astype(str).str.strip().any(), axis=1)]

    return df
