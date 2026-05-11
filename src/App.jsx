import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Toaster } from '@/components/ui/sonner'

const gameFiles = [
  'aftermath.png',
  'fallen.png',
  'armory.png',
  'rivals.png',
  'Deepwoken.png',
  'Hood testing.png',
]

const overrides = {
  fallen: {
    status: 'In Dev',
    version: 'v0.1.0',
    description:
      'PvPvE hardcore base-building survival. Gather resources, craft gear, raid bases, fight bosses.',
    hoverInfo: 'currently in development',
  },
  aftermath: {
    version: 'v0.9.5',
    description:
      'Open-world zombie survival looter-shooter. Loot weapons, manage hunger and thirst, fight zombies and players.',
    hoverInfo: 'silentaim added to new version',
  },
  deepwoken: {
    status: 'In Dev',
    version: 'v0.1.0',
    hoverInfo: 'currently in development',
  },
}

function titleFromFile(file) {
  const base = file.replace(/\.[^.]+$/, '')
  return base
    .split(/[ _-]+/)
    .map((w) => (w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

const games = gameFiles.map((file) => {
  const base = file.replace(/\.[^.]+$/, '')
  const key = base.toLowerCase()
  const o = overrides[key] || {}
  return {
    name: o.name ?? titleFromFile(file),
    image: `/${encodeURI(file)}`,
    version: o.version ?? 'v1.0.0',
    status: o.status ?? 'UD',
    description: o.description ?? 'Description coming soon.',
    hoverInfo: o.hoverInfo ?? 'silentaim added to new version',
  }
})

function StatusBadge({ status }) {
  if (status === 'UD') {
    return (
      <span className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">
        UD
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-amber-300/40 bg-amber-300/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
      In Dev
    </span>
  )
}

function GameCard({ game }) {
  const inDev = game.status !== 'UD'
  return (
    <div className="relative w-full max-w-md h-[350px] rounded-xl border border-white/10 bg-[#151515] text-foreground shadow-2xl overflow-hidden flex flex-col">
      <div
        className="h-1/2 bg-cover bg-top"
        style={{ backgroundImage: `url(${game.image})` }}
      />
      <div className="h-1/2 p-4 flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{game.name}</h2>
          <span className="inline-flex items-center rounded-md border border-white/10 bg-[#202020] px-2.5 py-0.5 text-xs font-semibold text-neutral-300">
            {game.version}
          </span>
          <StatusBadge status={game.status} />
        </div>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          {game.description}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <HoverCard>
            <HoverCardTrigger className="text-xs text-neutral-400 hover:text-neutral-200 cursor-help underline decoration-dotted underline-offset-4">
              Info (Hover)
            </HoverCardTrigger>
            <HoverCardContent side="top" align="start" className="w-64 text-sm">
              <p>{game.hoverInfo}</p>
            </HoverCardContent>
          </HoverCard>
          <Button
            size="sm"
            disabled={inDev}
            onClick={() =>
              toast("Hey, this isn't available right now. Please check the Discord.")
            }
          >
            Get script
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <Toaster />
      <h1 className="pixel-font text-3xl md:text-5xl">
        <span className="text-white">PRIVATE</span>
        <span className="text-neutral-500">HAXX</span>
        <span className="pastel-rgb">.LIVE</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl w-full justify-items-center">
        {games.map((g) => (
          <GameCard key={g.name} game={g} />
        ))}
      </div>
    </main>
  )
}
