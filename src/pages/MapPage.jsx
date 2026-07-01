import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const GIST_ID = '8f1c7f4ee430dd9bf0c317a782938d5b';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const MARKERS_URL = `https://api.github.com/gists/${GIST_ID}`;

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

const maps = [
  { id: 'dust2', name: 'Dust 2' },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

function MapPage({ editMode, onLoginSuccess, onLogout }) {
  const { mapId } = useParams();
  const selectedMap = mapId;
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
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const mapRef = useRef(null);
  const { lang, t } = useLanguage();

  const imageName = `${selectedMap}.png`;

  const getSpacing = () => window.innerWidth <= 768 ? 6 : 4;

  useEffect(() => {
    fetch(MARKERS_URL)
      .then(res => res.json())
      .then(data => {
        const content = data.files['markers.json']?.content;
        if (!content) {
          setMarkers([]);
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(content);
        const fixed = parsed.map(m => {
          const hasLineTo = m.lineTo && m.lineTo.x !== undefined && m.lineTo.y !== undefined;

          let bendAbsoluteX = m.bendAbsoluteX;
          let bendAbsoluteY = m.bendAbsoluteY;

          if ((bendAbsoluteX === undefined || bendAbsoluteX === null) && hasLineTo) {
            const sx = m.lineTo.x * 8;
            const sy = m.lineTo.y * 6;
            const ex = (m.displayX ?? m.x) * 8;
            const ey = (m.displayY ?? m.y) * 6;
            const midX = (sx + ex) / 2;
            const midY = (sy + ey) / 2;
            bendAbsoluteX = midX + (m.bendX || 0);
            bendAbsoluteY = midY + (m.bendY || 0);
          } else if (!hasLineTo) {
            bendAbsoluteX = 0;
            bendAbsoluteY = 0;
          }

          return {
            ...m,
            displayX: m.displayX ?? m.x,
            displayY: m.displayY ?? m.y,
            lineTo: hasLineTo ? m.lineTo : null,
            bendAbsoluteX: bendAbsoluteX || 0,
            bendAbsoluteY: bendAbsoluteY || 0,
            throwType: m.throwType || '',
            videoUrl: m.videoUrl || '',
            side: m.side || '',
            images: m.images || [],
          };
        });
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

  useEffect(() => {
    document.title = `${t('mapTitle')} - ${maps.find(m => m.id === selectedMap)?.name || ''}`;
  }, [selectedMap, lang, t]);

  const saveToFile = useCallback(async (data) => {
    try {
      await fetch(MARKERS_URL, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'markers.json': {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      });
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  }, []);

  const updateMarkers = (newMarkers) => { setMarkers(newMarkers); saveToFile(newMarkers); };

  const recalculateGroup = (markersArray, groupX, groupY, mapId) => {
    const spacing = getSpacing();
    const groupMembers = markersArray
      .filter(m => m.mapId === mapId && Math.abs(m.x - groupX) < 1.5 && Math.abs(m.y - groupY) < 1.5)
      .sort((a, b) => a.id - b.id);

    return markersArray.map(m => {
      const idx = groupMembers.findIndex(gm => gm.id === m.id);
      if (idx !== -1) {
        return { ...m, displayX: groupX + idx * spacing, displayY: groupY };
      }
      return m;
    });
  };

  const collapseGroup = (groupKey) => {
    if (!groupKey) return;
    const [gx, gy] = groupKey.split(',').map(Number);
    const collapsed = markers.map(m => {
      if (Math.abs(m.x - gx) < 1.5 && Math.abs(m.y - gy) < 1.5) {
        return { ...m, displayX: gx, displayY: gy, bendAbsoluteX: 0, bendAbsoluteY: 0 };
      }
      return m;
    });
    updateMarkers(collapsed);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onLoginSuccess();
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  const handleMapClick = (e) => {
    if (expandedGroup) { collapseGroup(expandedGroup); setExpandedGroup(null); }
    if (!editMode || !selectedMap) return;
    if (e.target.closest('circle')) return;

    if (drawingLine) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const toX = ((e.clientX - rect.left) / rect.width) * 100;
      const toY = ((e.clientY - rect.top) / rect.height) * 100;
      updateMarkers(markers.map(m => m.id === drawingLine.markerId ? { ...m, lineTo: { x: Math.round(toX * 100) / 100, y: Math.round(toY * 100) / 100 } } : m));
      setDrawingLine(null);
      return;
    }
    if (e.shiftKey) return;

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
    const newMarker = { 
      id: Date.now(), 
      mapId: selectedMap, 
      x: granadeMenu.x, 
      y: granadeMenu.y, 
      displayX: granadeMenu.x, 
      displayY: granadeMenu.y, 
      type, 
      videoUrl: '', 
      lineTo: null, 
      bendX: 0, 
      bendY: 0, 
      bendAbsoluteX: 0, 
      bendAbsoluteY: 0, 
      throwType: '', 
      side: '',
      images: [],
    };
    const updated = recalculateGroup([...markers, newMarker], granadeMenu.x, granadeMenu.y, selectedMap);
    updateMarkers(updated);
    setGranadeMenu(null);
  };

  const handleMarkerRightClick = (e, markerId) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const deleted = markers.find(m => m.id === markerId);
    if (!deleted) return;
    let updated = markers.filter(m => m.id !== markerId);
    updated = recalculateGroup(updated, deleted.x, deleted.y, deleted.mapId);
    updateMarkers(updated);
    setSidePanel(null); setDrawingLine(null); setExpandedGroup(null);
  };

  const handleMarkerClick = (e, marker) => {
    e.stopPropagation();
    if (e.defaultPrevented) return;
    setGranadeMenu(null);
    if (wasDragging) { setWasDragging(false); return; }
    if (editMode && e.ctrlKey) { setGranadeMenu({ x: marker.x, y: marker.y }); setSidePanel(null); setDrawingLine(null); return; }
    if (editMode && e.shiftKey) { setDrawingLine({ markerId: marker.id, fromX: marker.x, fromY: marker.y }); setSidePanel(null); setExpandedGroup(null); return; }
    if (editMode) setSidePanel({ marker, mode: 'edit' });
    else if (marker.videoUrl || (marker.images && marker.images.length > 0) || marker.throwType || marker.side) setSidePanel({ marker, mode: 'view' });
  };

  const handleMarkerMouseDown = (e, marker) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();

    setWasDragging(false);

    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const origX = marker.x;
    const origY = marker.y;
    const origDisplayX = marker.displayX || marker.x;
    const origDisplayY = marker.displayY || marker.y;
    let moved = false;

    const mm = (me) => {
      moved = true;
      const rect = mapRef.current.getBoundingClientRect();
      const moveX = me.touches ? me.touches[0].clientX : me.clientX;
      const moveY = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((moveX - startX) / rect.width) * 100;
      const dy = ((moveY - startY) / rect.height) * 100;

      setMarkers(prev => prev.map(m => {
        if (m.id === marker.id) {
          return {
            ...m,
            x: Math.round((origX + dx) * 100) / 100,
            y: Math.round((origY + dy) * 100) / 100,
            displayX: origDisplayX + dx,
            displayY: origDisplayY + dy
          };
        }
        return m;
      }));
    };

    const mu = () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      document.removeEventListener('touchmove', mm);
      document.removeEventListener('touchend', mu);
      if (!moved) return;

      setWasDragging(true);

      setMarkers(prev => {
        const movedMarker = prev.find(m => m.id === marker.id);
        if (!movedMarker) return prev;

        const nearby = prev.find(m =>
          m.mapId === selectedMap &&
          m.id !== marker.id &&
          Math.abs(m.x - movedMarker.x) < 1.5 &&
          Math.abs(m.y - movedMarker.y) < 1.5
        );

        let updated;

        if (nearby) {
          updated = prev.map(m => m.id === marker.id ? { ...m, x: nearby.x, y: nearby.y, displayX: nearby.x, displayY: nearby.y } : m);
          updated = recalculateGroup(updated, nearby.x, nearby.y, selectedMap);
        } else {
          updated = prev.map(m => {
            if (m.id === marker.id) {
              const isAlone = !prev.some(u => u.id !== m.id && u.mapId === selectedMap && Math.abs(u.x - m.x) < 1.5 && Math.abs(u.y - m.y) < 1.5);
              return { ...m, displayX: isAlone ? m.x : m.displayX, displayY: isAlone ? m.y : m.displayY };
            }
            return m;
          });
        }

        saveToFile(updated);
        setExpandedGroup(null);
        return updated;
      });
    };

    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
    document.addEventListener('touchmove', mm, { passive: false });
    document.addEventListener('touchend', mu);
  };

  const handleGroupMouseDown = (e, groupKey) => {
    if (!editMode) return;

    const isTouch = e.type === 'touchstart';
    e.stopPropagation();
    e.preventDefault();

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const [gx, gy] = groupKey.split(',').map(Number);
    const startX = clientX, startY = clientY;
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
      const moveX = me.touches ? me.touches[0].clientX : me.clientX;
      const moveY = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((moveX - startX) / rect.width) * 100;
      const dy = ((moveY - startY) / rect.height) * 100;

      setMarkers(prev => prev.map(m => {
        const o = origValues.find(ov => ov.id === m.id);
        if (!o) return m;

        return {
          ...m,
          x: Math.round((o.x + dx) * 100) / 100,
          y: Math.round((o.y + dy) * 100) / 100,
          displayX: o.displayX + dx,
          displayY: o.displayY + dy
        };
      }));
    };

    const mu = () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      document.removeEventListener('touchmove', mm);
      document.removeEventListener('touchend', mu);

      setMarkers(prev => {
        const first = prev.find(m => m.mapId === selectedMap && Math.abs(m.x - gx) < 3 && Math.abs(m.y - gy) < 3);
        const newGx = first?.x || gx;
        const newGy = first?.y || gy;
        const updated = recalculateGroup(prev, newGx, newGy, selectedMap);
        saveToFile(updated);
        return updated;
      });
    };

    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
    document.addEventListener('touchmove', mm, { passive: false });
    document.addEventListener('touchend', mu);
  };

  const handleGroupClick = (e, groupKey) => {
    e.stopPropagation();
    if (editMode && e.ctrlKey) { const [gx, gy] = groupKey.split(',').map(Number); setGranadeMenu({ x: gx, y: gy }); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null); return; }
    const [gx, gy] = groupKey.split(',').map(Number);
    if (expandedGroup !== groupKey) { const expanded = recalculateGroup(markers, gx, gy, selectedMap); updateMarkers(expanded); setExpandedGroup(groupKey); }
    else { collapseGroup(groupKey); setExpandedGroup(null); }
    setGranadeMenu(null); setSidePanel(null);
  };

  const handleMarkerHover = (m) => { if (m.lineTo) setHoveredMarker(m); };
  const handleMarkerLeave = () => setHoveredMarker(null);

  const handleBendMouseDown = (e, marker) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();

    const svgElement = document.querySelector('.lines-svg');
    if (!svgElement) return;
    
    const svgRect = svgElement.getBoundingClientRect();
    if (svgRect.width === 0 || svgRect.height === 0) return;

    const mm = (me) => {
      const moveX = me.touches ? me.touches[0].clientX : me.clientX;
      const moveY = me.touches ? me.touches[0].clientY : me.clientY;

      const newMx = ((moveX - svgRect.left) / svgRect.width) * 800;
      const newMy = ((moveY - svgRect.top) / svgRect.height) * 600;

      setMarkers(prev => prev.map(m =>
        m.id === marker.id ? {
          ...m,
          bendAbsoluteX: newMx,
          bendAbsoluteY: newMy
        } : m
      ));
    };

    const mu = () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      document.removeEventListener('touchmove', mm);
      document.removeEventListener('touchend', mu);
      
      setMarkers(prev => {
        saveToFile(prev);
        return prev;
      });
    };

    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
    document.addEventListener('touchmove', mm, { passive: false });
    document.addEventListener('touchend', mu);
  };

  const handleThrowTypeChange = (v) => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, throwType: v } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, throwType: v } })); };
  const handleSideChange = (v) => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, side: v } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, side: v } })); };
  const handleDeleteLine = () => {
    if (!sidePanel) return;
    updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? {
      ...m,
      lineTo: null,
      bendAbsoluteX: 0,
      bendAbsoluteY: 0
    } : m));
    setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, lineTo: null } }));
  };
  const handleDeleteVideo = () => { if (!sidePanel) return; updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, videoUrl: '' } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, videoUrl: '' } })); };

  const currentMarkers = markers.filter(m => m.mapId === selectedMap);
  const groupedMarkers = {};
  currentMarkers.forEach(m => {
    const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
    if (!groupedMarkers[key]) groupedMarkers[key] = [];
    groupedMarkers[key].push(m);
  });

  return (
    <>
      <Helmet>
        <title>{t('mapTitle')} - {maps.find(m => m.id === selectedMap)?.name || ''}</title>
      </Helmet>

      <Header
        editMode={editMode}
        guideOpen={guideOpen}
        setGuideOpen={setGuideOpen}
        onLogout={onLogout}
        onLoginClick={() => setShowLogin(true)}
      />

      {showLogin && (
        <div className="modal-overlay" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="login-close" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>✕</button>
            <h2 className="login-title">{t('login')}</h2>
            <input type="password" className="login-input" placeholder={t('password')} value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(false); }} onKeyDown={handleKeyDown} autoFocus />
            {loginError && <p className="login-error">{t('wrongPassword')}</p>}
            <button className="login-btn" onClick={handleLogin}>{t('loginBtn')}</button>
          </div>
        </div>
      )}

      <main className="main">
        {loading ? <p style={{ color: '#a0aec0' }}>{t('loading')}</p> : (
          <div className="map-wrapper">
            <div className="map-container" onClick={handleMapClick} ref={mapRef}>
              <img src={`/maps/${imageName}`} alt={selectedMap} className="map-image" />

              <svg className="lines-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
                {currentMarkers.map(marker => {
                  if (!marker.lineTo) return null;
                  if (drawingLine && marker.id !== drawingLine.markerId) return null;
                  const isHovered = hoveredMarker?.id === marker.id;
                  const isDrawing = drawingLine?.markerId === marker.id;

                  if (editMode && hoveredMarker && !isHovered && !isDrawing) return null;
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

                  const midX = (sx + ex) / 2;
                  const midY = (sy + ey) / 2;

                  const mx = (marker.bendAbsoluteX != null && marker.bendAbsoluteX !== 0) 
                    ? marker.bendAbsoluteX 
                    : midX + (marker.bendX || 0);
                  const my = (marker.bendAbsoluteY != null && marker.bendAbsoluteY !== 0) 
                    ? marker.bendAbsoluteY 
                    : midY + (marker.bendY || 0);

                  return (
                    <g key={`line-${marker.id}`}>
                      <line x1={sx} y1={sy} x2={mx} y2={my} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <line x1={mx} y1={my} x2={ex} y2={ey} stroke="white" strokeWidth="2" strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />
                      <circle cx={sx} cy={sy} r="5" fill="white" opacity="0.9" style={{ pointerEvents: 'none' }} />
                      {editMode && marker.lineTo && (
                        <circle
                          cx={mx}
                          cy={my}
                          r="6"
                          fill="#e94560"
                          stroke="white"
                          strokeWidth="2"
                          style={{ cursor: 'move', pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleBendMouseDown(e, marker)}
                          onTouchStart={(e) => handleBendMouseDown(e, marker)}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {drawingLine && <div className="drawing-hint">{t('shiftHint')}</div>}
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
                      onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                      onTouchStart={(e) => handleMarkerMouseDown(e, marker)}
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
                        {group.map((marker) => {
                          const type = granadeTypes.find(g => g.type === marker.type);
                          const left = `${(marker.displayX || marker.x)}%`;
                          const top = `${(marker.displayY || marker.y)}%`;
                          return (
                            <div key={marker.id} className={`marker ${drawingLine?.markerId === marker.id ? 'drawing' : ''}`} style={{ left, top }}
                              onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                              onTouchStart={(e) => handleMarkerMouseDown(e, marker)}
                              onClick={(e) => handleMarkerClick(e, marker)}
                              onContextMenu={(e) => handleMarkerRightClick(e, marker.id)}
                              onMouseEnter={() => handleMarkerHover(marker)}
                              onMouseLeave={handleMarkerLeave}
                              title={type?.type}>
                              <img src={type?.icon} alt={type?.type} className="marker-icon-img" />
                            </div>
                          );
                        })}
                        <div className="marker group-close-marker" style={{ left: `${gx + group.length * getSpacing()}%`, top: `${gy}%` }}
                          onClick={(e) => { e.stopPropagation(); collapseGroup(key); setExpandedGroup(null); }} title={t('collapse')}><span className="close-icon">✕</span></div>
                      </>
                    ) : (
                      <div
                        className="marker group-marker"
                        style={{ left: `${gx}%`, top: `${gy}%`, cursor: editMode ? 'move' : 'pointer' }}
                        onClick={(e) => handleGroupClick(e, key)}
                        onMouseDown={(e) => handleGroupMouseDown(e, key)}
                        onTouchStart={(e) => handleGroupMouseDown(e, key)}
                        title={`${group.length} ${t('groupGrenades')}`}
                      >
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
                      {sidePanel.marker.lineTo && <button className="delete-line-btn" onClick={handleDeleteLine}>{t('deleteTrajectory')}</button>}
                      {sidePanel.marker.videoUrl && <button className="delete-line-btn" onClick={handleDeleteVideo}>{t('deleteVideo')}</button>}
                    </div>
                    {sidePanel.marker.videoUrl ? (
                      <div className="video-loaded-block"><video src={sidePanel.marker.videoUrl} controls className="side-video" /></div>
                    ) : (
                      <div className="video-url-block"><input type="text" className="video-url-input" placeholder={t('videoPlaceholder')} value={sidePanel.marker.videoUrl || ''} onChange={(e) => { updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, videoUrl: e.target.value } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, videoUrl: e.target.value } })); }} /></div>
                    )}
                    
                    {/* Блок изображений */}
                    <div className="images-block">
                      <p className="throw-type-label">Изображения:</p>
                      <div className="image-upload">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target.result;
                              const updatedMarker = {
                                ...sidePanel.marker,
                                images: [...(sidePanel.marker.images || []), imageUrl]
                              };
                              updateMarkers(markers.map(m => 
                                m.id === sidePanel.marker.id ? updatedMarker : m
                              ));
                              setSidePanel(prev => ({ ...prev, marker: updatedMarker }));
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="image-input"
                        />
                        <span className="image-upload-hint">Загрузить изображение</span>
                      </div>
                      {sidePanel.marker.images && sidePanel.marker.images.length > 0 && (
                        <div className="images-gallery">
                          {sidePanel.marker.images.map((img, index) => (
                            <div key={index} className="image-item">
                              <img src={img} alt={`Скриншот ${index + 1}`} className="gallery-image" onClick={() => setFullscreenImage(img)} />
                              <button 
                                className="image-delete-btn"
                                onClick={() => {
                                  const updatedImages = sidePanel.marker.images.filter((_, i) => i !== index);
                                  const updatedMarker = { ...sidePanel.marker, images: updatedImages };
                                  updateMarkers(markers.map(m => 
                                    m.id === sidePanel.marker.id ? updatedMarker : m
                                  ));
                                  setSidePanel(prev => ({ ...prev, marker: updatedMarker }));
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="throw-type-block">
                      <p className="throw-type-label">{t('throwType')}</p>
                      <select className="throw-type-select" value={sidePanel.marker.throwType || ''} onChange={(e) => handleThrowTypeChange(e.target.value)}>{throwTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                    </div>
                    <div className="throw-type-block">
                      <p className="throw-type-label">{t('side')}</p>
                      <div className="side-buttons">{sideTypes.filter(s => s.value !== '').map(s => (
                        <button key={s.value} className={`side-btn ${sidePanel.marker.side === s.value ? 'active' : ''}`} onClick={() => handleSideChange(sidePanel.marker.side === s.value ? '' : s.value)}><img src={s.icon} alt={s.label} className="side-btn-icon" /></button>
                      ))}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="video-container">{sidePanel.marker.videoUrl ? <video src={sidePanel.marker.videoUrl} controls className="side-video" /> : <p className="no-video">{t('noVideo')}</p>}</div>
                    
                    {/* Изображения в режиме просмотра */}
                    {sidePanel.marker.images && sidePanel.marker.images.length > 0 && (
                      <div className="images-gallery">
                        {sidePanel.marker.images.map((img, index) => (
                          <div key={index} className="image-item">
                            <img src={img} alt={`Скриншот ${index + 1}`} className="gallery-image" onClick={() => setFullscreenImage(img)} />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {sidePanel.marker.throwType && <div className="throw-type-display">{t('throwType')} {throwTypes.find(t => t.value === sidePanel.marker.throwType)?.label}</div>}
                    {sidePanel.marker.side && <div className="side-display"><span className="side-display-label">{t('side')}</span><img src={sideTypes.find(s => s.value === sidePanel.marker.side)?.icon} alt="" className="side-display-icon" /></div>}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Модальное окно для просмотра изображения */}
        {fullscreenImage && (
          <div className="modal-overlay" onClick={() => setFullscreenImage(null)}>
            <img 
              src={fullscreenImage} 
              alt="Полный размер" 
              className="fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="fullscreen-close"
              onClick={() => setFullscreenImage(null)}
            >
              ✕
            </button>
          </div>
        )}
        
        {editMode && sidePanel?.marker && (
          <div className="mobile-tools">
            <button
              className="mobile-tool-btn"
              onClick={() => {
                setDrawingLine({ markerId: sidePanel.marker.id, fromX: sidePanel.marker.x, fromY: sidePanel.marker.y });
                setSidePanel(null);
              }}
              title={t('guideShiftMarker')}
            >
              <img src="/icons/trajectory.png" alt="Line" className="mobile-tool-icon" />
            </button>
            <button
              className="mobile-tool-btn"
              onClick={() => {
                handleMarkerRightClick(new MouseEvent('click'), sidePanel.marker.id);
              }}
              title={t('guideRightClick')}
            >
              <img src="/icons/delete.png" alt="Delete" className="mobile-tool-icon" />
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default MapPage;