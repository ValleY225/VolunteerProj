// В файле App.tsx - измените импорт
import { RouterProvider } from 'react-router-dom';  // используйте react-router-dom вместо react-router
import { router } from './routes';

export default function App() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
      <RouterProvider router={router} />
    </>
  );
}