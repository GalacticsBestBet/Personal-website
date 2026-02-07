'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { nl } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

export function DateFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get date range from URL
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const [date, setDate] = useState<DateRange | undefined>(
        fromParam ? {
            from: new Date(fromParam),
            to: toParam ? new Date(toParam) : undefined
        } : undefined
    )
    const [open, setOpen] = useState(false)

    // Sync state with URL params
    useEffect(() => {
        if (fromParam) {
            setDate({
                from: new Date(fromParam),
                to: toParam ? new Date(toParam) : undefined
            })
        } else {
            setDate(undefined)
        }
    }, [fromParam, toParam])

    const handleSelect = (newDate: DateRange | undefined) => {
        setDate(newDate)

        // Only update URL if we have at least a 'from' date or if cleared
        if (!newDate) {
            const params = new URLSearchParams(searchParams)
            params.delete('from')
            params.delete('to')
            router.replace(`${pathname}?${params.toString()}`)
            return
        }
    }

    // Apply filter on popover close or specific action? 
    // Usually range pickers wait for 'to' selection.
    // Let's update URL immediately but typically range needs 2 clicks. 
    // use 'onSelect' directly might trigger on first click (to is undefined).

    // Improved handler for range
    const onSelect = (range: DateRange | undefined) => {
        setDate(range)

        const params = new URLSearchParams(searchParams)
        if (range?.from) {
            params.set('from', format(range.from, 'yyyy-MM-dd'))
        } else {
            params.delete('from')
        }

        if (range?.to) {
            params.set('to', format(range.to, 'yyyy-MM-dd'))
        } else {
            params.delete('to')
        }

        router.replace(`${pathname}?${params.toString()}`)
    }


    const clearDate = (e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(undefined)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "d MMM", { locale: nl })} -{" "}
                                {format(date.to, "d MMM yyyy", { locale: nl })}
                            </>
                        ) : (
                            format(date.from, "d MMMM yyyy", { locale: nl })
                        )
                    ) : (
                        <span>Periode kiezen</span>
                    )}
                    {date?.from && (
                        <div
                            role="button"
                            onClick={clearDate}
                            className="ml-auto hover:bg-muted rounded-full p-1"
                        >
                            <X className="h-3 w-3" />
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={onSelect}
                    numberOfMonths={1}
                    locale={nl}
                />
            </PopoverContent>
        </Popover>
    )
}
