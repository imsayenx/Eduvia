import { RouterProvider } from "react-router";
import { Toaster } from "sileo";
import { router } from "./routes";
import { useTheme } from "./theme";
import { useLang } from "./i18n";

export default function App() {
  const { dark } = useTheme();
  const lang = useLang(); // al cambiar de idioma se vuelve a dibujar toda la app traducida
  return (
    <>
      <Toaster theme={dark ? "light" : "dark"} position="top-right" offset={{ top: 80, right: 16 }} />
      <RouterProvider key={lang} router={router} />
    </>
  );
}
