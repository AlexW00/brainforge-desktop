import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from '../ui/breadcrumb'

interface PathBreadcrumbsProps {
  path: string
  onBreadcrumbClick: (path: string) => Promise<void> | void
}

export function PathBreadcrumbs({ path, onBreadcrumbClick }: PathBreadcrumbsProps) {
  const segments = path.split('/').filter(Boolean)

  const getPathUpToSegment = (index: number) => {
    return '/' + segments.slice(0, index + 1).join('/')
  }

  return (
    <Breadcrumb className="p-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="cursor-pointer" onClick={() => onBreadcrumbClick('/')}>
            /
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => onBreadcrumbClick(getPathUpToSegment(index))}
            >
              {segment}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
