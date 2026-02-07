'use client'

import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableItemProps {
    children: React.ReactNode
    onSwipeLeft?: () => void // Usually Delete
    onSwipeRight?: () => void // Usually Complete or Edit
    className?: string
    isDestructive?: boolean
}

export function SwipeableItem({ children, onSwipeLeft, onSwipeRight, className, isDestructive = true }: SwipeableItemProps) {
    const x = useMotionValue(0)
    const [isDragged, setIsDragged] = useState(false)

    // Opacity for icons - Custom range for better visibility
    const leftIconOpacity = useTransform(x, [0, 40], [0, 1])
    const rightIconOpacity = useTransform(x, [0, -40], [0, 1])

    // Background color transformation
    const bgStyle = useTransform(
        x,
        [-100, 0, 100],
        [isDestructive ? 'rgb(239, 68, 68)' : 'rgb(168, 85, 247)', 'rgb(244, 244, 245)', 'rgb(34, 197, 94)']
    )

    const handleDragEnd = async (event: any, info: PanInfo) => {
        setIsDragged(false)
        const threshold = 80 // Reduced threshold

        if (info.offset.x < -threshold && onSwipeLeft) {
            onSwipeLeft()
        } else if (info.offset.x > threshold && onSwipeRight) {
            onSwipeRight()
        }
    }

    return (
        <div className={cn("relative group touch-pan-y overflow-hidden rounded-lg", className)}>
            {/* Background Actions Layer */}
            <motion.div
                className="absolute inset-0 flex items-center justify-between px-6 rounded-lg"
                style={{ backgroundColor: bgStyle }}
            >
                <motion.div style={{ opacity: leftIconOpacity }}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div style={{ opacity: rightIconOpacity }}>
                    <Trash2 className="w-6 h-6 text-white" />
                </motion.div>
            </motion.div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7} // Increased for easier swiping
                onDragStart={() => setIsDragged(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative z-10 bg-card rounded-lg"
            >
                {children}
            </motion.div>
        </div>
    )
}
