from pathlib import Path
from typing import List, Dict, Any, Optional

from utils.file_reader import (
    DATA_DIR,
    read_list_csv,
    read_meta_csv,
    read_structure_csv,
    read_data_csv,
)

from models.schemas import (
    DatasetListItem,
    DatasetMetadata,
    ColumnStructure,
)

import pandas as pd
import traceback


DATASETS_DIR = DATA_DIR / "datasets"


# -------------------------------
#        LIST DATASETS
# -------------------------------
def list_datasets() -> List[DatasetListItem]:
    df = read_list_csv()
    items: List[DatasetListItem] = []

    for _, row in df.iterrows():
        items.append(
            DatasetListItem(
                id=row["id"],
                title=row["title"],
                meta_path=row["meta_path"],
                format=row["format"],
            )
        )

    return items


# -------------------------------
#        DATASET META
# -------------------------------
def get_dataset_meta(dataset_id: str) -> DatasetMetadata:
    ds_dir = DATASETS_DIR / dataset_id

    if not ds_dir.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_id}")

    meta_df = read_meta_csv(ds_dir)
    structure_df = read_structure_csv(ds_dir)

    # meta.csv → словарь
    meta = {row["property"]: row["value"] for _, row in meta_df.iterrows()}

    # structure.csv → список колонок
    columns: List[ColumnStructure] = []

    def _safe(v):
        # если pandas поместил пустое значение как '' или 'nan' или None — приводим к None
        if v is None:
            return None
        s = str(v).strip()
        if s == "" or s.lower() == "nan":
            return None
        return s

    for _, row in structure_df.iterrows():
        columns.append(
            ColumnStructure(
                field_name=_safe(row.get("field_name")),
                russian_description=_safe(row.get("russian_description")),
                english_description=_safe(row.get("english_description")),
                format=_safe(row.get("format")),
            )
        )

    return DatasetMetadata(
        identifier=meta.get("identifier"),
        title=meta.get("title"),
        description=meta.get("description"),
        creator=meta.get("creator"),
        created=meta.get("created"),
        modified=meta.get("modified"),
        subject=meta.get("subject"),
        provenance=meta.get("provenance"),
        valid=meta.get("valid"),
        publishername=meta.get("publishername"),
        publisherphone=meta.get("publisherphone"),
        publisherbox=meta.get("publisherbox"),
        structure_path=str(ds_dir / "structure.csv"),
        data_path=str(ds_dir / "data.csv"),
        columns=columns
    )



# -------------------------------
#        DATASET ROWS
# -------------------------------
def get_rows(dataset_id: str, offset: int = 0, limit: int = 50) -> Dict[str, Any]:
    ds_dir = DATASETS_DIR / dataset_id

    if not ds_dir.exists():
        raise FileNotFoundError(f"Dataset dir not found: {ds_dir}")

    try:
        df = read_data_csv(ds_dir, "data.csv")
    except Exception as e:
        print("ERROR reading CSV")
        traceback.print_exc()
        raise

    total = len(df)

    if offset < 0:
        offset = 0
    if limit < 1:
        limit = 50

    selected = df.iloc[offset : offset + limit]

    # безопасная замена NaN → None
    safe = selected.where(pd.notnull(selected), None)

    return {
        "total_rows": total,
        "offset": offset,
        "limit": limit,
        "rows": safe.to_dict(orient="records"),
    }
