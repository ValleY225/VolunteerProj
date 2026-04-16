import { RouterProvider } from 'react-router';
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