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
    provenance: Optional[str] = None           
    valid: Optional[str] = None                
    publishername: Optional[str] = None        
    publisherphone: Optional[str] = None       
    publishermbox: Optional[str] = None        
    structure_path: Optional[str] = None
    data_path: Optional[str] = None
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
    # top_values: Optional[List[Dict]] = None  # на будущее

