import { ipcRenderer } from 'electron'

const onScanElement = (element: HTMLElement, x: number) => {
  const outerHtml = element.outerHTML
  const textContent = element.textContent

  // Create a range from the mouse position
  const range = document.createRange()
  const textNode = element.firstChild
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    // Get approximate character position based on x coordinate
    const rect = element.getBoundingClientRect()
    const relativeX = x - rect.left
    const approximateOffset = Math.floor((relativeX / rect.width) * textContent!.length)

    range.setStart(textNode, Math.min(approximateOffset, textContent!.length))
    const preciseText = textNode.textContent || ''

    ipcRenderer.sendToHost('scan-element', {
      outerHtml,
      textContent,
      preciseText,
      offset: approximateOffset
    })
  } else {
    ipcRenderer.sendToHost('scan-element', {
      outerHtml,
      textContent,
      preciseText: '',
      offset: 0
    })
  }
}

window.addEventListener('keydown', (event) => {
  if (event.altKey) {
    if (event.key === 'ArrowLeft') {
      ipcRenderer.sendToHost('navigation-event', { type: 'back' })
    } else if (event.key === 'ArrowRight') {
      ipcRenderer.sendToHost('navigation-event', { type: 'forward' })
    }
  }
})

window.addEventListener('mouseup', (event) => {
  if (event.button === 3 || event.button === 4) {
    ipcRenderer.sendToHost('navigation-event', {
      type: event.button === 3 ? 'back' : 'forward'
    })
  } else if (event.shiftKey) {
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement
    if (element) {
      onScanElement(element, event.clientX)
    }
  }
})

window.addEventListener('mousemove', (event) => {
  if (event.shiftKey) {
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement
    if (element) {
      onScanElement(element, event.clientX)
    }
  }
})
