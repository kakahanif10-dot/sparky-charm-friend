
import { motion } from 'framer-motion'
import { ChevronDown, Rocket, Share2, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from '@/components/auth/account-menu'

export function WorkspaceTopnav({
  projectName,
  deployState,
  onDeploy,
}: {
  projectName: string
  deployState: 'idle' | 'deploying' | 'deployed'
  onDeploy: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-background px-4">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" className="h-8 gap-1.5 px-2">
          <span className="font-medium">{projectName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button
          onClick={onDeploy}
          disabled={deployState === 'deploying'}
          className="h-9 gap-1.5 rounded-lg font-medium text-primary-foreground hover:brightness-110"
        >
          {deployState === 'idle' && (
            <>
              <Rocket className="h-4 w-4" />
              Deploy
            </>
          )}
          {deployState === 'deploying' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying
            </>
          )}
          {deployState === 'deployed' && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              Live
            </motion.span>
          )}
        </Button>
        <AccountMenu />
      </div>
    </header>
  )
}
