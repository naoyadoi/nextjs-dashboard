import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    // 1) リクエストヘッダーとボディをダンプ
    console.log('----- Incoming Request Headers -----');
    console.log(request.headers);
    console.log('----- Incoming Request Body -----');
    const { image } = await request.json();
    console.log({ image });

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 2) サービスアカウントキーを読み込み
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
    }
    const credentials = JSON.parse(serviceAccountKey);

    // 3) アクセストークンを取得
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
//  const accessToken = await client.getAccessToken();
    const { token } = await client.getAccessToken();  // { token, res } のうち token を抜き出す
    console.log('----- Access Token -----');
    console.log(token);

    if (!token) {
      throw new Error('Failed to retrieve access token');
    }

    // 4) Vision API に送信するリクエストボディを作成してダンプ
    const visionRequestBody = {
      requests: [
        {
          image: { content: image },
          features: [{ type: 'PRODUCT_SEARCH', maxResults: 5 }],
          imageContext: {
            productSearchParams: {
              productSet:
                'projects/personalmuji/locations/us-west1/productSets/mujipoc241225',
              productCategories: ['homegoods'],
            },
          },
        },
      ],
    };
    console.log('----- Vision API Request Body -----');
    console.log(JSON.stringify(visionRequestBody, null, 2));

    // 5) Vision API にリクエストを送信
    const response = await fetch(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-goog-user-project': 'personalmuji',
        },
        body: JSON.stringify(visionRequestBody),
      }
    );

    // 6) Vision API のレスポンスをダンプ
    const visionApiResponseText = await response.text();
    console.log('----- Vision API Response -----');
    console.log(visionApiResponseText);

    // エラーがあればクライアントにエラーメッセージを返す
    if (!response.ok) {
      return NextResponse.json(
        { error: visionApiResponseText },
        { status: response.status }
      );
    }

    // 成功したレスポンスを返す
    const visionApiResponseJson = JSON.parse(visionApiResponseText);
    return NextResponse.json(visionApiResponseJson, { status: 200 });
  } catch (err: any) {
    console.error('----- Error -----');
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
