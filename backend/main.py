from fastapi import FastAPI
from contextlib import asynccontextmanager

from utils.build_index import build_index 
from routers.datasets_router import router as datasets_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Выполняется при запуске приложения
    print("Rebuilding datasets index...")
    build_index()  # синхронная функция – допустимо
    print("Index built successfully.")
    yield

app = FastAPI(
    title="Datasets API",
    version="1.0",
    description="API для просмотра списка датасетов, мета и таблиц с пагинацией",
    lifespan=lifespan
)

# Разрешаем CORS (для разработки; для продакшена настрой по доменам)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router, prefix="/api/datasets", tags=["datasets"])