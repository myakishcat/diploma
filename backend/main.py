from fastapi import FastAPI
from routers.datasets_router import router as datasets_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Datasets API",
    version="1.0",
    description="API для просмотра списка датасетов, мета и таблиц с пагинацией"
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
