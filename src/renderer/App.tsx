import Navbar from "./components/layout/Navbar";
import { ThemeProvider } from "./context/theme/ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>
  );
}
