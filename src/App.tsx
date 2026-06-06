import { CockpitScreenContainer } from "@/features/cockpit"
import { LanguageProvider } from "@/i18n"

function App() {
    return (
        <LanguageProvider>
            <CockpitScreenContainer />
        </LanguageProvider>
    )
}

export default App
