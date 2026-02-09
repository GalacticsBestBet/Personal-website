import { getSkill, getSkillLogs, deleteSkill } from '../actions'
import { AddLogForm } from './AddLogForm'
import { LogItem } from './LogItem'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Trash2, Calendar } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'

export default async function SkillDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const skill = await getSkill(params.id)

    if (!skill) {
        notFound()
    }

    const logs = await getSkillLogs(skill.id)
    const latestRating = logs.length > 0 ? logs[0].rating : 0

    async function handleDelete() {
        'use server'
        await deleteSkill(skill.id)
        redirect('/skills')
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/skills">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {skill.title}
                        <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: skill.color }}
                        />
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Huidige score: {latestRating}/100
                    </p>
                </div>

                <form action={handleDelete}>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </form>
            </div>

            {/* Visual Progress */}
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-500"
                    style={{
                        width: `${Math.max(5, latestRating)}%`, // Min 5% so it's visible
                        backgroundColor: skill.color
                    }}
                />
            </div>

            {/* Add Log Form */}
            <AddLogForm skillId={skill.id} />

            {/* Log History */}
            <div className="space-y-4">
                <h2 className="font-semibold text-lg border-b pb-2">Geschiedenis</h2>

                {logs.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Nog geen logs. Voeg je eerste update toe!
                    </p>
                )}

                {logs.map((log: any) => (
                    <LogItem
                        key={log.id}
                        log={log}
                        skillId={skill.id}
                        color={skill.color}
                    />
                ))}
            </div>
        </div>
    )
}
