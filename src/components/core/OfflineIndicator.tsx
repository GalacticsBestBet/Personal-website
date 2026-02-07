'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        function handleOnline() {
            setIsOffline(false)
        }
        function handleOffline() {
            setIsOffline(true)
        }

        // Set initial state
        setIsOffline(!navigator.onLine)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-destructive text-destructive-foreground z-[100] fixed top-0 left-0 right-0"
                >
                    <div className="flex items-center justify-center gap-2 p-2 text-sm font-medium">
                        <WifiOff className="h-4 w-4" />
                        <span>Je bent offline. Wijzigingen worden niet opgeslagen.</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
