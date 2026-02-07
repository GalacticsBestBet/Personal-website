'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Brain, Settings, CalendarDays, LogOut, History, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { signout } from '@/app/auth/actions'

export function BottomNav() {
    const pathname = usePathname()

    // Don't show on login page
    if (pathname === '/login') return null

    const items = [
        { href: '/', label: 'Inbox', icon: Home },
        { href: '/tasks', label: 'Taken', icon: CheckSquare },
        { href: '/memories', label: 'Brein', icon: Brain },
        { href: '/overview', label: 'Overzicht', icon: CalendarDays },
    ]

    const isActive = pathname === '/history'

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t pb-safe pt-2 px-6 h-16 flex items-center justify-around md:justify-center md:gap-12 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
            {items.map((item) => {
                const Icon = item.icon
                const isItemActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center text-xs font-medium transition-colors",
                            isItemActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary/80"
                        )}
                    >
                        <Icon className={cn("h-6 w-6 mb-1", isItemActive && "fill-current")} />
                        <span className="md:hidden">{item.label}</span>
                        <span className="hidden md:inline text-sm">{item.label}</span>
                    </Link>
                )
            })}

            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "flex flex-col items-center justify-center text-xs font-medium transition-colors hover:text-primary/80 focus:outline-none",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Settings className={cn("h-6 w-6 mb-1", isActive && "fill-current")} />
                        <span className="md:hidden">Instellingen</span>
                        <span className="hidden md:inline text-sm">Instellingen</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 mb-2" align="end" side="top">
                    <div className="flex flex-col space-y-1">
                        <Link
                            href="/history"
                            className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                        >
                            <History className="h-4 w-4" />
                            Geschiedenis
                        </Link>
                        <Link
                            href="/locations"
                            className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                        >
                            <MapPin className="h-4 w-4" />
                            Locatie Logboek
                        </Link>
                        <div className="h-px bg-border my-1" />
                        <form action={signout}>
                            <button
                                type="submit"
                                className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Uitloggen
                            </button>
                        </form>
                    </div>
                </PopoverContent>
            </Popover>
        </nav>
    )
}
