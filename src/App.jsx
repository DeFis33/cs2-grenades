import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const maps = [
  { id: 'dust2', name: 'Dust 2' },
];

const granadeTypes = [
  { type: 'smoke', icon: '/icons/smoke.png' },
  { type: 'flash', icon: '/icons/flash.png' },
  { type: 'molotov', icon: '/icons/molotov.png' },
  { type: 'he', icon: '/icons/he.png' },
];

const sideTypes = [
  { value: '', label: 'Любая', icon: null },
  { value: 'ct', label: 'CT', icon: '/icons/side-ct.png' },
  { value: 't', label: 'T', icon: '/icons/side-t.png' },
];

const throwTypes = [
  { value: '', label: 'Не выбрано' },
  { value: 'throw', label: 'Throw' },
  { value: 'jump-throw', label: 'Jump-throw' },
  { value: 'jump-throw + w', label: 'Jump-throw + W' },
  { value: 'walk-throw', label: 'Walk-throw' },
  { value: 'crouch-throw', label: 'Crouch-throw' },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

function App() {
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [editMode, setEditMode] = useState(() => {
    return localStorage.getItem('cs2_editor_auth') === 'true';
  });

  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [granadeMenu, setGranadeMenu] = useState(null);
  const [sidePanel, setSidePanel] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [drawingLine, setDrawingLine] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const mapRef = useRef(null);

  const imageName = selectedMap ? `${selectedMap}.png` : 'start.png';

  useEffect(() => {
    fetch('/markers.json')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const fixed = data.map(m => ({
          ...m,
          displayX: m.displayX ?? m.x,
          displayY: m.displayY ?? m.y,
          lineTo: m.lineTo || null,
          bendX: m.bendX || 0,
          bendY: m.bendY || 0,
          throwType: m.throwType || '',
          videoUrl: m.videoUrl || '',
          side: m.side || '',
        }));
        setMarkers(fixed);
      })
      .catch(() => setMarkers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleGroupMouseDown = (e, groupKey) => {
    if (!editMode) return;
    e.stopPropagation();

    const [gx, gy] = groupKey.split(',').map(Number);
    const startX = e.clientX;
    const startY = e.clientY;

    const groupMarkers = markers.filter(m =>
      m.mapId === selectedMap &&
      Math.abs(m.x - gx) < 1 &&
      Math.abs(m.y - gy) < 1
    );

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / 8;
      const dy = (moveEvent.clientY - startY) / 6;

      const updated = markers.map(m => {
        if (groupMarkers.find(gm => gm.id === m.id)) {
          return {
            ...m,
            x: Math.round((m.x + dx) * 100) / 100,
            y: Math.round((m.y + dy) * 100) / 100,
            displayX: (m.displayX || m.x) + dx,
            displayY: (m.displayY || m.y) + dy,
          };
        }
        return m;
      });
      setMarkers(updated);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      saveToFile(markers);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const saveToFile = useCallback(async (data) => {
    try {
      await fetch('http://localhost:3001/api/save-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.log('API сервер не запущен');
    }
  }, []);

  const updateMarkers = (newMarkers) => {
    setMarkers(newMarkers);
    saveToFile(newMarkers);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setEditMode(true);
      localStorage.setItem('cs2_editor_auth', 'true');
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setEditMode(false);
    localStorage.removeItem('cs2_editor_auth');
    setGranadeMenu(null);
    setSidePanel(null);
    setDrawingLine(null);
    setExpandedGroup(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleMapClick = (e) => {
    if (!editMode || !selectedMap) return;
    if (e.target.closest('circle')) return;

    if (e.shiftKey && drawingLine) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const toX = ((e.clientX - rect.left) / rect.width) * 100;
      const toY = ((e.clientY - rect.top) / rect.height) * 100;

      const updated = markers.map(m =>
        m.id === drawingLine.markerId
          ? { ...m, lineTo: { x: Math.round(toX * 100) / 100, y: Math.round(toY * 100) / 100 } }
          : m
      );
      updateMarkers(updated);
      setDrawingLine(null);
      return;
    }

    if (e.shiftKey) return;

    if (e.ctrlKey) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setGranadeMenu({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
      setSidePanel(null);
      setDrawingLine(null);
      setExpandedGroup(null);
      return;
    }

    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (granadeMenu) {
      setGranadeMenu(null);
      return;
    }

    setGranadeMenu({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    setSidePanel(null);
    setDrawingLine(null);
    setExpandedGroup(null);
  };

  const handleSelectGranade = (type, e) => {
    if (!granadeMenu) return;
    e.stopPropagation();

    const samePlace = markers.filter(m =>
      m.mapId === selectedMap &&
      Math.abs(m.x - granadeMenu.x) < 1 &&
      Math.abs(m.y - granadeMenu.y) < 1
    );

    const offsetIndex = samePlace.length;

    const newMarker = {
      id: Date.now(),
      mapId: selectedMap,
      x: granadeMenu.x,
      y: granadeMenu.y,
      displayX: granadeMenu.x + offsetIndex * 4,
      displayY: granadeMenu.y,
      type: type,
      videoUrl: '',
      lineTo: null,
      bendX: 0,
      bendY: 0,
      throwType: '',
      side: '',
    };

    updateMarkers([...markers, newMarker]);
    setGranadeMenu(null);
  };

  const handleMarkerRightClick = (e, markerId) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();

    const deleted = markers.find(m => m.id === markerId);
    let updated = markers.filter(m => m.id !== markerId);

    if (deleted) {
      const sameGroup = updated.filter(m =>
        m.mapId === deleted.mapId &&
        Math.abs(m.x - deleted.x) < 1 &&
        Math.abs(m.y - deleted.y) < 1
      );

      sameGroup.forEach((m, i) => {
        updated = updated.map(marker =>
          marker.id === m.id
            ? { ...marker, displayX: marker.x + i * 4, displayY: marker.y }
            : marker
        );
      });
    }

    updateMarkers(updated);
    setSidePanel(null);
    setDrawingLine(null);
    setExpandedGroup(null);
  };

  const handleMarkerClick = (e, marker) => {
    e.stopPropagation();
    if (e.defaultPrevented) return;

    setGranadeMenu(null);

    if (editMode && e.ctrlKey) {
      setGranadeMenu({ x: marker.x, y: marker.y });
      setSidePanel(null);
      setDrawingLine(null);
      return;
    }

    if (editMode && e.shiftKey) {
      setDrawingLine({ markerId: marker.id, fromX: marker.x, fromY: marker.y });
      setSidePanel(null);
      setExpandedGroup(null);
      return;
    }

    if (editMode) {
      setSidePanel({ marker, mode: 'edit' });
    } else {
      if (marker.videoUrl) {
        setSidePanel({ marker, mode: 'view' });
      }
    }
  };

  const handleMarkerMouseDown = (e, marker) => {
    if (!editMode) return;
    if (e.ctrlKey || e.shiftKey) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = marker.x;
    const origY = marker.y;
    const origDisplayX = marker.displayX || marker.x;
    const origDisplayY = marker.displayY || marker.y;
    let moved = false;

    const handleMouseMove = (moveEvent) => {
      moved = true;
      const dx = (moveEvent.clientX - startX) / 8;
      const dy = (moveEvent.clientY - startY) / 6;

      const updated = markers.map(m =>
        m.id === marker.id
          ? {
            ...m,
            x: Math.round((origX + dx) * 100) / 100,
            y: Math.round((origY + dy) * 100) / 100,
            displayX: origDisplayX + dx,
            displayY: origDisplayY + dy,
          }
          : m
      );
      setMarkers(updated);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (moved) saveToFile(markers);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleGroupClick = (e, groupKey) => {
    e.stopPropagation();

    if (editMode && e.ctrlKey) {
      const [gx, gy] = groupKey.split(',').map(Number);
      setGranadeMenu({ x: gx, y: gy });
      setSidePanel(null);
      setDrawingLine(null);
      setExpandedGroup(null);
      return;
    }

    if (expandedGroup !== groupKey) {
      const [gx, gy] = groupKey.split(',').map(Number);
      const updated = markers.map(m => {
        if (m.mapId === selectedMap && Math.abs(m.x - gx) < 1 && Math.abs(m.y - gy) < 1) {
          return { ...m };
        }
        return m;
      });

      let count = 0;
      const rebuilt = updated.map(m => {
        if (m.mapId === selectedMap && Math.abs(m.x - gx) < 1 && Math.abs(m.y - gy) < 1) {
          const newMarker = { ...m, displayX: m.x + count * 4, displayY: m.y };
          count++;
          return newMarker;
        }
        return m;
      });

      updateMarkers(rebuilt);
    }

    setGranadeMenu(null);
    setSidePanel(null);
    setExpandedGroup(expandedGroup === groupKey ? null : groupKey);
  };

  const handleMarkerHover = (marker) => {
    if (!editMode && marker.lineTo) {
      setHoveredMarker(marker);
    }
  };

  const handleMarkerLeave = () => {
    setHoveredMarker(null);
  };

  const handleBendMouseDown = (e, marker) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startBendX = marker.bendX || 0;
    const startBendY = marker.bendY || 0;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newBendX = startBendX + dx;
      const newBendY = startBendY + dy;

      const updated = markers.map(m =>
        m.id === marker.id ? { ...m, bendX: newBendX, bendY: newBendY } : m
      );
      setMarkers(updated);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      saveToFile(markers);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleThrowTypeChange = (value) => {
    if (!sidePanel) return;
    const updated = markers.map(m =>
      m.id === sidePanel.marker.id ? { ...m, throwType: value } : m
    );
    updateMarkers(updated);
    setSidePanel({ ...sidePanel, marker: { ...sidePanel.marker, throwType: value } });
  };

  const handleSideChange = (value) => {
    if (!sidePanel) return;
    const updated = markers.map(m =>
      m.id === sidePanel.marker.id ? { ...m, side: value } : m
    );
    updateMarkers(updated);
    setSidePanel({ ...sidePanel, marker: { ...sidePanel.marker, side: value } });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      await uploadVideo(file);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadVideo(file);
    }
  };

  const uploadVideo = async (file) => {
    if (!sidePanel) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await fetch('http://localhost:3001/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const updated = markers.map(m =>
          m.id === sidePanel.marker.id ? { ...m, videoUrl: data.url } : m
        );
        updateMarkers(updated);
        setSidePanel({ ...sidePanel, marker: { ...sidePanel.marker, videoUrl: data.url } });
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    }
    setUploading(false);
  };

  const handleDeleteLine = () => {
    if (!sidePanel) return;
    const updated = markers.map(m =>
      m.id === sidePanel.marker.id ? { ...m, lineTo: null, bendX: 0, bendY: 0 } : m
    );
    updateMarkers(updated);
    setSidePanel({ ...sidePanel, marker: { ...sidePanel.marker, lineTo: null, bendX: 0, bendY: 0 } });
  };

  const handleDeleteVideo = () => {
    if (!sidePanel) return;
    const updated = markers.map(m =>
      m.id === sidePanel.marker.id ? { ...m, videoUrl: '' } : m
    );
    updateMarkers(updated);
    setSidePanel({ ...sidePanel, marker: { ...sidePanel.marker, videoUrl: '' } });
  };

  const currentMarkers = markers.filter(m => m.mapId === selectedMap);

  const groupedMarkers = {};
  currentMarkers.forEach(m => {
    const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
    if (!groupedMarkers[key]) groupedMarkers[key] = [];
    groupedMarkers[key].push(m);
  });

  return (
    <div className="app" onClick={() => { setGranadeMenu(null); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null); }}>
      <header className="header">
        <div className="header-spacer"></div>

        <div className="dropdown-container">
          <button className="dropdown-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            Карты ▾
          </button>
          {dropdownOpen && (
            <ul className="dropdown">
              {maps.map(map => (
                <li key={map.id} className="dropdown-item" onClick={() => {
                  setSelectedMap(map.id);
                  setDropdownOpen(false);
                  setGranadeMenu(null);
                  setSidePanel(null);
                  setDrawingLine(null);
                  setExpandedGroup(null);
                }}>
                  {map.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="header-right">
          {editMode && (
            <div className="guide-container">
              <button className="guide-icon-btn" title="Управление">
                <img src="/icons/help.png" alt="?" className="guide-icon-img" />
              </button>
              <div className="guide-dropdown">
                <div className="guide-title">Управление</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по карте - создать</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по метке - редактировать</div>
                <div className="guide-item"><kbd>Ctrl</kbd> + <kbd>ЛКМ</kbd> - в группу</div>
                <div className="guide-item"><kbd>Shift</kbd> + <kbd>ЛКМ</kbd> по метке - траектория</div>
                <div className="guide-item"><kbd>Shift</kbd> + <kbd>ЛКМ</kbd> по карте - конец</div>
                <div className="guide-item"><kbd>ПКМ</kbd> - удалить</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по группе - развернуть</div>
              </div>
            </div>
          )}
          {editMode ? (
            <button className="edit-icon-btn active" onClick={handleLogout} title="Выйти из редактора">
              <img src="/icons/edit-active.png" alt="Редактор" className="edit-icon-img" />
            </button>
          ) : (
            <button className="edit-icon-btn" onClick={() => setShowLogin(true)} title="Редактор">
              <img src="/icons/edit.png" alt="Редактор" className="edit-icon-img" />
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="modal-overlay" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="login-close" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>✕</button>
            <h2 className="login-title">Вход в редактор</h2>
            <input type="password" className="login-input" placeholder="Введите пароль" value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
              onKeyDown={handleKeyDown} autoFocus />
            {loginError && <p className="login-error">Неверный пароль</p>}
            <button className="login-btn" onClick={handleLogin}>Войти</button>
          </div>
        </div>
      )}

      <main className="main">
        {loading ? (
          <p style={{ color: '#a0aec0' }}>Загрузка...</p>
        ) : (
          <div className="map-wrapper">
            <div className="map-container" onClick={handleMapClick} ref={mapRef}>
              <img src={`/maps/${imageName}`} alt={selectedMap || 'Выберите карту'} className="map-image" />

              <svg className="lines-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
                {currentMarkers.map(marker => {
                  if (!marker.lineTo) return null;

                  if (drawingLine && marker.id !== drawingLine.markerId) return null;

                  const isHovered = hoveredMarker?.id === marker.id;
                  const isDrawing = drawingLine?.markerId === marker.id;
                  if (!isHovered && !isDrawing && !editMode) return null;

                  const startX = marker.lineTo.x * 8;
                  const startY = marker.lineTo.y * 6;
                  const endX = marker.x * 8;
                  const endY = marker.y * 6;
                  const midX = (startX + endX) / 2 + (marker.bendX || 0);
                  const midY = (startY + endY) / 2 + (marker.bendY || 0);

                  return (
                    <g key={`line-${marker.id}`}>
                      <line x1={startX} y1={startY} x2={midX} y2={midY} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <line x1={midX} y1={midY} x2={endX} y2={endY} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <circle cx={startX} cy={startY} r="5" fill="white" opacity="0.9" style={{ pointerEvents: 'none' }} />
                      {editMode && (
                        <circle cx={midX} cy={midY} r="4" fill="white" stroke="#1a1a2e" strokeWidth="2"
                          style={{ cursor: 'move', pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleBendMouseDown(e, marker)} />
                      )}
                    </g>
                  );
                })}
              </svg>

              {drawingLine && (
                <div className="drawing-hint">Shift+клик по карте - поставить конечную точку</div>
              )}

              {granadeMenu && selectedMap && (
                <div className="granade-menu" style={{ left: `${granadeMenu.x}%`, top: `${granadeMenu.y}%` }} onClick={e => e.stopPropagation()}>
                  {granadeTypes.map((g, i) => (
                    <button key={g.type} className={`granade-option granade-pos-${i}`} onClick={(e) => handleSelectGranade(g.type, e)}>
                      <img src={g.icon} alt={g.type} className="granade-option-img" />
                    </button>
                  ))}
                </div>
              )}

              {Object.entries(groupedMarkers).map(([key, group]) => {
                if (drawingLine && !group.find(m => m.id === drawingLine.markerId)) {
                  return null;
                }

                const isExpanded = expandedGroup === key;
                const [gx, gy] = key.split(',').map(Number);

                if (group.length === 1 && !isExpanded) {
                  const marker = group[0];
                  const type = granadeTypes.find(g => g.type === marker.type);
                  const dx = (marker.displayX || marker.x) - marker.x;
                  const dy = (marker.displayY || marker.y) - marker.y;
                  return (
                    <div key={marker.id}
                      className={`marker ${drawingLine?.markerId === marker.id ? 'drawing' : ''}`}
                      style={{ left: `${marker.x + dx}%`, top: `${marker.y + dy}%` }}
                      onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                      onClick={(e) => handleMarkerClick(e, marker)}
                      onContextMenu={(e) => handleMarkerRightClick(e, marker.id)}
                      onMouseEnter={() => handleMarkerHover(marker)}
                      onMouseLeave={handleMarkerLeave}
                      title={type?.type}>
                      <img src={type?.icon} alt={type?.type} className="marker-icon-img" />
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    {isExpanded ? (
                      <>
                        {group.map((marker, i) => {
                          const type = granadeTypes.find(g => g.type === marker.type);
                          const dx = (marker.displayX || marker.x) - marker.x;
                          const dy = (marker.displayY || marker.y) - marker.y;
                          return (
                            <div key={marker.id}
                              className={`marker ${drawingLine?.markerId === marker.id ? 'drawing' : ''}`}
                              style={{ left: `${marker.x + dx}%`, top: `${marker.y + dy}%` }}
                              onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                              onClick={(e) => handleMarkerClick(e, marker)}
                              onContextMenu={(e) => handleMarkerRightClick(e, marker.id)}
                              onMouseEnter={() => handleMarkerHover(marker)}
                              onMouseLeave={handleMarkerLeave}
                              title={type?.type}>
                              <img src={type?.icon} alt={type?.type} className="marker-icon-img" />
                            </div>
                          );
                        })}
                        <div
                          className="marker group-close-marker"
                          style={{ left: `${gx + group.length * 4}%`, top: `${gy}%` }}
                          onClick={(e) => { e.stopPropagation(); setExpandedGroup(null); }}
                          title="Свернуть">
                          <span className="close-icon">✕</span>
                        </div>
                      </>
                    ) : (
                      <div
                        className="marker group-marker"
                        style={{ left: `${gx}%`, top: `${gy}%`, cursor: editMode ? 'move' : 'pointer' }}
                        onClick={(e) => handleGroupClick(e, key)}
                        onMouseDown={(e) => handleGroupMouseDown(e, key)}
                        title={`${group.length} гранат`}>
                        <span className="group-count">{group.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {sidePanel && (
              <div className="side-panel" onClick={e => e.stopPropagation()}>
                <button className="side-panel-close" onClick={() => setSidePanel(null)}>✕</button>
                <div className="side-panel-type">
                  <img src={granadeTypes.find(g => g.type === sidePanel.marker.type)?.icon} alt="" className="side-panel-type-icon" />
                  <span>{granadeTypes.find(g => g.type === sidePanel.marker.type)?.type}</span>
                </div>

                {sidePanel.mode === 'edit' ? (
                  <>
                    <div className="edit-video-block">
                      {sidePanel.marker.lineTo && (
                        <button className="delete-line-btn" onClick={handleDeleteLine}>Удалить траекторию</button>
                      )}
                      {sidePanel.marker.videoUrl && (
                        <button className="delete-line-btn" onClick={handleDeleteVideo}>Удалить видео</button>
                      )}
                    </div>
                    {sidePanel.marker.videoUrl ? (
                      <div className="video-loaded-block">
                        <video src={sidePanel.marker.videoUrl} controls className="side-video" />
                      </div>
                    ) : (
                      <div className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" style={{ display: 'none' }} />
                        {uploading ? (
                          <p className="drop-zone-text">Загрузка...</p>
                        ) : (
                          <p className="drop-zone-text">Перетащите видео сюда{'\n'}или нажмите чтобы выбрать</p>
                        )}
                      </div>
                    )}
                    <div className="throw-type-block">
                      <p className="throw-type-label">Тип броска:</p>
                      <select className="throw-type-select" value={sidePanel.marker.throwType || ''}
                        onChange={(e) => handleThrowTypeChange(e.target.value)}>
                        {throwTypes.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="throw-type-block">
                      <p className="throw-type-label">Сторона:</p>
                      <div className="side-buttons">
                        {sideTypes.filter(s => s.value !== '').map(s => (
                          <button
                            key={s.value}
                            className={`side-btn ${sidePanel.marker.side === s.value ? 'active' : ''}`}
                            onClick={() => handleSideChange(sidePanel.marker.side === s.value ? '' : s.value)}
                          >
                            <img src={s.icon} alt={s.label} className="side-btn-icon" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="video-container">
                      {sidePanel.marker.videoUrl ? (
                        <video src={sidePanel.marker.videoUrl} controls className="side-video" />
                      ) : (
                        <p className="no-video">Видео не добавлено</p>
                      )}
                    </div>
                    {sidePanel.marker.throwType && (
                      <div className="throw-type-display">
                        Тип: {throwTypes.find(t => t.value === sidePanel.marker.throwType)?.label}
                      </div>
                    )}
                    {sidePanel.marker.side && (
                      <div className="side-display">
                        <span className="side-display-label">Сторона:</span>
                        <img
                          src={sideTypes.find(s => s.value === sidePanel.marker.side)?.icon}
                          alt=""
                          className="side-display-icon"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;