import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-md text-center">
        <div className="mb-4 md:mb-6">
          <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto" />
        </div>
        <h1 className="text-xl md:text-2xl font-semibold mb-2">Thank You!</h1>
        <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Your testimony has been submitted successfully and is now pending review.
        </p>
        <Button asChild className="bg-[#1a1a2e] hover:bg-[#2a2a4e] w-full sm:w-auto">
          <Link href="/submit">Submit Another Testimony</Link>
        </Button>
      </div>
    </div>
  )
}
