import fastapi
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from ....infrastructure.db.database import SessionLocal
from ....infrastructure.repositories.experiment_repository_impl import SqlExperimentRepository
from ....application.use_cases.create_experiment import CreateExperiment
from ....application.use_cases.list_experiments import ListExperiments
from .schemas import ExperimentIn, ExperimentOut
from ....application.services.image_generation import ImageGenerator
from .auth_router import router as auth_router


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


router = APIRouter()


experiments_router = APIRouter(prefix="/experiments", tags=["experiments"])


@experiments_router.post("", response_model=ExperimentOut, status_code=201)
async def create_experiment(payload: ExperimentIn, session: AsyncSession = Depends(get_session)):
    repo = SqlExperimentRepository(session)
    use_case = CreateExperiment(repo)
    exp = await use_case.execute(
        id=payload.id,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        created_at=payload.created_at,
    )
    return ExperimentOut(**exp.__dict__)


@experiments_router.get("", response_model=list[ExperimentOut])
async def list_experiments(limit: int = 50, offset: int = 0, session: AsyncSession = Depends(get_session)):
    repo = SqlExperimentRepository(session)
    use_case = ListExperiments(repo)
    items = await use_case.execute(limit=limit, offset=offset)
    return [ExperimentOut(**i.__dict__) for i in items]


@experiments_router.post("/generate", response_description="Generated image bytes")
async def generate_image(
    brand: str | None = Form(default=None),
    model: str | None = Form(default=None),
    year: str | None = Form(default=None),
    car_photos: list[UploadFile] = File(default_factory=list),
    wheel_photo: UploadFile | None = File(default=None),
):
    # Read files into memory
    car_images: list[tuple[bytes, str]] = []
    for f in car_photos[:3]:
        data = await f.read()
        car_images.append((data, f.content_type or "image/jpeg"))
    wheel: tuple[bytes, str] | None = None
    if wheel_photo is not None:
        wheel = (await wheel_photo.read(), wheel_photo.content_type or "image/jpeg")

    if not car_images:
        raise HTTPException(status_code=400, detail="At least one car photo is required")

    # Build prompt
    prompt = (
        "Replace the wheels in the provided car photo(s) with the wheels from the wheel photo. "
        "Preserve the original car, scene, lighting, reflections, and realism. Return a single photorealistic result."
        "based on the provided car photos, generate a new car photo showing the side view of the car with the new wheels."
    )
    if brand or model or year:
        prompt += f" Car metadata: brand={brand or ''}, model={model or ''}, year={year or ''}."

    # Call generator
    try:
        gen = ImageGenerator()
        image_bytes = gen.generate(prompt=prompt, car_images=car_images, wheel_image=wheel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return fastapi.Response(content=image_bytes, media_type="image/png")


router.include_router(auth_router)
router.include_router(experiments_router)
