import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;

createApp().then((app) => {
  app.listen(PORT, () => {
    console.log(`Red-Box API on http://localhost:${PORT}`);
  });
});
