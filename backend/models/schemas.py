from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DatasetListItem(BaseModel):
    id: str
    title: str
    meta_path: Optional[str] = None
    format: Optional[str] = "csv"


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
    structure_path: Optional[str] = None
    data_path: Optional[str] = None
    columns: Optional[List[ColumnStructure]] = None


class PaginatedData(BaseModel):
    total_rows: int
    offset: int
    limit: int
    rows: List[Dict[str, Any]]
