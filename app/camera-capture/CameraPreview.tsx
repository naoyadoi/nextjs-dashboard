'use client';

import React, { useRef, useState } from 'react';

const CameraPreview = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // カメラを起動する
  const startCamera = async () => {
    try {
      // iOS Safari でバックカメラを優先したい場合: facingMode: { ideal: 'environment' }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, 
        audio: false,
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play(); // iOS Safari では、ユーザー操作がないと再生されないことに注意
      }
    } catch (err) {
      console.error('カメラ起動に失敗しました', err);
      alert('カメラを起動できませんでした。権限やブラウザの対応状況を確認してください。');
    }
  };

  // カメラを停止する
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // 画像をキャプチャする
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // canvas の大きさを video と同じに設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // video の現在のフレームを canvas に描画
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // base64 データを取得
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
  };

  // キャプチャ画像をサーバーへ送信する例
  const sendImageToServer = async () => {
    if (!capturedImage) {
      alert('キャプチャした画像がありません。');
      return;
    }
    try {
      const response = await fetch('https://example.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage }),
      });
      if (!response.ok) {
        throw new Error('サーバーエラー');
      }
      alert('送信に成功しました！');
    } catch (error) {
      console.error(error);
      alert('送信に失敗しました。');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>カメラプレビュー</h2>

      {/* カメラ起動／停止ボタン */}
      {!stream ? (
        <button onClick={startCamera}>カメラ起動</button>
      ) : (
        <button onClick={stopCamera}>カメラ停止</button>
      )}

      {/* video 要素 (ライブプレビュー) */}
      <div style={{ margin: '20px' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            maxWidth: '400px',
            background: '#000',
          }}
          // iOS Safari の場合、自動再生には "playsInline" や "muted" 等の属性設定が必要になる場合も
          playsInline
          muted
        />
      </div>

      {/* キャプチャ用 canvas (非表示でもOK) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* カメラ画像をキャプチャするボタン */}
      <button onClick={captureImage} disabled={!stream}>
        シャッター
      </button>

      {/* キャプチャ結果のプレビュー */}
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
    </div>
  );
};

export default CameraPreview;
