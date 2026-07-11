import { LandingNavbar } from '@/components/landing-navbar'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { SlotsSection } from '@/components/slots-section'
import { HowItWorks } from '@/components/how-it-works'
import { Testimonials } from '@/components/testimonials'
import { LandingFooter } from '@/components/landing-footer'

export const metadata = {
  title: 'NITSRI Gym Portal - Train Smart, Train Hard',
  description: 'NIT Srinagar official gym management system. Book slots, manage enrollments, and build your fitness routine.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SlotsSection />
        <HowItWorks />
        <Testimonials />
      </main>
      <LandingFooter />
    </div>
  )
}
