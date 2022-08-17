/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';

declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => any;
        set: (key: string, val: any) => void;
      };
    };
  }
}

const Hello = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-200">
      <h1 className="text-center text-blue-800">Hello Tailwind</h1>

      <button
        className="btn bg-blue-500"
        type="button"
        onClick={() => {
          window.electron.store.set('test', 'Testing electron store!');
        }}
      >
        Test Set
      </button>

      <button
        className="btn bg-purple-500"
        type="button"
        onClick={() => {
          // eslint-disable-next-line no-console
          console.log(window.electron.store.get('test'));
        }}
      >
        Test Set
      </button>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
