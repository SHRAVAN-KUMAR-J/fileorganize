import React, { useState, useRef, useEffect } from 'react';
import { uploadFiles, getStats, downloadCategory, clearFiles } from '../services/api';

const FileOrganizer = () => {
  const [files, setFiles] = useState([]);
  const [organizedFiles, setOrganizedFiles] = useState({});
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, categories: 0 });
  const [sortBy, setSortBy] = useState('type');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileMap, setFileMap] = useState(new Map());
  const [textContent, setTextContent] = useState('');
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);

  const fileTypeMap = {
    jpg: { category: 'JPG', color: '#FF6B6B', icon: '🖼' },
    jpeg: { category: 'JPEG', color: '#FF6B6B', icon: '🖼' },
    png: { category: 'PNG', color: '#FF6B6B', icon: '🖼' },
    gif: { category: 'GIF', color: '#FF6B6B', icon: '🖼' },
    svg: { category: 'SVG', color: '#FF6B6B', icon: '🖼' },
    webp: { category: 'WEBP', color: '#FF6B6B', icon: '🖼' },
    pdf: { category: 'PDF', color: '#4ECDC4', icon: '📄' },
    doc: { category: 'DOC', color: '#4ECDC4', icon: '📄' },
    docx: { category: 'DOCX', color: '#4ECDC4', icon: '📄' },
    txt: { category: 'TXT', color: '#4ECDC4', icon: '📄' },
    rtf: { category: 'RTF', color: '#4ECDC4', icon: '📄' },
    xls: { category: 'XLS', color: '#45B7D1', icon: '📊' },
    xlsx: { category: 'XLSX', color: '#45B7D1', icon: '📊' },
    csv: { category: 'CSV', color: '#45B7D1', icon: '📊' },
    ppt: { category: 'PPT', color: '#F39C12', icon: '📽' },
    pptx: { category: 'PPTX', color: '#F39C12', icon: '📽' },
    mp4: { category: 'MP4', color: '#9B59B6', icon: '🎥' },
    avi: { category: 'AVI', color: '#9B59B6', icon: '🎥' },
    mov: { category: 'MOV', color: '#9B59B6', icon: '🎥' },
    wmv: { category: 'WMV', color: '#9B59B6', icon: '🎥' },
    mkv: { category: 'MKV', color: '#9B59B6', icon: '🎥' },
    mp3: { category: 'MP3', color: '#E74C3C', icon: '🎵' },
    wav: { category: 'WAV', color: '#E74C3C', icon: '🎵' },
    flac: { category: 'FLAC', color: '#E74C3C', icon: '🎵' },
    aac: { category: 'AAC', color: '#E74C3C', icon: '🎵' },
    zip: { category: 'ZIP', color: '#95A5A6', icon: '📦' },
    rar: { category: 'RAR', color: '#95A5A6', icon: '📦' },
    '7z': { category: '7Z', color: '#95A5A6', icon: '📦' },
    tar: { category: 'TAR', color: '#95A5A6', icon: '📦' },
    js: { category: 'JS', color: '#2ECC71', icon: '💻' },
    html: { category: 'HTML', color: '#2ECC71', icon: '💻' },
    css: { category: 'CSS', color: '#2ECC71', icon: '💻' },
    jsx: { category: 'JSX', color: '#2ECC71', icon: '💻' },
    py: { category: 'PY', color: '#2ECC71', icon: '💻' },
    java: { category: 'JAVA', color: '#2ECC71', icon: '💻' },
    cpp: { category: 'CPP', color: '#2ECC71', icon: '💻' },
    c: { category: 'C', color: '#2ECC71', icon: '💻' },
  };

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    fetchStats();
  }, [files]);

  useEffect(() => {
    if (selectedFile) {
      const extension = getFileExtension(selectedFile.originalName).toLowerCase();
      if (['txt', 'js', 'html', 'css', 'jsx', 'py', 'java', 'cpp', 'c'].includes(extension)) {
        const fileObject = fileMap.get(selectedFile.originalName);
        if (fileObject) {
          fileObject.text()
            .then(text => setTextContent(text))
            .catch(error => {
              console.error('Error reading file content:', error);
              setTextContent('Unable to display content');
            });
        } else {
          setTextContent('File content not found');
        }
      } else {
        setTextContent('');
      }
    } else {
      setTextContent('');
    }
  }, [selectedFile, fileMap]);

  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropZoneRef.current.classList.remove('dragover');
  };

  const readDirectory = (entry, path = '') => {
    return new Promise((resolve, reject) => {
      const files = [];
      const reader = entry.createReader();
      const readEntries = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(files);
            return;
          }
          for (const item of entries) {
            if (item.isFile) {
              const file = await new Promise((res, rej) => {
                item.file(res, rej);
              });
              files.push(file);
            } else if (item.isDirectory) {
              const subFiles = await readDirectory(item, `${path}${item.name}/`);
              files.push(...subFiles);
            }
          }
          readEntries();
        }, reject);
      };
      readEntries();
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    dropZoneRef.current.classList.remove('dragover');
    const items = Array.from(e.dataTransfer.items);
    const uploadedFiles = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        uploadedFiles.push(file);
      } else if (entry.isDirectory) {
        const folderFiles = await readDirectory(entry);
        uploadedFiles.push(...folderFiles);
      }
    }

    await processFiles(uploadedFiles);
  };

  const handleFileSelect = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    await processFiles(uploadedFiles);
  };

  const processFiles = async (uploadedFiles) => {
    if (uploadedFiles.length === 0) return;

    setProgress(0);
    document.getElementById('progressBar').style.display = 'block';

    const newFiles = uploadedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: getFileExtension(file.name),
      file,
    }));

    const newFileMap = new Map(fileMap);
    newFiles.forEach(file => {
      newFileMap.set(file.name, file.file);
    });
    setFileMap(newFileMap);

    setFiles(prev => [...prev, ...newFiles]);

    try {
      const response = await uploadFiles(uploadedFiles, sortBy, sortOrder, minSize, maxSize);
      setOrganizedFiles(response.organized);
      setStats({
        totalFiles: response.statistics.totalFiles,
        totalSize: response.statistics.totalSize,
        categories: response.statistics.categories,
      });

      newFiles.forEach((file, index) => {
        setTimeout(() => {
          setProgress(((index + 1) / uploadedFiles.length) * 100);
          if (index === uploadedFiles.length - 1) {
            setTimeout(() => {
              document.getElementById('progressBar').style.display = 'none';
            }, 500);
          }
        }, index * 100);
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getFileCategory = (extension) => {
    return fileTypeMap[extension] || { category: extension.toUpperCase(), color: '#34495E', icon: '📄' };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchStats = async () => {
    try {
      const response = await getStats();
      setStats({
        totalFiles: response.totalFiles,
        totalSize: response.totalSize,
        categories: Object.keys(response.categories).length,
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleDownload = async (category) => {
    try {
      const response = await downloadCategory(category);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${category}-files.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleClear = async () => {
    try {
      await clearFiles();
      setFiles([]);
      setOrganizedFiles({});
      setFileMap(new Map());
      setStats({ totalFiles: 0, totalSize: 0, categories: 0 });
      setTextContent('');
      document.getElementById('fileList').style.display = 'none';
      document.getElementById('progressBar').style.display = 'none';
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const handleViewFile = (file) => {
    setSelectedFile(file);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setTextContent('');
  };

  const renderFilePreview = (file) => {
    const extension = getFileExtension(file.originalName).toLowerCase();
    const fileObject = fileMap.get(file.originalName);

    if (!fileObject) {
      return <p>Preview not available: File content not found</p>;
    }

    const fileUrl = URL.createObjectURL(fileObject);

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <img src={fileUrl} alt={file.originalName} style={{ maxWidth: '100%', maxHeight: '500px' }} />;
    } else if (extension === 'pdf') {
      return <iframe src={fileUrl} style={{ width: '100%', height: '500px' }} title={file.originalName}></iframe>;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
      return (
        <video controls style={{ maxWidth: '100%', maxHeight: '500px' }}>
          <source src={fileUrl} type={file.mimetype} />
        </video>
      );
    } else if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
      return (
        <audio controls>
          <source src={fileUrl} type={file.mimetype} />
        </audio>
      );
    } else if (['txt', 'js', 'html', 'css', 'jsx', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return (
        <pre style={{ maxHeight: '500px', overflow: 'auto', background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          {textContent || 'Loading content...'}
        </pre>
      );
    } else {
      return <p>Preview not available for this file type</p>;
    }
  };

  return (
    <div className="container">
      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            z-index: 1000;
            overflow: hidden;
          }
          .modal-content {
            background: #ffffff;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding: 40px;
            box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            animation: slideIn 0.4s ease-out forwards;
          }
          .modal-content.closing {
            animation: slideOut 0.4s ease-in forwards;
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes slideOut {
            from { transform: translateX(0); }
            to { transform: translateX(100%); }
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .modal-close {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.2s;
          }
          .modal-close:hover {
            background: #c0392b;
          }
          .modal-body {
            margin: 20px 0;
          }
          .modal-info p {
            margin: 10px 0;
            font-size: 16px;
          }
        `}
      </style>
      <div className="header">
        <h1>🗂 Automated File Organizer</h1>
        <p>Drag and drop files or folders to organize them automatically</p>
      </div>

      <div className="controls">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="sortBy">Sort by:</label>
            <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="type">File Type</option>
              <option value="size">File Size</option>
              <option value="name">File Name</option>
              <option value="date">Date Modified</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="sortOrder">Order:</label>
            <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="minSize">Min Size (KB):</label>
            <input
              type="number"
              id="minSize"
              min="0"
              placeholder="0"
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label htmlFor="maxSize">Max Size (MB):</label>
            <input
              type="number"
              id="maxSize"
              min="0"
              placeholder="∞"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
            />
          </div>
          <div className="control-group">
            <button onClick={handleClear} className="file-input-label">
              Clear All Files
            </button>
          </div>
        </div>
      </div>

      <div className="drop-zone" ref={dropZoneRef}>
        <div className="drop-zone-content">
          <div className="drop-icon">📁</div>
          <div className="drop-text">Drag and drop files or folders here</div>
          <label htmlFor="fileInput" className="file-input-label">
            Or click to browse files or folders
          </label>
          <input type="file" id="fileInput" multiple ref={fileInputRef} onChange={handleFileSelect} webkitdirectory="true" />
        </div>
      </div>

      <div className="progress-bar" id="progressBar" style={{ display: 'none' }}>
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="file-list" id="fileList" style={{ display: files.length > 0 ? 'block' : 'none' }}>
        <h3>📋 Uploaded Files</h3>
        <div id="fileItems">
          {Object.entries(organizedFiles).map(([category, data]) => {
            const categoryInfo = data.info;
            return (
              <div key={`category-${category}`} className="category-group">
                <div className="category-header">
                  <div className="category-icon" style={{ backgroundColor: categoryInfo.color }}>
                    {categoryInfo.icon}
                  </div>
                  <div className="category-name">{category}</div>
                  <div className="category-count">{data.files.length}</div>
                  <button
                    onClick={() => handleDownload(category)}
                    className="file-input-label"
                    style={{ marginLeft: '10px' }}
                  >
                    Download
                  </button>
                </div>
                <div className="category-files">
                  {data.files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-icon" style={{ backgroundColor: categoryInfo.color }}>
                        {categoryInfo.icon}
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.originalName}</div>
                        <div className="file-details">
                          {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewFile(file)}
                        style={{
                          padding: '8px 16px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginLeft: '10px',
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedFile && (
        <div className="modal-overlay">
          <div className={`modal-content ${selectedFile ? '' : 'closing'}`}>
            <div className="modal-header">
              <h2>{selectedFile.originalName}</h2>
              <button className="modal-close" onClick={closeModal}>
                Close
              </button>
            </div>
            <div className="modal-info">
              <p>Size: {formatFileSize(selectedFile.size)}</p>
              <p>Type: {getFileCategory(selectedFile.extension).category}</p>
              <p>Last Modified: {new Date(selectedFile.lastModified).toLocaleDateString()}</p>
            </div>
            <div className="modal-body">
              {renderFilePreview(selectedFile)}
            </div>
          </div>
        </div>
      )}

      <div className="stats" id="stats" style={{ display: stats.totalFiles > 0 ? 'grid' : 'none' }}>
        <div className="stat-card">
          <div className="stat-number">{stats.totalFiles}</div>
          <div className="stat-label">Total Files</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatFileSize(stats.totalSize)}</div>
          <div className="stat-label">Total Size</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.categories}</div>
          <div className="stat-label">Categories</div>
        </div>
      </div>
    </div>
  );
};

export default FileOrganizer;