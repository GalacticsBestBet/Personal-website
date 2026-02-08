import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function CalmPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white relative overflow-hidden">
            {/* Background Image - filling the screen */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/calm/trainclock.jpg"
                    alt="Calm Train Clock"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-in fade-in duration-1000">

                <blockquote className="space-y-4">
                    <p className="text-2xl md:text-3xl font-light leading-relaxed font-serif italic tracking-wide text-white/90 drop-shadow-lg">
                        "Dieper ingaan lost het probleem niet op. Je discussieert met mensen van wie je houdt. Geef comfort, zoek samen naar een oplossing."
                    </p>
                </blockquote>

                <div className="pt-12">
                    <Button asChild variant="outline" className="rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white transition-all">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Terug naar rust
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    )
}
