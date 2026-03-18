import api from '../api/axios';
import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';

/**
 * resolve image URL — generates a pre-signed URL for S3 objects
 * @param {string} rawPath - The path or URI stored in DB
 * @returns {Promise<string>} - A viewable URL
 */
export const getImageUrl = async (rawPath) => {
  if (!rawPath) return '';
  
  // Detect if it's an S3-hosted path (either URI or full URL)
  const isS3 = rawPath.startsWith('s3://') || rawPath.includes('amazonaws.com');

  // If it's a full URL and NOT S3 (e.g. Cloudinary), return as is
  if (!isS3 && (rawPath.startsWith('http://') || rawPath.startsWith('https://'))) {
    return rawPath;
  }
  
  // S3 path — request a signed URL from the backend
  if (isS3) {
    try {
      const res = await api.post('/api/admin/signed-url', { s3Uri: rawPath });
      return res.data.url;
    } catch (err) {
      console.error('Failed to resolve S3 signed URL:', err);
      return '';
    }
  }
  
  // Legacy local path fallback (relative filename)
  return `${API_BASE_URL}/uploads/${rawPath}`;
};

/**
 * Small component to display any image (S3 or legacy) asynchronously
 */
export const S3Image = ({ src, alt, className }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    getImageUrl(src).then(resolved => { if (!cancelled) setUrl(resolved); });
    return () => { cancelled = true; };
  }, [src]);
  if (!url) return <div className="w-full h-32 bg-white/5 rounded-xl animate-pulse" />;
  return <img src={url} alt={alt} className={className} />;
};

/**
 * Small component for an anchor tag pointing to an S3 or legacy URL
 */
export const S3Anchor = ({ src, className, children }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    getImageUrl(src).then(resolved => { if (!cancelled) setUrl(resolved); });
    return () => { cancelled = true; };
  }, [src]);
  return <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
};
