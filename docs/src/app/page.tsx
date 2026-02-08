import { Features } from "@/components/features"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { PoweringSection } from "@/components/powering"
import { Footer } from "@/components/footer"

const IndexPage = () => {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <PoweringSection />
                <Features />
            </main>
            <Footer />
        </>
    )
}

export default IndexPage
