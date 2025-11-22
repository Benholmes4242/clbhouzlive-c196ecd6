/**
 * AppBootstrapLoader
 * Only shown during initial app mount. Never appears during normal navigation.
 */

export function AppBootstrapLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="relative w-16 h-16 mx-auto">
          <img 
            src="/lovable-uploads/47c9c183-0718-432a-bf49-9150f7beceb0.png"
            alt="Clubhouz"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
        <p className="text-body-sm text-secondary">Loading Clubhouz</p>
      </div>
    </div>
  )
}
