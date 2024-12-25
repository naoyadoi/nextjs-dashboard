'use client';

import React, { useRef, useState } from 'react';

const CameraPreview = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // ★ ここがポイント：Vision API のレスポンスを表示するための state
  const [serverResponse, setServerResponse] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('カメラ起動に失敗しました', err);
      alert('カメラを起動できませんでした。権限やブラウザの対応状況を確認してください。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
  };

  // ★ サーバーへ送信したあと、サーバーからの結果を state に保存
  const sendImageToServer = async () => {
    if (!capturedImage) {
      alert('キャプチャした画像がありません。');
      return;
    }

    const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, '');

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('サーバーエラー:', errorText);
        throw new Error(`サーバーエラー: ${errorText}`);
      }

      const result = await response.json();
      setServerResponse(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('送信エラー:', error);
      alert(`送信に失敗しました。\nエラー詳細: ${error.message}`);
    }
  };


  return (
    <div style={{ textAlign: 'center' }}>
      <h2>カメラプレビュー</h2>

      {!stream ? (
        <button onClick={startCamera}>カメラ起動</button>
      ) : (
        <button onClick={stopCamera}>カメラ停止</button>
      )}

      <div style={{ margin: '20px' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            maxWidth: '400px',
            background: '#000',
          }}
          playsInline
          muted
        />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <button onClick={captureImage} disabled={!stream}>
        シャッター
      </button>

      {/* キャプチャした画像のプレビュー */}
      {capturedImage && (
        <div style={{ margin: '20px' }}>
          <img
            src={capturedImage}
            alt="captured"
            style={{ maxWidth: '300px', border: '1px solid #ccc' }}
          />
          <div>
            <button onClick={sendImageToServer}>画像を送信</button>
          </div>
        </div>
      )}

      {/* ★ サーバーからのレスポンスを表示する領域 */}
      {serverResponse && (
        <div style={{ textAlign: 'left', margin: '20px auto', maxWidth: '600px' }}>
          <h3>Vision API レスポンス</h3>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '8px',
            }}
          >
            {serverResponse}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
