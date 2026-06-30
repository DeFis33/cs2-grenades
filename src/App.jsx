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
  const [selectedMap, setSelectedMap] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editMode, setEditMode] = useState(() => localStorage.getItem('cs2_editor_auth') === 'true');
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [granadeMenu, setGranadeMenu] = useState(null);
  const [sidePanel, setSidePanel] = useState(null);
  const [wasDragging, setWasDragging] = useState(false);
  const [drawingLine, setDrawingLine] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
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

  useEffect(() => {
    const handleClick = () => setGuideOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const saveToFile = useCallback(async (data) => {
    try { await fetch('http://localhost:3001/api/save-markers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (err) { }
  }, []);

  const updateMarkers = (newMarkers) => { setMarkers(newMarkers); saveToFile(newMarkers); };

  // НОВАЯ ЛОГИКА: пересчитать все display в группе
  const recalculateGroup = (markersArray, groupX, groupY, mapId) => {
    const groupMembers = markersArray
      .filter(m => m.mapId === mapId && Math.abs(m.x - groupX) < 1.5 && Math.abs(m.y - groupY) < 1.5)
      .sort((a, b) => a.id - b.id); // Сортируем по id для стабильности

    return markersArray.map(m => {
      const idx = groupMembers.findIndex(gm => gm.id === m.id);
      if (idx !== -1) {
        return { ...m, displayX: groupX + idx * 4, displayY: groupY };
      }
      return m;
    });
  };

  const collapseGroup = (groupKey) => {
    if (!groupKey) return;
    const [gx, gy] = groupKey.split(',').map(Number);
    const collapsed = markers.map(m => {
      if (Math.abs(m.x - gx) < 1.5 && Math.abs(m.y - gy) < 1.5) {
        return { ...m, displayX: gx, displayY: gy, bendX: 0, bendY: 0 };
      }
      return m;
    });
    updateMarkers(collapsed);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setEditMode(true); localStorage.setItem('cs2_editor_auth', 'true'); setShowLogin(false); setPassword(''); setLoginError(false); }
    else { setLoginError(true); }
  };

  const handleLogout = () => { setEditMode(false); localStorage.removeItem('cs2_editor_auth'); setGranadeMenu(null); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  const handleMapClick = (e) => {
    if (expandedGroup) {
      collapseGroup(expandedGroup);
      setExpandedGroup(null);
    }

    if (!editMode || !selectedMap) return;
    if (e.target.closest('circle')) return;

    if (e.shiftKey && drawingLine) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const toX = ((e.clientX - rect.left) / rect.width) * 100;
      const toY = ((e.clientY - rect.top) / rect.height) * 100;
      updateMarkers(markers.map(m => m.id === drawingLine.markerId ? { ...m, lineTo: { x: Math.round(toX * 100) / 100, y: Math.round(toY * 100) / 100 } } : m));
      setDrawingLine(null);
      return;
    }
    if (e.shiftKey) return;

    if (e.ctrlKey) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setGranadeMenu({ x: Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100, y: Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100 });
      setSidePanel(null); setDrawingLine(null); setExpandedGroup(null);
      return;
    }

    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100, y = ((e.clientY - rect.top) / rect.height) * 100;
    if (granadeMenu) { setGranadeMenu(null); return; }
    setGranadeMenu({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    setSidePanel(null); setDrawingLine(null); setExpandedGroup(null);
  };

  const handleSelectGranade = (type, e) => {
    if (!granadeMenu) return;
    e.stopPropagation();
    const newMarker = { id: Date.now(), mapId: selectedMap, x: granadeMenu.x, y: granadeMenu.y, displayX: granadeMenu.x, displayY: granadeMenu.y, type, videoUrl: '', lineTo: null, bendX: 0, bendY: 0, throwType: '', side: '' };
    const updated = recalculateGroup([...markers, newMarker], granadeMenu.x, granadeMenu.y, selectedMap);
    updateMarkers(updated);
    setGranadeMenu(null);
  };

  // НОВАЯ ЛОГИКА УДАЛЕНИЯ
  const handleMarkerRightClick = (e, markerId) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();

    const deleted = markers.find(m => m.id === markerId);
    if (!deleted) return;

    // Удаляем маркер
    let updated = markers.filter(m => m.id !== markerId);

    // Пересчитываем группу
    updated = recalculateGroup(updated, deleted.x, deleted.y, deleted.mapId);

    updateMarkers(updated);
    setSidePanel(null); setDrawingLine(null); setExpandedGroup(null);
  };

  const handleMarkerClick = (e, marker) => {
    e.stopPropagation();
    if (e.defaultPrevented) return;
    setGranadeMenu(null);

    if (wasDragging) {
      setWasDragging(false);
      return;
    }

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
    if (editMode) setSidePanel({ marker, mode: 'edit' });
    else if (marker.videoUrl) setSidePanel({ marker, mode: 'view' });
  };

  // НОВАЯ ЛОГИКА ПЕРЕТАСКИВАНИЯ
  const handleMarkerMouseDown = (e, marker) => {
    if (!editMode || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();

    setWasDragging(false);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = marker.x;
    const origY = marker.y;
    const origDisplayX = marker.displayX || marker.x;
    const origDisplayY = marker.displayY || marker.y;
    let moved = false;

    const mm = (me) => {
      moved = true;
      const rect = mapRef.current.getBoundingClientRect();
      const dx = ((me.clientX - startX) / rect.width) * 100;
      const dy = ((me.clientY - startY) / rect.height) * 100;

      setMarkers(prev => prev.map(m => {
        if (m.id === marker.id) {
          return {
            ...m,
            x: Math.round((origX + dx) * 100) / 100,
            y: Math.round((origY + dy) * 100) / 100,
            displayX: origDisplayX + dx,
            displayY: origDisplayY + dy,
          };
        }
        return m;
      }));
    };

    const mu = () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      if (!moved) return;

      setWasDragging(true);

      setMarkers(prev => {
        const movedMarker = prev.find(m => m.id === marker.id);
        if (!movedMarker) return prev;

        // Ищем ближайшую метку для прилипания
        const nearby = prev.find(m =>
          m.mapId === selectedMap &&
          m.id !== marker.id &&
          Math.abs(m.x - movedMarker.x) < 1.5 &&
          Math.abs(m.y - movedMarker.y) < 1.5
        );

        if (nearby) {
          // Прилипаем: ставим маркер в ту же точку и пересчитываем группу
          let updated = prev.map(m => {
            if (m.id === marker.id) {
              return { ...m, x: nearby.x, y: nearby.y, displayX: nearby.x, displayY: nearby.y };
            }
            return m;
          });

          // Пересчитываем всю группу
          updated = recalculateGroup(updated, nearby.x, nearby.y, selectedMap);

          saveToFile(updated);
          setExpandedGroup(null);
          return updated;
        }

        // Если не прилипли — пересчитываем старую группу
        let updated = recalculateGroup(prev, origX, origY, selectedMap);

        // И пересчитываем новую позицию (если переместился в пустое место)
        updated = updated.map(m => {
          if (m.id === marker.id && !updated.some(u => u.id !== m.id && Math.abs(u.x - m.x) < 1.5 && Math.abs(u.y - m.y) < 1.5)) {
            return { ...m, displayX: m.x, displayY: m.y };
          }
          return m;
        });

        saveToFile(updated);
        setExpandedGroup(null);
        return updated;
      });
    };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
  };

  const handleGroupMouseDown = (e, groupKey) => {
    if (!editMode) return;
    e.stopPropagation();
    const [gx, gy] = groupKey.split(',').map(Number);
    const startX = e.clientX;
    const startY = e.clientY;
    const groupMarkers = markers.filter(m => m.mapId === selectedMap && Math.abs(m.x - gx) < 1.5 && Math.abs(m.y - gy) < 1.5);
    const origValues = groupMarkers.map(m => ({
      id: m.id,
      x: m.x,
      y: m.y,
      displayX: m.displayX || m.x,
      displayY: m.displayY || m.y
    }));

    const mm = (me) => {
      const rect = mapRef.current.getBoundingClientRect();
      const dx = ((me.clientX - startX) / rect.width) * 100;
      const dy = ((me.clientY - startY) / rect.height) * 100;

      setMarkers(prev => prev.map(m => {
        const o = origValues.find(ov => ov.id === m.id);
        return o ? {
          ...m,
          x: Math.round((o.x + dx) * 100) / 100,
          y: Math.round((o.y + dy) * 100) / 100,
          displayX: o.displayX + dx,
          displayY: o.displayY + dy
        } : m;
      }));
    };

    const mu = () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      saveToFile(markers);
    };

    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
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

    const [gx, gy] = groupKey.split(',').map(Number);

    if (expandedGroup !== groupKey) {
      // Разворачиваем группу
      const expanded = recalculateGroup(markers, gx, gy, selectedMap);
      updateMarkers(expanded);
      setExpandedGroup(groupKey);
    } else {
      // Сворачиваем группу
      collapseGroup(groupKey);
      setExpandedGroup(null);
    }
    setGranadeMenu(null);
    setSidePanel(null);
  };

  const handleMarkerHover = (m) => {
    if (m.lineTo) setHoveredMarker(m);
  };
  const handleMarkerLeave = () => setHoveredMarker(null);

  const handleBendMouseDown = (e, marker) => {
    if (!editMode) return;
    e.stopPropagation(); e.preventDefault();
    const sx = e.clientX, sy = e.clientY, sbx = marker.bendX || 0, sby = marker.bendY || 0;
    const mm = (me) => setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, bendX: sbx + me.clientX - sx, bendY: sby + me.clientY - sy } : m));
    const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); saveToFile(markers); };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  };

  const handleThrowTypeChange = (v) => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, throwType: v } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, throwType: v } })); };
  const handleSideChange = (v) => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, side: v } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, side: v } })); };
  const handleDeleteLine = () => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, lineTo: null, bendX: 0, bendY: 0 } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, lineTo: null } })); };
  const handleDeleteVideo = () => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, videoUrl: '' } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, videoUrl: '' } })); };

  const currentMarkers = markers.filter(m => m.mapId === selectedMap);
  const groupedMarkers = {};
  currentMarkers.forEach(m => {
    const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
    if (!groupedMarkers[key]) groupedMarkers[key] = [];
    groupedMarkers[key].push(m);
  });

  return (
    <div className="app" onClick={() => {
      if (expandedGroup) {
        collapseGroup(expandedGroup);
        setExpandedGroup(null);
      }
      setGranadeMenu(null); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null);
    }}>
      <header className="header">
        <div className="header-spacer"></div>
        <div className="dropdown-container">
          <button className="dropdown-button" onClick={() => setDropdownOpen(!dropdownOpen)}>Карты ▾</button>
          {dropdownOpen && (
            <ul className="dropdown">{maps.map(map => (
              <li key={map.id} className="dropdown-item" onClick={() => { setSelectedMap(map.id); setDropdownOpen(false); setGranadeMenu(null); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null); }}>{map.name}</li>
            ))}</ul>
          )}
        </div>
        <div className="header-right">
          {editMode && (
            <div className={`guide-container ${guideOpen ? 'active' : ''}`}>
              <button
                className="guide-icon-btn"
                title="Управление"
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideOpen(!guideOpen);
                }}
              >
                <img src="/icons/help.png" alt="?" className="guide-icon-img" />
              </button>
              <div className="guide-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="guide-title">Управление</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по карте - создать</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по метке - редактировать</div>
                <div className="guide-item"><kbd>Ctrl</kbd> + <kbd>ЛКМ</kbd> - в группу</div>
                <div className="guide-item"><kbd>Shift</kbd> + <kbd>ЛКМ</kbd> по метке - траектория</div>
                <div className="guide-item"><kbd>Shift</kbd> + <kbd>ЛКМ</kbd> по карте - конец</div>
                <div className="guide-item"><kbd>ПКМ</kbd> - удалить</div>
                <div className="guide-item"><kbd>ЛКМ</kbd> по группе - развернуть</div>
                <div className="guide-item">Перетащить метку на другую - в группу</div>
              </div>
            </div>
          )}
          {editMode ? (
            <button className="edit-icon-btn active" onClick={handleLogout} title="Выйти из редактора"><img src="/icons/edit-active.png" alt="Редактор" className="edit-icon-img" /></button>
          ) : (
            <button className="edit-icon-btn" onClick={() => setShowLogin(true)} title="Редактор"><img src="/icons/edit.png" alt="Редактор" className="edit-icon-img" /></button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="modal-overlay" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="login-close" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>✕</button>
            <h2 className="login-title">Вход в редактор</h2>
            <input type="password" className="login-input" placeholder="Введите пароль" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(false); }} onKeyDown={handleKeyDown} autoFocus />
            {loginError && <p className="login-error">Неверный пароль</p>}
            <button className="login-btn" onClick={handleLogin}>Войти</button>
          </div>
        </div>
      )}

      <main className="main">
        {loading ? <p style={{ color: '#a0aec0' }}>Загрузка...</p> : (
          <div className="map-wrapper">
            <div className="map-container" onClick={handleMapClick} ref={mapRef}>
              <img src={`/maps/${imageName}`} alt={selectedMap || 'Выберите карту'} className="map-image" />

              <svg className="lines-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
                {currentMarkers.map(marker => {
                  if (!marker.lineTo) return null;
                  if (drawingLine && marker.id !== drawingLine.markerId) return null;
                  const isHovered = hoveredMarker?.id === marker.id;
                  const isDrawing = drawingLine?.markerId === marker.id;

                  // Если наведён курсор на какую-то гранату — показываем только её траекторию
                  if (editMode && hoveredMarker && !isHovered && !isDrawing) return null;

                  // В режиме просмотра: показываем только при наведении
                  if (!editMode && !isHovered && !isDrawing) return null;

                  const group = Object.values(groupedMarkers).find(g => g.some(m => m.id === marker.id));
                  let ex = (marker.displayX || marker.x) * 8;
                  let ey = (marker.displayY || marker.y) * 6;

                  if (group && group.length >= 2 && marker.id !== group[0].id) {
                    ex = (group[0].displayX || group[0].x) * 8;
                    ey = (group[0].displayY || group[0].y) * 6;
                  }

                  const sx = marker.lineTo.x * 8;
                  const sy = marker.lineTo.y * 6;
                  const mx = (sx + ex) / 2 + (marker.bendX || 0);
                  const my = (sy + ey) / 2 + (marker.bendY || 0);

                  return (
                    <g key={`line-${marker.id}`}>
                      <line x1={sx} y1={sy} x2={mx} y2={my} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <line x1={mx} y1={my} x2={ex} y2={ey} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <circle cx={sx} cy={sy} r="5" fill="white" opacity="0.9" style={{ pointerEvents: 'none' }} />
                      {editMode && <circle cx={mx} cy={my} r="4" fill="white" stroke="#1a1a2e" strokeWidth="2" style={{ cursor: 'move', pointerEvents: 'auto' }} onMouseDown={(e) => handleBendMouseDown(e, marker)} />}
                    </g>
                  );
                })}
              </svg>

              {drawingLine && <div className="drawing-hint">Shift+клик по карте - поставить конечную точку</div>}
              {granadeMenu && selectedMap && (
                <div className="granade-menu" style={{ left: `${granadeMenu.x}%`, top: `${granadeMenu.y}%` }} onClick={e => e.stopPropagation()}>
                  {granadeTypes.map((g, i) => (
                    <button key={g.type} className={`granade-option granade-pos-${i}`} onClick={(e) => handleSelectGranade(g.type, e)}><img src={g.icon} alt={g.type} className="granade-option-img" /></button>
                  ))}
                </div>
              )}

              {Object.entries(groupedMarkers).map(([key, group]) => {
                if (drawingLine && !group.find(m => m.id === drawingLine.markerId)) return null;
                const isExpanded = expandedGroup === key;
                const [gx, gy] = key.split(',').map(Number);
                if (group.length === 1 && !isExpanded) {
                  const marker = group[0], type = granadeTypes.find(g => g.type === marker.type);
                  const left = `${(marker.displayX || marker.x)}%`;
                  const top = `${(marker.displayY || marker.y)}%`;
                  return (
                    <div key={marker.id} className={`marker ${drawingLine?.markerId === marker.id ? 'drawing' : ''}`} style={{ left, top }}
                      onMouseDown={(e) => handleMarkerMouseDown(e, marker)} onClick={(e) => handleMarkerClick(e, marker)}
                      onContextMenu={(e) => handleMarkerRightClick(e, marker.id)} onMouseEnter={() => handleMarkerHover(marker)} onMouseLeave={handleMarkerLeave} title={type?.type}>
                      <img src={type?.icon} alt={type?.type} className="marker-icon-img" />
                    </div>
                  );
                }
                return (
                  <div key={key}>
                    {isExpanded ? (
                      <>
                        {group.map((marker) => {
                          const type = granadeTypes.find(g => g.type === marker.type);
                          const left = `${(marker.displayX || marker.x)}%`;
                          const top = `${(marker.displayY || marker.y)}%`;
                          return (
                            <div key={marker.id} className={`marker ${drawingLine?.markerId === marker.id ? 'drawing' : ''}`} style={{ left, top }}
                              onMouseDown={(e) => handleMarkerMouseDown(e, marker)} onClick={(e) => handleMarkerClick(e, marker)}
                              onContextMenu={(e) => handleMarkerRightClick(e, marker.id)} onMouseEnter={() => handleMarkerHover(marker)} onMouseLeave={handleMarkerLeave} title={type?.type}>
                              <img src={type?.icon} alt={type?.type} className="marker-icon-img" />
                            </div>
                          );
                        })}
                        <div className="marker group-close-marker" style={{ left: `${gx + group.length * 4}%`, top: `${gy}%` }}
                          onClick={(e) => { e.stopPropagation(); collapseGroup(key); setExpandedGroup(null); }} title="Свернуть"><span className="close-icon">✕</span></div>
                      </>
                    ) : (
                      <div className="marker group-marker" style={{ left: `${gx}%`, top: `${gy}%`, cursor: editMode ? 'move' : 'pointer' }}
                        onClick={(e) => handleGroupClick(e, key)} onMouseDown={(e) => handleGroupMouseDown(e, key)} title={`${group.length} гранат`}><span className="group-count">{group.length}</span></div>
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
                      {sidePanel.marker.lineTo && <button className="delete-line-btn" onClick={handleDeleteLine}>Удалить траекторию</button>}
                      {sidePanel.marker.videoUrl && <button className="delete-line-btn" onClick={handleDeleteVideo}>Удалить видео</button>}
                    </div>
                    {sidePanel.marker.videoUrl ? (
                      <div className="video-loaded-block"><video src={sidePanel.marker.videoUrl} controls className="side-video" /></div>
                    ) : (
                      <div className="video-url-block"><input type="text" className="video-url-input" placeholder="Ссылка на видео (YouTube / Cloudinary)" value={sidePanel.marker.videoUrl || ''} onChange={(e) => { updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, videoUrl: e.target.value } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, videoUrl: e.target.value } })); }} /></div>
                    )}
                    <div className="throw-type-block">
                      <p className="throw-type-label">Тип броска:</p>
                      <select className="throw-type-select" value={sidePanel.marker.throwType || ''} onChange={(e) => handleThrowTypeChange(e.target.value)}>{throwTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                    </div>
                    <div className="throw-type-block">
                      <p className="throw-type-label">Сторона:</p>
                      <div className="side-buttons">{sideTypes.filter(s => s.value !== '').map(s => (
                        <button key={s.value} className={`side-btn ${sidePanel.marker.side === s.value ? 'active' : ''}`} onClick={() => handleSideChange(sidePanel.marker.side === s.value ? '' : s.value)}><img src={s.icon} alt={s.label} className="side-btn-icon" /></button>
                      ))}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="video-container">{sidePanel.marker.videoUrl ? <video src={sidePanel.marker.videoUrl} controls className="side-video" /> : <p className="no-video">Видео не добавлено</p>}</div>
                    {sidePanel.marker.throwType && <div className="throw-type-display">Тип: {throwTypes.find(t => t.value === sidePanel.marker.throwType)?.label}</div>}
                    {sidePanel.marker.side && <div className="side-display"><span className="side-display-label">Сторона:</span><img src={sideTypes.find(s => s.value === sidePanel.marker.side)?.icon} alt="" className="side-display-icon" /></div>}
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