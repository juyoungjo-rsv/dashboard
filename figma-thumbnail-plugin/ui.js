let backgroundImageData = null;

document.getElementById('background-image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      backgroundImageData = event.target.result;
      document.getElementById('image-name').textContent = `✓ ${file.name}`;
    };
    reader.readAsArrayBuffer(file);
  }
});

document.querySelector('.file-input-button').addEventListener('click', () => {
  document.getElementById('background-image').click();
});

document.getElementById('generate-button').addEventListener('click', () => {
  const gradient = document.querySelector('input[name="gradient"]:checked').value;
  const mainText = document.getElementById('main-text').value;
  const subText = document.getElementById('sub-text').value;

  if (!backgroundImageData) {
    alert('배경 이미지를 선택해주세요.');
    return;
  }

  if (!mainText.trim()) {
    alert('메인 문구를 입력해주세요.');
    return;
  }

  parent.postMessage(
    {
      pluginMessage: {
        type: 'generate',
        data: {
          gradient,
          mainText,
          subText,
          backgroundImage: backgroundImageData,
        },
      },
    },
    '*'
  );
});
