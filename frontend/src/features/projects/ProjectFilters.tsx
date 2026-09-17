import { Search } from 'lucide-react'
import { Select } from '../../components/ui/Select'
import { PROJECT_STATUSES } from '../../types/enums'
import type { ProjectStatus } from '../../types/enums'
import { PROJECT_STATUS_LABELS } from '../../utils/constants'

interface ProjectFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: ProjectStatus | ''
  onStatusChange: (value: ProjectStatus | '') => void
}

export function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="project-search"
          className="mb-1.5 block text-sm font-medium text-charcoal-700"
        >
          Search projects
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
            aria-hidden="true"
          />
          <input
            id="project-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, country, or region…"
            className="h-10 w-full rounded-lg border border-charcoal-200 bg-white pl-9 pr-3 text-sm text-charcoal-900 placeholder:text-charcoal-400 transition-colors focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
      </div>
      <div className="sm:w-56">
        <Select
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProjectStatus | '')}
          options={PROJECT_STATUSES.map((value) => ({
            value,
            label: PROJECT_STATUS_LABELS[value],
          }))}
        />
      </div>
    </div>
  )
}
