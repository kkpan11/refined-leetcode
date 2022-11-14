import { useEffect, FC } from 'react'
import 'styled-components/macro'

import { isValid } from './DragAndDrop'

type MaskProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/** 遮罩层
 *
 * 拖拽时显示，用以遮挡其余无关元素，突出显示拖拽源和目标容器
 */
const Mask: FC<MaskProps> = ({ open, setOpen }) => {
  useEffect(() => {
    let el: HTMLElement | null = null
    const handleDragstart = (e: DragEvent) => {
      el = e.target as HTMLElement
      if (!(el instanceof HTMLAnchorElement)) return
      if (!isValid(el.href)) return
      setOpen(true)
    }
    const handleDragend = () => {
      setOpen(false)
    }
    document.body.addEventListener('drag', handleDragstart)
    document.body.addEventListener('dragend', handleDragend)
    return () => {
      document.body.removeEventListener('drag', handleDragstart)
      document.body.removeEventListener('dragend', handleDragend)
    }
  }, [])
  if (!open) return null

  return (
    <div
      css={`
        top: 0;
        left: 0;
        position: fixed;
        width: 100vw;
        height: 100vh;
        backdrop-filter: blur(5px);
        z-index: 10;
      `}
    />
  )
}

export default Mask
