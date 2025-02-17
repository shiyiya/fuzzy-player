// https://github.com/WICG/document-picture-in-picture
//https://developer.chrome.com/docs/web-platform/document-picture-in-picture/

import { Player } from '@oplayer/core'

declare const documentPictureInPicture: any

export function isSupport() {
  return 'documentPictureInPicture' in window
}

export async function togglePictureInPicture(player: Player) {
  if (documentPictureInPicture.window) {
    documentPictureInPicture.window.close()
    return
  }

  const pipWindow = await documentPictureInPicture.requestWindow({
    width: player.$root.clientWidth,
    height: player.$root.clientHeight,
    copyStyleSheets: true
  })

  const allCSS = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return [...styleSheet.cssRules].map((rule) => rule.cssText).join('')
      } catch (e) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = styleSheet.type
        //@ts-ignore
        link.media = styleSheet.media
        link.href = styleSheet.href!
        pipWindow.document.head.appendChild(link)
        return false
      }
    })
    .filter(Boolean)
    .join('\n')

  const style = document.createElement('style')
  style.textContent = allCSS
  pipWindow.document.head.appendChild(style)
  pipWindow.document.body.append(player.$root)

  pipWindow.addEventListener('pagehide', (event: any) => {
    player.container.append(event.target.querySelector('.' + player.$root.classList.item(0)))
  })
}
