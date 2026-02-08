import { getSkills, createSkill } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, Plus, Hash } from 'lucide-react'

export default async function SkillsPage() {
    const skills = await getSkills()

    return (
        <div className="container mx-auto max-w-2xl p-4 pb-24 space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Vaardigheden</h1>
                <p className="text-muted-foreground">
                    Houd bij wat je leert en hoe je groeit.
                </p>
            </header>

            {/* Add Skill Form */}
            <Card className="border-2 border-dashed shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nieuwe Vaardigheid
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createSkill} className="flex gap-2">
                        <Input
                            name="title"
                            placeholder="Bijv. Piano, Spaans, Coderen..."
                            required
                            className="flex-1"
                        />
                        <Input
                            type="color"
                            name="color"
                            defaultValue="#3b82f6"
                            className="w-12 p-1 h-10 cursor-pointer"
                            title="Kies een kleur"
                        />
                        <Button type="submit">Toevoegen</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Skills Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill: any) => (
                    <Link key={skill.id} href={`/skills/${skill.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">
                                    {skill.title}
                                </CardTitle>
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: skill.color }}
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    Bekijk voortgang <ArrowRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {skills.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Nog geen vaardigheden toegevoegd. Begin hierboven!
                    </div>
                )}
            </div>
        </div>
    )
}
