from flask import Flask, request, jsonify, render_template
from ultralytics import YOLO
import cv2
import numpy as np
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app = Flask(__name__)
model = YOLO("static\best.pt")

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/detect', methods=['POST'])
def detect():
    # Recebe imagem base64
    data = request.json['image']
    img_data = base64.b64decode(data.split(",")[1])
    np_img = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    # Faz a predição
    results = model.predict(source=img, conf=0.5)

    detections = []
    for box in results[0].boxes:
        cls = model.names[int(box.cls)]
        conf = float(box.conf)
        x1, y1, x2, y2 = box.xyxy[0]
        detections.append({
            "class": cls,
            "confidence": conf,
            "box": [float(x1), float(y1), float(x2), float(y2)]
        })

    return jsonify(detections)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
