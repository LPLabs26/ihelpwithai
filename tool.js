async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function setTemporaryLabel(element, label) {
  const originalLabel = element.textContent;
  element.textContent = label;
  window.setTimeout(() => {
    element.textContent = originalLabel;
  }, 1400);
}

function buildToolPrompt(builder) {
  const toolName = builder.dataset.toolName || 'this tool';
  const whatFor = builder.dataset.toolWhatFor || '';
  const firstPrompt = builder.dataset.toolFirstPrompt || '';
  const fallbackTask = builder.dataset.toolUseCase || '';

  const task = builder.querySelector('[data-prompt-task]')?.value.trim() || fallbackTask;
  const tone = builder.querySelector('[data-prompt-tone]')?.value.trim();
  const context = builder.querySelector('[data-prompt-context]')?.value.trim();
  const outputFormat = builder.querySelector('[data-prompt-output-format]')?.value.trim();
  const constraints = builder.querySelector('[data-prompt-constraints]')?.value.trim();

  return [
    `I am using ${toolName} for this job: ${task}.`,
    whatFor ? `Best-fit reminder: ${whatFor}` : '',
    context ? `Context:\n${context}` : '',
    outputFormat ? `What I want back:\n${outputFormat}` : 'What I want back:\nA practical answer I can use right away.',
    tone ? `Tone or style:\n${tone}` : 'Tone or style:\nClear, concise, and practical.',
    constraints ? `Constraints:\n${constraints}` : '',
    'If anything important is missing, ask up to 3 short clarifying questions before answering.',
    firstPrompt ? `Starter prompt to build from:\n${firstPrompt}` : ''
  ].filter(Boolean).join('\n\n');
}

document.querySelectorAll('[data-prompt-builder]').forEach(builder => {
  const output = builder.querySelector('[data-prompt-output]');
  const buildButton = builder.querySelector('[data-build-prompt]');
  const copyCustomButton = builder.querySelector('[data-copy-custom-prompt]');

  const render = () => {
    if (!output) return;
    output.textContent = buildToolPrompt(builder);
  };

  builder.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', render);
  });

  buildButton?.addEventListener('click', render);
  copyCustomButton?.addEventListener('click', async () => {
    if (!output) return;
    await copyText(output.textContent || '');
    setTemporaryLabel(copyCustomButton, 'Copied');
  });

  render();
});

document.querySelectorAll('[data-copy-starter-prompt]').forEach(button => {
  button.addEventListener('click', async () => {
    await copyText(button.getAttribute('data-copy-starter-prompt') || '');
    setTemporaryLabel(button, 'Copied');
  });
});
