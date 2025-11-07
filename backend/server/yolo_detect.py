# yolo_detect.py
import sys
import base64
import io
import json
from PIL import Image
from ultralytics import YOLO

# Carrega o modelo
model = YOLO("best.pt")

def main():
    # Lê o Base64 da imagem (enviado pelo Node)
    image_b64 = sys.stdin.read().strip()
    image_data = base64.b64decode(image_b64.split(",")[1])  # remove "data:image/jpeg;base64,"
    image = Image.open(io.BytesIO(image_data))

    # Faz a detecção
    results = model(image)

    detections = []
    for result in results:
        for box in result.boxes:
            detections.append({
                "box": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                "confidence": float(box.conf[0]),
                "class": model.names[int(box.cls[0])]
            })

    # Retorna o JSON
    print(json.dumps(detections))

if __name__ == "__main__":
    main()
