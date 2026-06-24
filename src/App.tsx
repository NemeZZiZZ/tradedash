import { I18nProvider } from "@/i18n";
import { TradingTerminal } from "@/components/terminal/TradingTerminal";

export function App() {
  return (
    <I18nProvider>
      <TradingTerminal />
    </I18nProvider>
  );
}

export default App;
