"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1a1a2e] border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="https://rhapsodyofrealities.abilliontestimoniesandmore.org/themes/default/img/logo-light.png?cache=758"
              alt="A Billion Testimonies"
              width={180}
              height={40}
              className="h-10 w-auto"
              unoptimized
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/submit" className="text-sm text-white/70 hover:text-white">
              Share Testimony
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-3">
              <Link
                href="/submit"
                className="text-sm text-white/70 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Share Testimony
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
