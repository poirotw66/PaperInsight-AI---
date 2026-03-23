import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

const MODEL_NAME = "gemini-3.1-pro-preview";

export interface ExtractedImage {
  filename: string;
  mimeType: string;
  base64Data: string;
  originalAlt: string;
}

export async function analyzePaper(content: string): Promise<{ report: string; images: ExtractedImage[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // Regex to find base64 images in Markdown: ![alt](data:image/png;base64,...)
  const imageRegex = /!\[(.*?)\]\((data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+))\)/g;
  const parts: Part[] = [];
  
  let lastIndex = 0;
  let match;
  const extractedImages: ExtractedImage[] = [];
  let imageCounter = 1;

  // Extract images and text segments
  while ((match = imageRegex.exec(content)) !== null) {
    // Add text before the image
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) {
      parts.push({ text: textBefore });
    }

    const alt = match[1];
    const mimeType = `image/${match[3]}`;
    const base64Data = match[4];
    const filename = `image_${imageCounter++}.jpg`;

    extractedImages.push({
      filename,
      mimeType,
      base64Data,
      originalAlt: alt
    });

    // Add image as a part for Gemini's vision
    parts.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });

    // Add a hint to Gemini about which image this is
    parts.push({ text: `[此處為圖片: ${filename}, 原始描述: ${alt}]` });
    
    lastIndex = imageRegex.lastIndex;
  }

  // Add remaining text
  const remainingText = content.substring(lastIndex).trim();
  if (remainingText) {
    parts.push({ text: remainingText });
  }

  // If no images were found with regex, just send the whole content as text
  if (parts.length === 0) {
    parts.push({ text: content });
  }

  const systemInstruction = `
你是一位世界級的學術研究員與導師。你的任務是協助學生使用「三遍掃描法」（Three-Pass Method）解析學術論文。
你將收到一篇論文的內容，其中包含文字與圖片（圖表、架構圖等）。

### 重要指令：圖片引用
- 論文內容中包含圖片，我已經為每張圖片分配了檔名（如 image_1.jpg, image_2.jpg）。
- 請在生成的解析報告中，**務必適當地引用並顯示這些圖片**。
- **使用 Markdown 圖片語法插入圖片**，路徑請使用相對路徑：\![描述](images/檔名)。
- 例如：\![系統架構圖](images/image_1.jpg)
- 請根據圖片內容決定最適合插入的位置。

### 報告結構需求：

### 第一部分：第一次閱讀筆記（5-10 分鐘海選）
目標：鳥瞰論文，判斷價值。
內容需求：
1. 🧱 為什麼要讀這篇？解決什麼「坑」？（背景與動機）
2. 🛠️ 技術定位：它到底「做了什麼」？（核心貢獻與方法簡述）
3. 🔍 論文摘要精要（一句話總結與核心主張）
4. 📊 第一遍必看圖表解析：**在此處務必插入並解析關鍵的系統架構圖或核心數據圖**。
5. 💡 工程直覺：這東西離落地有多遠？（初步評估）
6. 🏁 第一遍速讀結論：三個關鍵判斷（解什麼、憑什麼、值得深讀嗎）

### 第二部分：第二次閱讀精讀（30-60 分鐘精選）
目標：抓住方法、證據與對比，吃透技術細節。
內容需求：
1. 核心機制：深入拆解論文提出的底層邏輯與設計。**適時插入流程圖或機制圖**。
2. 檢索/運算演算法：詳細說明其運作流程與公式/邏輯。
3. 實戰表現與數據分析：分析實驗數據、性能增益與消融實驗結果。**務必在此處插入並對比實驗結果圖表**。
4. 嚴格審視：指出潛在風險、失敗案例（Failure Cases）或局限性。
5. 💡 總結與工程洞察：給開發者或研究者的具體建議。

請嚴格遵守以下規則：
- 使用繁體中文輸出。
- 專業術語若無通用中文翻譯請保留英文。
- 語氣專業、犀利且具備洞察力。
- 結構清晰，使用 Emoji 增加可讀性。
`;

  const prompt = `請解析以上提供的論文內容（包含文字與圖片）並生成深度報告。請在報告中使用我分配的檔名（images/image_n.jpg）來引用圖片。`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [...parts, { text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return {
      report: response.text || "未能生成報告。",
      images: extractedImages
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
