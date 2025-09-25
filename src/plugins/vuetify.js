import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0f172a',       // Deep navy night sky
          surface: '#1e293b',          // Card background
          primary: '#fff1e6',          // Milk cream
          secondary: '#f5e1da',        // Cookie beige
          accent: '#cdb4db',           // Lavender blush
          info: '#a3c4f3',             // Sky blue
          success: '#b5ead7',          // Matcha milk
          warning: '#ffd6a5',          // Honey toast
          error: '#ff6b6b'             // Strawberry milk
        }
      }
    }
  }
});
