import React, { useState, useEffect } from "react"
import { useRef } from "react"

const SNAPS = [0.18, 0.52, 0.95]

interface BottomSheetProps {
    children: React.ReactNode
    forceSnap?: number
}

export function BottomSheet({ children, forceSnap }: BottomSheetProps) {
    const sheet = useBottomSheet(forceSnap);

    return (
        <div
            ref={sheet.sheetRef}
            className="absolute inset-x-0 bottom-0 z-[1000] flex flex-col bg-white rounded-t-3xl shadow-2xl"
            style={{
                height: `${sheet.visibleHeight}px`,
                transition: sheet.dragging ? 'none' : 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            }}>
            <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
                onPointerDown={sheet.onPointerDown}
                onPointerMove={sheet.onPointerMove}
                onPointerUp={sheet.onPointerUp}
            >
                <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div
                className="flex-1 overflow-x-hidden"
                style={{ overflowY: sheet.snapIndex === SNAPS.length - 1 ? 'auto' : 'hidden' }}
            >
                {children}
            </div>
        </div>
    )
}


function useBottomSheet(forceSnap?: number) {
    const [snapIndex, setSnapIndex] = useState(0)

    useEffect(() => {
        if (forceSnap !== undefined) setSnapIndex(forceSnap)
    }, [forceSnap])
    const [dragging, setDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const startY = useRef(0)
    const sheetRef = useRef<HTMLDivElement>(null)

    const snapHeight = (i: number) => SNAPS[i] * window.innerHeight
    const currentSnap = snapHeight(snapIndex)

    function onPointerDown(e: React.PointerEvent) {
        startY.current = e.clientY
        setDragging(true)
            ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!dragging) return
        const delta = startY.current - e.clientY
        setDragOffset(delta)
    }

    function onPointerUp() {
        if (!dragging) return
        setDragging(false)
        const finalHeight = currentSnap + dragOffset

        let nearest = 0
        let minDist = Infinity
        SNAPS.forEach((_s, i) => {
            const d = Math.abs(finalHeight - snapHeight(i))
            if (d < minDist) { minDist = d; nearest = i }
        })
        setSnapIndex(nearest)
        setDragOffset(0)
    }

    const visibleHeight = Math.max(40, Math.min(window.innerHeight * 0.95, currentSnap + dragOffset))

    return { sheetRef, visibleHeight, dragging, snapIndex, onPointerDown, onPointerMove, onPointerUp }
}