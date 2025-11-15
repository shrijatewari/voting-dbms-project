import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { biometricService } from '../services/api';

interface BiometricCaptureProps {
  voterId?: number;
  onCapture: (faceEmbedding: number[], faceHash: string, fingerprintTemplate: number[], fingerprintHash: string, livenessPassed: boolean) => void;
  onCancel: () => void;
  mode?: 'register' | 'verify';
}

export default function BiometricCapture({ voterId, onCapture, onCancel, mode = 'register' }: BiometricCaptureProps) {
  const [step, setStep] = useState<'face' | 'fingerprint'>('face');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [webcamReady, setWebcamReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [faceHash, setFaceHash] = useState<string | null>(null);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<number[] | null>(null);
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); // 0-100 for scanning animation
  const [liveComment, setLiveComment] = useState<string>('Initializing face detection...');
  const [scanningActive, setScanningActive] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const lastEyeStateRef = useRef<{ left: boolean; right: boolean } | null>(null);

  // Load face-api models
  useEffect(() => {
    loadModels();
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Start face detection when webcam is ready
  useEffect(() => {
    if (webcamReady && step === 'face' && !faceImage && modelsLoaded) {
      startFaceDetection();
    } else {
      stopFaceDetection();
    }
    return () => stopFaceDetection();
  }, [webcamReady, step, faceImage, modelsLoaded]);

  const loadModels = async () => {
    try {
      setError('Loading face recognition models...');
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      setError('');
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load face recognition models. Please refresh the page.');
    }
  };

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) return;
    
    setScanningActive(true);
    setLiveComment('Scanning for face...');
    setScanProgress(0);
    
    // Animate scan progress (top to bottom)
    progressIntervalRef.current = window.setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 1.5;
        return next >= 100 ? 0 : next;
      });
    }, 50);
    
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!webcamRef.current || !canvasRef.current || !modelsLoaded) return;
      
      const video = webcamRef.current.video;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          if (!faceDetected) {
            setFaceDetected(true);
            setLiveComment('✓ Face detected! Analyzing features...');
          }
          
          setScanning(true);
          
          // Check for blink (liveness detection)
          const landmarks = detection.landmarks;
          if (landmarks) {
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            
            // Simple blink detection: check if eyes are closed
            const leftEyeOpen = calculateEyeAspectRatio(leftEye) > 0.25;
            const rightEyeOpen = calculateEyeAspectRatio(rightEye) > 0.25;
            
            if (lastEyeStateRef.current) {
              // Detect blink: eyes were open, now closed
              if (lastEyeStateRef.current.left && lastEyeStateRef.current.right && 
                  !leftEyeOpen && !rightEyeOpen) {
                setBlinkCount(prev => {
                  const newCount = prev + 1;
                  if (newCount >= 1) {
                    setLivenessPassed(true);
                    setLiveComment(`✓ Blink detected! Liveness check passed (${newCount} blink${newCount > 1 ? 's' : ''})`);
                  }
                  return newCount;
                });
              } else if (leftEyeOpen && rightEyeOpen && lastEyeStateRef.current.left && lastEyeStateRef.current.right) {
                setLiveComment('Face detected. Please blink once for liveness verification...');
              }
            } else {
              setLiveComment('Face detected. Analyzing facial features...');
            }
            
            lastEyeStateRef.current = { left: leftEyeOpen, right: rightEyeOpen };
          }
        } else {
          if (faceDetected) {
            setFaceDetected(false);
            setLiveComment('Face lost. Please position your face in the frame...');
          } else {
            setLiveComment('Waiting for face... Please look at the camera');
          }
          setScanning(false);
        }
      } catch (err) {
        console.error('Face detection error:', err);
        setLiveComment('Error detecting face. Please try again...');
      }
    }, 100);
  };

  const stopFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setScanningActive(false);
    setScanProgress(0);
  };

  const calculateEyeAspectRatio = (eyePoints: any[]): number => {
    if (eyePoints.length < 6) return 0;
    // Simplified EAR calculation
    const vertical1 = Math.abs(eyePoints[1].y - eyePoints[5].y);
    const vertical2 = Math.abs(eyePoints[2].y - eyePoints[4].y);
    const horizontal = Math.abs(eyePoints[0].x - eyePoints[3].x);
    return (vertical1 + vertical2) / (2 * horizontal);
  };

  const captureFace = useCallback(async () => {
    if (capturing || !webcamRef.current || !faceDetected) return;
    
    setCapturing(true);
    setError('');
    setScanning(false);
    setLiveComment('Capturing face image...');
    
    try {
      const video = webcamRef.current.video;
      if (!video) {
        throw new Error('Video element not available');
      }

      setLiveComment('Extracting facial features...');
      
      // Detect face and extract embedding
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection || !detection.descriptor) {
        throw new Error('No face detected. Please position your face in the frame.');
      }

      setLiveComment('Processing face embedding...');
      
      // Extract embedding (128-dimensional vector)
      const embedding = Array.from(detection.descriptor);
      
      setLiveComment('Generating secure hash...');
      
      // Generate hash
      const embeddingString = JSON.stringify(embedding);
      const encoder = new TextEncoder();
      const data = encoder.encode(embeddingString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setLiveComment('Finalizing capture...');

      // Capture screenshot for preview
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        screenshotQuality: 0.92
      });

      setFaceImage(imageSrc);
      setFaceEmbedding(embedding);
      setFaceHash(hash);
      setLiveComment('✓ Face captured successfully!');
      setStep('fingerprint');
      setError('');
      stopFaceDetection();
    } catch (err) {
      setError('Error capturing face: ' + (err as Error).message);
      setLiveComment('Error: ' + (err as Error).message);
    } finally {
      setCapturing(false);
    }
  }, [capturing, faceDetected]);

  const handleFingerprintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setLiveComment('Uploading fingerprint image...');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          setFingerprintImage(base64);
          setLiveComment('Processing fingerprint...');

          // Extract fingerprint template
          try {
            setLiveComment('Extracting fingerprint features...');
            const response = await biometricService.extractFingerprint(base64);
            console.log('Fingerprint extraction response:', response);
            
            if (response.data.success && response.data.data.template) {
              const template = response.data.data.template;
              
              setLiveComment('Generating secure hash...');
              
              // Generate hash from template
              const templateString = JSON.stringify(template);
              const encoder = new TextEncoder();
              const data = encoder.encode(templateString);
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              // Store in state
              setFingerprintTemplate(template);
              setFingerprintHash(hash);
              setError('');
              setLiveComment('✓ Fingerprint processed successfully!');
              console.log('Fingerprint processed successfully');
            } else {
              throw new Error('Template extraction failed');
            }
          } catch (err) {
            console.error('Fingerprint extraction error:', err);
            setLiveComment('Using fallback extraction method...');
            // Fallback: generate template from image hash
            const hash = await hashString(base64);
            // Create a 128-dimensional template from hash
            const template: number[] = [];
            for (let i = 0; i < 128; i += 2) {
              const hexPair = hash.slice(i, i + 2);
              template.push(parseInt(hexPair, 16) / 255);
            }
            
            setFingerprintTemplate(template);
            setFingerprintHash(hash);
            setError('');
            setLiveComment('✓ Fingerprint processed with fallback method');
            console.log('Fingerprint processed with fallback method');
          }
        } catch (err) {
          console.error('Error processing fingerprint:', err);
          setError('Error processing fingerprint: ' + (err as Error).message);
          setLiveComment('Error processing fingerprint');
        } finally {
          setProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
        setLiveComment('File read error');
        setProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing fingerprint: ' + (err as Error).message);
      setLiveComment('Upload error');
      setProcessing(false);
    }
  };

  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = () => {
    if (!faceEmbedding || !faceHash) {
      setError('Face data not captured. Please capture your face first.');
      return;
    }

    if (!fingerprintTemplate || !fingerprintHash) {
      setError('Fingerprint not processed. Please upload your fingerprint and wait for processing to complete.');
      return;
    }

    console.log('Submitting biometrics:', {
      faceEmbeddingLength: faceEmbedding.length,
      faceHash: faceHash.substring(0, 16) + '...',
      fingerprintTemplateLength: fingerprintTemplate.length,
      fingerprintHash: fingerprintHash.substring(0, 16) + '...',
      livenessPassed
    });

    onCapture(faceEmbedding, faceHash, fingerprintTemplate, fingerprintHash, livenessPassed);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-500/20">
        <div className="p-8">
          <h2 className="text-3xl font-heading font-bold mb-2 text-white text-center">
            {mode === 'register' ? 'Biometric Registration' : 'Biometric Verification'}
          </h2>
          <p className="text-purple-300 text-center mb-8">Secure facial recognition and fingerprint scanning</p>

          {!modelsLoaded && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-purple-300">Loading face recognition models...</p>
            </div>
          )}

          {step === 'face' && modelsLoaded && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-white">Step 1: Face Recognition</h3>
                <p className="text-purple-200">Position your face in the frame and blink once for liveness check</p>
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Face Detection Status */}
              <div className="flex items-center justify-center flex-wrap gap-3">
                <div className={`px-4 py-2 rounded-lg border ${faceDetected ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'}`}>
                  {faceDetected ? '✓ Face Detected' : '⏳ Waiting for face...'}
                </div>
                {livenessPassed && (
                  <div className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/50">
                    ✓ Liveness Verified
                  </div>
                )}
                {blinkCount > 0 && (
                  <div className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/50">
                    👁️ Blink Detected ({blinkCount})
                  </div>
                )}
                {scanningActive && (
                  <div className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/50">
                    🔄 Scanning... {Math.round(scanProgress)}%
                  </div>
                )}
              </div>

              {/* Live Comment Display */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <p className="text-white font-medium text-lg">{liveComment}</p>
                </div>
              </div>

              {/* Face Recognition Camera */}
              <div className="relative bg-black rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl">
                {!webcamReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-20">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                      <p className="text-purple-300">Initializing camera...</p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-auto"
                    onUserMedia={() => {
                      setWebcamReady(true);
                      setError('');
                      setLiveComment('Camera ready. Positioning face...');
                    }}
                    onUserMediaError={(err) => {
                      setError('Camera access denied or not available. Please allow camera permissions.');
                      setWebcamReady(false);
                      setLiveComment('Camera error. Please check permissions.');
                    }}
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: 'user'
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Top-to-Bottom Scanning Line Animation */}
                  {webcamReady && !faceImage && scanningActive && (
                    <>
                      {/* Main scanning line */}
                      <div 
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{
                          top: `${scanProgress}%`,
                          height: '6px',
                          background: 'linear-gradient(to bottom, transparent, #00d9ff 50%, transparent)',
                          boxShadow: '0 0 30px #00d9ff, 0 0 60px #00d9ff, inset 0 0 20px #00d9ff',
                          transition: 'top 0.05s linear',
                          borderRadius: '3px'
                        }}
                      />
                      {/* Scanning trail effect */}
                      <div 
                        className="absolute left-0 right-0 z-9 pointer-events-none opacity-50"
                        style={{
                          top: `${Math.max(0, scanProgress - 5)}%`,
                          height: '20px',
                          background: 'linear-gradient(to bottom, transparent, rgba(0, 217, 255, 0.3), transparent)',
                          transition: 'top 0.05s linear'
                        }}
                      />
                      {/* Scanning glow effect */}
                      <div 
                        className="absolute left-0 right-0 z-8 pointer-events-none opacity-30"
                        style={{
                          top: `${Math.max(0, scanProgress - 10)}%`,
                          height: '40px',
                          background: 'radial-gradient(ellipse at center, rgba(0, 217, 255, 0.4), transparent)',
                          transition: 'top 0.05s linear'
                        }}
                      />
                    </>
                  )}

                  {/* Scanning Brackets */}
                  {webcamReady && !faceImage && faceDetected && (
                    <>
                      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-teal-400 z-10 animate-pulse"></div>
                      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-teal-400 z-10 animate-pulse"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-teal-400 z-10 animate-pulse"></div>
                      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-teal-400 z-10 animate-pulse"></div>
                    </>
                  )}

                  {/* Face Detection Overlay Grid */}
                  {webcamReady && !faceImage && faceDetected && scanning && (
                    <div className="absolute inset-0 pointer-events-none z-5">
                      <svg className="w-full h-full" viewBox="0 0 640 480">
                        {/* Animated grid overlay */}
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00d9ff" strokeWidth="0.5" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Face feature points animation */}
                        {[160, 200, 240, 280, 320, 360, 400].map((y, i) => (
                          <circle 
                            key={`scan-${i}`} 
                            cx="320" 
                            cy={y} 
                            r="3" 
                            fill="#00d9ff" 
                            opacity={Math.abs(scanProgress / 100 - y / 480) < 0.1 ? 1 : 0.3}
                            className="animate-pulse"
                          />
                        ))}
                      </svg>
                    </div>
                  )}

                  {/* Live Status Indicator */}
                  {scanning && faceDetected && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="flex items-center space-x-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-teal-400/50">
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                        <span className="text-teal-400 text-sm font-medium">Scanning face features...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Captured Image Preview */}
              {faceImage && (
                <div className="mt-4 relative">
                  <div className="relative rounded-xl overflow-hidden border-2 border-teal-400">
                    <img src={faceImage} alt="Captured face" className="w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <span className="text-white text-sm font-medium">✓ Face captured successfully</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={captureFace}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={!webcamReady || capturing || !faceDetected}
                >
                  {capturing ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Processing...
                    </span>
                  ) : webcamReady && faceDetected ? (
                    '✓ Capture Face'
                  ) : (
                    'Waiting for face detection...'
                  )}
                </button>
                {faceImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFaceImage(null);
                      setFaceEmbedding(null);
                      setFaceHash(null);
                      setStep('face');
                      setBlinkCount(0);
                      setLivenessPassed(false);
                    }}
                    className="flex-1 bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all"
                  >
                    ↻ Retake
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'fingerprint' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-white">Step 2: Fingerprint Scan</h3>
                <p className="text-purple-200">Upload your fingerprint image for verification</p>
              </div>

              {/* Live Comment Display for Fingerprint */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${processing ? 'bg-yellow-400' : 'bg-teal-400'}`}></div>
                  <p className="text-white font-medium text-lg">{liveComment || (processing ? 'Processing fingerprint...' : 'Ready to upload')}</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-purple-500/50 rounded-xl p-12 text-center bg-slate-800/50 hover:border-teal-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFingerprintUpload}
                  className="hidden"
                  id="fingerprint-upload"
                  disabled={processing}
                />
                <label
                  htmlFor="fingerprint-upload"
                  className={`cursor-pointer block ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {processing ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <p className="text-purple-200 font-medium">
                    {processing ? 'Processing fingerprint...' : 'Click to upload fingerprint'}
                  </p>
                  <p className="text-purple-400 text-sm mt-2">PNG, JPG, or JPEG format</p>
                </label>
              </div>

              {fingerprintImage && (
                <div className="mt-4 relative rounded-xl overflow-hidden border-2 border-teal-400">
                  <img src={fingerprintImage} alt="Fingerprint" className="w-full max-h-64 object-contain bg-slate-900" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-medium">✓ Fingerprint uploaded</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('face')}
                  className="flex-1 bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={!fingerprintImage || !fingerprintTemplate || processing}
                >
                  {processing ? 'Processing...' : mode === 'register' ? 'Complete Registration' : 'Verify Biometrics'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onCancel}
            className="mt-6 text-purple-300 hover:text-white w-full text-center transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
