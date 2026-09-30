'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapDirectoryBlock, MapPlace } from '@/content/types';
import styles from './MapDirectory.module.css';

type Props = Omit<MapDirectoryBlock, 'type'> & { type?: string };

// Google Maps JavaScript API types, declared locally for the few calls used.
type GMap = { setCenter: (p: { lat: number; lng: number }) => void; setZoom: (z: number) => void };
type GMarker = { setMap: (m: GMap | null) => void; addListener: (e: string, fn: () => void) => void };
type GInfo = { setContent: (html: string) => void; open: (o: { map: GMap; anchor: GMarker }) => void; close: () => void };
type GoogleMaps = {
  maps: {
    Map: new (el: HTMLElement, o: object) => GMap;
    Marker: new (o: object) => GMarker;
    InfoWindow: new () => GInfo;
  };
};
declare global {
  interface Window {
    google?: GoogleMaps;
    __clpMapsLoading?: Promise<GoogleMaps>;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadGoogleMaps(): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google);
  window.__clpMapsLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google Maps failed to load')));
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window.__clpMapsLoading;
}

/** Great-circle distance in miles (or km). */
function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }, unit: string) {
  const R = unit === 'km' ? 6371 : 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Location directory with a Google map (WP Google Map Pro): sport / age / cost / city / experience / radius drop-downs,
 * the map with gold pins on the left and the matching locations (4 a page, A–Z) on the right. Clicking a location zooms
 * the map to it. With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set the map uses the original's grey style, pins and info
 * windows; without a key it falls back to Google's embeddable map.
 */
export default function MapDirectory({ center, zoom, height, styles: mapStyles, skin, perPage, categories, filters, radius, markerIcon, places }: Props) {
  const [category, setCategory] = useState('');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [within, setWithin] = useState('');
  const [page, setPage] = useState(1);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const gmap = useRef<{ map: GMap; markers: Map<string, GMarker>; info: GInfo } | null>(null);

  const matches = useMemo(() => {
    const list = places.filter((p) => {
      if (category && !p.categoryIds.includes(category)) return false;
      for (const f of filters) {
        const v = chosen[f.key];
        if (!v) continue;
        if (f.key === 'city' && p.city.toLowerCase() !== v) return false;
        if (f.key === 'experience-type' && !p.extra[f.key].split(',').some((s) => s.trim().toLowerCase() === v)) return false;
        if (f.key !== 'city' && f.key !== 'experience-type' && p.extra[f.key]?.toLowerCase() !== v) return false;
      }
      if (within && distance(center, p, radius.unit) > Number(within)) return false;
      return true;
    });
    return list.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
  }, [places, category, chosen, within, filters, center, radius.unit]);

  const pages = Math.max(1, Math.ceil(matches.length / perPage));
  const current = Math.min(page, pages);
  const shown = matches.slice((current - 1) * perPage, current * perPage);

  // Interactive Google map (only with an API key).
  useEffect(() => {
    if (!API_KEY || !mapRef.current) return;
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, { center, zoom, styles: JSON.parse(mapStyles || '[]'), scrollwheel: false });
      const info = new google.maps.InfoWindow();
      const markers = new Map<string, GMarker>();
      gmap.current = { map, markers, info };
      for (const p of places) {
        const marker = new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, icon: markerIcon, title: p.title });
        marker.addListener('click', () => {
          info.setContent(infoWindow(p));
          info.open({ map, anchor: marker });
        });
        markers.set(p.id, marker);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [center, zoom, mapStyles, places, markerIcon]);

  // Show only the matching pins.
  useEffect(() => {
    const g = gmap.current;
    if (!g) return;
    const ids = new Set(matches.map((p) => p.id));
    g.markers.forEach((marker, id) => marker.setMap(ids.has(id) ? g.map : null));
  }, [matches]);

  const show = (p: MapPlace) => {
    const g = gmap.current;
    if (g) {
      g.map.setCenter({ lat: p.lat, lng: p.lng });
      g.map.setZoom(p.zoom);
    } else setFocus({ lat: p.lat, lng: p.lng, zoom: p.zoom });
  };

  const embed = focus
    ? `https://maps.google.com/maps?q=${focus.lat},${focus.lng}&z=${focus.zoom}&output=embed`
    : `https://maps.google.com/maps?ll=${center.lat},${center.lng}&z=${zoom}&output=embed`;

  return (
    <div className={styles.container}>
      <div className={styles.filterWrap}>
        <div className={styles.filters}>
          <select
            className={styles.select}
            aria-label="Sport"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {filters.map((f) => (
            <select
              key={f.key}
              className={styles.select}
              aria-label={f.label}
              value={chosen[f.key] ?? ''}
              onChange={(e) => {
                setChosen({ ...chosen, [f.key]: e.target.value });
                setPage(1);
              }}
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          <select
            className={styles.select}
            aria-label="Radius"
            value={within}
            onChange={(e) => {
              setWithin(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{radius.label}</option>
            {radius.options.map((r) => (
              <option key={r} value={r}>
                Within {r} {radius.unit === 'km' ? 'Km' : 'Miles'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.mapSide}>
          {API_KEY ? (
            <div ref={mapRef} className={styles.map} style={{ height }} />
          ) : (
            <iframe className={styles.map} style={{ height }} src={embed} title="Map of locations" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
        <div className={styles.listSide}>
          <div className={styles.listing} style={{ height: pages > 1 ? height - 65 : height, overflowY: 'auto' }}>
            {shown.map((p) => (
              <div key={p.id} className={styles.location}>
                <div className={styles.head}>
                  <div className={styles.title}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        show(p);
                      }}
                    >
                      {p.title}
                    </a>
                  </div>
                  <div className={styles.meta}>
                    <span className={styles.badge}>{p.categories.join(', ')}</span>
                  </div>
                </div>
                {skin === 'image' && p.image && (
                  <div className={styles.image}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- the location's own photo */}
                    <img src={p.image} alt={p.title} loading="lazy" />
                  </div>
                )}
                <div className={styles.content}>
                  {p.content}
                  {skin === 'text' && p.learnMore}
                </div>
                {skin === 'image' && (
                  <div className={styles.learnMore}>
                    <a href={p.learnMore || undefined} target="_blank" rel="noopener noreferrer">
                      Learn More
                    </a>
                  </div>
                )}
                <div className={styles.foot} />
              </div>
            ))}
          </div>
          <div className={styles.pagination}>
            {pages > 1 && (
              <>
                {current > 1 && (
                  <a href="#" className={styles.pageLink} onClick={(e) => (e.preventDefault(), setPage(current - 1))}>
                    Prev
                  </a>
                )}
                {Array.from({ length: pages }, (_, i) =>
                  i + 1 === current ? (
                    <span key={i} className={styles.pageCurrent}>
                      {i + 1}
                    </span>
                  ) : (
                    <a key={i} href="#" className={styles.pageLink} onClick={(e) => (e.preventDefault(), setPage(i + 1))}>
                      {i + 1}
                    </a>
                  ),
                )}
                {current < pages && (
                  <a href="#" className={styles.pageLink} onClick={(e) => (e.preventDefault(), setPage(current + 1))}>
                    Next
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The map pin's info window (the original's default info-window template). */
function infoWindow(p: MapPlace) {
  return `<div style="font-family:Montserrat,sans-serif;max-width:260px">
<div style="font-weight:700;font-size:16px;color:#444;margin-bottom:5px">${escape(p.title)} <span style="display:inline-block;padding:0 10px;border:1px solid #e3bd66;border-radius:32px;color:#e3bd66;font-size:13px;font-weight:400">${escape(p.categories.join(', '))}</span></div>
${p.image ? `<img src="${escape(p.image)}" alt="" style="max-width:100%;margin-bottom:5px">` : ''}
<p style="font-size:14px;margin:0 0 5px">${escape(p.content)}</p>
<address style="font-style:normal;font-size:14px"><b>Address : </b>${escape(p.address)}</address></div>`;
}
