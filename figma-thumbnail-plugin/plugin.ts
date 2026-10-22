figma.showUI(__html__, { width: 320, height: 700 });

interface GenerateData {
  gradient: 'dark' | 'light';
  mainText: string;
  subText: string;
  backgroundImage: ArrayBuffer;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate') {
    const data: GenerateData = msg.data;
    await generateThumbnail(data);
  }
};

async function generateThumbnail(data: GenerateData) {
  const { gradient, mainText, subText, backgroundImage } = data;

  const frame = figma.createFrame();
  frame.name = 'Thumbnail';
  frame.resize(1200, 628);

  // 배경 이미지 추가
  const imageBytes = new Uint8Array(backgroundImage);
  const image = figma.createImage(imageBytes);
  const imageFill: ImagePaint = {
    type: 'IMAGE',
    scaleMode: 'FILL',
    imageHash: image.hash,
  };
  frame.fills = [imageFill];

  // 그라데이션 오버레이
  const overlayRect = figma.createRectangle();
  overlayRect.resize(1200, 628);
  overlayRect.name = 'Gradient Overlay';

  if (gradient === 'dark') {
    overlayRect.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        gradientStops: [
          { color: { r: 0, g: 0, b: 0, a: 0.6 }, position: 0 },
          { color: { r: 0, g: 0, b: 0, a: 0.3 }, position: 1 },
        ],
      } as GradientPaint,
    ];
  } else {
    overlayRect.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        gradientStops: [
          { color: { r: 1, g: 1, b: 1, a: 0.5 }, position: 0 },
          { color: { r: 1, g: 1, b: 1, a: 0.2 }, position: 1 },
        ],
      } as GradientPaint,
    ];
  }

  frame.appendChild(overlayRect);

  // 텍스트 박스 (메인 문구)
  const textBox = figma.createRectangle();
  textBox.resize(900, 180);
  textBox.x = 150;
  textBox.y = 180;
  textBox.name = 'Text Box';
  textBox.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }];
  frame.appendChild(textBox);

  // 메인 텍스트
  await figma.loadFontAsync({ family: 'Roboto', style: 'Bold' });
  const mainTextNode = figma.createText();
  mainTextNode.characters = mainText;
  mainTextNode.fontSize = 48;
  mainTextNode.fontName = { family: 'Roboto', style: 'Bold' };
  mainTextNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }];
  mainTextNode.textAlignHorizontal = 'CENTER';
  mainTextNode.textAlignVertical = 'CENTER';
  mainTextNode.x = 150;
  mainTextNode.y = 180;
  mainTextNode.resize(900, 100);
  mainTextNode.name = 'Main Text';
  frame.appendChild(mainTextNode);

  // 서브 텍스트
  if (subText) {
    await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
    const subTextNode = figma.createText();
    subTextNode.characters = subText;
    subTextNode.fontSize = 18;
    subTextNode.fontName = { family: 'Roboto', style: 'Regular' };
    subTextNode.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3, a: 1 } }];
    subTextNode.textAlignHorizontal = 'CENTER';
    subTextNode.x = 150;
    subTextNode.y = 290;
    subTextNode.resize(900, 60);
    subTextNode.name = 'Sub Text';
    frame.appendChild(subTextNode);
  }

  // Sweetspot 로고 (흰색, 하단)
  const logoText = figma.createText();
  await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
  logoText.characters = 'sweetspot';
  logoText.fontSize = 16;
  logoText.fontName = { family: 'Roboto', style: 'Regular' };
  logoText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }];
  logoText.x = 50;
  logoText.y = 550;
  logoText.name = 'Logo Text';
  frame.appendChild(logoText);

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);

  figma.notify('✨ 썸네일이 생성되었습니다!', { timeout: 3 });
}
