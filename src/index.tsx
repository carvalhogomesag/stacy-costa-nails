import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { THEME } from "./theme";

// Injetar configuração do Tailwind dinamicamente via CDN config
if (typeof (window as any).tailwind !== 'undefined') {
  (window as any).tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: THEME.primary.DEFAULT,
          'primary-hover': THEME.primary.hover,
          'primary-light': THEME.primary.light,
          'primary-dark': THEME.primary.dark,
          'brand-bg': THEME.bg.site,
          'brand-card': THEME.bg.card,
          'brand-footer': THEME.bg.footer,
        },
        fontFamily: {
          serif: [THEME.fonts.serif],
          sans: [THEME.fonts.sans],
        }
      }
    }
  };
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);