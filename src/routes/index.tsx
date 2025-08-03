import { createFileRoute } from '@tanstack/react-router'
import { VideoStream } from '@/components/posture/VideoStream'

export const Route = createFileRoute('/')({
  component: PostureAnalyzer,
})

function PostureAnalyzer() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Posture Analyzer POC
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Real-time posture detection using MediaPipe
          </p>
        </header>
        
        <main>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              Live Video Analysis
            </h2>
            <VideoStream />
          </div>
          
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              How it works
            </h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>• Uses MediaPipe Pose Landmarker to detect body position</li>
              <li>• Uses MediaPipe Face Landmarker to detect head and neck position</li>
              <li>• Analyzes shoulder alignment, head tilt, neck angle, and chin position</li>
              <li>• Provides real-time feedback on posture quality</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}
