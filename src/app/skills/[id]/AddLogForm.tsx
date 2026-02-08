'use client'

import { useState } from 'react'
import { addSkillLog } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AddLogForm({ skillId }: { skillId: string }) {
    const [rating, setRating] = useState(50)
    const [isPending, setIsPending] = useState(false)

    return (
        <Card className="border-2 border-dashed shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Logbook toevoegen</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    action={async (formData) => {
                        setIsPending(true)
                        await addSkillLog(formData)
                        setIsPending(false)
                        // Optional: Reset form via key or state if needed, but server action revalidate handles data
                    }}
                    className="space-y-4"
                >
                    <input type="hidden" name="skill_id" value={skillId} />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Wat heb je gedaan?</label>
                        <Textarea
                            name="content"
                            placeholder="Vandaag heb ik geoefend met..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Progressie / Score</label>
                            <span className="text-sm font-bold text-primary">{rating}/100</span>
                        </div>
                        <input
                            type="range"
                            name="rating"
                            min="0"
                            max="100"
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Opslaan...' : 'Log Opslaan'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
