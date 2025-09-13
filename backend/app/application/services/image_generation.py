from typing import Sequence, Optional
from google import genai
from google.genai import types
from ...core.config import settings


class ImageGenerator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_api_key
        if not self.api_key:
            raise RuntimeError("Missing Google API key (env var 'api_key')")
        self.client = genai.Client(api_key=self.api_key)

    def generate(self, *, prompt: str, car_images: Sequence[tuple[bytes, str]], wheel_image: Optional[tuple[bytes, str]] = None) -> bytes:
        parts: list = [prompt]
        # Attach images as inline data parts
        for data, mime in car_images:
            parts.append(types.Part(inline_data=types.Blob(mime_type=mime, data=data)))
        if wheel_image is not None:
            data, mime = wheel_image
            parts.append(types.Part(inline_data=types.Blob(mime_type=mime, data=data)))

        resp = self.client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=parts,
        )

        # Find first image in response parts
        for part in resp.candidates[0].content.parts:
            if getattr(part, "inline_data", None) is not None:
                return part.inline_data.data
        # If no image returned, attempt to return any text as bytes for debugging
        for part in resp.candidates[0].content.parts:
            if getattr(part, "text", None) is not None:
                return part.text.encode("utf-8")
        raise RuntimeError("No image returned by model")

