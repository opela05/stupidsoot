from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
from transformers import pipeline

app = Flask(__name__)
CORS(app)  

model = whisper.load_model("base")
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'text': 'No audio file received', 'notes': ''}), 400

    audio_file = request.files['audio']
    audio_path = "received_audio.webm"
    audio_file.save(audio_path)

    try:
        result = model.transcribe(audio_path)
        transcript = result['text']
        summary = summarizer(transcript, max_length=130, min_length=30, do_sample=False)[0]['summary_text']
        return jsonify({'text': transcript, 'notes': summary})
    except Exception as e:
        print("Transcription error:", str(e))
        return jsonify({'text': 'Transcription failed', 'notes': ''}), 500

@app.route('/start')
def start():
    return jsonify({'message': 'Backend is running'})

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)
