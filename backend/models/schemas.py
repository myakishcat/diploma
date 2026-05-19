from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DatasetListItem(BaseModel):
    id: str
    title: str
    meta_path: Optional[str] = None
    format: Optional[str] = "csv"
    # Новые поля (опциональные, для обратной совместимости)
    description: Optional[str] = None
    modified: Optional[str] = None
    valid: Optional[str] = None
    publishername: Optional[str] = None
    rows_count: Optional[int] = None
    file_size_kb: Optional[float] = None
    created: Optional[str] = None
    subject: Optional[str] = None


class ColumnStructure(BaseModel):
    field_name: str
    russian_description: Optional[str] = None
    english_description: Optional[str] = None
    format: Optional[str] = None


class DatasetMetadata(BaseModel):
    identifier: str
    title: str
    description: Optional[str] = None
    creator: Optional[str] = None
    created: Optional[str] = None
    modified: Optional[str] = None
    subject: Optional[str] = None
    provenance: Optional[str] = None           
    valid: Optional[str] = None                
    publishername: Optional[str] = None        
    publisherphone: Optional[str] = None       
    publishermbox: Optional[str] = None        
    format: Optional[str] = None
    standardversion: Optional[str] = None
    structure_path: Optional[str] = None        # локальный путь (опционально)
    data_path: Optional[str] = None             # локальный путь (опционально)
    # Добавьте два поля для ссылок из meta.csv:
    data_url: Optional[str] = None              # ссылка на файл с данными
    structure_url: Optional[str] = None         # ссылка на файл со структурой
    columns: Optional[List[ColumnStructure]] = None


class PaginatedData(BaseModel):
    total_rows: int
    offset: int
    limit: int
    rows: List[Dict[str, Any]]

class NumericColumnStats(BaseModel):
    type: str = "numeric"
    count: int
    unique: int
    nulls: int
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    histogram: List[Dict[str, Any]] = []

class CategoricalColumnStats(BaseModel):
    type: str = "categorical"
    count: int
    unique: int
    nulls: int

