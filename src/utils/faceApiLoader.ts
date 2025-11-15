import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded) return true;

  try {
    // Load models from CDN (in production, host these locally)
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    // Fallback: try loading from local public folder if models are there
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      modelsLoaded = true;
      return true;
    } catch (fallbackError) {
      console.error('Fallback model loading also failed:', fallbackError);
      return false;
    }
  }
}

export async function detectFace(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection;
}

export async function extractFaceEmbedding(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<number[] | null> {
  const detection = await detectFace(image);
  
  if (!detection || !detection.descriptor) {
    return null;
  }

  // Return the 128-dimensional face descriptor
  return Array.from(detection.descriptor);
}

export function hashEmbedding(embedding: number[]): string {
  // Convert embedding to string and hash it
  const crypto = require('crypto');
  const embeddingString = JSON.stringify(embedding);
  return crypto.createHash('sha256').update(embeddingString).digest('hex');
}

// For browser environment, use Web Crypto API
export async function hashEmbeddingBrowser(embedding: number[]): Promise<string> {
  const embeddingString = JSON.stringify(embedding);
  const encoder = new TextEncoder();
  const data = encoder.encode(embeddingString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

