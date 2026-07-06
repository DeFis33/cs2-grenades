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
  { id: 'ancient', name: 'Ancient', image: 'Ancient.png' },
  { id: 'anubis', name: 'Anubis', image: 'Anubis.png' },
  { id: 'cache', name: 'Cache', image: 'Cache.png' },
  { id: 'dust2', name: 'Dust 2', image: 'Dust.png' },
  { id: 'inferno', name: 'Inferno', image: 'Inferno.png' },
  { id: 'mirage', name: 'Mirage', image: 'Mirage.png' },
  { id: 'nuke', name: 'Nuke', image: 'Nuke.png' },
  { id: 'overpass', name: 'Overpass', image: 'Overpass.png' },
  { id: 'train', name: 'Train', image: 'Train.png' },
];

function MapPage({ isAdmin, guideOpen, setGuideOpen, onAdminLogin, onAdminLogout }) {
  const { mapId } = useParams();
  const selectedMap = mapId;
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [granadeMenu, setGranadeMenu] = useState(null);
  const [sidePanel, setSidePanel] = useState(null);
  const [wasDragging, setWasDragging] = useState(false);
  const [drawingLine, setDrawingLine] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [sideFilter, setSideFilter] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const { lang, t } = useLanguage();
  const [revealFilter, setRevealFilter] = useState(null);
  const utilityTypes = [
    { value: 'reveal', label: 'R', fullLabel: 'Reveal', availableFor: ['he'] },
    { value: 'instant', label: 'I', fullLabel: 'Instant', availableFor: ['smoke'] },
  ];

  const imageName = maps.find(m => m.id === selectedMap)?.image || `${selectedMap}.png`;

  const getSpacing = () => window.innerWidth <= 768 ? 6 : 5;

  useEffect(() => {
    fetch(MARKERS_URL)
      .then(res => res.json())
      .then(data => {
        const content = data.files['markers.json']?.content;
        if (!content) {
          setMarkers([]);
        } else {
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
              name: m.name || '',
            };
          });
          setMarkers(fixed);
        }
      })
      .catch(() => setMarkers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = () => setGuideOpen && setGuideOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [setGuideOpen]);

  useEffect(() => {
    document.title = `${t('mapTitle')} - ${maps.find(m => m.id === selectedMap)?.name || ''}`;
  }, [selectedMap, lang, t]);

  // ФИКС: Добавляем passive: false на контейнер карты
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) return;

    const preventDefaultTouch = (e) => {
      e.preventDefault();
    };

    mapContainer.addEventListener('touchstart', preventDefaultTouch, { passive: false });

    return () => {
      mapContainer.removeEventListener('touchstart', preventDefaultTouch);
    };
  }, []);

  const saveToFile = useCallback(async (data) => {
    try {
      const response = await fetch(MARKERS_URL, {
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

      if (!response.ok) {
        console.error('Save failed:', response.status);
      }
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

  const handleMapClick = (e) => {
    if (expandedGroup) { collapseGroup(expandedGroup); setExpandedGroup(null); }
    if (!isAdmin || !selectedMap) return;
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
      name: '',
      utilityType: ''
    };
    const updated = recalculateGroup([...markers, newMarker], granadeMenu.x, granadeMenu.y, selectedMap);
    updateMarkers(updated);
    setGranadeMenu(null);
  };

  const handleMarkerRightClick = (e, markerId) => {
    if (!isAdmin) return;
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
    if (isAdmin && e.ctrlKey) { setGranadeMenu({ x: marker.x, y: marker.y }); setSidePanel(null); setDrawingLine(null); return; }
    if (isAdmin && e.shiftKey) { setDrawingLine({ markerId: marker.id, fromX: marker.x, fromY: marker.y }); setSidePanel(null); setExpandedGroup(null); return; }
    setSidePanel({ marker, mode: isAdmin ? 'edit' : 'view' });
  };

  const handleMarkerMouseDown = (e, marker) => {
    if (!isAdmin) return;
    e.stopPropagation();
    // УБРАЛИ e.preventDefault()

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
    if (!isAdmin) return;

    const isTouch = e.type === 'touchstart';
    e.stopPropagation();
    // УБРАЛИ e.preventDefault()

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
    if (isAdmin && e.ctrlKey) { const [gx, gy] = groupKey.split(',').map(Number); setGranadeMenu({ x: gx, y: gy }); setSidePanel(null); setDrawingLine(null); setExpandedGroup(null); return; }
    const [gx, gy] = groupKey.split(',').map(Number);
    if (expandedGroup !== groupKey) { const expanded = recalculateGroup(markers, gx, gy, selectedMap); updateMarkers(expanded); setExpandedGroup(groupKey); }
    else { collapseGroup(groupKey); setExpandedGroup(null); }
    setGranadeMenu(null); setSidePanel(null);
  };

  const handleMarkerHover = (m) => { if (m.lineTo) setHoveredMarker(m); };
  const handleMarkerLeave = () => setHoveredMarker(null);

  const handleBendMouseDown = (e, marker) => {
    if (!isAdmin) return;
    e.stopPropagation();
    // УБРАЛИ e.preventDefault()

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

  const currentMarkers = markers.filter(m => {
    if (m.mapId !== selectedMap) return false;
    if (activeFilter === null && sideFilter === null && revealFilter === null) return true;

    const typeMatch = activeFilter === null || m.type === activeFilter;
    const sideMatch = sideFilter === null || m.side === sideFilter;
    const utilityMatch = revealFilter === null || m.utilityType === revealFilter;

    return typeMatch && sideMatch && utilityMatch;
  });

  const filteredMarkers = activeFilter === null && sideFilter === null && revealFilter === null ? currentMarkers : (() => {
    const spacing = getSpacing();
    const grouped = {};

    currentMarkers.forEach(m => {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });

    return currentMarkers.map(m => {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      const group = grouped[key];
      const idx = group.findIndex(gm => gm.id === m.id);

      if (group.length > 1) {
        const [gx, gy] = key.split(',').map(Number);
        return { ...m, displayX: gx + idx * spacing, displayY: gy };
      }
      return { ...m, displayX: m.x, displayY: m.y };
    });
  })();

  const groupedMarkers = {};
  filteredMarkers.forEach(m => {
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
        isAdmin={isAdmin}
        guideOpen={guideOpen}
        setGuideOpen={setGuideOpen}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
      />

      <main className="main">
        {loading ? <p style={{ color: '#a0aec0' }}>{t('loading')}</p> : (
          <div className="map-wrapper">
            <div className="filter-panel">
              <div className="filter-grenades-row">
                <button
                  className={`filter-btn ${activeFilter === null && sideFilter === null && revealFilter === null ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(null); setSideFilter(null); setRevealFilter(null); }}
                  title={t('all')}
                >
                  {t('all')}
                </button>
                {granadeTypes.map(g => (
                  <button
                    key={g.type}
                    className={`filter-btn ${activeFilter === g.type ? 'active' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === g.type ? null : g.type)}
                    title={g.type}
                  >
                    <img src={g.icon} alt={g.type} className="filter-icon" />
                  </button>
                ))}
              </div>
              <div className="filter-divider"></div>
              <div className="filter-sides-row">
                <button
                  className={`filter-btn side-filter-btn ${sideFilter === 'ct' ? 'active' : ''}`}
                  onClick={() => setSideFilter(sideFilter === 'ct' ? null : 'ct')}
                  title="CT"
                >
                  <img src="/icons/side-ct.png" alt="CT" className="filter-icon" />
                </button>
                <button
                  className={`filter-btn side-filter-btn ${sideFilter === 't' ? 'active' : ''}`}
                  onClick={() => setSideFilter(sideFilter === 't' ? null : 't')}
                  title="T"
                >
                  <img src="/icons/side-t.png" alt="T" className="filter-icon" />
                </button>
              </div>
              <div className="filter-utility-row">
                {utilityTypes.map(u => (
                  <button
                    key={u.value}
                    className={`filter-btn utility-filter-btn ${revealFilter === u.value ? 'active' : ''}`}
                    onClick={() => setRevealFilter(revealFilter === u.value ? null : u.value)}
                    title={u.fullLabel}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="map-container" onClick={handleMapClick} ref={mapRef}>
              <img src={`/maps/${imageName}`} alt={selectedMap} className="map-image" />

              <svg className="lines-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
                {currentMarkers.map(marker => {
                  if (!marker.lineTo) return null;
                  if (drawingLine && marker.id !== drawingLine.markerId) return null;
                  const isHovered = hoveredMarker?.id === marker.id;
                  const isDrawing = drawingLine?.markerId === marker.id;

                  if (isAdmin && hoveredMarker && !isHovered && !isDrawing) return null;
                  if (!isAdmin && !isHovered && !isDrawing) return null;

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
                      {isAdmin && marker.lineTo && (
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
                      title={marker.name || type?.type}>
                      <img src={type?.icon} alt={type?.type} className="marker-icon-img" draggable="false" />
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
                              title={marker.name || type?.type}>
                              <img src={type?.icon} alt={type?.type} className="marker-icon-img" draggable="false" />
                            </div>
                          );
                        })}
                        <div className="marker group-close-marker" style={{ left: `${gx + group.length * getSpacing()}%`, top: `${gy}%` }}
                          onClick={(e) => { e.stopPropagation(); collapseGroup(key); setExpandedGroup(null); }} title={t('collapse')}><span className="close-icon">✕</span></div>
                      </>
                    ) : (
                      <div
                        className="marker group-marker"
                        style={{ left: `${gx}%`, top: `${gy}%`, cursor: isAdmin ? 'move' : 'pointer' }}
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
                  <span>{sidePanel.marker.name || granadeTypes.find(g => g.type === sidePanel.marker.type)?.type}</span>
                </div>
                {sidePanel.mode === 'edit' ? (
                  <>
                    <div className="throw-type-block">
                      <p className="throw-type-label">Utility Type</p>
                      <div className="side-buttons">
                        {utilityTypes
                          .filter(u => u.availableFor.includes(sidePanel.marker.type))
                          .map(u => (
                            <button
                              key={u.value}
                              className={`side-btn ${sidePanel.marker.utilityType === u.value ? 'active' : ''}`}
                              onClick={() => {
                                const newValue = sidePanel.marker.utilityType === u.value ? '' : u.value;
                                updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, utilityType: newValue } : m));
                                setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, utilityType: newValue } }));
                              }}
                              title={u.fullLabel}
                            >
                              {u.label}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="edit-video-block">
                      {sidePanel.marker.lineTo && <button className="delete-line-btn" onClick={handleDeleteLine}>{t('deleteTrajectory')}</button>}
                      {sidePanel.marker.videoUrl && <button className="delete-line-btn" onClick={handleDeleteVideo}>{t('deleteVideo')}</button>}
                    </div>
                    {sidePanel.marker.videoUrl ? (
                      <div className="video-loaded-block"><video src={sidePanel.marker.videoUrl} controls className="side-video" /></div>
                    ) : (
                      <div className="video-url-block"><input type="text" className="video-url-input" placeholder={t('videoPlaceholder')} value={sidePanel.marker.videoUrl || ''} onChange={(e) => { updateMarkers(markers.map(m => m.id === sidePanel.marker.id ? { ...m, videoUrl: e.target.value } : m)); setSidePanel(prev => ({ ...prev, marker: { ...prev.marker, videoUrl: e.target.value } })); }} /></div>
                    )}

                    <div className="images-block">
                      <p className="throw-type-label">{t('images')}</p>

                      <div className="video-url-block">
                        <input
                          type="text"
                          className="video-url-input"
                          placeholder={t('imagePlaceholder')}
                          value={sidePanel.marker.newImageUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            const updatedMarker = { ...sidePanel.marker, newImageUrl: url };

                            if (url && url.startsWith('http')) {
                              updatedMarker.images = [...(sidePanel.marker.images || []), url];
                              updatedMarker.newImageUrl = '';
                            }

                            setSidePanel(prev => ({ ...prev, marker: updatedMarker }));

                            if (updatedMarker.images.length > (sidePanel.marker.images || []).length) {
                              updateMarkers(markers.map(m =>
                                m.id === sidePanel.marker.id ? updatedMarker : m
                              ));
                            }
                          }}
                        />
                      </div>

                      {sidePanel.marker.images && sidePanel.marker.images.length > 0 && (
                        <div className="images-gallery">
                          {sidePanel.marker.images.map((img, index) => (
                            <div key={index} className="image-item">
                              <img src={img} alt={`${t('screenshot')} ${index + 1}`} className="gallery-image" onClick={() => setFullscreenImage(img)} />
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

                    {sidePanel.marker.images && sidePanel.marker.images.length > 0 && (
                      <div className="images-gallery">
                        {sidePanel.marker.images.map((img, index) => (
                          <div key={index} className="image-item">
                            <img src={img} alt={`${t('screenshot')} ${index + 1}`} className="gallery-image" onClick={() => setFullscreenImage(img)} />
                          </div>
                        ))}
                      </div>
                    )}

                    {sidePanel.marker.throwType && <div className="throw-type-display">{t('throwType')} {throwTypes.find(t => t.value === sidePanel.marker.throwType)?.label}</div>}
                    {sidePanel.marker.side && (
                      <div className="side-display">
                        <span className="side-display-label">{t('side')}</span>
                        <img src={sideTypes.find(s => s.value === sidePanel.marker.side)?.icon} alt="" className="side-display-icon" />
                      </div>
                    )}
                    {sidePanel.marker.utilityType && (
                      <div className="side-display">
                        <span className="side-display-label">Type:</span>
                        <span>{utilityTypes.find(u => u.value === sidePanel.marker.utilityType)?.fullLabel}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {fullscreenImage && (
          <div
            className="modal-overlay"
            onClick={() => {
              setFullscreenImage(null);
              setImageZoom(1);
              setImagePosition({ x: 0, y: 0 });
            }}
            onWheel={(e) => {
              e.stopPropagation();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setImageZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
            }}
          >
            <div
              className="fullscreen-image-container"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullscreenImage}
                alt="Полный размер"
                className="fullscreen-image"
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageZoom})`,
                  cursor: imageZoom > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'default'
                }}
                onMouseDown={(e) => {
                  if (imageZoom > 1) {
                    e.preventDefault();
                    setIsDraggingImage(true);
                    setDragStart({
                      x: e.clientX - imagePosition.x,
                      y: e.clientY - imagePosition.y
                    });
                  }
                }}
                onMouseMove={(e) => {
                  if (isDraggingImage) {
                    setImagePosition({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y
                    });
                  }
                }}
                onMouseUp={() => setIsDraggingImage(false)}
                onMouseLeave={() => setIsDraggingImage(false)}
                onTouchStart={(e) => {
                  if (imageZoom > 1 && e.touches.length === 1) {
                    setIsDraggingImage(true);
                    setDragStart({
                      x: e.touches[0].clientX - imagePosition.x,
                      y: e.touches[0].clientY - imagePosition.y
                    });
                  }
                }}
                onTouchMove={(e) => {
                  if (isDraggingImage && e.touches.length === 1) {
                    setImagePosition({
                      x: e.touches[0].clientX - dragStart.x,
                      y: e.touches[0].clientY - dragStart.y
                    });
                  }
                }}
                onTouchEnd={() => setIsDraggingImage(false)}
                draggable="false"
              />

              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageZoom(prev => Math.min(prev + 0.2, 5));
                  }}
                >
                  +
                </button>
                <button
                  className="zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageZoom(prev => Math.max(prev - 0.2, 0.5));
                  }}
                >
                  −
                </button>
                <button
                  className="zoom-btn zoom-reset"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageZoom(1);
                    setImagePosition({ x: 0, y: 0 });
                  }}
                >
                  ↺
                </button>
              </div>

              <button
                className="fullscreen-close"
                onClick={() => {
                  setFullscreenImage(null);
                  setImageZoom(1);
                  setImagePosition({ x: 0, y: 0 });
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {isAdmin && sidePanel?.marker && (
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