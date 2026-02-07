'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
    const [isOpen, setIsOpen] = React.useState(false)

    // Sync internal state with props when popover opens/date changes externally
    React.useEffect(() => {
        setSelectedDate(date)
    }, [date])

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeStr = e.target.value
        if (!selectedDate) return

        const [hours, minutes] = timeStr.split(':').map(Number)
        const newDate = new Date(selectedDate)
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setSelectedDate(newDate)
    }

    const handleSave = () => {
        setDate(selectedDate)
        setIsOpen(false)
    }

    const handleClear = () => {
        setSelectedDate(undefined)
        setDate(undefined)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 text-muted-foreground hover:text-primary",
                        date && "text-primary"
                    )}
                >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="sr-only">Datum wijzigen</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto max-w-[calc(100vw-16px)] p-0"
                align="end"
                sideOffset={4}
                collisionPadding={16}
            >
                <div className="p-3">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                            if (d) {
                                // Preserve time if already set, else default to 09:00 or current time
                                const newDate = new Date(d)
                                if (selectedDate) {
                                    newDate.setHours(selectedDate.getHours())
                                    newDate.setMinutes(selectedDate.getMinutes())
                                } else {
                                    newDate.setHours(9, 0, 0, 0)
                                }
                                setSelectedDate(newDate)
                            } else {
                                setSelectedDate(undefined)
                            }
                        }}
                        initialFocus
                        className="rounded-md border shadow-sm p-4"
                        classNames={{
                            month: "space-y-4",
                        }}
                    />

                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="time"
                            value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                            onChange={handleTimeChange}
                            disabled={!selectedDate}
                            className="flex-1"
                        />
                    </div>

                    <div className="flex justify-between gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
                            Wissen
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Opslaan
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
