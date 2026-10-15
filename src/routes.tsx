import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Cursos } from "./pages/Cursos";
import { CursoDetalle } from "./pages/CursoDetalle";
import { MisAvances } from "./pages/MisAvances";
import { Comunidad } from "./pages/Comunidad";
import { Perfil } from "./pages/Perfil";
import { Recursos } from "./pages/Recursos";
import { Ajustes } from "./pages/Ajustes";
import { Grupos } from "./pages/Grupos";
import { GrupoDetalle } from "./pages/GrupoDetalle";
import { Eventos } from "./pages/Eventos";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Restablecer } from "./pages/Restablecer";
import { Contenido } from "./pages/Contenido";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/registro", Component: Registro },
  { path: "/restablecer", Component: Restablecer },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "cursos", Component: Cursos },
      { path: "curso/:id", Component: CursoDetalle },
      { path: "recursos", Component: Recursos },
      { path: "mis-avances", Component: MisAvances },
      { path: "comunidad", Component: Comunidad },
      { path: "comunidad/grupos", Component: Grupos },
      { path: "comunidad/grupo/:id", Component: GrupoDetalle },
      { path: "comunidad/eventos", Component: Eventos },
      { path: "perfil", Component: Perfil },
      { path: "ajustes", Component: Ajustes },
      { path: "contenido", Component: Contenido },
      { path: "*", Component: Home },
    ],
  },
]);
