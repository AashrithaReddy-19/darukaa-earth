import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-offwhite px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-700">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-bold text-charcoal-900">Page not found</h1>
      <p className="max-w-sm text-sm text-charcoal-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
