import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileOrganizer from './components/FileOrganizer';
import './App.css'; // Importing external stylesheet

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-container">
              <div className="landing-background"></div>
              <div className="file-icons">
                <span className="file-icon">📄</span>
                <span className="file-icon">🖼</span>
                <span className="file-icon">🎥</span>
                <span className="file-icon">🎵</span>
                <span className="file-icon">💻</span>
              </div>
              <div className="landing-container">
                <h1 className="landing-heading">Automated File Organizing System</h1>
                <p className="landing-paragraph">
                  Discover the power of effortless file management with our Automated File Organizing System. Seamlessly organize images, documents, videos, code, and more with intelligent sorting based on file type, size, or date.
                </p>
                <p className="landing-paragraph">
                  Drag and drop your files or entire folders to experience instant categorization. Preview your files in detail, download them by category, or clear your workspace with a single click. Simplify your digital life today.
                </p>
                <p className="landing-paragraph">
                  Ready to transform how you manage your files? Dive in and start organizing with ease and precision.
                </p>
                <Link to="/organizer" className="analyze-button">
                  Ready to Analyze
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/organizer" element={<FileOrganizer />} />
      </Routes>
    </Router>
  );
}

export default App;
