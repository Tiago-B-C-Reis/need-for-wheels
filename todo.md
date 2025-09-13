# what to do

now, I'd like to call an image generator to generate the car image with the new wheels. for that, backend should call the following model from google:
"""
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client(api_key="YOUR_API_KEY")

prompt = (
    "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
)

response = client.models.generate_content(
    model="gemini-2.5-flash-image-preview",
    contents=[prompt],
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("generated_image.png")
"""

the api key is in the .env file and it's named "api_key". you should send the car images and the wheel photo and ask to simply put the new wheels on the car and to please keep the car photo as original and real as possible.

