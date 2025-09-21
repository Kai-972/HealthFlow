import { Upload, ServerCog, Network, Download } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border" data-testid="sidebar">
      <nav className="p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Workflow
          </h2>
          <div className="space-y-1">
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
              data-testid="nav-document-upload"
            >
              <Upload className="w-4 h-4" />
              <span>Document Upload</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="nav-ai-processing"
            >
              <ServerCog className="w-4 h-4" />
              <span>AI Processing</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="nav-traceability-matrix"
            >
              <Network className="w-4 h-4" />
              <span>Traceability Matrix</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="nav-export-results"
            >
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </a>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Compliance
          </h2>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 px-3 py-2" data-testid="compliance-hipaa">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">HIPAA</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2" data-testid="compliance-iso13485">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">ISO 13485</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2" data-testid="compliance-fda">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm">FDA 21 CFR Part 11</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Projects
          </h2>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-muted" data-testid="recent-project-1">
              <div className="text-sm font-medium mb-1">EHR System Tests</div>
              <div className="text-xs text-muted-foreground">HIPAA Compliance • 2 hours ago</div>
            </div>
            <div className="p-3 rounded-lg bg-muted" data-testid="recent-project-2">
              <div className="text-sm font-medium mb-1">Medical Device API</div>
              <div className="text-xs text-muted-foreground">ISO 13485 • 1 day ago</div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
