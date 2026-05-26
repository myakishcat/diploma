from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from services.datasets_service import (
    list_datasets,
    get_dataset_meta,
    get_rows,
)
from services.stats_service import get_stats
from services.heatmap_service import get_heatmap_data
from models.schemas import DatasetListItem, DatasetMetadata


router = APIRouter()


@router.get("/", response_model=List[DatasetListItem])
def api_list_datasets():
    try:
        return list_datasets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}", response_model=DatasetMetadata)
def api_get_dataset_meta(dataset_id: str):
    try:
        return get_dataset_meta(dataset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/rows")
def api_get_rows(
    dataset_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
):
    try:
        return get_rows(dataset_id, offset, limit)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/stats")
def api_get_dataset_stats(dataset_id: str, recompute: bool = False):
    try:
        stats = get_stats(dataset_id, force_recompute=recompute)
        return stats
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/heatmap")
def api_get_dataset_heatmap(
    dataset_id: str,
    urban: Optional[str] = Query(None, description="Фильтр по типу населения"),
    gender: Optional[str] = Query(None, description="Фильтр по полу")
):
    """Получает данные для хитмапа карты регионов России."""
    try:
        data = get_heatmap_data(dataset_id, urban_filter=urban, gender_filter=gender)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))